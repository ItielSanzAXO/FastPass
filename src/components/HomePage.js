import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { fetchEvents, getRandomEvents } from '../utils/fetchEvents.js';
import banner1 from '../assets/banner1.png';
import banner2 from '../assets/banner2.png';
import ErrorBoundary from './ErrorBoundary.js';
import Slider from 'react-slick';

// Ajustar la importación para acceder explícitamente a la propiedad default
const SliderComponent = Slider.default || Slider;

const HomePage = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const loadRandomEvents = async () => {
      try {
        const fetchedEvents = await fetchEvents();
        if (Array.isArray(fetchedEvents)) {
          const randomEvents = getRandomEvents(fetchedEvents, 4);
          setEvents(randomEvents);
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

  console.log('Carousel settings:', carouselSettings);
  console.log('Slider component:', SliderComponent);

  return (
    <ErrorBoundary>
        <section className="homepage-carousel">
          <SliderComponent {...carouselSettings}>
            <div className="carousel-slide">
              <img src={banner1} alt="Mar Indigo" />
              <div className="banner-content">
                <h2>Mar Indigo</h2>
                <p>Salón 51</p>
                <Link to="/event/mar-indigo">
                  <button className="homepage-button primary">Ver Boletos</button>
                </Link>
              </div>
            </div>
            <div className="carousel-slide">
              <img src={banner2} alt="SERBIA" />
              <div className="banner-content">
                <h2>SERBIA</h2>
                <p>Auditorio ITIZ</p>
                <Link to="/event/serbia">
                  <button className="homepage-button primary">Ver Boletos</button>
                </Link>
              </div>
            </div>
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
