const { chromium } = require("playwright");

// Tamaños de ventana para cada viewport
const VIEWPORTS = {
    desktop: { width: 1440, height: 900 },
    tablet: { width: 768, height: 1024 },
    movil: { width: 390, height: 844 },
};

// Hace una captura de una URL con un tamaño y la guarda en rutaArchivo
async function hacerCaptura(url, tamano, rutaArchivo) {
    if (!VIEWPORTS[tamano]) {
        throw new Error("Tamaño no válido: " + tamano);
    }

    const navegador = await chromium.launch();
    try {
        const pagina = await navegador.newPage({ viewport: VIEWPORTS[tamano] });
        await pagina.goto(url, { waitUntil: "load", timeout: 30000 });
        await pagina.screenshot({ path: rutaArchivo });
    } finally {
        await navegador.close();
    }
}

module.exports = { hacerCaptura, VIEWPORTS };