import React from 'react';
import '../styles/CardPages.css';

const Contact = () => (
			<div className="card">
				<h1 className="card-title">Contacto</h1>
				<div className="card-subtitle">¿Tienes dudas o necesitas ayuda?</div>
				<p style={{ fontSize: '1.15rem', lineHeight: '1.7', marginBottom: '18px', textAlign: 'center' }}>
					Escríbenos a <a href="mailto:info.axopunk@gmail.com" style={{ color: '#3b82f6', textDecoration: 'underline' }}>info.axopunk@gmail.com</a> o utiliza el formulario a continuación.<br />
					También puedes contactarnos a través de nuestras redes sociales.
				</p>
				<form className="card-form">
					<h2 className="card-form-title">Formulario de contacto</h2>
					<div>
						<label htmlFor="nombre" className="card-label">Nombre:</label>
						<input type="text" id="nombre" name="nombre" className="card-input" required />
					</div>
					<div>
						<label htmlFor="email" className="card-label">Correo electrónico:</label>
						<input type="email" id="email" name="email" className="card-input" required />
					</div>
					<div>
						<label htmlFor="mensaje" className="card-label">Mensaje:</label>
						<textarea id="mensaje" name="mensaje" rows="4" className="card-textarea" required></textarea>
					</div>
					<button type="submit" className="card-button">Enviar</button>
				</form>
				<ul className="card-list">
					<li>Instagram: <a href="https://instagram.com/axopunkmx" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>@axopunk</a></li>
					<li>Facebook: <a href="https://www.facebook.com/axopunk" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>AxoPunk</a></li>
				</ul>
				<p className="card-footer">
					Responderemos lo más pronto posible.<br />
					Todos los derechos reservados &copy; 2025.
				</p>
			</div>
);

export default Contact;
