// React & Router
import React, { useState, useEffect, useMemo } from 'react';

// Context & Hooks
import { useAdmin } from '@hooks/useAdmin';
import { useProduction } from '@context/ProductionContext';
import { useDashboardData } from '@hooks/useDashboardData'; // <-- Tu nuevo hook

// Services
import productionService from '@services/ProductionServices';

// Components
import LineDeltaContainer from '@components/Dashboard/LineDeltaContainer';
import Header from '@components/Header/Header';
import Footer from '@components/Footer/footer';
import ClockTime from '@components/ClockTime/ClockTime';
import AdminTimer from '@components/Admin/AdminTimer';
import AdminAccessButton from '@components/Admin/AdminAccessButton';
import ConsolidatedRate from '@components/Dashboard/ConsolidatedRate';

import { LINES_CONFIG } from '@config/linesConfig';

const GlobalDashboard = () => {
    const { selectedDate, selectedShift } = useProduction();
    const { isAdmin, handleUnlock, handleExpire, adminWarning, showWarning } = useAdmin();

    // 1. Configuramos la API para el hook global
    const apiConfig = useMemo(() => ({
        getDashboardProduction: (date) => productionService.getDashboardProduction(date),
        postShiftToggle: (date, shift, shiftStatus, lineId) => productionService.shiftToggleStatus(lineId, date, shift, shiftStatus)
    }), []);

    // 2. Traemos TODA la información de un solo golpe
    const {
        dashboardData,
        loading,
        toggleShiftDB
    } = useDashboardData(selectedDate, apiConfig);

    // 3. Mezclamos los datos del backend con las imágenes estáticas de LINES_CONFIG
    const lineasProcesadas = useMemo(() => {
        if (!dashboardData || dashboardData.length === 0) return [];

        return dashboardData.map(lineaDB => {
            // Buscamos la config visual base (imágenes, etc)
            const baseConfig = Object.values(LINES_CONFIG).find(
                c => c.id.toLowerCase() === lineaDB.LineId.toLowerCase() ||
                    (c.lineNo && `${c.id}_${c.lineNo}`.toLowerCase() === lineaDB.LineId.toLowerCase())
            ) || {};

            return {
                ...baseConfig, // Trae imgURL
                id: lineaDB.LineId,
                name: lineaDB.Nombre,
                datosAPI: lineaDB // Inyectamos la data de producción aquí
            };
        });
    }, [dashboardData]);

    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (lineasProcesadas.length === 0) return;
        const interval = setInterval(() => {
            setActiveIndex((prevIndex) => (prevIndex + 2) % lineasProcesadas.length);
        }, 20 * 1000); // 20 segundos
        return () => clearInterval(interval);
    }, [lineasProcesadas.length]);

    if (loading && lineasProcesadas.length === 0) {
        return <div className="loading-screen"><p>Cargando Dashboard Global...</p></div>;
    }

    const focusedLine = lineasProcesadas[activeIndex];
    const nextIndex = (activeIndex + 1) % lineasProcesadas.length;
    const lineasCarousel = lineasProcesadas.filter((_, idx) => idx !== activeIndex && idx !== nextIndex);
    const cardStyleSmall = { flex: '0 0 auto', width: '600px', height: '100%' };

    return (
        <div className="global-dashboard-kiosk">
            <Header title="Dashboard Global de Producción" />

            {adminWarning && <div className="discreet-notification warning-toast">⚠️ {adminWarning}</div>}
            {isAdmin && <AdminTimer onExpire={handleExpire} />}

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box', overflow: 'hidden', justifyContent: 'space-around' }}>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', fontSize: '2rem', fontWeight: '600' }}>
                    <div style={{ marginRight: '40px' }}><ClockTime /></div>
                </div>

                <div style={{ flex: '0 0 60%', display: 'flex', gap: '20px', padding: '10px', overflow: 'hidden' }}>
                    {lineasProcesadas.length > 0 && (
                        <div style={{ flex: 1, overflow: 'hidden' }} key={`consolidated_${activeIndex}`}>
                            {/* Pasamos el arreglo completo */}
                            <ConsolidatedRate lines={lineasProcesadas} />
                        </div>
                    )}

                    {focusedLine && (
                        <div style={{ flex: 1, overflow: 'hidden' }} key={`focus_${focusedLine.id}`} className="slide-up-animation">
                            <LineDeltaContainer
                                lineConfig={focusedLine}
                                isLarge={true}
                                isAdmin={isAdmin}
                                onAccessDenied={showWarning}
                                onToggleShift={toggleShiftDB}
                            />
                        </div>
                    )}
                </div>

                <div style={{ flex: '0 0 calc(40% - 20px)', paddingBottom: '10px', overflow: 'hidden', position: 'relative' }}>
                    <div className="marquee-track-left">
                        {lineasCarousel.map((lineaConfig, idx) => (
                            <div key={`bot1_${lineaConfig.id}_${idx}`} style={cardStyleSmall}>
                                <LineDeltaContainer
                                    lineConfig={lineaConfig}
                                    isLarge={false}
                                    isAdmin={isAdmin}
                                    onAccessDenied={showWarning}
                                    onToggleShift={toggleShiftDB}
                                />
                            </div>
                        ))}
                        {lineasCarousel.map((lineaConfig, idx) => (
                            <div key={`bot2_${lineaConfig.id}_${idx}`} style={cardStyleSmall}>
                                <LineDeltaContainer
                                    lineConfig={lineaConfig}
                                    isLarge={false}
                                    isAdmin={isAdmin}
                                    onToggleShift={toggleShiftDB}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <AdminAccessButton isAdmin={isAdmin} onUnlock={handleUnlock} className="btn-admin-floating" />
            <Footer />
        </div>
    );
};

export default GlobalDashboard;