const express = require("express"); // require dice: tráeme esta librería. coge la librería Express de node_modules, y la guarda dentro de la constante express
const path = require("path"); //path, viene incluido en Node, así que no hubo que instalarlo. Sirve para construir rutas de carpetas que funcionen en cualquier sistema.

const { chromium } = require("playwright"); //Constante para la libreria Playwright. Chromium es el navegador que se va a usar para hacer las capturas de pantalla.


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
                }]});
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

app.listen(3000, () => {
    console.log("WebShot funcionando en http://localhost:3000");
});//Enciende el servidor y lo pone a escuchar en el puerto 3000. Lo de dentro de { } se ejecuta cuando ya está encendido y escribe un mensaje en la terminal.