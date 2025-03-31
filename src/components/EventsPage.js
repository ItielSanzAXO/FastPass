import React, { useState, useEffect } from 'react';

function EventsPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchedEvents = [
      { id: 1, venue: 'Lugar A', concert: 'Concierto 1' },
      { id: 2, venue: 'Lugar A', concert: 'Concierto 2' },
      { id: 3, venue: 'Lugar B', concert: 'Concierto 3' },
      { id: 4, venue: 'Lugar B', concert: 'Concierto 4' },
      { id: 5, venue: 'Lugar C', concert: 'Concierto 5' },
      { id: 6, venue: 'Lugar C', concert: 'Concierto 6' },
    ];
    setEvents(fetchedEvents);
  }, []);

  return (
    <div style={{ padding: '20px', color: '#1e9ade' }}>
      <h1>Eventos Disponibles</h1>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {events.map(event => (
          <li 
            key={event.id} 
            style={{ 
              padding: '10px', 
              margin: '10px 0', 
              border: '1px solid #6995bb', 
              borderRadius: '5px', 
              backgroundColor: '#eefbff' 
            }}
          >
            {event.venue} - {event.concert}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EventsPage;
