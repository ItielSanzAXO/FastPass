import React, { useState } from 'react';
import '../styles/CardPages.css';

const faqs = [
    {
        question: '¿Cómo puedo comprar boletos?',
        answer: 'Puedes comprar boletos directamente en nuestra página web o en nuestra aplicación móvil.'
    },
    {
        question: '¿Qué métodos de pago aceptan?',
        answer: 'Aceptamos tarjetas de crédito, débito y pagos a través de plataformas como PayPal.'
    },
    {
        question: '¿Puedo cancelar o reembolsar mis boletos?',
        answer: 'Las políticas de cancelación y reembolso dependen del evento. Por favor, revisa los términos y condiciones al momento de la compra.'
    },
    {
        question: '¿Cómo recibo mis boletos?',
        answer: 'Los boletos se envían por correo electrónico y también puedes descargarlos desde tu cuenta en nuestra plataforma.'
    },
    {
        question: '¿Qué hago si no recibí mis boletos?',
        answer: 'Verifica tu carpeta de spam o contáctanos a través del formulario a continuación.'
    }
];

const HelpPage = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const toggleIndex = idx => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

        return (
                    <div className="card">
                        <h1 className="card-title">Ayuda sobre la boletera</h1>
                        <h2 className="card-subtitle">Preguntas frecuentes</h2>
                        <div>
                            {faqs.map((faq, idx) => (
                                <div key={idx} style={{ marginBottom: '10px', borderRadius: '6px', border: '1px solid #ddd', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <button
                                        onClick={() => toggleIndex(idx)}
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            background: '#f7f7f7',
                                            border: 'none',
                                            padding: '12px 16px',
                                            fontWeight: 'bold',
                                            fontSize: '16px',
                                            cursor: 'pointer',
                                            borderRadius: '6px 6px 0 0'
                                        }}
                                    >
                                        {faq.question}
                                        <span style={{ float: 'right' }}>{openIndex === idx ? '▲' : '▼'}</span>
                                    </button>
                                    {openIndex === idx && (
                                        <div style={{ padding: '12px 16px', background: '#fff', borderRadius: '0 0 6px 6px', borderTop: '1px solid #eee', fontSize: '15px' }}>
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
        );
};

export default HelpPage;