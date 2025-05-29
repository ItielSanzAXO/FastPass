import React, { useState } from 'react';
import styles from '../../styles/Salon51.module.css';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext.js';

function formatFirebaseTimestamp(timestamp) {
  if (!timestamp || !timestamp.seconds) return null;
  const date = new Date(timestamp.seconds * 1000);
  return format(date, 'dd/MM/yyyy HH:mm');
}

const Salon51 = ({ event }) => {
  const { user } = useAuth();
  const [ticketCount, setTicketCount] = useState(0);
  const [selectedZone, setSelectedZone] = useState(null);
  const ticketLimit = event.ticketLimitPerUser || 3;

  const increment = () => {
    if (ticketCount < ticketLimit) {
      setTicketCount(ticketCount + 1);
    }
  };

  const decrement = () => {
    if (ticketCount > 0) {
      setTicketCount(ticketCount - 1);
    }
  };

  return (
    <div className={styles.container}>
      {/* Mapa del Salón */}
      <div className={styles.layout}>
        <div className={styles.zones}>
          <h2 className={styles.stage}>Mapa del Salón 51</h2>

          {/* Escenario */}
          <div className={styles.stageArea}>
            <h3 className={styles.stageText}>Escenario</h3>
          </div>

          {/* General */}
          <div
            className={`${styles.zone} ${styles.general} ${
              selectedZone === 'General' ? styles.active : ''
            }`}
            onClick={() => setSelectedZone('General')}
          >
            General
          </div>
        </div>

        {/* Panel de info y compra */}
        <div className={styles.sidePanel}>
          <div className={styles.card}>
            <h2>Detalles del Evento</h2>
            <div>
              <h3 className={styles.eventName}>{event.name}</h3>
              <p>Fecha y Hora: {formatFirebaseTimestamp(event.date) || 'Fecha no disponible'}</p>
              <p>Lugar: Salón 51</p>
            </div>

            <hr className={styles.divider} />

            <h3>Precios por zona:</h3>
            <ul className={styles.priceList}>
              <li>General: {event.ticketPricing?.General === 0 ? 'Gratis' : `$${event.ticketPricing?.General || 'N/A'}`}</li>
            </ul>

            <h2>Tu Selección</h2>
            <div className={styles.counter}>
              <button onClick={decrement} disabled={ticketCount === 0}>
                -
              </button>
              <span>{ticketCount}</span>
              <button onClick={increment} disabled={ticketCount >= ticketLimit}>
                +
              </button>
            </div>
            <p className={styles.limit}>
              {selectedZone
                ? `Zona seleccionada: ${selectedZone}`
                : 'Selecciona una zona (General)'}
            </p>
            <p className={styles.limit}>Máximo permitido: {ticketLimit} boletos</p>
            <button
              className={styles.buyButton}
              disabled={ticketCount === 0 || !selectedZone || !user}
            >
              {user
                ? selectedZone
                  ? `Comprar boletos ${selectedZone}`
                  : 'Selecciona una zona'
                : 'Inicia sesión para comprar boletos'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Salon51;