const { hacerCaptura } = require("./capturas");
// require("./capturas"): el ./ significa “un archivo mío, de esta carpeta”. Sin ./, Node lo buscaría en node_modules como si fuera una librería instalada. Las llaves { hacerCaptura } cogen solo la función, igual que hacías con { chromium }.
async function probar() {
    await hacerCaptura("https://www.wikipedia.org", "desktop", "capturas/prueba-desktop.png");
    console.log("Captura desktop hecha");
//probar(): una función que hace dos capturas seguidas, una de desktop y otra de móvil.
    await hacerCaptura("https://www.wikipedia.org", "movil", "capturas/prueba-movil.png");
    console.log("Captura móvil hecha");
}

probar().catch(error => console.log("Error:", error.message));
//.catch(error => ...): si algo falla, muestra el mensaje del error en la terminal en vez de un texto rojo enorme.

//Las imágenes se guardan en la carpeta capturas, que ya está en .gitignore, así que no se subirán a GitHub.

//para comprobar que funciona se ejecuta en la terminal el comando: node prueba-capturas.js. 
//se debería poder ver : Captura desktop hecha ; Captua móvil hecha. Y en la carpeta capturas deberá aparecer prueba-desktop.png y prueba-móvil.png. 