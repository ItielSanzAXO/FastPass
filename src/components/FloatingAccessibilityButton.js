
import React, { useState, useRef, useEffect } from 'react';
import './FloatingAccessibilityButton.css';

const AccessibilityDropdown = ({ open, onClose }) => {
  const dropdownRef = useRef(null);
  const [darkMode, setDarkMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  useEffect(() => {
    // Leer preferencias iniciales de localStorage
    try {
      const savedDark = localStorage.getItem('fp_dark_mode');
      const isDark = savedDark === '1';
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
      }

      const savedContrast = localStorage.getItem('fp_high_contrast');
      const isContrast = savedContrast === '1';
      setHighContrast(isContrast);
      if (isContrast) {
        document.documentElement.classList.add('high-contrast');
        document.body.classList.add('high-contrast');
      }
      // cargar tamaño de letra
      const savedFont = localStorage.getItem('fp_font_size');
      const parsed = savedFont ? Number(savedFont) : null;
      if (parsed && !Number.isNaN(parsed)) {
        setFontSize(parsed);
        document.documentElement.style.setProperty('--fp-font-size', `${parsed}px`);
      } else {
        // usar el valor por defecto (16px) en vez de referenciar fontSize aquí
        document.documentElement.style.setProperty('--fp-font-size', `16px`);
      }
    } catch (e) {
      // noop
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    try {
      if (next) {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
        localStorage.setItem('fp_dark_mode', '1');
      } else {
        document.documentElement.classList.remove('dark-mode');
        document.body.classList.remove('dark-mode');
        localStorage.setItem('fp_dark_mode', '0');
      }
    } catch (e) {
      // noop
    }
  };

  const handleFontSizeChange = (e) => {
    const next = Number(e.target.value);
    if (Number.isNaN(next)) return;
    setFontSize(next);
    try {
      document.documentElement.style.setProperty('--fp-font-size', `${next}px`);
      localStorage.setItem('fp_font_size', String(next));
    } catch (err) {
      // noop
    }
  };

  const toggleContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    try {
      if (next) {
        document.documentElement.classList.add('high-contrast');
        document.body.classList.add('high-contrast');
        localStorage.setItem('fp_high_contrast', '1');
      } else {
        document.documentElement.classList.remove('high-contrast');
        document.body.classList.remove('high-contrast');
        localStorage.setItem('fp_high_contrast', '0');
      }
    } catch (e) {
      // noop
    }
  };

  if (!open) return null;

  return (
    <div className="accessibility-dropdown" ref={dropdownRef}>
      <h2>Accesibilidad</h2>
      <div className="accessibility-options">
        <label>
          <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} /> Modo nocturno
        </label>
        <label>
          <input type="checkbox" checked={highContrast} onChange={toggleContrast} /> Contraste alto
        </label>
        <div className="slider-group">
          <label htmlFor="fp-font-size-range">Tamaño de letra: <strong>{fontSize}px</strong></label>
          <input
            id="fp-font-size-range"
            type="range"
            min="12"
            max="24"
            step="1"
            value={fontSize}
            onChange={handleFontSizeChange}
            aria-label={`Tamaño de letra, actualmente ${fontSize} pixels`}
          />
        </div>
        <label>
          <input type="checkbox" /> Escala de grises
        </label>
        <div className="select-group">
          <span>Tipografía</span>
          <select>
            <option>Sistema</option>
            <option>Sans-serif</option>
            <option>Serif</option>
            <option>Monospace</option>
          </select>
        </div>
        <button className="guide-btn">Alternar guía de lectura</button>
      </div>
    </div>
  );
};

const FloatingAccessibilityButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="floating-accessibility-btn"
        aria-label="Accesibilidad"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span role="img" aria-label="Accesibilidad">⚙</span>
      </button>
      <AccessibilityDropdown open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default FloatingAccessibilityButton;
