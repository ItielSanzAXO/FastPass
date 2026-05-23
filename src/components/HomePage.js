import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { fetchEvents, getRandomEvents } from '../utils/fetchEvents.js';
import ErrorBoundary from './ErrorBoundary.js';
import Slider from 'react-slick';

// Ajustar la importación para acceder explícitamente a la propiedad default
const SliderComponent = Slider.default || Slider;

const HomePage = () => {
  const [events, setEvents] = useState([]);
  const [carouselEvents, setCarouselEvents] = useState([]);

  useEffect(() => {
    const loadRandomEvents = async () => {
      try {
        const fetchedEvents = await fetchEvents();
        if (Array.isArray(fetchedEvents)) {
          const randomEvents = getRandomEvents(fetchedEvents, 4);
          const eventsWithImage = fetchedEvents.filter((event) => !!event.imageUrl);
          const randomCarouselEvents = getRandomEvents(eventsWithImage, 3);

          setEvents(randomEvents);
          setCarouselEvents(randomCarouselEvents);
        } else {
          console.error('Fetched events is not an array:', fetchedEvents);
        }
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };

    loadRandomEvents();
  }, []);

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000, // Cambiar cada 3 segundos
  };

  return (
    <ErrorBoundary>
        <section className="homepage-carousel">
          <SliderComponent {...carouselSettings}>
            {carouselEvents.length > 0 ? (
              carouselEvents.map((event) => (
                <div className="carousel-slide" key={event.id}>
                  <div
                    className="carousel-media"
                    style={{
                      backgroundImage: event.imageUrl
                        ? `url(${event.imageUrl})`
                        : 'linear-gradient(120deg, #0f172a, #1e293b)',
                    }}
                    role="img"
                    aria-label={event.name || 'Evento'}
                  />
                  <div className="banner-content">
                    <h2>{event.name || 'Evento'}</h2>
                    <p>{event.venueId ? event.venueId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Venue por definir'}</p>
                    <Link to={`/event/${event.id}`}>
                      <button className="homepage-button primary">Ver Boletos</button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="carousel-slide">
                <div className="carousel-media" style={{ backgroundImage: 'linear-gradient(120deg, #0f172a, #1e293b)' }} />
                <div className="banner-content" style={{ position: 'static', margin: '40px' }}>
                  <h2>Próximos Eventos</h2>
                  <p>Estamos cargando los banners.</p>
                </div>
              </div>
            )}
          </SliderComponent>
        </section>

        <section className="homepage-featured">
          <h2>Eventos Destacados</h2>
          <ul className="events-list single-row">
            {events.map(event => (
              <li
                className="event-card"
                key={event.id}
                style={{ backgroundImage: `url(${event.imageUrl})` }}
              >
                <h2 className="event-title">{event.name}</h2>
                <Link to={`/event/${event.id}`} className="view-event-link">Ver Evento</Link>
              </li>
            ))}
          </ul>
        </section>
    </ErrorBoundary>
  );
};

export default HomePage;
