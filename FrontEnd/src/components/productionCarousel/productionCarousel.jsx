import React, { useState, useEffect } from 'react';
import '@styles/global.css';

const ProductionCarousel = ({ 
    items = [], 
    onOpenModal, 
    localConfig, 
    onSetMeal,
    lineName = ''
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Resetear al primer registro de hora si cambia la lista o la línea
    useEffect(() => {
        setCurrentIndex(0);
    }, [items, lineName]);

    const hasItems = items && items.length > 0;
    const currentItem = hasItems ? (items[currentIndex] || items[0]) : null;
    const isMeal = currentItem && localConfig?.mealHour === currentItem.hora;

    // Navegación de HORAS (mediante los botones < >)
    const handlePrevHour = () => {
        if (!hasItems) return;
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    };

    const handleNextHour = () => {
        if (!hasItems) return;
        setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    };

    return (
        <div className="production-carousel-container">
            {/* Banner superior con la Línea Actual (solo informativo dentro del popup) */}
            <div style={{
                textAlign: 'center',
                marginBottom: '12px',
                padding: '6px 12px',
                backgroundColor: '#f1f5f9',
                borderRadius: '8px',
                border: '1px solid #cbd5e1'
            }}>
                <div style={{
                    fontSize: '1.15rem',
                    fontWeight: '800',
                    color: '#0f172a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    Línea: {lineName || 'Sin identificar'}
                </div>
            </div>

            {/* Cabecera del Carrusel (Navegación de Horas) */}
            <div className="carousel-header">
                <button className="btn-carousel-nav" onClick={handlePrevHour} disabled={!hasItems}>
                    &lt;
                </button>
                <div className="carousel-time-title">
                    <span>
                        Hora: <strong>{hasItems ? (currentItem.hora || currentItem.hour) : '--:--'}</strong>
                    </span>
                    <small>
                        {hasItems ? `(${currentIndex + 1} de ${items.length})` : '(0 de 0)'}
                    </small>
                </div>
                <button className="btn-carousel-nav" onClick={handleNextHour} disabled={!hasItems}>
                    &gt;
                </button>
            </div>

            {/* Tarjeta de Producción */}
            <div className={`production-card ${isMeal ? 'meal-card' : ''}`}>
                {hasItems ? (
                    <>
                        <div className="card-row">
                            <span className="card-label">Plan:</span>
                            <span className="card-value font-bold">{currentItem.plan ?? currentItem.meta ?? 0}</span>
                        </div>

                        <div className="card-row">
                            <span className="card-label">Real:</span>
                            <span className="card-value font-bold real-value">{currentItem.real ?? 0}</span>
                        </div>

                        <div className="card-row-losses">
                            <div className="loss-box no-justified">
                                <span className="loss-title">Pérdidas No Just.</span>
                                <span className="loss-amount">
                                    {currentItem.perdidaCalculada ?? currentItem.noJustified ?? 0} min
                                </span>
                            </div>

                            <div 
                                className="loss-box justified clickable"
                                onClick={() => onOpenModal(currentItem.hora)}
                            >
                                <span className="loss-title">Pérdidas Just. 📝</span>
                                <span className="loss-amount">
                                    {currentItem.perdidaJustificada ?? currentItem.justified ?? 0} min
                                </span>
                            </div>
                        </div>

                        {currentItem.observaciones && (
                            <div className="card-row-obs">
                                <span className="card-label">Observaciones:</span>
                                <p>{currentItem.observaciones}</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="empty-card-content" style={{ textAlign: 'center', padding: '30px 10px', color: '#777' }}>
                        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📋</span>
                        <strong style={{ display: 'block', marginBottom: '4px', color: '#444' }}>Sin registros de producción</strong>
                        <p style={{ fontSize: '0.85rem', margin: 0 }}>No hay información disponible para esta línea en la fecha/turno seleccionados.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductionCarousel;
