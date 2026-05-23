import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import '../../styles/PaymentPopup.css';

console.log("STRIPE PUBLIC KEY FRONT:", process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLIC_KEY ||
  'pk_test_51SUOefRptxGpyu7uoCaZeAxLoi0bR0ERtj6dqmAO3wQeAI2mcuw2W8hpXG5dOlXweHzcfRP6aw7pYLAPx4LUe5MZ00n2RHDRTM'
);

const API_BASE = process.env.REACT_APP_API_BASE || 'https://fastpass-backend.vercel.app';
const CREATE_SESSION_URL = `${API_BASE}/api/create-checkout-session`;

// ⬇️ NUEVOS props: price, eventName, zone, ticketCount
function PaymentPopup({
  selectedSeats,
  onClose,
  onConfirm,
  isFree,
  purchaseStatus,
  errorMsg,
  price,
  eventName,
  zone,
  ticketCount,
  eventId,
  userUid,
  seats,
}) {
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const handleConfirm = async () => {
    // Boletos gratis: mismo flujo que antes
    if (isFree) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        if (onConfirm) onConfirm();
      }, Math.floor(Math.random() * 4000) + 6000);
      return;
    }

    // Pago con Stripe (modo prueba)
    try {
      setLoading(true);
      const stripe = await stripePromise;
      if (!stripe) {
        alert('No se pudo inicializar Stripe.');
        setLoading(false);
        return;
      }

      const successUrl = `${window.location.origin}/payment-success`;
      const cancelUrl = window.location.href;

      localStorage.setItem(
        'fastpass_pending_purchase',
        JSON.stringify({
          eventId,
          zone,
          ticketCount,
          userUid,
          seats: selectedSeats,
        })
      );

      const res = await fetch(CREATE_SESSION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price,
          eventName,
          zone,
          ticketCount,
          seats: selectedSeats,
          successUrl,
          cancelUrl,
        }),
      });

      const data = await res.json();
      console.log('create-checkout-session:', data);

      if (!data.ok || !data.url) {
        alert(data.error || 'No se pudo crear la sesión de pago.');
        setLoading(false);
        return;
      }

      // Redirigir a Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error('Stripe checkout error:', err);
      //alert('Error al iniciar el pago.');
      alert(`Error al iniciar el pago: ${err.message || err}`);
      setLoading(false);
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
            <h2>Redirigiendo a Stripe...</h2>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 80 }}>
              <div className="loader-circle" />
            </div>
            <p>Por favor espera...</p>
          </>
        ) : purchaseStatus === 'success' ? (
          <>
            <h2>¡Compra exitosa!</h2>
            <p>Tu compra se realizó correctamente.</p>
            <button style={{ background: '#1e9ade', color: '#fff' }} onClick={handleGoToAccount}>
              Ver tus boletos
            </button>
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
                <p><strong>Monto a pagar:</strong> ${price} MXN</p>
                <p style={{ fontSize: 12, marginBottom: 12 }}>
                  Serás redirigido a Stripe (modo prueba) para completar el pago con una tarjeta de prueba.
                </p>
                <button onClick={handleConfirm}>Confirmar Compra (Stripe)</button>
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
