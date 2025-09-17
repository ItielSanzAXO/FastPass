import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import '../../styles/PaymentPopup.css';

function PaymentPopup({ selectedSeats, onClose, onConfirm }) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [success, setSuccess] = useState(false);
  const history = useHistory();

  const handleConfirm = () => {
    if (cardNumber && expiryDate && cvv) {
      setSuccess(true);
      if (onConfirm) onConfirm();
    } else {
      alert('Por favor, completa todos los campos de la tarjeta.');
    }
  };

  const handleGoToAccount = () => {
    history.push('/account');
    if (onClose) onClose();
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        {!success ? (
          <>
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
          </>
        ) : (
          <>
            <h2>¡Compra exitosa!</h2>
            <p>Tu compra se realizó correctamente.</p>
            <button style={{background:'#1e9ade', color:'#fff'}} onClick={handleGoToAccount}>Ver tus boletos</button>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentPopup;
