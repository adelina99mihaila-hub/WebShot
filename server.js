const express = require("express"); // require dice: tráeme esta librería. coge la librería Express de node_modules, y la guarda dentro de la constante express
const path = require("path"); //path, viene incluido en Node, así que no hubo que instalarlo. Sirve para construir rutas de carpetas que funcionen en cualquier sistema.

const fs = require("fs"); // NUEVO 
// fs (file system, sistema de archivos) viene incluido en Node. Sirve para crear carpetas y leer o escribir archivos.

const { chromium } = require("playwright"); // NUEVO
//Playwright trae varios navegadores, y las llaves { } significan “de todo lo que trae, dame solo chromium” (el Chrome que descargamos al principio desde la terminal con el comando npx playwright install chromium).
const app = express(); // Crea el servidor. A partir de aquí, app es tu servidor

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

// NUEVO: ruta de prueba que hace una captura
app.get("/api/prueba", async (req, res) => {
    const navegador = await chromium.launch();
    const pagina = await navegador.newPage();
    await pagina.goto("https://example.com");
    await pagina.screenshot({ path: path.join(CARPETA_CAPTURAS, "prueba.png") });
    await navegador.close();
    res.send('<img src="/capturas/prueba.png" style="max-width:100%">');
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
