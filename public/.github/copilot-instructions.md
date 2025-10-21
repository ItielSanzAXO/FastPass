Propósito
-------
Breve guía para agentes AI que trabajan en este repositorio React + Firebase. Incluye el "big picture", comandos clave, patrones de código y ejemplos específicos extraídos del código fuente.

Inicio rápido
-------------
- Instalar dependencias: `npm install`
- Ejecutar en desarrollo: `npm start` (React Scripts)
- Construir para producción: `npm run build`
- Desplegar: `firebase deploy` (este repo ya contiene workflows en `.github/workflows` que usan `firebase-tools`).
- Variables de entorno: el código lee variables `REACT_APP_FIREBASE_*` desde `process.env` en `src/firebaseConfig.js`. Asegúrate de tener un `.env` con las claves antes de `npm start`.

Arquitectura (visión general)
----------------------------
- Frontend: React (Create React App / react-scripts). Entrada en `src/index.js` y componente raíz en `src/App.js`.
- Enrutamiento: `react-router-dom@5.x` (uso de `Switch`, `Route` y `Redirect`), ver `src/App.js`.
- Autenticación y datos: Firebase Authentication + Firestore. Inicialización y exports en `src/firebaseConfig.js` (`db`, `auth`, `provider`).
- Estado de sesión: Context API personalizado en `src/context/AuthContext.js` (escucha `onAuthStateChanged`, crea/actualiza documento de usuario con `setDoc(..., { merge: true })`).
- Población / utilidades: `src/utils/*.js` contiene scripts de importación/generación de datos. En `src/index.js` hay imports comentados que, si se descomentan, ejecutan esas utilidades (útil para cargas masivas de prueba, pero no dejar activados en producción).

Puntos de integración y riesgos
------------------------------
- Firebase: todas las llamadas usan los exports de `src/firebaseConfig.js`. Cambios en la estructura de Firestore deben sincronizarse con `src/utils/validateFirestoreData.js`.
- Imports ejecutables: `src/index.js` contiene líneas comentadas como `//import "./utils/importData";` — descomentar ejecuta código que modifica Firestore.
- CI/CD: hay workflows en `.github/workflows/firebase-hosting-*.yml`. Revisa secrets necesarios (GITHUB_TOKEN y posibles secretos de Firebase) antes de cambiar despliegues.

Convenciones de código del proyecto
---------------------------------
- Rutas protegidas: usa `src/components/ProtectedRoute.js`. Comportamiento: muestra un loader mientras `loading` en AuthContext es true; redirige a `/login` si no hay `user`.
- Acceso a Firebase: siempre importar desde `src/firebaseConfig.js` — ejemplo: `import { db, auth, provider } from './firebaseConfig.js'`.
- Estilos: la mayoría son CSS simples en `src/styles/`; hay algunos módulos CSS (`*.module.css`) — respeta el nombre y la importación tal cual.
- Estructura de componentes: `src/components/` contiene páginas y componentes reutilizables; `src/components/venues/` agrupa componentes por venue.

Ejemplos concretos (copiar/pegar seguro)
--------------------------------------
- Ruta protegida (ver `src/components/ProtectedRoute.js`):
  - Uso: `<ProtectedRoute path="/account" component={UserAccountPage} />`
- Inicializar Firebase (ver `src/firebaseConfig.js`):
  - Variables esperadas: `REACT_APP_FIREBASE_API_KEY`, `REACT_APP_FIREBASE_AUTH_DOMAIN`, `REACT_APP_FIREBASE_PROJECT_ID`, `REACT_APP_FIREBASE_STORAGE_BUCKET`, `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`, `REACT_APP_FIREBASE_APP_ID`, `REACT_APP_FIREBASE_MEASUREMENT_ID`.

Debug y pruebas rápidas
-----------------------
- Si falla la inicialización de Firebase: comprobar que `.env` contiene las variables `REACT_APP_...` y que el proceso se reinició tras modificarlas.
- Para pruebas de UI: `npm test` usa `react-scripts test` y las utilidades de `@testing-library` (configurado en `src/setupTests.js`).
- Antes de cambiar estructuras de Firestore, ejecutar y/o revisar `src/utils/validateFirestoreData.js`.

Reglas para agentes AI
----------------------
- No descomentar imports masivos en `src/index.js` sin avisar; son destructivos en entornos reales.
- Mantén la compatibilidad con `react-router-dom@5.x` (no migrar rutas a v6 sin actualizar `App.js`).
- Al proponer cambios que toquen datos en Firestore, referencia `src/utils/` que contienen scripts de ejemplo para migraciones y validación.
- Evita introducir secretos en el repositorio; sugiere usar GitHub Secrets para workflows y `.env` local para desarrollo.

Archivos clave (rápida referencia)
--------------------------------
- `src/firebaseConfig.js` — inicialización Firebase y exports (`db`, `auth`, `provider`).
- `src/context/AuthContext.js` — lógica de sesión, creación de documento de usuario en Firestore.
- `src/index.js` — punto de entrada; contiene imports comentados de utilidades de importación.
- `src/App.js` — rutas y navegación principal.
- `src/components/ProtectedRoute.js` — patrón de protección de rutas.
- `src/utils/` — scripts para generar/importar datos y validar estructura de Firestore.
- `.github/workflows/*.yml` — CI/CD de despliegue a Firebase Hosting.

Feedback
--------
Si falta información (por ejemplo, detalles de emuladores de Firebase, workflows secretos, o convenciones de rama), dime qué sección quieres que amplíe y la actualizaré.
