# 🎫 FastPass - Plataforma de Venta y Reventa de Boletos

FastPass es una plataforma digital para la compra y reventa de boletos para eventos sociales. Los usuarios pueden adquirir boletos para distintos eventos y, si ya no los necesitan, venderlos a otros usuarios al precio que deseen.

---

## 🚀 Desplegar en Firebase Hosting

Sigue estos pasos para desplegar tu aplicación en Firebase Hosting:

### 1. Instalar Firebase CLI
Si no tienes Firebase CLI instalado, hazlo globalmente con:
```bash
npm install -g firebase-tools
```

### 2. Iniciar sesión en Firebase
Abre la terminal e inicia sesión:
```bash
firebase login
```

### 3. Configurar Firebase Hosting
Inicializa Firebase Hosting en tu proyecto:
```bash
firebase init hosting
```
- Selecciona tu proyecto de Firebase.
- Define `build` como el directorio público.
- Responde "No" cuando se te pregunte si es una SPA (React Router manejará el enrutamiento).

### 4. Construir la aplicación
Genera los archivos optimizados para producción:
```bash
npm run build
```

### 5. Desplegar la aplicación
Sube tu aplicación a Firebase Hosting:
```bash
firebase deploy
```

Tu aplicación estará disponible en la URL proporcionada por Firebase Hosting. 🎉

### 6. Construir la aplicación en el host de Firebase
Si deseas construir la aplicación directamente en el host de Firebase, puedes usar el siguiente comando después de haber configurado Firebase Hosting:

```bash
firebase build
```

Esto generará los archivos optimizados para producción y los colocará en el directorio configurado como público (`build` por defecto).

---

## 🚀 Características Principales

- 🔑 **Inicio de sesión con Google**
- 🎭 **Compra de boletos** (Máximo 4 por usuario por evento)
- 💳 **Simulación de pasarela de pagos**
- 🔄 **Reventa de boletos** (Los usuarios pueden poner sus boletos en venta)
- 📍 **Eventos en diferentes venues** (Por ahora, 3 venues y 2 conciertos por cada uno)

---

## 📌 Tecnologías Utilizadas

- **Frontend:** React.js con React Router
- **Autenticación:** Firebase Authentication
- **Base de Datos:** Firebase (simulada por ahora)
- **Estado Global:** Context API (o Redux en el futuro)

---

## 📦 Instalación y Configuración

### 1. Clonar el repositorio
Si no tienes el repositorio, clónalo con:
```bash
git clone https://github.com/ItielSanzAXO/fastpass.git
cd fastpass
```

Si ya tienes el repositorio, actualízalo con:
```bash
git pull origin main
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar las variables de entorno
Copia el archivo `.env.example` y renómalo como `.env`:
```bash
cp .env.example .env
```

Luego, completa las variables en el archivo `.env` con las claves de Firebase proporcionadas.

**Nota:** Si Firebase genera un archivo de configuración `firebaseConfig`, asegúrate de colocarlo en `src/firebaseConfig.js` y exportarlo como un objeto. Por ejemplo:
```javascript
// src/firebaseConfig.js
const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-auth-domain",
  projectId: "tu-project-id",
  storageBucket: "tu-storage-bucket",
  messagingSenderId: "tu-messaging-sender-id",
  appId: "tu-app-id"
};

export default firebaseConfig;
```

### 4. Ejecutar el proyecto
Para desarrollo:
```bash
npm start
```

Para construir la aplicación para producción:
```bash
npm run build
```

---

## 📂 Estructura del Proyecto

```plaintext
FastPass/
├── public/
│   ├── 404.html                    # Página de error 404
│   ├── index.html                  # Archivo HTML principal
│   ├── manifest.json               # Manifest para PWA
│   └── robots.txt                  # Instrucciones para bots de búsqueda
│
├── src/
│   ├── assets/
│   │   └── fonts/                  # Fuentes personalizadas
│   │
│   ├── components/                 # Componentes React principales
│   │   ├── About.js                # Página de información
│   │   ├── AccessibilityModal.js   # Modal de accesibilidad
│   │   ├── AccessibilityModal.css  # Estilos del modal
│   │   ├── AddEvent.js             # Formulario para agregar eventos
│   │   ├── AdminLoginForm.js       # Formulario de login para administradores
│   │   ├── Contact.js              # Página de contacto
│   │   ├── ErrorBoundary.js        # Límite de error para React
│   │   ├── EventDetail.js          # Página de detalle del evento
│   │   ├── EventForm.js            # Formulario para crear/editar eventos
│   │   ├── EventsPage.js           # Página principal de eventos
│   │   ├── FloatingAccessibilityButton.js  # Botón flotante de accesibilidad
│   │   ├── FloatingAccessibilityButton.css # Estilos del botón
│   │   ├── Footer.js               # Componente de pie de página
│   │   ├── HelpPage.js             # Página de ayuda
│   │   ├── HomePage.js             # Página de inicio
│   │   ├── LoginPage.js            # Página de login
│   │   ├── NotFound.js             # Página 404
│   │   ├── NotFound.css            # Estilos de página 404
│   │   ├── ProtectedRoute.js       # Componente para rutas protegidas
│   │   ├── ResalePage.js           # Página de reventa de boletos
│   │   ├── TicketModal.js          # Modal para mostrar boletos
│   │   ├── UserAccountPage.js      # Página de cuenta de usuario
│   │   │
│   │   └── venues/                 # Componentes específicos de venues
│   │       ├── AuditorioITIZ.js    # Componente Auditorio ITIZ
│   │       ├── DuelaITIZ.js        # Componente Duela ITIZ
│   │       ├── PaymentPopup.js     # Modal de pago
│   │       └── Salon51.js          # Componente Salón 51
│   │
│   ├── context/                    # Context API para estado global
│   │   └── AuthContext.js          # Contexto de autenticación
│   │
│   ├── pages/                      # Páginas adicionales
│   │   ├── ValidateTicketPage.js   # Página para validar boletos
│   │   └── ValidateTicketPage.css  # Estilos de validación
│   │
│   ├── styles/                     # Estilos CSS globales y específicos
│   │   ├── AddEvent.css            # Estilos para agregar eventos
│   │   ├── AuditorioITIZ.css       # Estilos Auditorio ITIZ
│   │   ├── CardPages.css           # Estilos para tarjetas
│   │   ├── DuelaITIZ.module.css    # Estilos modulares Duela ITIZ
│   │   ├── EventDetail.css         # Estilos detalles de evento
│   │   ├── EventsPage.css          # Estilos página de eventos
│   │   ├── Footer.css              # Estilos del pie
│   │   ├── HomePage.css            # Estilos de inicio
│   │   ├── Navigation.css          # Estilos de navegación
│   │   ├── PaymentPopup.css        # Estilos del popup de pago
│   │   ├── ResalePage.css          # Estilos página de reventa
│   │   ├── Salon51.css             # Estilos Salón 51
│   │   ├── Salon51.module.css      # Estilos modulares Salón 51
│   │   ├── TicketModal.css         # Estilos del modal de boletos
│   │   ├── UserAccountPage.css     # Estilos cuenta de usuario
│   │   └── Venue.css               # Estilos genéricos de venues
│   │
│   ├── utils/                      # Funciones utilitarias
│   │   ├── addExpoIngenierias.js   # Utilidad para agregar Expo Ingenierías
│   │   ├── deleteTicketsForEvent.js # Elimina boletos de un evento
│   │   ├── fetchEvents.js          # Obtiene eventos de la base de datos
│   │   ├── generateOtherTickets.js # Genera boletos adicionales
│   │   ├── generateSerbiaTickets.js # Genera boletos para Serbia
│   │   ├── generateTicketsForEvent.js # Genera boletos para eventos
│   │   ├── importData.js           # Importa datos a Firestore
│   │   ├── readingGuide.js         # Guía de lectura
│   │   ├── updateVenueData.js      # Actualiza datos de venues
│   │   └── validateFirestoreData.js # Valida datos en Firestore
│   │
│   ├── App.js                      # Componente principal de la aplicación
│   ├── App.css                     # Estilos principales
│   ├── App.test.js                 # Tests para App.js
│   ├── example.html                # Archivo HTML de ejemplo
│   ├── firebaseConfig.js           # Configuración de Firebase (cliente)
│   ├── firebaseConfig.node.js      # Configuración de Firebase (Node.js)
│   ├── index.js                    # Punto de entrada de la aplicación
│   ├── index.css                   # Estilos globales
│   ├── reportWebVitals.js          # Reporte de vitales web
│   └── setupTests.js               # Configuración de tests
│
├── firebase.json                   # Configuración de Firebase
├── package.json                    # Dependencias y scripts del proyecto
└── README.md                       # Este archivo

```

### 📋 Descripción de Componentes Clave

**Autenticación:**
- `LoginPage.js` - Login con Google y credenciales
- `AdminLoginForm.js` - Login especial para administradores
- `ProtectedRoute.js` - Protege rutas que requieren autenticación

**Gestión de Eventos:**
- `EventsPage.js` - Lista todos los eventos disponibles
- `EventDetail.js` - Muestra detalles completos de un evento
- `EventForm.js` - Formulario para crear o editar eventos
- `AddEvent.js` - Interfaz para agregar nuevos eventos

**Boletos y Transacciones:**
- `TicketModal.js` - Modal para comprar boletos
- `ResalePage.js` - Permite revender boletos comprados
- `UserAccountPage.js` - Gestiona boletos del usuario
- `PaymentPopup.js` - Simula la pasarela de pagos

**Venue/Locales:**
- `AuditorioITIZ.js` - Específico para Auditorio ITIZ
- `DuelaITIZ.js` - Específico para Duela ITIZ
- `Salon51.js` - Específico para Salón 51

**Más Funcionalidades:**
- `HomePage.js` - Página de bienvenida
- `About.js` - Información sobre FastPass
- `Contact.js` - Página de contacto
- `HelpPage.js` - Página de ayuda
- `AccessibilityModal.js` - Modal de opciones de accesibilidad
- `FloatingAccessibilityButton.js` - Botón flotante para accesibilidad
- `ErrorBoundary.js` - Captura errores de React
- `Footer.js` - Pie de página
- `ValidateTicketPage.js` - Valida boletos

### 🛠️ Utilidades (Utils)

Las funciones utilitarias en `/src/utils/` manejan:
- Generación de boletos para diferentes eventos
- Importación y validación de datos en Firestore
- Actualización de información de venues
- Obtención de eventos de la base de datos

---

## 🤝 Contribuciones

¡Toda contribución es bienvenida! Para contribuir:

1. Realiza un fork del repositorio.
2. Crea una rama con tu funcionalidad:

    ```bash
    git checkout -b feature-nueva
    ```

3. Realiza commits y sube los cambios:

    ```bash
    git commit -m "Agregada nueva funcionalidad"
    ```

4. Envía un Pull Request 🚀

---

## 📜 Licencia

Este proyecto está bajo la licencia **MIT**. Puedes usarlo y modificarlo libremente.

---

## 📧 Contacto

Si tienes dudas o sugerencias, puedes enviarme un mensaje a [tu email o perfil de GitHub].
