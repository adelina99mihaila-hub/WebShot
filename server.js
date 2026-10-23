const express = require("express"); // require dice: tráeme esta librería. coge la librería Express de node_modules, y la guarda dentro de la constante express
const path = require("path"); // path viene incluido en Node. Sirve para construir rutas de carpetas que funcionen en cualquier sistema.
const fs = require("fs"); // fs (file system) viene incluido en Node. Sirve para crear carpetas y trabajar con archivos.
const { chromium } = require("playwright"); // NUEVO
//Playwright trae varios navegadores, y las llaves { } significan “de todo lo que trae, dame solo chromium” (el Chrome que descargamos al principio desde la terminal con el comando npx playwright install chromium).
const { hacerCaptura, VIEWPORTS } = require("./capturas"); //NUEVO Conecta este archivo con capturas.js (importa la función y los tamaños válidos)

const app = express(); // Crea el servidor. A partir de aquí, app es tu servidor

app.use(express.json()); // Permite que el servidor entienda datos JSON enviados desde el navegador

app.use(express.static(path.join(__dirname, "public"))); // NUEVO Sirve archivos estáticos de la carpeta public (html, css, js del front)

// Carpeta donde se guardarán las capturas NUEVO
const CARPETA_CAPTURAS = path.join(__dirname, "capturas");
fs.mkdirSync(CARPETA_CAPTURAS, { recursive: true }); // Crea la carpeta si no existe
app.use("/capturas", express.static(CARPETA_CAPTURAS)); // Hace pública la carpeta capturas en la ruta /capturas

// Ruta principal: hace una captura de pantalla con el tamaño indicado
// Espera body JSON: { url: "...", tamano: "desktop" | "tablet" | "movil" }
app.post("/api/captura", async (req, res) => {
    let { url, tamano } = req.body ?? {};

    // Validación básica de URL
    if (typeof url !== "string" || url.trim() === "") {
        return res.status(400).json({ error: "URL inválida" });
    }

    url = url.trim(); // Elimina espacios al principio y final

    // Si trae protocolo distinto de http/https (ej: ftp://), lo bloqueamos
    if (/^[a-z][a-z\d+.-]*:\/\//i.test(url) && !/^https?:\/\//i.test(url)) {
        return res.status(400).json({
            error: "Solo se permiten URLs con http o https"
        });
    }

    // Si no trae protocolo, añadimos https://
    if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
    }

    // Verifica que la URL final sea válida
    try {
        new URL(url);
    } catch (error) {
        return res.status(400).json({ error: "URL inválida" });
    }

    // Valida tamaño contra los tamaños exportados en capturas.js 
    if (!VIEWPORTS[tamano]) {
        return res.status(400).json({
            error: `Tamaño no válido. Usa: ${Object.keys(VIEWPORTS).join(", ")}`
        });
    }

    // Nombre único para no sobrescribir imágenes anteriores
    const nombreArchivo = `captura-${Date.now()}-${tamano}.png`;
    const rutaArchivo = path.join(CARPETA_CAPTURAS, nombreArchivo);

    try {
        // Llama a la función del otro archivo (capturas.js)
        await hacerCaptura(url, tamano, rutaArchivo);

        // Devuelve la ruta pública de la imagen para mostrarla en el front
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

app.listen(3000, () => {
    console.log("WebShot funcionando en http://localhost:3000");
}); // Enciende el servidor y lo deja escuchando en el puerto 3000
// Importante: app.listen suele ir al final, cuando ya configuraste todo.