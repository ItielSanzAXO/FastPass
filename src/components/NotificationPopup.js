import React from 'react';
import '../../src/styles/PaymentPopup.css';

function NotificationPopup({ isOpen, title, message, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        {title && <h2>{title}</h2>}
        <p>{message}</p>
        <button style={{ background: '#00c19a', color: '#fff' }} onClick={onClose}>Aceptar</button>
      </div>
    </div>
  );
}

export default NotificationPopup;
