# 🎫 FastPass - Plataforma de Venta y Reventa de Boletos

FastPass es una plataforma digital para la compra y reventa de boletos para eventos sociales. Los usuarios pueden adquirir boletos para distintos eventos y, si ya no los necesitan, venderlos a otros usuarios al precio que deseen.

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
- **Base de Datos:** Azure (simulada por ahora)
- **Estado Global:** Context API (o Redux en el futuro)

---

## 📦 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/fastpass.git
cd fastpass
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