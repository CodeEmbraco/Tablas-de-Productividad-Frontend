import { 
    getFormattedDate,
    getCurrentShift, 
    generateHourSlots, 
    getMetaPorHoraIndividual, 
    horaSlotFormatter 
} from '@utils/dateUtils';

const SHIFT_ORDER = ['1', '2', '3'];

const SHIFT_START_TIMES = {
    '1': 6,  // 06:00
    '2': 14, // 14:00
    '3': 23  // 23:00
};

export const getShiftStartHour = (shiftId) => {
    return SHIFT_START_TIMES[shiftId] || 6;
};

export const calculateShiftMeta = (config) => {
    const {
        selectedDate, 
        currentClientMinute, 
        currentClientHour, 
        metaPorHora
    } = config;
    
    // CORRECCIÓN CRÍTICA: Soportar ambos nombres de parámetro para evitar el bug del 0
    const shiftId = config.shiftId || config.selectedShift;

    if (!shiftId) return 0;
    if (selectedDate < getFormattedDate()) return getFullShiftMeta({ selectedShift: shiftId, metaPorHora });
    if (selectedDate > getFormattedDate()) return 0;

    const currentShift = getCurrentShift();
    const currentIndex = SHIFT_ORDER.indexOf(currentShift);
    const targetIndex = SHIFT_ORDER.indexOf(shiftId);

    if (targetIndex < currentIndex) return getFullShiftMeta({ selectedShift: shiftId, metaPorHora });
    if (targetIndex > currentIndex) return 0;

    // SI ES EL TURNO ACTUAL: Acumulamos secuencialmente siguiendo el orden cronológico del turno
    const slots = generateHourSlots(shiftId);
    let metaAcum = 0;

    for (const slot of slots) {
        const startHour = parseInt(slot.split(':')[0], 10);
        const hourlyMeta = getMetaPorHoraIndividual(startHour, shiftId, metaPorHora);

        if (startHour === currentClientHour) {
            // Llegamos a la hora actual en curso: aplicamos proporcionalidad por cuartos de hora
            const quarter = hourlyMeta / 4;
            if (currentClientMinute >= 45) metaAcum += hourlyMeta;
            else if (currentClientMinute >= 30) metaAcum += (quarter * 2);
            else if (currentClientMinute >= 15) metaAcum += quarter;
            break; // Detenerse aquí, las horas siguientes en el bucle son el futuro
        } else {
            // Es una hora pasada dentro de la secuencia cronológica de este turno
            metaAcum += hourlyMeta;
        }
    }
    return metaAcum;
};

export const getFullShiftMeta = (config) => {
    const { metaPorHora } = config;
    // CORRECCIÓN CRÍTICA: Soportar ambos nombres de parámetro
    const shiftId = config.selectedShift || config.shiftId;
    if (!shiftId) return 0;

    return generateHourSlots(shiftId).reduce((acc, slot) => {
        const start = parseInt(slot.split(':')[0], 10);
        return acc + getMetaPorHoraIndividual(start, shiftId, metaPorHora);
    }, 0);
};

export const calcularMetaDiaAcumulada = (config, shiftFilter = null) => {
    const { selectedDate, metaPorHora, currentClientHour, currentClientMinute } = config;
    const today = getFormattedDate();
    
    if (selectedDate > today) return 0;

    const currentShift = getCurrentShift();
    const currentShiftIdx = SHIFT_ORDER.indexOf(currentShift);
    let totalAcc = 0;

    for (let i = 0; i < SHIFT_ORDER.length; i++) {
        const shiftId = SHIFT_ORDER[i];
        
        let isShiftActive = true;
        if (shiftFilter) {
            if (Array.isArray(shiftFilter)) {
                if (shiftFilter.length === 0) {
                    isShiftActive = true; // Si está vacío al iniciar, por defecto está activo
                } else if (typeof shiftFilter[0] === 'object') {
                    const found = shiftFilter.find(s => String(s?.Turno ?? s?.id ?? '') === String(shiftId));
                    isShiftActive = found ? Boolean(found.Activo) : true;
                } else {
                    isShiftActive = shiftFilter.map(String).includes(String(shiftId));
                }
            } else if (shiftFilter.activeShifts && Array.isArray(shiftFilter.activeShifts)) {
                isShiftActive = shiftFilter.activeShifts.map(String).includes(String(shiftId));
            }
        }

        if (!isShiftActive) continue;

        if (selectedDate === today) {
            const targetIndex = SHIFT_ORDER.indexOf(shiftId);
            if (targetIndex < currentShiftIdx) {
                totalAcc += getFullShiftMeta({ selectedShift: shiftId, metaPorHora });
            } else if (targetIndex === currentShiftIdx) {
                totalAcc += calculateShiftMeta({ 
                    shiftId, selectedDate, currentClientMinute, currentClientHour, metaPorHora
                });
                break; 
            }
        } else {
            totalAcc += getFullShiftMeta({ selectedShift: shiftId, metaPorHora });
        }
    }
    return totalAcc;
};

export const calcularMetaProgresiva = (horasData, metaTurnoDB) => {
    if (!horasData || horasData.length === 0) return 0;

    const ahora = new Date();
    const horaActual = ahora.getHours();
    const minutosActuales = ahora.getMinutes();

    let metaAcumulada = 0;

    for (let i = 0; i < horasData.length; i++) {
        const fila = horasData[i];
        const metaDeEstaHora = Number(fila.MetaEfectiva) || 0;
        const horaInt = Number(fila.Hora);

        if (horaInt === horaActual) {
            const cuartosPasados = Math.floor(minutosActuales / 15);
            metaAcumulada += metaDeEstaHora * (cuartosPasados / 4);
            break; 
        } else {
            metaAcumulada += metaDeEstaHora;
        }
    }

    metaAcumulada = Math.round(metaAcumulada);
    return (metaTurnoDB > 0 && metaAcumulada > metaTurnoDB) ? metaTurnoDB : metaAcumulada;
};

export const horasEsperadas = (turno) => {
    if (turno === '1') return [6, 7, 8, 9, 10, 11, 12, 13];
    if (turno === '2') return [14, 15, 16, 17, 18, 19, 20, 21, 22];
    if (turno === '3') return [23, 0, 1, 2, 3, 4, 5];
    return [];
};

export const esHoraTerminada = (fecha, horaFija, turno) => {
    if (!fecha) return true;

    const [year, month, day] = fecha.split('-');
    const rowEnd = new Date(year, month - 1, day);
    if(String(turno) === '3' && horaFija < 6){
        rowEnd.setDate(rowEnd.getDate() + 1);
    }

    rowEnd.setHours(horaFija + 1, 0, 0, 0);

    const now = new Date();
    return now >= rowEnd;
};

/**
 * Obtiene la meta de un turno específico a partir de un objeto o arreglo de turnos.
 * Soporta formatos:
 * - Objeto: { T1: { meta: 100 }, T2: { meta: 200 } }
 * - Arreglo: [{ turno: 1, MetaEfectivaTurno: 100 }, ...] o [{ meta: 100 }, ...]
 */
export const getShiftMeta = (turnosData, shiftId) => {
    if (!turnosData) return 0;

    const keyUpper = `T${shiftId}`;
    const keyLower = `t${shiftId}`;

    if (turnosData[keyUpper] !== undefined) {
        return Number(turnosData[keyUpper]?.meta ?? turnosData[keyUpper]?.MetaEfectivaTurno ?? 0) || 0;
    }
    if (turnosData[keyLower] !== undefined) {
        return Number(turnosData[keyLower]?.meta ?? turnosData[keyLower]?.MetaEfectivaTurno ?? 0) || 0;
    }
    if (turnosData[shiftId] !== undefined && typeof turnosData[shiftId] === 'object') {
        return Number(turnosData[shiftId]?.meta ?? turnosData[shiftId]?.MetaEfectivaTurno ?? 0) || 0;
    }

    if (Array.isArray(turnosData)) {
        const found = turnosData.find(item => 
            String(item?.turno ?? item?.Turno ?? item?.id ?? '') === String(shiftId)
        );
        if (found) {
            return Number(found.MetaEfectivaTurno ?? found.meta ?? 0) || 0;
        }
        const idx = parseInt(shiftId, 10) - 1;
        if (turnosData[idx]) {
            return Number(turnosData[idx].MetaEfectivaTurno ?? turnosData[idx].meta ?? 0) || 0;
        }
    }

    return 0;
};

/**
 * Determina si un turno está activo según shiftsStatus o si su meta es mayor a 0.
 */
export const isShiftActive = (shiftsStatus, shiftId, shiftMeta = 0) => {
    if (shiftsStatus && Array.isArray(shiftsStatus) && shiftsStatus.length > 0) {
        const statusObj = shiftsStatus.find(s => 
            String(s?.Turno ?? s?.turno ?? s?.id ?? '') === String(shiftId)
        );
        if (statusObj) {
            return Boolean(statusObj.Activo ?? statusObj.ACTIVO ?? statusObj.activo);
        }
    }
    return shiftMeta > 0;
};

/**
 * Calcula la meta progresiva acumulada del día cada 15 minutos.
 *
 * @param {Object|Array} turnosData - Datos de turnos (T1, T2, T3)
 * @param {string} selectedDate - Fecha seleccionada 'YYYY-MM-DD'
 * @param {Date} currentTime - Hora/fecha de evaluación
 * @param {Array} shiftsStatus - Estado de turnos
 * @returns {number} Meta acumulada redondeada
 */
export const calcularMetaDiaProgresiva = (
    turnosData,
    selectedDate = getFormattedDate(),
    currentTime = new Date(),
    shiftsStatus = null
) => {
    if (!turnosData) return 0;

    const today = getFormattedDate(currentTime);
    const actualShift = getCurrentShift(currentTime);
    const currentHour = currentTime.getHours();
    const cuartosActuales = Math.floor(currentTime.getMinutes() / 15); // 0, 1, 2, 3

    const SHIFT_ORDER = ['1', '2', '3'];
    const currentIdx = selectedDate === today ? SHIFT_ORDER.indexOf(actualShift) : (selectedDate < today ? 3 : -1);

    let metaDiaProgresiva = 0;

    for (let index = 0; index < SHIFT_ORDER.length; index++) {
        const shiftId = SHIFT_ORDER[index];
        const metaTotalTurno = getShiftMeta(turnosData, shiftId);

        if (!isShiftActive(shiftsStatus, shiftId, metaTotalTurno)) {
            continue;
        }

        if (selectedDate < today || index < currentIdx) {
            // Turno finalizado en el día o día pasado
            metaDiaProgresiva += metaTotalTurno;
        } else if (selectedDate === today && index === currentIdx) {
            // Turno actual en curso: incremento proporcional cada 15 minutos
            const totalCuartos = shiftId === '1' ? 32 : (shiftId === '2' ? 36 : 28);
            const hrsPasadas = shiftId === '1' ? (currentHour - 6) 
                : (shiftId === '2' ? (currentHour - 14) 
                : (currentHour === 23 ? 0 : currentHour + 1));
            const cuartosTranscurridos = Math.max(0, Math.min((hrsPasadas * 4) + cuartosActuales, totalCuartos));
            metaDiaProgresiva += metaTotalTurno * (cuartosTranscurridos / totalCuartos);
        }
        // index > currentIdx: turno futuro, 0
    }

    return Math.round(metaDiaProgresiva);
};

