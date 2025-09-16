import React from 'react';
import '../styles/CardPages.css';



const About = () => (
			<div className="card">
				<h1 className="card-title">Acerca de FastPass</h1>
				<div className="card-subtitle">Proyecto escolar desarrollado por estudiantes del<br/> Instituto Tecnológico de Iztapalapa<br/>
					BrendN0va | ItielSanz
				</div>
				<p style={{ fontSize: '1.15rem', lineHeight: '1.7', marginBottom: '18px' }}>
					<strong>FastPass</strong> es una boletera digital pensada para eventos sociales. Su objetivo es facilitar la compra, gestión y reventa de boletos de manera segura, rápida y eficiente, tanto para organizadores como para asistentes.
				</p>
				<ul className="card-list">
					<li>Compra tus boletos en línea de forma sencilla.</li>
					<li>Gestiona tus eventos y entradas desde tu cuenta.</li>
					<li>Reventa segura y controlada entre usuarios.</li>
					<li>Soporte y ayuda personalizada.</li>
				</ul>
				<p className="card-footer">
					Este proyecto es parte de la materia de<br/> Programación Web.<br />
					Todos los derechos reservados &copy; 2025.
				</p>
		</div>
);

export default About;
