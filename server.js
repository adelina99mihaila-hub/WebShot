const express = require("express"); // require dice: tráeme esta librería. coge la librería Express de node_modules, y la guarda dentro de la constante express
const path = require("path"); // path viene incluido en Node. Sirve para construir rutas de carpetas que funcionen en cualquier sistema.
const fs = require("fs"); // fs (file system) viene incluido en Node. Sirve para crear carpetas y trabajar con archivos.
const { chromium } = require("playwright");
//Playwright trae varios navegadores, y las llaves { } significan “de todo lo que trae, dame solo chromium” (el Chrome que descargamos al principio desde la terminal con el comando npx playwright install chromium).
const { hacerCaptura, generarVistaPrevia, VIEWPORTS } = require("./capturas"); //Conecta este archivo con capturas.js (importa la función y los tamaños válidos)
const robotsParser = require("robots-parser"); //
const app = express(); // Crea el servidor. A partir de aquí, app es tu servidor
const { randomUUID } = require("crypto"); //Sirve para crear id aleatorios, lo usaremos para asociarlos a las urls


app.use(express.json()); // Permite que el servidor entienda datos JSON enviados desde el navegador

app.use(express.static(path.join(__dirname, "public"))); //Sirve archivos estáticos de la carpeta public (html, css, js del front)

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

    //Logica para el chekbox de robots.txt 
    if (typeof respectRobots !== "boolean") {
        return res.status(400).json({
            error: "La opción de respetar robots.txt debe ser true o false."
        });
    }

    //Cache de robots.txt se consulta una vez por origen
    const cacheRobots = new Map();

    async function puedeRastrear(url) {

        //Si la opción se desactiva, no se consultan ni aplican reglas
        if (!respectRobots) {
            return true;
        }

        const direccion = new URL(url);
        const origen = direccion.origin;

        //Si aun no tenemos las reglas las consultamos
        if (!cacheRobots.has(origen)) {

            const urlRobots = `${origen}/robots.txt`;
            try {
                //Se establece un limite de tiempo parala busqueda
                const respuesta = await fetch(urlRobots, {
                    signal: AbortSignal.timeout(5000)
                });

                if (respuesta.status === 404) { //Error 404, no hay archivo por lo que se puede rastrear
                    cacheRobots.set(origen, robotsParser(urlRobots, ""));

                } else if (!respuesta.ok) { //Para otros errores dejamos de rastrear el origen
                    console.warn(`No se pudo leer ${urlRobots}: HTTP ${respuesta.status}`);
                    cacheRobots.set(origen, null);

                } else { //Si todo es correcto, analizamos y guardamos las reglas.
                    const contenido = await respuesta.text();
                    cacheRobots.set(origen, robotsParser(urlRobots, contenido));

                }
            } catch (error) { //Si falla laconsulta no rastreamos

                console.error(`Error al consultar ${urlRobots}: `, error);
                cacheRobots.set(origen, null);
            }
        }

        //Continua solo en caso de que el parser confirme que la URL esta permitida.
        const reglas = cacheRobots.get(origen);

        return reglas !== null && reglas.isAllowed(url, "*") === true;
    }

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

            //Eliminamos fuentes y archivos multimedia para acelerar el buscador    /NUEVO
            if (["image", "media", "font"].includes(solicitud.resourceType())) {
                await route.abort();
                return;
            }
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

            //Si robot.txt prohibe la pagina la omitimos
            if (!(await puedeRastrear(paginaActual.url))) {
                continue;
            }

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
                    status: respuesta && respuesta.ok() ? "ok" : "error",
                    
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

                    //No añade a la cola los enlaces prohibidos por robots.txt.
                    if (!(await puedeRastrear(urlNormalizada))) {
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
        limpiarSesionesRastreo();

        const crawlId = randomUUID();
        const urlsEncontradas = paginas
            .filter(pagina => pagina.status === "ok")
            .map(pagina => pagina.url);

        sesionesRastreo.set(crawlId, {
            urlsEncontradas: new Set(urlsEncontradas),
            expira: Date.now() + DURACION_SESION_RASTREO
        });
        return res.json({
            crawlId,
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

//Map para guardar las sesiones de rastreo identificadas con un id(crawlId)
const sesionesRastreo = new Map();
//Establece la duración de la sesión en 20 min
const DURACION_SESION_RASTREO = 20 * 60 * 1000;
//Maximo de 50 sesiones de rastreo
const MAX_SESIONES_RASTREO = 50;


//Función para eliminar las sesiones caducadas
function limpiarSesionesRastreo() {

    const ahora = Date.now();

    //Recorremos todas las sesiones guardadas en map y borramos las caducadas
    for (const [id, sesion] of sesionesRastreo) {

        if (sesion.expira <= ahora) {
            sesionesRastreo.delete(id);
        }
    }
    //Si llevamos mas de 50 sesiones borramos la mas antigua para dejar espacio
    while (sesionesRastreo.size >= MAX_SESIONES_RASTREO) {

        const idMasAntiguo = sesionesRastreo.keys().next().value;
        sesionesRastreo.delete(idMasAntiguo);

    }
}

//Registramos en el servidor las url seleccionadas en la tabla
//Se valida que llegue un id y una lista de urls, que la urls este entre las encontradas y no se repita
//la sesión debe existir y no haber caducado
app.post("/api/seleccion", (req, res) => {

    const { crawlId, urls } = req.body ?? {}; //si rer.body no existe creamos un objeto vacio

    //Comprobamos que crawldId sea texto y que urls sea un array de entre 1-100 elementos
    if (typeof crawlId !== "string" || !Array.isArray(urls)
        || urls.length === 0 || urls.length > 100) {

        return res.status(400).json({ error: "Selección inválida" });
    }

    //Buscamos la sesión perteneciente al id recibido
    const sesion = sesionesRastreo.get(crawlId);

    //comprobamos si ha caducado
    if (!sesion || sesion.expira <= Date.now()) {

        sesionesRastreo.delete(crawlId);
        return res.status(410).json({ error: "El rastreo ha caducado" }); //Error 410 recurso eliminado
    
    }
    //comprobamos que sea texto y este entre las encontradas y que no haya duplicidad
    if (urls.some(url => typeof url !== "string" || !sesion.urlsEncontradas.has(url))
        || new Set(urls).size !== urls.length) {

        return res.status(400).json({ error: "La selección contiene páginas invalidas" });
    }
    
    //Convertimos el array en un set, que guarda valores unicos y permite comprobar la duplicidad
    sesion.urlsSeleccionadas = new Set(urls);
    //Renovamos la sesión
    sesion.expira = Date.now() + DURACION_SESION_RASTREO;

    return res.json({ ok: true });

});

//Ruta para generar la captura para la vista previa
app.post("/api/vista-previa", async (req, res) => {

    const { crawlId, url } = req.body ?? {};

    if (typeof crawlId !== "string" || typeof url !== "string") {

        return res.status(400).json({ error: "Solicitud de vista previa inválida." });
    }

    const sesion = sesionesRastreo.get(crawlId);

    if (!sesion || sesion.expira <= Date.now()) {
        sesionesRastreo.delete(crawlId);
        return res.status(410).json({ error: "El rastreo ha caducado. Vuelve a analizar la web." });
    }

    if (!sesion.urlsSeleccionadas || !sesion.urlsSeleccionadas.has(url)) {
        return res.status(403).json({ error: "Esa página no forma parte de la selección." });
    }
    //Bloque para la captura
    try {
        //Llamamos a la función para la vista previa
        const vista = await generarVistaPrevia(url);

        sesion.expira = Date.now() + DURACION_SESION_RASTREO;

        //Debe devolver una imagen jpeg 
        return res
            .type("image/jpeg")
            .set("X-Preview-Document-Height", String(vista.alturaDocumento))
            .set("X-Preview-Viewport-Height", String(vista.alturaViewport))
            .send(vista.imagen); //Se envian los datos al navegador

        //Los dos encabezados acompañan a la imagen con las medidas necesarias;
        // el navegador podrá leerlos al pedirla y usarlos para mantener el significado actual de los porcentajes.
    } catch (error) {
        console.error("Error al generar la vista previa:", url, error);
        return res.status(500).json({ error: "No se pudo generar la vista previa." });
    }
});

app.listen(3000, () => {
    console.log("WebShot funcionando en http://localhost:3000");
}); // Enciende el servidor y lo deja escuchando en el puerto 3000
// Importante: app.listen suele ir al final, cuando ya configuraste todo.