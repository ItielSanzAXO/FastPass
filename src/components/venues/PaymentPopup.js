import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import '../../styles/PaymentPopup.css';



function PaymentPopup({ selectedSeats, onClose, onConfirm, isFree, purchaseStatus, errorMsg }) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const handleConfirm = () => {
    if (isFree) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        if (onConfirm) onConfirm();
      }, Math.floor(Math.random() * 4000) + 6000);
      return;
    }
    if (cardNumber && expiryDate && cvv) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        if (onConfirm) onConfirm({ cardNumber, expiryDate, cvv });
      }, Math.floor(Math.random() * 4000) + 6000);
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
        {loading ? (
          <>
            <h2>Obteniendo tus boletos</h2>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 80 }}>
              <div className="loader-circle" />
            </div>
            <p>Por favor espera...</p>
          </>
        ) : purchaseStatus === 'success' ? (
          <>
            <h2>¡Compra exitosa!</h2>
            <p>Tu compra se realizó correctamente.</p>
            <button style={{background:'#1e9ade', color:'#fff'}} onClick={handleGoToAccount}>Ver tus boletos</button>
          </>
        ) : purchaseStatus === 'error' ? (
          <>
            <h2>Error</h2>
            <p>{errorMsg || 'Ocurrió un error al procesar la compra.'}</p>
            <button onClick={onClose}>Cerrar</button>
          </>
        ) : (
          <>
            {isFree ? (
              <>
                <h2>Boletos Gratis</h2>
                <p>Asientos seleccionados: {selectedSeats.join(', ')}</p>
                <button onClick={handleConfirm}>Obtener boletos</button>
                <button onClick={onClose}>Cancelar</button>
              </>
            ) : (
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
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentPopup;
