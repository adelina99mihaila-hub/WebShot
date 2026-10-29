const { hacerCaptura, generarCapturas } = require("./capturas");

async function probar() {
    // Prueba 1: puntos de scroll en móvil
    const scroll = await generarCapturas({
        url: "https://www.cofre.io/",
        tamano: "movil",
        tipo: "viewport",
        puntos: [0, 50, 100],
        carpeta: "capturas",
        nombreBase: "cofre.io",
    });
    console.log("Prueba 1 - capturas de scroll:", scroll);

    // Prueba 2: página completa en desktop
    const completa = await generarCapturas({
        url: "https://www.cofre.io/",
        tamano: "desktop",
        tipo: "completa",
        carpeta: "capturas",
        nombreBase: "cofre.io",
    });
    console.log("Prueba 2 - captura completa:", completa);

    // Prueba 3: la función antigua sigue funcionando (la que usa Pablo)
    await hacerCaptura("https://www.cofre.io/", "tablet", "capturas/antigua-tablet.png");
    console.log("Prueba 3 - hacerCaptura sigue funcionando");
}

probar().catch(error => console.log("Error:", error.message)); 