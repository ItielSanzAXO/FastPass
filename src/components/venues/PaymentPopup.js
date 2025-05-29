import React, { useState } from 'react';
import '../../styles/PaymentPopup.css';

function PaymentPopup({ selectedSeats, onClose, onConfirm }) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const handleConfirm = () => {
    if (cardNumber && expiryDate && cvv) {
      onConfirm(); // Simular confirmación de compra
    } else {
      alert('Por favor, completa todos los campos de la tarjeta.');
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Detalles de Pago</h2>
        <p>Asientos seleccionados: {selectedSeats.join(', ')}</p>
        <div>
          <label>Número de Tarjeta:</label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="1234 5678 9012 3456"
          />
        </div>
        <div>
          <label>Fecha de Expiración:</label>
          <input
            type="text"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            placeholder="MM/AA"
          />
        </div>
        <div>
          <label>CVV:</label>
          <input
            type="text"
            value={cvv}
            onChange={(e) => setCvv(e.target.value)}
            placeholder="123"
          />
        </div>
        <button onClick={handleConfirm}>Confirmar Compra</button>
        <button onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}

export default PaymentPopup;
