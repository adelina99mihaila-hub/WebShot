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

La aplicación incluye una suite de pruebas automatizadas desarrollada con Playwright.

### Pruebas funcionales

Las pruebas funcionales verifican los principales flujos de uso de la aplicación:

- Búsqueda de URLs válidas.
- Gestión de URLs inválidas.
- Tratamiento de redirecciones.
- Navegación entre páginas.
- Generación y exportación de capturas.
- Flujo completo de usuario.

Si Playwright aún no tiene Chromium instalado:

```bash
npx playwright install chromium
```

Para ejecutar las pruebas funcionales:

```bash
npm test
```

### Benchmarks

La aplicación incluye benchmarks destinados a medir el rendimiento de los procesos más costosos:

- Rastreo de URLs.
- Generación de capturas.

Cada benchmark ejecuta múltiples iteraciones y calcula métricas estadísticas como:

- Tiempo mínimo.
- Tiempo máximo.
- Tiempo medio.
- Mediana.
- Desviación típica.
- Rango.
- Coeficiente de variación.

Los resultados se almacenan en formato JSON para permitir la comparación entre ejecuciones.

Para ejecutar los benchmarks:

```bash
npm run test:bench
```

## Tecnologías

- Node.js
- Express
- Playwright
- HTML
- CSS
- JavaScript