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