const { generarTodo } = require("./capturas");

// Simula lo que guarda la página 3 de la web
const configuracion = {
    tipo: "viewport",
    datos: {
        "https://www.cofre.io/": { puntos: [0, 50, 100], tamanos: ["desktop", "movil"] },
        "https://es.wikipedia.org/wiki/JavaScript": { puntos: [0, 80], tamanos: ["tablet"] },
        "https://esta-web-no-existe-12345.com": { puntos: [0], tamanos: ["desktop"] },
    },
};//La tercera URL no existe a propósito. Sirve para comprobar que, si una web falla, las demás se hacen igual

async function probar() {
    console.time("Tiempo total");

    const resultados = await generarTodo({
        tipo: configuracion.tipo,
        datos: configuracion.datos,
        carpeta: "capturas/prueba-todo",
    });

    console.timeEnd("Tiempo total");
    console.log(JSON.stringify(resultados, null, 2));
}//console.time y console.timeEnd miden cuánto tarda todo, con el mismo nombre de etiqueta en los dos. Así puedes comprobar que es rápido

probar().catch(error => console.log("Error:", error.message));