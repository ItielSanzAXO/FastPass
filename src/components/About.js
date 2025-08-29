import React from 'react';
import '../styles/CardPages.css';



const About = () => (
			<div className="card">
				<h1 className="card-title">Acerca de FastPass</h1>
				<div className="card-subtitle">Proyecto escolar desarrollado por estudiantes del Instituto Tecnológico de Iztapalapa II</div>
				<p style={{ fontSize: '1.15rem', lineHeight: '1.7', marginBottom: '18px' }}>
					<strong>FastPass</strong> es una boletera digital pensada para eventos universitarios. Su objetivo es facilitar la compra, gestión y reventa de boletos de manera segura, rápida y eficiente, tanto para organizadores como para asistentes.
				</p>
				<ul className="card-list">
					<li>Compra tus boletos en línea de forma sencilla.</li>
					<li>Gestiona tus eventos y entradas desde tu cuenta.</li>
					<li>Reventa segura y controlada entre estudiantes.</li>
					<li>Soporte y ayuda personalizada.</li>
				</ul>
				<p className="card-footer">
					Este proyecto es parte de la materia de Desarrollo de Aplicaciones Web.<br />
					Todos los derechos reservados &copy; 2025.
				</p>
		</div>
);

export default About;
