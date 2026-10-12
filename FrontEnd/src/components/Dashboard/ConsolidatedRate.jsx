import React from 'react';
import ZeroBien from '@assets/zero-status-color/zero-green.png';
import ZeroMal from '@assets/zero-status-color/zero-red.png';
import ZeroYellow from '@assets/zero-status-color/zero-yellow.png';
import '@styles/global.css';

const LineRateItem = ({ name, real, metaAcumulada, metaTotal }) => {
    const eficiencia = metaAcumulada > 0 ? Math.round((real / metaAcumulada) * 100) : 0;
    const itemColor = metaAcumulada === 0 ? '#4caf50' : (eficiencia >= 100 ? '#4caf50' : (eficiencia >= 90 ? '#fbc02d' : '#ea5a00'));

    return (
        <div className="progressBar-container" style={{ position: 'relative', height: '40px', width: '100%', borderRadius: '40px', overflow: 'hidden', zIndex: 1 }}>
            <div className="progress-bar-gradient" style={{ '--dynamic-color': itemColor, position: 'absolute', top: 0, left: 0, width: "100%", height: '100%', zIndex: 2 }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: '5px 10px', zIndex: 10, color: '#000000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>{name}: </span>
                    <strong style={{ color: itemColor, fontSize: '1.8rem', marginRight: '15px' }}>
                        {/* Se muestra la producción real y la meta final del día */}
                        {real} / {parseInt(metaAcumulada)}
                    </strong>
                </div>
            </div>
        </div>
    );
};

/**
 * Contenedor principal que muestra el rate consolidado de todas las líneas.
 */
const ConsolidatedRate = ({ lines }) => {
    const totalReal = lines.reduce((acc, curr) => acc + (curr.datosAPI?.totalDia?.produccion || 0), 0);
    const totalMetaAcumulada = lines.reduce((acc, curr) => acc + (curr.datosAPI?.totalDia?.metaAcumulada || 0), 0);
    const totalMetaFinal = lines.reduce((acc, curr) => acc + (curr.datosAPI?.totalDia?.metaAcumulada || 0), 0);
    const totalEficiencia = totalMetaAcumulada > 0 ? (totalReal / totalMetaAcumulada) * 100 : 0;
    
    const statusClass = totalEficiencia >= 100 ? 'bueno' : (totalEficiencia >= 90 ? 'medio' : 'mal');
    const statusImage = statusClass === 'bueno' ? ZeroBien : (statusClass === 'medio' ? ZeroYellow : ZeroMal);
    
    const deltaColor = totalMetaAcumulada === 0 ? '#4caf50' : (totalEficiencia >= 100 ? '#4caf50' : (totalEficiencia >= 90 ? '#fbc02d' : '#ea5a00'));

    return (
        <div className="grid-item" style={{ border: `0px`, padding: '10px', boxSizing: 'border-box', pointerEvents: 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center', width: '100%' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    {lines.map(line => (
                        <LineRateItem
                            key={line.id}
                            name={line.name}
                            real={line.datosAPI?.totalDia?.produccion || 0}
                            metaAcumulada={line.datosAPI?.totalDia?.metaAcumulada || 0}
                            metaTotal={line.datosAPI?.totalDia?.metaTotal || 0}
                        />
                    ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px', width: '100%' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.7rem', fontWeight: 'bold', color: '#000' }}>TOTAL PLANTA</div>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: deltaColor, lineHeight: 1.1 }}>
                            {totalReal}
                            {/* Muestra la meta final del día para no confundir al operador */}
                            <span style={{ fontSize: '1.5rem', color: '#888', fontWeight: 'normal' }}>/{parseInt(totalMetaFinal)}</span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <img src={statusImage} alt="Status Indicator" fetchPriority="high" style={{ height: '400px', transition: 'all 0.3s', objectFit: 'fill' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsolidatedRate;