// src/components/Modals/LossModal.jsx
import React, { useState, useEffect } from 'react';
import './LossModals.css';
import { lossCatalog, getLossDescription } from '@config/LossCatalog'; 

const LossModal = ({ 
        isOpen,
        onClose, 
        onSave, 
        onDeleteDetail, 
        currentSlot, 
        initialData = [], 
        perdidaCalculada = 0,
        supervisor,
        lider
    }) => {
    const [tempLossList, setTempLossList] = useState([]);
    const [newLossMinutos, setNewLossMinutos] = useState('');
    const [newLossMotivo, setNewLossMotivo] = useState('');
    const [newLossObs, setNewLossObs] = useState('');
    const [newLossMaquina, setNewLossMaquina] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTempLossList(initialData);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const totalJustificado = tempLossList.reduce((sum, item) => sum + (parseInt(item.minutos) || 0), 0);
    const noJustificado = Math.max(0, (parseInt(perdidaCalculada) || 0) - totalJustificado);

    const addLossItem = () => {
        if (!newLossMinutos) {
            alert("Debe ingresar los minutos");
            return;
        }
        const min = parseInt(newLossMinutos);
        if (min <= 0) {
            alert("Favor de introducir un valor adecuado para los minutos");
            return;
        }
        if (!newLossMotivo) {
            alert("Debe seleccionar un motivo");
            return;
        }
        if (newLossMinutos > noJustificado){
            alert("Los minutos justificados superan los minutos no justificados");
            return;
        }

        const newItem = {
            minutos: parseInt(newLossMinutos),
            motivo: newLossMotivo,
            maquina: newLossMaquina || '',
            observacion: newLossObs
        };

        setTempLossList([...tempLossList, newItem]);
        setNewLossMinutos('');
        setNewLossMotivo('');
        setNewLossMaquina('');
        setNewLossObs('');
    };

    const removeLossItem = async (index) => {
        const itemToRemove = tempLossList[index];
        if (itemToRemove.IdDetalle) {
            const confirm = window.confirm("¿Estás seguro que quieres eliminar este registro?")
            if(confirm) {
                await onDeleteDetail(itemToRemove.IdDetalle);
                setTempLossList(tempLossList.filter((_, i) => i !== index));
            }
        } else {
            setTempLossList(tempLossList.filter((_, i) => i !== index));
        }
    };

    const handleConfirm = () => {
        const nuevosDetalles = tempLossList.filter(item => !item.IdDetalle);
        const totalMinutes = tempLossList.reduce((sum, item) => sum + (item.minutos || 0), 0);

        //console.log("debug",totalMinutes," | ", nuevosDetalles," | ", supervisor," | ", lider)
        onSave(totalMinutes, nuevosDetalles, supervisor, lider);
        onClose();
    };

    const handleCancel = () => {
        setTempLossList([]);
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ minWidth: '650px' }}>
                <h3>Registro de Eventos: {currentSlot}</h3>

                {/* Resumen de Métricas de Pérdida */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    backgroundColor: '#f4f6f8',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'bold' }}>PÉRDIDA CALCULADA</span>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1976D2' }}>{perdidaCalculada} min</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'bold' }}>JUSTIFICADA</span>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2E7D32' }}>{totalJustificado} min</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'bold' }}>NO JUSTIFICADA</span>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: noJustificado > 0 ? '#D32F2F' : '#455A64' }}>{noJustificado} min</div>
                    </div>
                </div>

                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <table className="loss-list-table">
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>Minutos</th>
                                <th>Motivo</th>
                                <th>Máquina</th>
                                <th>Descripción / Observación</th>
                                <th style={{ width: '50px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {tempLossList.map((item, idx) => (
                                <tr key={idx}>
                                    <td style={{ fontWeight: 'bold', color: '#D32F2F' }}>{item.minutos} min</td>
                                    <td>{item.motivo}</td>
                                    <td style={{ color: '#777', fontSize: '0.85rem' }}>{item.maquina || '---'}</td>
                                    <td>{item.observacion}</td>
                                    <td>
                                        <button className="btn-delete-loss" onClick={() => removeLossItem(idx)}>X</button>
                                    </td>
                                </tr>
                            ))}
                            {tempLossList.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', color: '#999' }}>Sin eventos registrados</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Formulario para añadir nuevo registro */}
                <div className="add-loss-form" style={{ marginTop: '15px' }}>
                    <div className="form-group">
                        <label>Minutos:</label>
                        <input
                            type="number"
                            placeholder="0"
                            style={{ width: '70px' }}
                            value={newLossMinutos}
                            onChange={(e) => setNewLossMinutos(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Motivo:</label>
                        <select
                            style={{ width: '140px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            value={newLossMotivo}
                            onChange={(e) => setNewLossMotivo(e.target.value)}
                        >
                            <option value="" disabled>--Selecciona--</option>
                            {Object.entries(lossCatalog).map(([codigo, descripcion]) => (
                                <option key={codigo} value={codigo}>
                                    {codigo} - {descripcion}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Máquina:</label>
                        <input
                            type="text"
                            placeholder="Próximamente..."
                            disabled
                            style={{ width: '110px', backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
                            value={newLossMaquina}
                            onChange={(e) => setNewLossMaquina(e.target.value)}
                        />
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Descripción:</label>
                        <input
                            type="text"
                            placeholder="Escribe la causa..."
                            style={{ width: '100%' }}
                            value={newLossObs}
                            onChange={(e) => setNewLossObs(e.target.value)}
                        />
                    </div>
                    <button className="btn-add-loss" onClick={addLossItem}>Agregar</button>
                </div>

                {/* Acciones Finales del Modal */}
                <div className="modal-actions" style={{ marginTop: '15px' }}>
                    <button className="btn-modal-cancel" onClick={handleCancel}>Cancelar</button>
                    <button className="btn-modal-confirm" onClick={handleConfirm}>Aceptar</button>
                </div>
            </div>
        </div>
    );
};

export default LossModal;