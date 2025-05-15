//import "./utils/importData"; // 🔥 Esto ejecuta la importación automáticamente
//import "./utils/generateSerbiaTickets"; // 🔥 Esto ejecuta la importación automáticament
//import "./utils/updateVenueData"; // 🔥 Esto ejecuta la importación automáticamente
//import "./utils/addExpoIngenierias"; // 🔥 Esto ejecuta la importación automáticamente
//import "./utils/generateOtherTickets"; // 🔥 Esto ejecuta la importación automáticamente

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.js';
import reportWebVitals from './reportWebVitals.js';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
