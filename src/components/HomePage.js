import React from 'react';
import { Link } from 'react-router-dom';
import Slider from 'react-slick'; // Importar el carrusel
import '../styles/HomePage.css';
import 'slick-carousel/slick/slick.css'; // Importar estilos de react-slick
import 'slick-carousel/slick/slick-theme.css';

// Importar las imágenes desde assets
import banner1 from '../assets/banner1.png';
import banner2 from '../assets/banner2.png';

function HomePage() {
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
    <div className="homepage-container">
      <section className="homepage-carousel">
        <Slider {...carouselSettings}>
          <div className="carousel-slide">
            <img src={banner1} alt="El Rey León" />
            <div className="banner-content">
              <h2>El Rey León</h2>
              <p>Teatro Telcel</p>
              <Link to="/events">
                <button className="homepage-button primary">Ver Boletos</button>
              </Link>
            </div>
          </div>
          <div className="carousel-slide">
            <img src={banner2} alt="Shakira en Concierto" />
            <div className="banner-content">
              <h2>Shakira en Concierto</h2>
              <p>Estadio Azteca</p>
              <Link to="/events">
                <button className="homepage-button primary">Ver Boletos</button>
              </Link>
            </div>
          </div>
        </Slider>
      </section>

      <section className="homepage-featured">
        <h2>Eventos Destacados</h2>
        <div className="featured-grid">
          <div className="featured-item">
            <img src="/images/nascar.jpg" alt="Nascar" />
            <p className="featured-title">Nascar</p>
          </div>
          <div className="featured-item">
            <img src="/images/tecate.jpg" alt="Tecate Emblema" />
            <p className="featured-title">Tecate Emblema</p>
          </div>
          <div className="featured-item">
            <img src="/images/shakira.jpg" alt="Shakira" />
            <p className="featured-title">Shakira</p>
          </div>
          <div className="featured-item">
            <img src="/images/lamas.jpg" alt="Super Lamas" />
            <p className="featured-title">Super Lamas</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
