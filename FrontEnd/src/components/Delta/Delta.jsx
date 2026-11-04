import React from 'react';

const Delta = ({ total, accGoal, totalTurno, eficiencia, activeShifts = [], onToggleShift, isAdmin, onAccessDenied }) => {
    const deltaValue = total - accGoal;
    const deltaSign = deltaValue >= 0 ? "+" : "";

    // Agregamos la verificación de turnos inactivos y meta en 0
    const hasActiveShifts = activeShifts.some(s => s.Activo || s.ACTIVO);
    const deltaColor = (!hasActiveShifts || accGoal === 0) 
        ? '#4caf50' 
        : (eficiencia >= 100 ? '#4caf50' : (eficiencia >= 90 ? '#fbc02d' : '#f44336'));

    const displayValue = Math.min(Math.max(eficiencia,0), 100);
    
    // console.log('totalTurno content:', totalTurno);
    // console.log('totalTurno length:', totalTurno?.length);
    const shifts = [
        {id: '1', label: 'T1', value: totalTurno[0]?.contador ?? 0},
        {id: '2', label: 'T2', value: totalTurno[1]?.contador ?? 0},
        {id: '3', label: 'T3', value: totalTurno[2]?.contador ?? 0}
    ];

    //console.log(shifts);

    return (
        <div className='medidor-card' style={{border: `3px solid ${deltaColor}`}}>
            <div className='total-dia-title'>
                TOTAL DÍA
            </div>
            <div className='total-dia-container'>
            <div className='total-dia-top-info' style={{ flex: '1'}}>
                <div className='delta-main-number' style={{ fontSize: '2.2rem', fontWeight: 'bold', color: deltaColor, lineHeight: '1' }}>
                    {total} <span style={{ fontSize: '1rem', color: '#888', fontWeight: 'normal' }}>/ {parseInt(accGoal)}</span>
                </div>
                <div className='delta-pill-badge' style={{ 
                    fontSize: '1.3rem', 
                    fontWeight: 'bold', 
                    color: deltaColor, 
                    marginTop: '8px',
                    backgroundColor: `${deltaColor}40`,
                    padding: '2px 10px',
                    borderRadius: '20px',
                }}>
                    Delta: {deltaSign}{parseInt(deltaValue)}
                </div>
            </div>
            <div className='vertical-div'></div>
            <div className='total-dia-right-breakdown'>
                {shifts.map((s) => {
                    // 1. Buscamos el estado del turno en el arreglo que viene de la BD
                    // Aseguramos comparar como string ya que viene como INT desde SQL
                    const statusDB = activeShifts.find(shift => String(shift.Turno) === String(s.id));
                    
                    // 2. Si existe en la BD evaluamos su estado, si no hay registro asumimos true (por defecto)
                    const isActive = statusDB ? Boolean(statusDB.Activo) : true;

                    return (
                        <div 
                            key={s.id} 
                            onClick={() => isAdmin ? onToggleShift(s.id, isActive) : onAccessDenied("Acceso Protegido: Introduzca credenciales válidas.")}
                            style={{ 
                                display: 'flex', justifyContent: 'space-between', fontSize: '1rem',
                                cursor: isAdmin ? 'pointer' : 'not-allowed', 
                                opacity: isActive ? 1 : 0.4,
                                textDecoration: isActive ? 'none' : 'line-through' 
                            }}
                            title={!isAdmin ? "Acceso Restringido" : (isActive ? "Turno activo (Click para desactivar)" : "Turno inactivo (Click para activar)")}
                        >
                            <span style={{ fontWeight: 'bold', color: isActive ? '#6e6e6e' : '#888888' }}>
                                {/* Punto de color de estado */}
                                <span style={{ marginRight: '5px', color: isActive ? '#4caf50' : '#727272' }}>●</span>
                                {s.label}:
                            </span>
                            <strong style={{ marginLeft: '10px', color: '#333' }}>{s.value}</strong>
                        </div>
                    );
                })}
            </div>
        </div>
            <div className="progressBar-container">
                <div className="progressBar" style={{ width: `${displayValue}%`, backgroundColor: deltaColor  }}></div>
            </div>
        </div>
        
    );
};

export const ShiftDeltaCard = ({ shift, real, plan, eficiencia, perdidaJustificada = 0, perdidaNoJustificada = 0, onClick }) => {
    const deltaValue = real - plan;
    const deltaSign = deltaValue >= 0 ? "+" : "";

    const deltaColor = plan === 0
        ? '#4caf50'
        : (eficiencia >= 100 ? '#4caf50' : (eficiencia >= 90 ? '#fbc02d' : '#f44336'));

    const displayValue = Math.min(Math.max(eficiencia, 0), 100);

    return (
        <div
            className="medidor-card shift-clickable-card"
            style={{ border: `3px solid ${deltaColor}`, cursor: 'pointer' }}
            onClick={onClick}
            title="Pulsar para ver carrusel de producción por hora"
        >
            <div className="total-dia-title">
                TURNO {shift && shift !== '0' ? shift : ''}
            </div>
            <div className="total-dia-container">
                <div className="total-dia-top-info" style={{ flex: '1' }}>
                    <div className="delta-main-number" style={{ fontSize: '2.2rem', fontWeight: 'bold', color: deltaColor, lineHeight: '1' }}>
                        {real} <span style={{ fontSize: '1rem', color: '#888', fontWeight: 'normal' }}>/ {parseInt(plan)}</span>
                    </div>
                    <div className="delta-pill-badge" style={{
                        fontSize: '1.3rem',
                        fontWeight: 'bold',
                        color: deltaColor,
                        marginTop: '8px',
                        backgroundColor: `${deltaColor}40`,
                        padding: '2px 10px',
                        borderRadius: '20px',
                    }}>
                        Delta: {deltaSign}{parseInt(deltaValue)}
                    </div>
                </div>
                <div className="vertical-div"></div>
                <div className="total-dia-right-breakdown" style={{ justifyContent: 'center', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: '#6e6e6e' }}>
                            <span style={{ marginRight: '4px', color: '#16a34a' }}>●</span>
                            Just.:
                        </span>
                        <strong style={{ marginLeft: '6px', color: '#333' }}>{perdidaJustificada}m</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: '#6e6e6e' }}>
                            <span style={{ marginRight: '4px', color: '#dc2626' }}>●</span>
                            No Just.:
                        </span>
                        <strong style={{ marginLeft: '6px', color: '#333' }}>{perdidaNoJustificada}m</strong>
                    </div>
                </div>
            </div>
            <div className="progressBar-container">
                <div className="progressBar" style={{ width: `${displayValue}%`, backgroundColor: deltaColor }}></div>
            </div>
        </div>
    );
};

export default Delta;
