# WebShot

WebShot es una aplicación web para analizar páginas web y realizar capturas en distintos puntos de desplazamiento y tamaños de pantalla.

## Funcionalidades actuales

- Analiza una URL y rastrea páginas del sitio.
- Permite configurar la profundidad, el límite de URLs, los dominios permitidos y el respeto de `robots.txt`.
- Permite revisar y seleccionar las páginas de las que se desea hacer las capturas.
- Permite configurar los puntos de scroll y los tamaños de pantalla por página.
- Muestra una vista previa de la página y permite colocar marcadores en los puntos de captura.
- Guarda búsquedas anteriores en el historial del navegador.

## Requisitos

- Node.js y npm.
- Chromium instalado para Playwright.

## Instalación y ejecución

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Inicia el servidor:

   ```bash
   npm start
   ```

3. Abre [http://localhost:3000](http://localhost:3000) en el navegador.

## Tecnologías

- Node.js y Express
- Playwright
- HTML, CSS y JavaScript

## Pendiente

La generación final de todas las capturas configuradas y su integración completa con la pantalla de resultados todavía están pendientes.