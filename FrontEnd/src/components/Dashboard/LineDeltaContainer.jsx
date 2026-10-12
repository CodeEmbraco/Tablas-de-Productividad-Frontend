import React from 'react';
import DashboardDelta from './DashboardDelta';
import zero from '@assets/zeroproductividad.png';

const LineDeltaContainer = ({ lineConfig, isLarge, isAdmin, onAccessDenied, onToggleShift }) => {
    if (!lineConfig || !lineConfig.datosAPI) return null;

    // Extraemos la información del nuevo objeto de API
    const datos = lineConfig.datosAPI;
    const totalDia = datos.totalDia?.produccion || 0;

    const accGoal = datos.totalDia?.metaAcumulada || 0; 
    const metaTotal = datos.totalDia?.metaTotal || 0;

    const eficiencia = accGoal > 0 ? Math.round((totalDia / accGoal) * 100) : 0;
    // Formateamos el objeto de turnos para DashboardDelta
    const totalDelta = [
        datos.turnos?.T1 || { produccion: 0, meta: 0 },
        datos.turnos?.T2 || { produccion: 0, meta: 0 },
        datos.turnos?.T3 || { produccion: 0, meta: 0 }
    ];
    // Mockeamos el shiftsStatus si el endpoint nuevo no lo manda aún, 
    // o asume activo si hay meta en ese turno
    const shiftsStatus = [
        { Turno: 1, Activo: (datos.turnos?.T1?.meta > 0) },
        { Turno: 2, Activo: (datos.turnos?.T2?.meta > 0) },
        { Turno: 3, Activo: (datos.turnos?.T3?.meta > 0) }
    ];

    const status = eficiencia >= 100 ? "bueno" : eficiencia >= 90 ? "medio" : "mal";
    const deltaColor = accGoal === 0 ? '#4caf50' : (eficiencia >= 100 ? '#4caf50' : (eficiencia >= 90 ? '#fbc02d' : '#ea5a00'));

    return (
        <div className="grid-item" style={{
            borderTop: `8px solid ${deltaColor}`,
            height: isLarge ? '485px' : '325px',
            display: 'flex',
            flexDirection: 'column',
            padding: '10px',
            boxSizing: 'border-box',
            overflow: 'hidden',
            position: 'relative',
            transition: 'all 0.4s ease-in-out'
        }}>
            <div style={{
                textAlign: 'center',
                fontSize: isLarge ? '2.2rem' : '1.5rem',
                fontWeight: 'bold',
                padding: '5px',
                transition: 'font-size 0.4s ease'
            }}>
                {lineConfig.name}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <DashboardDelta
                    total={totalDia}
                    accGoal={accGoal}
                    metaTotal={metaTotal}
                    eficiencia={eficiencia}
                    status={status}
                    activeShifts={shiftsStatus}
                    onToggleShift={(turnoId, estado) => onToggleShift(lineConfig.id, turnoId, estado)}
                    totalTurno={totalDelta}
                    imgURL={lineConfig.imgURL || zero}
                    isAdmin={isAdmin}
                    onAccessDenied={onAccessDenied}
                    isLarge={isLarge}
                />
            </div>
        </div>
    );
};

export default LineDeltaContainer;