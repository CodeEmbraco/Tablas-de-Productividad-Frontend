import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_LOCAL_BACKEND_URL || 'http://localhost:3001/api',
    headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_API_KEY || '3ce62d43fbb5b5b09a16996f62395d'
    }
});

// Caché en memoria para la configuración de líneas (Nombre, Supervisores y Líderes)
const linesConfigCache = new Map();

/**
 * El Gateway Nginx de api.embraco.com tiene un balanceo donde ~1 de cada N conexiones
 * cae en un upstream que espera 60s (proxy_connect_timeout = 60000ms) antes de hacer failover.
 * Con Request Hedging, si una lectura tarda más de 2.5s sin responder, disparamos una petición
 * paralela de respaldo (con query param único para evitar bloqueo de caché del WebView) que
 * entra al nodo activo y responde en ~900ms en lugar de esperar 60.9 segundos.
 */
const HEDGE_DELAY_1_MS = 2500;
const HEDGE_DELAY_2_MS = 5500;

const hedgedGet = async (url, params = {}) => {
    const c1 = new AbortController();
    const c2 = new AbortController();
    const c3 = new AbortController();
    let timer1 = null;
    let timer2 = null;

    const p1 = api.get(url, { params, signal: c1.signal })
        .then((res) => ({ winner: 1, data: res.data }));

    const p2 = new Promise((resolve, reject) => {
        timer1 = setTimeout(() => {
            api.get(url, {
                params: { ...params, _h: `${Date.now()}_1` },
                signal: c2.signal
            }).then((res) => resolve({ winner: 2, data: res.data }), reject);
        }, HEDGE_DELAY_1_MS);
    });

    const p3 = new Promise((resolve, reject) => {
        timer2 = setTimeout(() => {
            api.get(url, {
                params: { ...params, _h: `${Date.now()}_2` },
                signal: c3.signal
            }).then((res) => resolve({ winner: 3, data: res.data }), reject);
        }, HEDGE_DELAY_2_MS);
    });

    try {
        const result = await Promise.any([p1, p2, p3]);
        clearTimeout(timer1);
        clearTimeout(timer2);
        if (result.winner !== 1) c1.abort();
        if (result.winner !== 2) c2.abort();
        if (result.winner !== 3) c3.abort();
        return result.data;
    } catch (err) {
        clearTimeout(timer1);
        clearTimeout(timer2);
        throw err?.errors?.[0] || err;
    }
};

const hedgedPostReadOnly = async (url, body = {}) => {
    const c1 = new AbortController();
    const c2 = new AbortController();
    let timer1 = null;

    const p1 = api.post(url, body, { signal: c1.signal })
        .then((res) => ({ winner: 1, data: res.data }));

    const p2 = new Promise((resolve, reject) => {
        timer1 = setTimeout(() => {
            api.post(url, body, {
                params: { _h: `${Date.now()}_1` },
                signal: c2.signal
            }).then((res) => resolve({ winner: 2, data: res.data }), reject);
        }, HEDGE_DELAY_1_MS);
    });

    try {
        const result = await Promise.any([p1, p2]);
        clearTimeout(timer1);
        if (result.winner !== 1) c1.abort();
        if (result.winner !== 2) c2.abort();
        return result.data;
    } catch (err) {
        clearTimeout(timer1);
        throw err?.errors?.[0] || err;
    }
};

const productionService = {
    //TABLA DE PRODUCTIVIDAD
    getDailyProduction: async (lineID, date) => {
        return hedgedGet(`${lineID}/production`, { fecha: date });
    },

    //DASHBOARD
    getDashboardProduction: async (date) => {
        return hedgedGet(`dashboard/production`, { fecha: date });
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
        return hedgedGet(`shift/shift-status`, params);
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
        const data = await hedgedGet(`lines/lines-config`, params);
        if (data) {
            linesConfigCache.set(cacheKey, data);
        }
        return data;
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
        return hedgedGet(`goal/line-effective-goal-day`, params);
    },

    //AUTENTICACIÓN (LOGIN CON NÓMINA)
    login: async (usuario, password) => {
        return hedgedPostReadOnly(`auth/login`, {
            usuario: String(usuario).trim(),
            password
        });
    },

    getUserByNomina: async (usuario) => {
        return hedgedGet(`auth/user/${encodeURIComponent(String(usuario).trim())}`);
    }
};

export default productionService;
