import React, { useState, useEffect } from 'react';
import { fetchEvents } from '../utils/fetchEvents.js';
import { Link } from 'react-router-dom';
import '../styles/EventsPage.css'; // Assuming you have a CSS file for additional styles

const capitalize = str => str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

function EventsPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const fetchedEvents = await fetchEvents();
        setEvents(fetchedEvents);
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };

    loadEvents();
  }, []);

  return (
    <div className="events-container">
      <h1>Eventos Disponibles</h1>
      <p>Encuentra los mejores eventos cerca de ti.</p>
      <ul className="events-list">
        {events.map(event => (
          <li className="event-card" key={event.id}>
            <h2 className="event-title">{event.name}</h2>
            <p className="event-venue">{capitalize(event.venueId)}</p>
            <p className="event-date">{event.date}</p>
            <Link to={`/event/${event.id}`} className="view-event-link">Ver Evento</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EventsPage;
