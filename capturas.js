const { chromium } = require("playwright");

// Tamaños de ventana para cada viewport
const VIEWPORTS = {
    desktop: { width: 1440, height: 900 },
    tablet: { width: 768, height: 1024 },
    movil: { width: 390, height: 844 },
};

// Hace una captura de una URL con un tamaño y la guarda en rutaArchivo
//async function hacerCaptura(url, tamano, rutaArchivo)
// Una función es un bloque de código con nombre que se puede usar muchas veces. Entre paréntesis van sus parámetros, los datos que necesita para trabajar:

// url: qué web capturar.
// tamano: "desktop", "tablet" o "movil".
// rutaArchivo: dónde guardar la imagen.

// Lleva async porque dentro usa await (Playwright tarda)
async function hacerCaptura(url, tamano, rutaArchivo) {
    if (!VIEWPORTS[tamano]) {
        throw new Error("Tamaño no válido: " + tamano);
    }
            //throw new Error(...) dice que: 
// Si el tamaño no existe, la función lanza un error y se para. No decide qué responder al usuario: eso se hace con express,Pablo recibirá el error en su catch de server.js. esta función solo avisa de que algo ha fallado.
    const navegador = await chromium.launch();
    try {
        const pagina = await navegador.newPage({ viewport: VIEWPORTS[tamano] });
        await pagina.goto(url, { waitUntil: "load", timeout: 30000 });
        await pagina.screenshot({ path: rutaArchivo });
    } finally {
        await navegador.close();
    }
}
//.launch abre Chrome; .newPage abre una pestaña con el tamaño; .goto carga la web; .screenshot hace la foto y .close cierra Chrome.
//try { } finally { } sin catch
// Igual que antes, pero sin catch. Si algo falla (la web no carga, por ejemplo), el error sube hacia quien llamó a la función, es decir, hacia Pablo. El finally garantiza que Chrome se cierra siempre, aunque haya error.

module.exports = { hacerCaptura, VIEWPORTS };
//Es la línea clave para trabajar en equipo. Significa: “esto es lo que este archivo ofrece a otros archivos”. Sin ella, Pablo no podría usar la función desde server.js. También exporta VIEWPORTS por si Pablo necesita comprobar qué tamaños existen.