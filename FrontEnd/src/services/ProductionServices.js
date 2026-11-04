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
