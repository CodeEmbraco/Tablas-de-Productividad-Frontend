import { useState, useEffect, useCallback, useRef } from 'react';
import { getFormattedDate } from '@utils/dateUtils';
import { construirEsqueletoTabla } from '@utils/dataUtils';
import productionService from '@services/ProductionServices';

// Caché en memoria por (línea + fecha) para mostrar datos al instante al cambiar de línea o turno
const productionDataCache = new Map();
const shiftStatusLoadedKeys = new Set();

// Promesas en vuelo para evitar peticiones duplicadas concurrentes
const inFlightProductionRequests = new Map();
const inFlightShiftRequests = new Map();

const CACHE_FRESH_TTL_MS = 20000; // 20 segundos de frescura
const SWITCH_DEBOUNCE_MS = 100;   // 100 ms al cambiar rápido entre líneas

const fetchProductionDeduped = (lineId, fecha, customFetcher = null) => {
    const key = `${lineId}_${fecha}`;
    if (inFlightProductionRequests.has(key)) {
        return inFlightProductionRequests.get(key);
    }

    const promise = (customFetcher ? customFetcher(fecha) : productionService.getDailyProduction(lineId, fecha))
        .finally(() => {
            inFlightProductionRequests.delete(key);
        });

    inFlightProductionRequests.set(key, promise);
    return promise;
};

const fetchShiftStatusDeduped = (lineId, fecha, customFetcher = null) => {
    const key = `${lineId}_${fecha}`;
    if (inFlightShiftRequests.has(key)) {
        return inFlightShiftRequests.get(key);
    }

    const promise = (customFetcher ? customFetcher(fecha) : productionService.getShiftsStatus(lineId, fecha))
        .finally(() => {
            inFlightShiftRequests.delete(key);
        });

    inFlightShiftRequests.set(key, promise);
    return promise;
};

const buildStateFromRaw = (fecha, turno, megaData, shiftsStatus) => {
    const { totalDia, turnos, porHora } = megaData.produccion;
    const currentShiftData = turnos[`T${turno}`] || { produccion: 0, meta: 0, eficiencia: 0 };
    const tableItems = construirEsqueletoTabla(fecha, turno, porHora);

    const totalDelta = [
        { turno: 1, contador: turnos.T1.produccion, MetaEfectivaTurno: turnos.T1.meta },
        { turno: 2, contador: turnos.T2.produccion, MetaEfectivaTurno: turnos.T2.meta },
        { turno: 3, contador: turnos.T3.produccion, MetaEfectivaTurno: turnos.T3.meta }
    ];

    return {
        tableItems,
        totalDia: totalDia.produccion,
        totalTurno: currentShiftData.produccion,
        metaTurnoDB: currentShiftData.meta,
        totalDelta,
        shiftsStatus: shiftsStatus || []
    };
};

export const useProductionData = (linea, fecha, turno, metaPorHora, apiFunctions) => {
    const cacheKey = `${linea}_${fecha}`;

    const [data, setData] = useState(() => {
        const cached = productionDataCache.get(cacheKey);
        if (cached?.megaData && turno && turno !== '0') {
            return {
                ...buildStateFromRaw(fecha, turno, cached.megaData, cached.shiftsStatus),
                loading: false,
                error: null
            };
        }
        return {
            tableItems: [],
            totalDia: 0,
            totalDelta: [],
            shiftsStatus: [],
            totalTurno: 0,
            metaTurnoDB: 0,
            loading: true,
            error: null
        };
    });

    const [isSaving, setIsSaving] = useState(false);
    const requestIdRef = useRef(0);

    // 1. Pintado instantáneo (0 ms) desde caché al cambiar de línea o de turno
    useEffect(() => {
        if (!turno || turno === '0') return;
        const cached = productionDataCache.get(cacheKey);
        if (cached && cached.megaData) {
            setData(prev => ({
                ...prev,
                ...buildStateFromRaw(fecha, turno, cached.megaData, cached.shiftsStatus),
                loading: false,
                error: null
            }));
        } else {
            setData(prev => ({
                ...prev,
                loading: true,
                error: null
            }));
        }
    }, [cacheKey, fecha, turno]);

    const saveLossRealTime = async (hora, minutosCalculados, detallesNuevos, idSupervisor, idLider) => {
        setIsSaving(true);
        try {
            const padre = await apiFunctions.syncParentLoss(fecha, hora, minutosCalculados, idSupervisor, idLider);
            for (const detalle of detallesNuevos) {
                await apiFunctions.addLossDetail(padre.data.IdPerdida, detalle);
            }
            await fetchAll(true, false, true);
        } catch (error) {
            console.warn("Fallo de red detectado, guardando localmente");

            const queueKey = `offline_queue_${linea}`;
            const queue = JSON.parse(localStorage.getItem(queueKey)) || [];
            queue.push({ hora, minutosCalculados, detallesNuevos, fecha, turno, idSupervisor, idLider });
            localStorage.setItem(queueKey, JSON.stringify(queue));
        } finally {
            setIsSaving(false);
        }
    };

    const syncOfflineQueue = async () => {
        const queueKey = `offline_queue_${linea}`;
        const queue = JSON.parse(localStorage.getItem(queueKey)) || [];
        if (queue.length === 0) return;

        setIsSaving(true);
        try {
            console.log(`Sincronizando ${queue.length} registros pendientes...`);
            for (const item of queue) {
                const padre = await apiFunctions.syncParentLoss(item.fecha, item.hora, item.minutosCalculados, item.idSupervisor, item.idLider);
                for (const detalle of item.detallesNuevos) {
                    await apiFunctions.addLossDetail(padre.data.IdPerdida, detalle);
                }
            }
            localStorage.removeItem(queueKey);
        } catch (error) {
            console.warn("La red sigue inestable, se reintentará en el próximo ciclo");
        } finally {
            setIsSaving(false);
        }
    };

    const deleteLossRealTime = async (idDetalle) => {
        setIsSaving(true);
        try {
            await apiFunctions.deleteLossDetail(idDetalle);
            await fetchAll(true, false, true);
        } catch (error) {
            console.error("Error al borrar detalle", error);
            alert("Sin conexión! No se pudo borrar el registro");
        } finally {
            setIsSaving(false);
        }
    };

    const fetchAll = useCallback(async (isPoll = false, forceShiftStatus = false, ignoreTTL = false) => {
        if (!turno || turno === '0') return;

        const cached = productionDataCache.get(cacheKey);
        const now = Date.now();

        // Si ya tenemos datos frescos (< 20 s) y no es polling ni forzado, no disparamos petición de red
        if (!isPoll && !ignoreTTL && cached?.megaData && (now - cached.timestamp < CACHE_FRESH_TTL_MS)) {
            return;
        }

        const currentRequestId = ++requestIdRef.current;

        if (!isPoll && !cached?.megaData) {
            setData(prev => ({ ...prev, loading: true }));
        }

        // 1. Esperamos PRIMERO a getDailyProduction sin competir con llamadas secundarias
        try {
            const megaData = await fetchProductionDeduped(linea, fecha, apiFunctions.getDailyProduction);

            // Ignorar respuesta si el usuario ya cambió a otra línea mientras se descargaba
            if (currentRequestId !== requestIdRef.current) return;

            const existingShiftsStatus = productionDataCache.get(cacheKey)?.shiftsStatus || [];
            productionDataCache.set(cacheKey, {
                megaData,
                shiftsStatus: existingShiftsStatus,
                timestamp: Date.now()
            });

            setData(prev => ({
                ...prev,
                ...buildStateFromRaw(fecha, turno, megaData, prev.shiftsStatus?.length ? prev.shiftsStatus : existingShiftsStatus),
                loading: false,
                error: null
            }));

            // 2. Cargar shift-status DESPUÉS de haber pintado la producción principal para no competir por red
            if (forceShiftStatus || !shiftStatusLoadedKeys.has(cacheKey)) {
                shiftStatusLoadedKeys.add(cacheKey);
                fetchShiftStatusDeduped(linea, fecha, apiFunctions.getShiftsStatus)
                    .then((shiftsStatus) => {
                        const currentCached = productionDataCache.get(cacheKey);
                        if (currentCached) {
                            productionDataCache.set(cacheKey, {
                                ...currentCached,
                                shiftsStatus: shiftsStatus || []
                            });
                        }
                        if (currentRequestId === requestIdRef.current) {
                            setData(prev => ({
                                ...prev,
                                shiftsStatus: shiftsStatus || []
                            }));
                        }
                    })
                    .catch((err) => {
                        shiftStatusLoadedKeys.delete(cacheKey);
                        console.warn("No se pudo obtener shift-status en segundo plano:", err);
                    });
            }

            await syncOfflineQueue();
        } catch (error) {
            if (currentRequestId !== requestIdRef.current) return;
            console.error("Error fetching data:", error);
            setData(prev => ({ ...prev, error, loading: false }));
        }
    }, [linea, fecha, turno, metaPorHora, apiFunctions, cacheKey]);

    // Función para cambiar el estado del turno
    const toggleShiftDB = useCallback(async (turnoId, estadoActual) => {
        try {
            const nuevoEstado = !estadoActual;
            await apiFunctions.postShiftToggle(fecha, turnoId, nuevoEstado);
            fetchAll(true, true, true);
        } catch (err) {
            console.error("Error al cambiar el estado del turno en el Hook:", err);
        }
    }, [apiFunctions, fecha, fetchAll]);

    // Efecto con Debounce (100 ms) al cambiar de línea + Polling cada 30 s en la línea donde te detienes
    useEffect(() => {
        if (!turno || turno === '0') return;

        const isToday = fecha === getFormattedDate();
        const hasAnyCache = productionDataCache.size > 0;
        const debounceDelay = hasAnyCache ? SWITCH_DEBOUNCE_MS : 0;

        const debounceTimer = setTimeout(() => {
            fetchAll(false);
        }, debounceDelay);

        let pollInterval = null;
        if (isToday) {
            pollInterval = setInterval(() => fetchAll(true), 30000);
        }

        return () => {
            clearTimeout(debounceTimer);
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [fetchAll, fecha, turno]);

    return { ...data, toggleShiftDB, fetchAll, saveLossRealTime, deleteLossRealTime };
};
