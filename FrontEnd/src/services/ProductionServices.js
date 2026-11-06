import axios from 'axios';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

const rawBaseURL = import.meta.env.VITE_LOCAL_BACKEND_URL || 'http://localhost:3001/api';
const apiKey = import.meta.env.VITE_API_KEY || '3ce62d43fbb5b5b09a16996f62395d';
const isNative = Capacitor.isNativePlatform();

// En modo desarrollo web (navegador), si apunta al gateway api.embraco.com usamos el proxy de Vite
// para evitar que el navegador envíe preflight OPTIONS sin el header 'apikey' (que da 401 + CORS error).
const resolvedBaseURL =
    !isNative && import.meta.env.DEV && rawBaseURL.startsWith('https://api.embraco.com')
        ? rawBaseURL.replace('https://api.embraco.com', '/api-embraco')
        : rawBaseURL;

/**
 * Adaptador nativo para Android/iOS usando CapacitorHttp directamente.
 * Evita que el WebView o librerías como Eruda intercepten XMLHttpRequest y disparen
 * peticiones preflight OPTIONS bloqueadas por CORS/401 en el API Gateway.
 */
const capacitorNativeAdapter = async (config) => {
    const base = (config.baseURL || '').replace(/\/+$/, '');
    const relativeUrl = (config.url || '').replace(/^\/+/, '');
    const fullUrl = relativeUrl ? `${base}/${relativeUrl}` : base;

    let parsedData = config.data;
    if (typeof parsedData === 'string') {
        try {
            parsedData = JSON.parse(parsedData);
        } catch {
            // mantener string si no es JSON válido
        }
    }

    const stringParams = {};
    if (config.params && typeof config.params === 'object') {
        Object.entries(config.params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) {
                stringParams[k] = String(v);
            }
        });
    }

    const response = await CapacitorHttp.request({
        url: fullUrl,
        method: (config.method || 'GET').toUpperCase(),
        headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
            ...(config.headers ? Object.fromEntries(
                Object.entries(config.headers).filter(([_, v]) => typeof v === 'string')
            ) : {})
        },
        params: stringParams,
        data: parsedData
    });

    if (response.status >= 200 && response.status < 300) {
        return {
            data: response.data,
            status: response.status,
            statusText: String(response.status),
            headers: response.headers,
            config
        };
    }

    const error = new Error(`Request failed with status code ${response.status}`);
    error.config = config;
    error.response = {
        data: response.data,
        status: response.status,
        headers: response.headers
    };
    throw error;
};

const api = axios.create({
    baseURL: resolvedBaseURL,
    headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
    },
    ...(isNative ? { adapter: capacitorNativeAdapter } : {})
});

// Caché en memoria para la configuración de líneas (Nombre, Supervisores y Líderes)
const linesConfigCache = new Map();

const productionService = {
    //TABLA DE PRODUCTIVIDAD
    getDailyProduction: async (lineID, date) => {
        const params = { fecha: date };
        const response = await api.get(`${lineID}/production`, { params });
        return response.data;
    },

    //DASHBOARD
    getDashboardProduction: async (date) => {
        const params = { fecha: date };
        const response = await api.get(`dashboard/production`, { params });
        return response.data;
    },

    //PERDIDAS
    syncParentLoss: async (linea, fecha, hora, minutosCalculados, idSup, idLider) => {
        //console.log("debug: ",linea," | ", fecha," | ", hora," | ", minutosCalculados," | ", idSup," | ", idLider);
        const response = await api.post(`losses/sync-parent`, {
            linea,
            fecha,
            hora,
            minutosCalculados,
            idSupervisor: idSup,
            idLider: idLider
        });
        return response.data;
    },

    addLossDetail: async (idPerdida, detailData) => {
        const response = await api.post(`losses/${idPerdida}/details`, detailData);
        return response.data;
    },

    deleteLossDetail: async (idDetalle) => {
        const response = await api.delete(`losses/details/${idDetalle}`);
        return response.data;
    },

    //ESTADOS DE TURNO
    getShiftsStatus: async (lineId, fecha, lineNo = null) => {
        const params = { fecha: fecha, lineId: lineId };
        if (lineNo) params.lineNo = lineNo;
        const response = await api.get(`shift/shift-status`, { params });
        return response.data;
    },

    shiftToggleStatus: async (lineId, fecha, turno, nuevoEstado, lineNo = null) => {
        try {
            const response = await api.post('shift/shift-toggle', {
                fecha: fecha,
                lineId: lineId,
                turno: turno,
                nuevoEstado: nuevoEstado,
                lineNo: lineNo
            });
            return response.data;
        } catch (error) {
            console.error("Error al actualizar el estado del turno en la BD:", error);
            throw error;
        }
    },

    //CONFIGURACION DE LINEAS
    getLinesConfig: async (lineId = null) => {
        const cacheKey = lineId || '__ALL__';
        if (linesConfigCache.has(cacheKey)) {
            return linesConfigCache.get(cacheKey);
        }
        const params = lineId ? { lineId: lineId } : {};
        const response = await api.get(`lines/lines-config`, { params });
        if (response.data) {
            linesConfigCache.set(cacheKey, response.data);
        }
        return response.data;
    },

    getCachedLineConfig: (lineId) => {
        return linesConfigCache.get(lineId || '__ALL__') || null;
    },

    //METAS
    updateDefaultGoalShift: async (lineId, turno, metaDefault, lineNo = null) => {
        try {
            const params = {};
            if (lineNo) params.lineNo = lineNo;
            const response = await api.post(`goal/default-goal-update-shift`, {
                lineId: lineId,
                turno: turno,
                metaDefault: metaDefault
            }, { params });
            return response.data;
        }
        catch (err) {
            console.error("Error actualizando la meta:", err);
            throw err;
        }
    },

    updateDefaultGoalTimeSlot: async (lineId, horaSlot, metaDefault, lineNo = null) => {
        try {
            const params = {};
            if (lineNo) params.lineNo = lineNo;
            const response = await api.post(`goal/default-goal-update-timeslot`, {
                lineId: lineId,
                horaSlot: horaSlot,
                metaDefault: metaDefault
            }, { params });
            return response.data;
        }
        catch (err) {
            console.error("Error actualizando la meta:", err);
            throw err;
        }
    },

    updateCustomGoal: async (lineId, fecha, turno, horaSlot, metaCustom, user, lineNo = null) => {
        try {
            const params = {};
            if (lineNo) params.lineNo = lineNo;
            const response = await api.post(`goal/custom-goal-update`, {
                lineId: lineId,
                fecha: fecha,
                turno: turno,
                horaSlot: horaSlot,
                metaCustom: metaCustom,
                user: user,
                lineNo: lineNo
            }, { params });
            return response.data;
        }
        catch (err) {
            console.error("Error actualizando la meta:", err);
            throw err;
        }
    },

    getLineEffectiveGoalDay: async (lineId, date, lineNo = null) => {
        const params = { fecha: date, lineId: lineId };
        if (lineNo) params.lineNo = lineNo;
        const response = await api.get(`goal/line-effective-goal-day`, { params });
        return response.data;
    },

    //AUTENTICACIÓN (LOGIN CON NÓMINA)
    login: async (usuario, password) => {
        const response = await api.post(`auth/login`, {
            usuario: String(usuario).trim(),
            password
        });
        return response.data;
    },

    getUserByNomina: async (usuario) => {
        const response = await api.get(`auth/user/${encodeURIComponent(String(usuario).trim())}`);
        return response.data;
    }
};

export default productionService;
