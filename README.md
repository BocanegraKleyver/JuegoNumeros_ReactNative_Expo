# 🎮 Juego de los Números

Este es un juego de lógica desarrollado en **React Native con Expo**. El objetivo es adivinar un número secreto de 4 cifras en un máximo de 10 intentos, con pistas tipo Mastermind que indican cuántos dígitos están bien posicionados, mal posicionados o no están presentes.

## 📱 Características

- Registro de hasta **3 jugadores**
- Almacenamiento local con **AsyncStorage**
- Partidas **continuables** tras cerrar la app
- Indicador de si hay una partida en curso
- Estadísticas por jugador: **ganadas** y **perdidas**
- Opción de permitir o no **dígitos repetidos**
- **Pistas limitadas** por partida (3 máximas)
- Restricción: solo se puede reiniciar una partida **una vez**
- Diseño optimizado para móviles

## 🧠 Lógica del juego

- El número secreto tiene 4 cifras
- Se muestra un resultado con:
  - `B`: dígitos bien ubicados
  - `R`: dígitos correctos pero mal ubicados
  - `M`: dígitos incorrectos
- Ejemplo: `1B 2R 1M`

## 🚀 Cómo ejecutar

1. Instalar Expo CLI si no lo tenés:

```bash
npm install -g expo
```

2. Instalar dependencias:

```bash
npm install
```

3. Iniciar la app:

```bash
npm start
```

4. Escanear el código QR con **Expo Go** desde tu celular Android/iOS.

> **Requisitos:** Node.js v18 o superior, Expo CLI, y la app Expo Go en el celular.

## 📂 Estructura

```
.
├── App.js
├── assets/
│   └── icon.png (ícono del juego)
├── screens/
│   ├── InicioScreen.js
│   ├── JuegoScreen.js
│   └── SplashScreen.js
├── package.json
└── ...
```

## 👨‍💻 Autor

- Kleyver Bocanegra – [GitHub](https://github.com/BocanegraKleyver)
