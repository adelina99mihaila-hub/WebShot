//Este archivo importa las herramientas que usa el servidor 
//Express recibe peticiones y Playwright abre paginas web con Chromium  
//path y fs gestionan rutas y archivos      

const express = require("express"); // require dice: tráeme esta librería. coge la librería Express de node_modules, y la guarda dentro de la constante express
const path = require("path"); //path, viene incluido en Node, así que no hubo que instalarlo. Sirve para construir rutas de carpetas que funcionen en cualquier sistema.

const fs = require("fs"); // NUEVO 
// fs (file system, sistema de archivos) viene incluido en Node. Sirve para crear carpetas y leer o escribir archivos.

const { chromium } = require("playwright"); // NUEVO
//Playwright trae varios navegadores, y las llaves { } significan “de todo lo que trae, dame solo chromium” (el Chrome que descargamos al principio desde la terminal con el comando npx playwright install chromium).
const app = express(); // Crea el servidor. A partir de aquí, app es tu servidor

app.use(express.json()); //permite que el servidor entienda los datos que le envía el navegador en formato JSON.
//---------------------------Buscador url-----------------------------------------------------

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
    //en caso contrario usa https por defecto
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

    //Lee las opciones del rastreo (profundidad, limite de paginas, dominio y robots.txt)

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

    //Falta añadir la logica para el chekbox de robots.txt /PENDIENTE/

    //Valida el dominio adicional y prepara la lista de hosts que el rastreador puede seguir

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

    //Conjunto para el host inicial
    const hostPermitidos = new Set([urlPrueba.hostname.toLowerCase()]);

    //si se añadio algún dominio lo añadimos los dominios permitidos si los hubiera
    if (hostPermitido !== "") {
        hostPermitidos.add(hostPermitido.toLowerCase());
    }

    //Si todo está bien, devuelve un JSON con la URL y un estado "ok"
    let navegador;
    try {

        navegador = await chromium.launch({ headless: true }); //Lanza el navegador Chromium 

        //Playwright abre una pestaña y visita la url
        //En modo headless el navegador no se ve
        const page = await navegador.newPage(); //Abre una nueva pestaña

        //Barrera que inspecciona las solicitudes antes de enviarlas
        // Revisa las solicitudes de navegación principal y permite solo HTTP o HTTPS.
        // Las solicitudes de recursos de la página, como imágenes y estilos, continúan.
        await page.route("**/*", async route => {

            //Comprueba que splicitud se va a hacer
            const solicitud = route.request();

            //Deja pasar solicitudes que no sean navegación principal
            if (!solicitud.isNavigationRequest() ||
                solicitud.frame() !== page.mainFrame()
            ) {
                await route.continue();
                return;
            }

            //Convierte la dirección en una url
            let destino;

            try {   //Convierte la url a objeto
                destino = new URL(solicitud.url());
            } catch {    //Si no es posiblebloquea la solicitud
                await route.abort();
                return;
            }

            //Coprueba protocolo y dominio
            const protocolo = destino.protocol === "http:" || destino.protocol === "https:";

            //Si el protocolo  no esta permitido bloquea la página
            if (!protocolo) {

                await route.abort();
                return;
            }

            await route.continue();
        })
        
        const paginas = []; //Guarda las páginas que el servidor ya ha visitado
        const cola = [];    //Guarda las páginas pendientes de visitar

        const urlPrincipal = new URL(urlPrueba.href);
        urlPrincipal.hash = "";

        const urlPrincipalNormalizada = urlPrincipal.href;

        cola.push({
            url: urlPrincipalNormalizada,
            depth: 0
        });

        const urlVistas = new Set([urlPrincipalNormalizada]);


        //Visita las páginas pendientes hasta que se acaban o se llega al limite configurado
        while (cola.length > 0 && paginas.length < maxUrls) {
            const paginaActual = cola.shift();

            try {
                const respuesta = await page.goto(paginaActual.url, {
                    waitUntil: "domcontentloaded",
                    timeout: 30000
                });

                const titulo = await page.title();
                const urlFinal = page.url();

                paginas.push({
                    title: titulo || "Sin titulo",
                    url: urlFinal,
                    depth: paginaActual.depth,
                    status: respuesta && respuesta.ok() ? "ok" : "error"
                });

                const urlFinalNormalizada = new URL(urlFinal);
                urlFinalNormalizada.hash = "";
                urlVistas.add(urlFinalNormalizada.href);

                //Buscamos paginas hasta llegar a la profundidad elegida
                if (paginaActual.depth >= maxDepth) {
                    continue;
                }

                const enlacesEncontrados = await page.locator("a[href]").evaluateAll(enlaces =>
                    enlaces.map(enlace => ({
                        texto: enlace.textContent.trim(),
                        url: enlace.href
                    }))
                );

                //Revisa los enlaces y descarta los no validos como las url duplicadas
                for (const enlace of enlacesEncontrados) {
                    if (paginas.length + cola.length >= maxUrls) {
                        break;
                    }

                    let urlEnlace;


                    try {
                        urlEnlace = new URL(enlace.url);
                    } catch {
                        continue;
                    }

                    if (
                        (urlEnlace.protocol !== "http:" && urlEnlace.protocol !== "https:")
                        || !hostPermitidos.has(urlEnlace.hostname.toLowerCase())
                    ) {
                        continue;
                    }

                    urlEnlace.hash = "";
                    const urlNormalizada = urlEnlace.href;

                    //Marca las direcciones vistas o en la cola
                    if (urlVistas.has(urlNormalizada)) { //Si el enlace esta repetido pasa al siguiente
                        continue;
                    }

                    urlVistas.add(urlNormalizada); //Guarda la url en urlVistas antes de ver la pagina
                    cola.push({     //La dirección se añade al final de la cola para visitarla
                        url: urlNormalizada,
                        depth: paginaActual.depth + 1 //La profundidad del enlace es la de la página actual +1
                    });
                }
            } catch (error) {
                console.error("Error al visitar la página:", paginaActual.url, error);
                paginas.push({
                    title: "Sin titulo",
                    url: paginaActual.url,
                    depth: paginaActual.depth,
                    status: "error"
                }
                );
            }
        }
        return res.json({
            pages: paginas
        });

    } catch (error) {
        console.error("Error al procesar la URL:", error);

        return res.status(500).json({
            error: "Error interno del servidor al procesar la URL."
        });

    } finally { //Siempre al terminar cerramos Chromium
        if (navegador) {

            await navegador.close(); //Cierra el navegador
        }
    }

});
//----------------------------------Capturas------------------------------------------------------------------------

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

// línea 307: Crea una ruta: “cuando alguien visite localhost:3000/api/prueba, ejecuta esto”. //CAMBIO EN LA LINEA
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




app.listen(3000, () => {
    console.log("WebShot funcionando en http://localhost:3000");
});//Enciende el servidor y lo pone a escuchar en el puerto 3000. Lo de dentro de { } se ejecuta cuando ya está encendido y escribe un mensaje en la terminal.
// Importante: app.listen tiene que ser siempre lo último. Primero se configura todo y al final se enciende.
