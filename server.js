const express = require("express"); // require dice: tráeme esta librería. coge la librería Express de node_modules, y la guarda dentro de la constante express
const path = require("path"); //path, viene incluido en Node, así que no hubo que instalarlo. Sirve para construir rutas de carpetas que funcionen en cualquier sistema.

const fs = require("fs"); // NUEVO 
// fs (file system, sistema de archivos) viene incluido en Node. Sirve para crear carpetas y leer o escribir archivos.

const { chromium } = require("playwright"); // NUEVO
//Playwright trae varios navegadores, y las llaves { } significan “de todo lo que trae, dame solo chromium” (el Chrome que descargamos al principio desde la terminal con el comando npx playwright install chromium).

const archiver = require("archiver"); // NUEVO
// archiver sirve para crear ZIPs en el servidor y enviarlos como descarga.

const { hacerCaptura, VIEWPORTS } = require("./capturas"); // NUEVO
// Conectamos con el otro archivo (capturas.js) para reutilizar la función de capturar pantalla y la lista de tamaños válidos.

const app = express(); // Crea el servidor. A partir de aquí, app es tu servidor

app.use(express.json()); //permite que el servidor entienda los datos que le envía el navegador en formato JSON.

//Ruta de prueba
//Metodo "POST" para recibir datos del navegador. La ruta es /api/crawl. Cuando el navegador haga un POST a esa ruta, se ejecuta la función que recibe req y res.

app.post("/api/crawl", async (req, res) => {
    //Obtiene el texto que envió el navegador en el cuerpo de la petición. 
    //req.body es un objeto con los datos que envió el navegador. req.body?.url es el valor de la propiedad url de ese objeto. El ? es para que no dé error si req.body es undefined.
    let urlTexto = req.body?.url;

    //Comprobación de que se haya enviado texto
    if (typeof urlTexto !== "string" || urlTexto.trim() === "") {
        return res.status(400).json({
            error: "URL inválida"
        });
    }

    urlTexto = urlTexto.trim(); //Elimina espacios al principio y al final
    //Comprobación de que la URL comience con http o https
    if (
        /^[a-z][a-z\d+.-]*:\/\//i.test(urlTexto) &&
        !/^https?:\/\//i.test(urlTexto)
    ) {
        return res.status(400).json({
            error: "Solo se permiten URLs con http o https"
        });
    }
    //Si no tiene http o https, se le añade https:// al principio
    if (!/^https?:\/\//i.test(urlTexto)) {
        urlTexto = "https://" + urlTexto;
    }

    let urlPrueba;
    try {
        urlPrueba = new URL(urlTexto); //Crea un objeto URL a partir del texto. Si el texto no es una URL válida, lanza un error.
    } catch (error) {
        return res.status(400).json({
            error: "URL inválida"
        });
    }
    

    const opciones = req.body ?? {}; //Si req.body es undefined, se le asigna un objeto vacío. Esto evita errores si el navegador no envía ningún dato.

    // Extrae las opciones del objeto que envió el navegador. 
    const { maxDepth, maxUrls, allowedDomains, respectRobots } = opciones;

    ////Validacion de las opciones desde el lado del servidor

    if (!Number.isInteger(maxDepth) || maxDepth < 0 || maxDepth > 5) {
        return res.status(400).json({
            error: "Profundidad máxima inválida. Debe ser un número entero entre 0 y 5."
        });
    }

    if (!Number.isInteger(maxUrls) || maxUrls < 1 || maxUrls > 100) {
        return res.status(400).json({
            error: "Límite de URLs inválido. Debe ser un número entero entre 1 y 100."
        });
    }

    if (typeof allowedDomains !== "string") {
        return res.status(400).json({
            error: "El dominio debe ser una cadena de texto."
        });
    }


    const hostPermitido = allowedDomains.trim();

    //Validación del dominio permitido: no puede contener caracteres inválidos y debe ser un dominio válido.
    if (hostPermitido !== "") {
        if (/[\/:?#@\s]/.test(hostPermitido)) {
            return res.status(400).json({
                error: "El dominio contiene caracteres inválidos."
            });
        }

        try {
            const urlPermitido = new URL("https://" + hostPermitido);

            if (urlPermitido.hostname !== hostPermitido.toLowerCase()) {
                return res.status(400).json({
                    error: "El dominio permitido no es válido."
                });
            }
        } catch (error) {
            return res.status(400).json({
                error: "El dominio permitido no es una URL válida."
            });
        }
    }

    //Si todo está bien, devuelve un JSON con la URL y un estado "ok"
    let navegador;
    try {

        navegador = await chromium.launch({ headless: true }); //Lanza el navegador Chromium 

        //Playwright abre una pestaña y visita la url
        //En modo headless el navegador no se ve
        const page = await navegador.newPage(); //Abre una nueva pestaña

        //Visita la url enviada
        const respuesta = await page.goto(urlPrueba.href, 

            //Espera a que la paguina cargue, despues del tiempo estipulado lanza un error
            { waitUntil: "domcontentloaded", timeout: 12000 }
        );

        const titulo = await page.title(); //Obtiene el título de la página

        return res.json({
            pages: [
                {
                    title: titulo || "Sin título",
                    url: page.url(),
                    depth: 0,
                    status: respuesta && respuesta.ok() ? "ok" : "error"
                }
            ]
        });
    } catch (error) {
        console.error("Error al procesar la URL:", error);
        return res.status(500).json({
            error: "Error interno del servidor al procesar la URL."
        });

    } finally {
        if (navegador) {

            await navegador.close(); //Cierra el navegador
        }
    }

});

app.use(express.static(path.join(__dirname, "public"))); //leído de dentro hacia fuera:
// 1. __dirname es la carpeta donde está server.js (WebShot).
// 2. path.join(__dirname, "public") da WebShot\public.
// 3.express.static(...) significa “entrega los archivos de esa carpeta cuando el navegador los pida”.
// 4.app.use(...) le dice al servidor que aplique esa regla.
// Cuando el navegador pida styles.css, el servidor lo busca en public y lo envía. Si alguien pide server.js, no lo encuentra, y por eso queda protegido.

// NUEVO: carpeta donde se guardarán las capturas
const CARPETA_CAPTURAS = path.join(__dirname, "capturas");
fs.mkdirSync(CARPETA_CAPTURAS, { recursive: true });
app.use("/capturas", express.static(CARPETA_CAPTURAS));
//  la línea 19: Guarda en una variable la ruta WebShot\capturas. Está en mayúsculas por convención, para indicar que es un valor fijo que no va a cambiar.
// la línea 20: mkdir significa “make directory”, crear carpeta. { recursive: true } evita un error si la carpeta ya existe.
// la línea 21: Es igual que lo de public, pero para las capturas: cuando el navegador pida /capturas/prueba.png, el servidor la busca en esa carpeta.

// NUEVO: ruta para hacer captura usando el módulo capturas.js (conecta ambos códigos)
app.post("/api/captura", async (req, res) => {
    // Esperamos recibir en el body: { url: "...", tamano: "desktop|tablet|movil" }
    let { url, tamano } = req.body ?? {};

    // Validar URL
    if (typeof url !== "string" || url.trim() === "") {
        return res.status(400).json({ error: "URL inválida" });
    }

    url = url.trim();

    // Si viene con protocolo raro (ftp, file, etc), bloquear
    if (/^[a-z][a-z\d+.-]*:\/\//i.test(url) && !/^https?:\/\//i.test(url)) {
        return res.status(400).json({ error: "Solo se permiten URLs con http o https" });
    }

    // Si no tiene protocolo, añadimos https://
    if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
    }

    // Comprobar formato final de URL
    try {
        new URL(url);
    } catch {
        return res.status(400).json({ error: "URL inválida" });
    }

    // Validar tamaño contra VIEWPORTS exportado por capturas.js
    if (!VIEWPORTS[tamano]) {
        return res.status(400).json({
            error: `Tamaño no válido. Usa: ${Object.keys(VIEWPORTS).join(", ")}`
        });
    }

    // Nombre único del archivo para no sobrescribir capturas anteriores
    const nombreArchivo = `captura-${Date.now()}-${tamano}.png`;
    const rutaArchivo = path.join(CARPETA_CAPTURAS, nombreArchivo);

    try {
        // Llamamos a la función del otro archivo: aquí se conectan ambos módulos
        await hacerCaptura(url, tamano, rutaArchivo);

        // Devolvemos la URL pública de la imagen guardada
        return res.json({
            ok: true,
            imagen: `/capturas/${nombreArchivo}`,
            tamano,
            url
        });
    } catch (error) {
        console.error("Error al hacer la captura:", error);
        return res.status(500).json({
            error: "No se pudo hacer la captura."
        });
    }
});

// NUEVO: helper para validar los archivos de captura que llegan desde el front
function nombresValidos(lista) {
    if (!Array.isArray(lista) || lista.length === 0 || lista.length > 200) return [];
    return lista
        .filter(function (a) { return typeof a === "string"; })
        .map(function (a) { return path.basename(a); }) // evita rutas peligrosas tipo ../../
        .filter(function (n) {
            return /^captura-[\w-]+\.png$/.test(n) && fs.existsSync(path.join(CARPETA_CAPTURAS, n));
        });
}

// NUEVO: genera y descarga ZIP con capturas seleccionadas
app.post("/api/zip", (req, res) => {
    const nombres = nombresValidos(req.body?.archivos);
    if (nombres.length === 0) {
        return res.status(400).json({ error: "No hay capturas válidas para comprimir." });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="capturas.zip"');

    const zip = archiver("zip");

    zip.on("error", function (error) {
        console.error("Error al crear el ZIP:", error);
        res.end();
    });

    zip.pipe(res);

    nombres.forEach(function (n) {
        zip.file(path.join(CARPETA_CAPTURAS, n), { name: n });
    });

    zip.finalize();
});

// NUEVO: genera y descarga PDF con capturas seleccionadas (una imagen por página)
app.post("/api/pdf", async (req, res) => {
    const nombres = nombresValidos(req.body?.archivos);
    if (nombres.length === 0) {
        return res.status(400).json({ error: "No hay capturas válidas para exportar." });
    }

    const imagenes = nombres.map(function (n) {
        const base64 = fs.readFileSync(path.join(CARPETA_CAPTURAS, n)).toString("base64");
        return `<img src="data:image/png;base64,${base64}" style="width:100%;display:block;page-break-after:always;">`;
    }).join("");

    let navegador;
    try {
        navegador = await chromium.launch();
        const pagina = await navegador.newPage();
        await pagina.setContent(`<html><body style="margin:0">${imagenes}</body></html>`);
        const pdf = await pagina.pdf({ format: "A4", printBackground: true });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'attachment; filename="capturas.pdf"');
        return res.send(pdf);
    } catch (error) {
        console.error("Error al crear el PDF:", error);
        return res.status(500).json({ error: "No se pudo crear el PDF." });
    } finally {
        if (navegador) await navegador.close();
    }
});

// NUEVO: ruta de prueba que hace una captura
app.get("/api/prueba", async (req, res) => {
    // Reutilizamos la función hacerCaptura para que toda captura pase por el mismo módulo
    const nombreArchivo = "prueba.png";
    const rutaArchivo = path.join(CARPETA_CAPTURAS, nombreArchivo);

    try {
        await hacerCaptura("https://example.com", "desktop", rutaArchivo);
        res.send('<img src="/capturas/prueba.png" style="max-width:100%">');
    } catch (error) {
        console.error("Error en /api/prueba:", error);
        res.status(500).send("Error al generar la captura de prueba.");
    }
});

// línea 27: Crea una ruta: “cuando alguien visite localhost:3000/api/prueba, ejecuta esto”.
//req (request) es la petición que llega del navegador.
//res (response) es la respuesta que le devolvemos.
//async y await
//Abrir un navegador o cargar una web tarda. await significa “espera a que esto termine antes de pasar a la siguiente línea”. Para poder usar await, la función tiene que llevar async delante.


// Lo que hace Playwright, paso a paso:

// chromium.launch() abre el Chrome invisible.
// navegador.newPage() abre una pestaña nueva.
// pagina.goto("https://example.com") carga esa web, que existe precisamente para hacer pruebas.
// pagina.screenshot({ path: ... }) hace la foto y la guarda como prueba.png en la carpeta capturas.
// navegador.close() cierra Chrome para no dejarlo abierto gastando memoria.
// res.send(...) responde al navegador con una etiqueta <img> que muestra la captura.


app.get("/ruta", (req, res) => {
    res.send("respuesta");
}); //Esto se denomina "ruta" y define qué hacer cuando alguien visita esa URL específica. "/ruta" corresponde a esta ruta. (req es la solicitud del navegador, res es la respuesta que enviamos al navegador) res.send("respuesta") envía la respuesta al navegador.
//Aquí en vez de "/ruta" puedes poner cualquier otra ruta que quieras manejar, por ejemplo "/inicio" o "/contacto" simplemente es para que sepais lo que significa. 
//Si cambiais "ruta" y quereis probar que sale bien la respuesta, inciar el navegador y ver que la respuesta de texto fuera la misma antes de apagarlo. 


app.get("/api/analizar", (req, res) => { // Esta ruta analiza la URL proporcionada en el parámetro "url". EjemploEjemplo: http://localhost:3000/api/analizar?url=https://example.com
    //función que se ejecuta cuando alguien entra ahi. Request (lo que llega del cliente). Response (lo que tú devuelves).
    const texto = req.query.url;  //Lee el parámetro url de la query string. Ejemplo "https://google.com"

    if (!texto) { //Comprueba si texto no existe o está vacío (undefined, "", etc.). Ejemplo, "si no me mandas URL, no puedo analizar"
        return res.status(400).json({ ok: false, error: "Falta el parámetro url" }); //Pone código HTTP 400 (Bad Request = petición incorrecta). devuelve un JSON al cliente.  formato claro para indicar error. corta la función aquí. Importante para que no siga al try. 
    }

    try {
        const url = new URL(texto);
        return res.json({
            ok: true,
            url: texto,
            dominio: url.hostname,
            ruta: url.pathname,
            parametro: url.search === "" ? "-" : url.search,
            cantidad: url.searchParams.size
        });
    } catch (e) {
        return res.status(400).json({ ok: false, error: "URL no válida" });
    }
});

app.listen(3000, () => {
    console.log("WebShot funcionando en http://localhost:3000");
});//Enciende el servidor y lo pone a escuchar en el puerto 3000. Lo de dentro de { } se ejecuta cuando ya está encendido y escribe un mensaje en la terminal.
// Importante: app.listen tiene que ser siempre lo último. Primero se configura todo y al final se enciende.