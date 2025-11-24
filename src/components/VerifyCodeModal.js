import React, { useState } from 'react';
import '../styles/PaymentPopup.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://fastpass-backend.vercel.app';
const VERIFY_CODE_URL = `${API_BASE}/api/verify-payment-code`;

function VerifyCodeModal({ isOpen, onClose, verificationId, uid, onVerified }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleVerify = async () => {
  if (!code) {
    setError('Ingresa el código recibido por correo.');
    return;
  }

  setLoading(true);
  setError(null);
  try {
    const res = await fetch(VERIFY_CODE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationId, code, uid }),
    });

    const data = await res.json();     // 👈 siempre leemos el JSON

    console.log("verify-payment-code:", data);

    if (!data.ok) {
      setError(data.error || 'Código inválido');
      return;
    }

    if (onVerified) onVerified();
  } catch (err) {
    console.error('verify-code error', err);
    setError(err.message || 'No se pudo verificar el código');
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Verificación de Compra</h2>
        <p>Hemos enviado un código a tu correo. Introduce el código para continuar con el pago.</p>
        <div style={{ marginTop: 10 }}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Código de verificación"
            style={{ width: '100%', padding: '8px', marginBottom: 8 }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={handleVerify} disabled={loading} style={{ flex: 1 }}>
            {loading ? 'Verificando...' : 'Verificar código'}
          </button>
          <button onClick={onClose} disabled={loading} style={{ flex: 1 }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerifyCodeModal;
