import { useState, useEffect, useCallback } from 'react';
import { getFormattedDate } from '@utils/dateUtils';

export const useDashboardData = (fecha, apiFunctions) => {
    const [dashboardData, setDashboardData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchAll = useCallback(async (isPoll = false) => {
        if (!isPoll) setLoading(true);

        try {
            const data = await apiFunctions.getDashboardProduction(fecha);
            setDashboardData(data || []);
            setError(null);
        } catch (error) {
            console.error("Error al obtener la producción para el Dashboard: ", error);
            setError(error);
        } finally {
            setLoading(false);
        }
    }, [fecha, apiFunctions]);

    const toggleShiftDB = useCallback(async (lineId, turnoId, estadoActual) => {
        setIsSaving(true);
        try {
            const nuevoEstado = !estadoActual;
            await apiFunctions.postShiftToggle(fecha, turnoId, nuevoEstado, lineId);
            await fetchAll(true);
        } catch (error) {
            console.error(`Error al cambiar el estado del turno para la línea ${lineId},`, error);
        }
    }, [apiFunctions, fecha, fetchAll]);

    useEffect(() => {
        const isToday = fecha === getFormattedDate();
        fetchAll();
        if (isToday) {
            const interval = setInterval(() => fetchAll(true), 30000);
            return () => clearInterval(interval);
        }
    }, [fetchAll, fecha]);

    return { dashboardData, loading, error, isSaving, toggleShiftDB, fetchAll };
};