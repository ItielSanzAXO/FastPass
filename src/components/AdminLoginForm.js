import React from "react";

function AdminLoginForm({ loginEmail, setLoginEmail, loginPassword, setLoginPassword, handleLogin, loginError }) {
  return (
    <form className="add-event-form add-event-form-login" onSubmit={handleLogin}>
      <h2 className="add-event-title">Acceso Administrador</h2>
      <div className="add-event-form-row">
        <label>Email</label>
        <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
      </div>
      <div className="add-event-form-row">
        <label>Contraseña</label>
        <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
      </div>
      <button className="add-event-btn add-event-btn-blue" type="submit">Iniciar sesión</button>
      {loginError && <div className="add-event-error">{loginError}</div>}
    </form>
  );
}

export default AdminLoginForm;
