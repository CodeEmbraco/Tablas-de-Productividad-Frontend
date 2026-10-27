import React, { useState } from 'react';
import '@styles/global.css';

const ProductionCarousel = ({ items = [], onOpenModal, localConfig, onSetMeal }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const hasItems = items && items.length > 0;
    const currentItem = hasItems ? (items[currentIndex] || items[0]) : null;
    const isMeal = currentItem && localConfig?.mealHour === currentItem.hora;

    const handlePrev = () => {
        if (!hasItems) return;
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    };

    const handleNext = () => {
        if (!hasItems) return;
        setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    };

    return (
        <div className="production-carousel-container">
            {/* Cabecera del Carrusel */}
            {/* <div className="carousel-header">
                <button className="btn-carousel-nav" onClick={handlePrev} disabled={!hasItems}>
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
                <button className="btn-carousel-nav" onClick={handleNext} disabled={!hasItems}>
                    &gt;
                </button>
            </div> */}

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

                        <div className="card-row">
                            <span className="card-label">Modelo:</span>
                            <span className="card-value">{currentItem.modelo || 'N/A'}</span>
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

                        {onSetMeal && (
                            <button 
                                className={`btn-meal-toggle ${isMeal ? 'active' : ''}`}
                                onClick={() => onSetMeal(currentItem.hora)}
                            >
                                {isMeal ? '🍽️ Hora de Comida' : 'Marcar como Comida'}
                            </button>
                        )}
                    </>
                ) : (
                    /* ESTADO VACÍO (Mantiene la forma de la tarjeta) */
                    <div className="empty-card-content" style={{ textAlign: 'center', padding: '30px 10px', color: '#777' }}>
                        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📋</span>
                        <strong style={{ display: 'block', marginBottom: '4px', color: '#444' }}>Sin registros de producción</strong>
                        <p style={{ fontSize: '0.85rem', margin: 0 }}>No hay información disponible para la fecha y turno seleccionados.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductionCarousel;