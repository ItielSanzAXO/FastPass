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
fastpass/
│-- src/
│   ├── components/
│   │   ├── HomePage.js
│   │   ├── LoginPage.js
│   │   ├── TicketPurchase.js
│   │   ├── TicketResale.js
│   ├── App.js
│   ├── firebaseConfig.js
│   ├── index.js
│-- public/
│-- package.json
│-- README.md
```

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
