# FastPass

Plataforma web para compra, gestión y reventa de boletos de eventos, con autenticación, checkout con Stripe, validación por QR y panel de usuario.

Actualizado: mayo 2026.

## Resumen

FastPass permite:

- Explorar eventos por venue.
- Comprar boletos por zona/asiento.
- Completar pago con Stripe Checkout.
- Consultar boletos comprados desde la cuenta del usuario.
- Publicar o retirar boletos de reventa (con verificación GeeTest).
- Visualizar boleto con QR para validación de acceso.
- Validar boletos en ruta de acceso para staff.
- Ajustar opciones de accesibilidad (contraste, tipografia, tamano, modo nocturno, escala de grises, guia de lectura).

## Novedades incluidas

- Flujo de pago con redireccion a Stripe y pantalla de confirmacion de compra.
- Asignacion de boletos posterior al pago usando `fastpass_pending_purchase` en `localStorage`.
- Reventa desde cuenta de usuario con validacion de captcha GeeTest y listado publico en la seccion de reventa.
- Modal de boleto con QR y ruta de validacion `/validate/:eventId/:ticketId`.
- Ruta protegida para cuenta (`/account`) y administracion de eventos (`/add-event`).
- Panel de accesibilidad flotante con persistencia en `localStorage`.
- Utilidades de datos para importar eventos/venues, generar boletos, eliminar boletos y validar integridad en Firestore.

## Stack tecnico

- Frontend: React 19 + react-scripts 5.
- Routing: react-router-dom 5.
- Backend/BaaS: Firebase (Auth + Firestore + Hosting).
- Pago: Stripe Checkout (`@stripe/stripe-js`) con backend externo para crear sesion.
- Seguridad bot/captcha: GeeTest (`react-geetest-v4`) + verificacion en backend.
- Extras: generacion de QR (`qrcode.react`), date-fns.

## Rutas principales

- `/` Inicio
- `/events` Catalogo de eventos
- `/event/:eventId` Detalle y compra
- `/resale` Boletos en reventa
- `/login` Inicio de sesion
- `/account` Cuenta del usuario (protegida)
- `/add-event` Administracion de eventos (protegida)
- `/validate/:eventId/:ticketId` Validacion de boleto
- `/payment-success` Confirmacion y asignacion de compra

## Requisitos

- Node.js 18+ recomendado
- npm 9+ recomendado
- Proyecto Firebase con Authentication y Firestore habilitados

## Instalacion y ejecucion local

1. Instalar dependencias:

```bash
npm install
```

2. Crear archivo de entorno:

```bash
copy .env.example .env
```

3. Configurar variables de entorno en `.env`.

4. Levantar en desarrollo:

```bash
npm start
```

5. Build de produccion:

```bash
npm run build
```

## Variables de entorno

Variables obligatorias (Firebase):

```env
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_MEASUREMENT_ID=
```

Variables recomendadas para pago:

```env
REACT_APP_STRIPE_PUBLIC_KEY=
REACT_APP_API_BASE=
REACT_APP_BYPASS_PAYMENT_CODE=0
```

Notas:

- Si no defines `REACT_APP_STRIPE_PUBLIC_KEY`, el proyecto usa una llave de prueba por defecto en frontend.
- Si no defines `REACT_APP_API_BASE`, se usa `https://fastpass-backend.vercel.app`.
- Si `REACT_APP_BYPASS_PAYMENT_CODE=1`, se omite la verificación por código por correo y se continúa directo al popup de pago.

## Despliegue en Firebase Hosting

1. Instalar Firebase CLI (si aun no la tienes):

```bash
npm install -g firebase-tools
```

2. Login en Firebase:

```bash
firebase login
```

3. Compilar app:

```bash
npm run build
```

4. Desplegar:

```bash
firebase deploy
```

Configuracion actual de hosting:

- Directorio publico: `build`
- Rewrite SPA activo hacia `index.html`
- Headers COOP/COEP configurados en `firebase.json`

## Scripts y utilidades de datos

Este proyecto incluye utilidades para poblar y mantener Firestore.

Ejecuta desde la raiz del proyecto:

```bash
node src/utils/importData.js
```

Utilidades destacadas:

- `src/utils/importData.js`: crea venues y eventos base.
- `src/utils/generateTicketsForEvent.js`: genera boletos por venue con reglas de asientos/zonas.
- `src/utils/deleteTicketsForEvent.js`: elimina boletos por `eventId`.
- `src/utils/validateFirestoreData.js`: revisa integridad minima de eventos y boletos.

## Estructura actual (resumen)

```text
src/
  components/
    venues/
    AddEvent.js
    EventDetail.js
    EventsPage.js
    FloatingAccessibilityButton.js
    LoginPage.js
    ProtectedRoute.js
    ResalePage.js
    TicketModal.js
    UserAccountPage.js
  context/
    AuthContext.js
  pages/
    PaymentSuccessPage.js
    ValidateTicketPage.js
  utils/
    importData.js
    generateTicketsForEvent.js
    deleteTicketsForEvent.js
    validateFirestoreData.js
    readingGuide.js
```

## Consideraciones importantes

- La creacion de sesion de Stripe y la verificacion de GeeTest dependen de un backend externo.
- El flujo de compra post-pago usa datos temporales en `localStorage`; no limpiarlo manualmente durante checkout.
- Para que la validacion QR funcione correctamente en produccion, verificar dominio final en las URLs de boleto.

## Contribucion

1. Crear rama de trabajo:

```bash
git checkout -b feature/mi-cambio
```

2. Realizar cambios y pruebas locales.

3. Abrir Pull Request con descripcion clara de:

- problema
- solucion
- impacto
- pasos de prueba
