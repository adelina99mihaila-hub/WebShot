import { test, expect } from '@playwright/test';

import fs from 'node:fs';
import path from 'node:path';


//Directorios
const directoroProyecto = process.cwd();
const directorioResultados = path.join(directoroProyecto, 'tests', 'benchmarks');

//Archivo del historico
const archivoResultados = path.join(directorioResultados, 'resultados-navegacion.json');

test('Medición interna del buscador', async ({ request }) => {

    const opciones = {
        url: 'www.cofre.io',
        maxDepth: 1,
        maxUrls: 100,
        allowedDomains: '',
        respectRobots: true,
        modoDiagnostico: true
    };

    const respuesta = await request.post('http://localhost:3000/api/crawl', { data: opciones });

    expect(respuesta.status()).toBe(200);

    const datos = await respuesta.json();

    expect(datos).toHaveProperty('medicionesNavegacion');
    expect(Array.isArray(datos.medicionesNavegacion)).toBe(true);

    console.log('\n========== MEDICIONES INTERNAS ==========');

    datos.medicionesNavegacion.forEach((medicion, i) => {

        console.log(`Navegación ${i + 1}:`);
        console.log('URL:', medicion.url);
        console.log('Profundidad:', medicion.profundidad);
        console.log('Tiempo:', medicion.tiempo, 's');
        console.log('Estado:', medicion.estado);
        console.log('-----------------------------');

    });

    console.log('Total de navegaciones:', datos.medicionesNavegacion.length);

    console.log('=========================================');
    // -----------------------------------------
    // ALMACENAMIENTO HISTÓRICO
    // -----------------------------------------

    fs.mkdirSync(directorioResultados, { recursive: true });

    let historico = {
        ejecuciones: []
    };

    try {

        const contenido = fs.readFileSync(archivoResultados, 'utf-8');
        historico = JSON.parse(contenido);

        if (!Array.isArray(historico.ejecuciones)) {
            throw new Error('El formato del histórico no es válido.');
        }

    } catch (error) {

        if (error.code !== 'ENOENT') {
            throw error;
        }

        // Si el archivo no existe, comenzamos un histórico vacío
    }

    // Generamos un identificador consecutivo
    const siguienteId = historico.ejecuciones.reduce(
        (maximo, ejecucion) => Math.max(maximo, ejecucion.id || 0),
        0
    ) + 1;

    // Creamos el registro de la ejecución
    const nuevaEjecucion = {
        id: siguienteId,
        fecha: new Date().toISOString(),
        urlReferencia: new URL(
            opciones.url.startsWith('http')
                ? opciones.url
                : `https://${opciones.url}`
        ).href,
        profundidadMaxima: opciones.maxDepth,
        totalNavegaciones: datos.medicionesNavegacion.length,
        mediciones: datos.medicionesNavegacion
    };

    // Añadimos la ejecución sin eliminar las anteriores
    historico.ejecuciones.push(nuevaEjecucion);

    // Guardamos primero en un archivo temporal
    const archivoTemporal = `${archivoResultados}.tmp`;

    fs.writeFileSync(
        archivoTemporal,
        JSON.stringify(historico, null, 2),
        'utf8'
    );

    // Sustituimos el archivo anterior por el actualizado
    fs.renameSync(archivoTemporal, archivoResultados);

    console.log('\n========== HISTÓRICO GUARDADO ==========');
    console.log('Ejecución:', nuevaEjecucion.id);
    console.log('Total de ejecuciones:', historico.ejecuciones.length);
    console.log('Archivo:', archivoResultados);
    console.log('========================================');
});
