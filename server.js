const express = require("express"); // require dice: tráeme esta librería. coge la librería Express de node_modules, y la guarda dentro de la constante express
const path = require("path"); //path, viene incluido en Node, así que no hubo que instalarlo. Sirve para construir rutas de carpetas que funcionen en cualquier sistema.

const app = express(); // Crea el servidor. A partir de aquí, app es tu servidor

app.use(express.static(path.join(__dirname, "public"))); //leído de dentro hacia fuera:
// 1. __dirname es la carpeta donde está server.js (WebShot).
// 2. path.join(__dirname, "public") da WebShot\public.
// 3.express.static(...) significa “entrega los archivos de esa carpeta cuando el navegador los pida”.
// 4.app.use(...) le dice al servidor que aplique esa regla.
// Cuando el navegador pida styles.css, el servidor lo busca en public y lo envía. Si alguien pide server.js, no lo encuentra, y por eso queda protegido.

app.listen(3000, () => {
    console.log("WebShot funcionando en http://localhost:3000");
});//Enciende el servidor y lo pone a escuchar en el puerto 3000. Lo de dentro de { } se ejecuta cuando ya está encendido y escribe un mensaje en la terminal.

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
