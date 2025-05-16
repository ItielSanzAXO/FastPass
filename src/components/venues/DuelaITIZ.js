import React, { useState } from 'react';
import styles from '../../styles/DuelaITIZ.module.css';
import { format } from 'date-fns';

function formatFirebaseTimestamp(timestamp) {
  if (!timestamp || !timestamp.seconds) return null;
  const date = new Date(timestamp.seconds * 1000);
  return format(date, 'dd/MM/yyyy HH:mm');
}

const DuelaITIZ = ({ event }) => {
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
      {/* Mapa de la Duela */}
      <div className={styles.layout}>
        <div className={styles.zones}>
          <h2 className={styles.stage}>Mapa de la Duela</h2>

          {/* VIP */}
          <div
            className={`${styles.zone} ${styles.vip} ${
              selectedZone === 'VIP' ? styles.active : ''
            }`}
            onClick={() => setSelectedZone('VIP')}
          >
            VIP
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
              <p>Lugar: Duela ITIZ</p>
            </div>

            <hr className={styles.divider} />

            <h3>Precios por zona:</h3>
            <ul className={styles.priceList}>
              <li>VIP: {event.ticketPricing?.VIP === 0 ? 'Gratis' : `$${event.ticketPricing?.VIP || 'N/A'}`}</li>
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
                : 'Selecciona una zona (VIP o General)'}
            </p>
            <p className={styles.limit}>Máximo permitido: {ticketLimit} boletos</p>
            <button
              className={styles.buyButton}
              disabled={ticketCount === 0 || !selectedZone}
            >
              {selectedZone ? `Comprar boletos ${selectedZone}` : 'Selecciona una zona'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuelaITIZ;
