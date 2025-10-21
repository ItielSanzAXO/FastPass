import React from 'react';
import './AccessibilityModal.css';

const AccessibilityModal = ({ onClose }) => {
  return (
    <div className="accessibility-modal-overlay">
      <div className="accessibility-modal">
        <h2>Accesibilidad</h2>
        <div className="accessibility-options">
          <label>
            <input type="checkbox" /> Modo nocturno
          </label>
          <label>
            <input type="checkbox" /> Contraste alto
          </label>
          <div className="slider-group">
            <span>Tamaño de letra</span>
            <input type="range" min="12" max="32" defaultValue="16" />
          </div>
          <label>
            <input type="checkbox" /> Escala de grises
          </label>
          <div className="select-group">
            <span>Tipografía</span>
            <select>
              <option>Sistema</option>
              <option>Sans-serif</option>
              <option>Serif</option>
              <option>Monospace</option>
            </select>
          </div>
          <button className="guide-btn">Alternar guía de lectura</button>
        </div>
        <button className="close-btn" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

export default AccessibilityModal;
