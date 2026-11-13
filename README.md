# WebShot

WebShot es una aplicación web para analizar páginas web y realizar capturas en distintos puntos de desplazamiento y tamaños de pantalla.

## Funcionalidades actuales

- Analiza una URL y rastrea páginas del sitio.
- Permite configurar la profundidad, el límite de URLs, los dominios permitidos y el respeto de `robots.txt`.
- Permite revisar y seleccionar las páginas de las que se desea hacer las capturas.
- Permite configurar los puntos de scroll y los tamaños de pantalla por página.
- Muestra una vista previa de la página y permite colocar marcadores en los puntos de captura.
- Guarda búsquedas anteriores en el historial del navegador.
- Realiza capturas de pantalla con la configuración seleccionada.
- Permite visionar las capturas en el mismo navegador sin necesidad de descargarlas.
- Permite descargar las capturas individualmente, en formato ZIP y en PDF.
- Permite comparar dos capturas sin necesidad de descargarlas.

## Requisitos

- Node.js 22.12.0 o posterior y npm.
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

## Pruebas

Si Playwright aún no tiene Chromium instalado, ejecuta:

```bash
npx playwright install chromium
```

Para ejecutar las pruebas:

```bash
npm test
```

Para ejecutar los benchmarks:

```bash
npm run test:bench
```

## Tecnologías

- Node.js y Express
- Playwright
- HTML, CSS y JavaScript
