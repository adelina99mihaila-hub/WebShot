import { test, expect } from '@playwright/test';

import fs from 'node:fs';


test('Generación y exportación de capturas validas', async ({ page }) => {

    //Abre la app y localiza los elementos
    await page.goto('http://localhost:3000');

    const formulario = page.locator('#search-box');

    const pagina1 = page.locator('#pagina-1');
    const pagina2 = page.locator('#pag2');
    const pagina3 = page.locator('#pag3');
    const pagina4 = page.locator('#pag4');
    const paginaCarga = page.locator('#pantalla-generando');

    //Introducimos la url
    await formulario.getByRole('textbox', { name: 'Buscar URL' }).fill('www.cofre.io');

    //Pulsamos el boton de Analizando
    await formulario.getByRole('button').click();

    await expect(pagina1).toBeVisible({ timeout: 60000 });

    //Seleccionamos un resultado para probar las capturas
    await page.getByRole('checkbox', { name: 'Seleccionar https://www.cofre.io/', exact: true }).check();

    //Procesamos la url seleccionada
    await page.getByRole('button', { name: 'Procesar URLs seleccionadas' }).click();

    //Aparece la página 2 (configuración global)
    await expect(pagina2).toBeVisible({ timeout: 60000 });

    //Dejamos la configuración por defecto y avanzamos
    await page.getByRole('button', { name: 'Continuar' }).click();

    //Página 3 (configuracion por página)
    await expect(pagina3).toBeVisible({ timeout: 60000 });

    //Esperamos la respuesta del servidor
    const respuestaGeneracion = page.waitForResponse(response =>
        response.url().includes('/api/generar') &&
        response.request().method() === 'POST'
    );

    //Generamos las capturas con la configuración por defecto
    await page.getByRole('button', { name: 'Generar capturas' }).click();

    //Aparece la página de carga de generación de capturas
    await expect(paginaCarga).toBeVisible();

    const respuesta = await respuestaGeneracion;
    const datos = await respuesta.json();

    //Pasado el tiempo se generan las capturas y se pasa a la página 4 (resultados)
    await expect(pagina4).toBeVisible({ timeout: 160000 });

    const paginas = datos.paginas;

    let capturasTotales = 0;
    let errores = 0;

    paginas.forEach((pagina) => {

        (pagina.capturas).forEach((captura) => {

            if (captura.error) {
                errores++;
            } else {
                capturasTotales++;
            }

        });

    });
    // recuento de capturas y errores

    expect(capturasTotales).toBe(3);
    expect(errores).toBe(0);

    //Descarga de una captura en formato png
    const descarga = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Descargar captura 0%' }).first().click();
    console.log('Se ha pulsado descargar');
    const descargaCaptura = await descarga;
    console.log('Evento download recibido');
    expect(descargaCaptura.suggestedFilename()).toMatch(/\.png$/);

    const ruta = await descargaCaptura.path();
    expect(ruta).not.toBeNull();
    const stats = fs.statSync(ruta);
    expect(stats.size).toBeGreaterThan(0);

    //Descarga de todas las capturas en formato ZIP
    const exportarZIP = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar todo (ZIP)' }).click();
    const descargaZIP = await exportarZIP;
    expect(descargaZIP.suggestedFilename()).toMatch(/\.zip$/);

    const rutaZIP = await descargaZIP.path();
    expect(rutaZIP).not.toBeNull();
    const statsZIP = fs.statSync(rutaZIP);
    expect(statsZIP.size).toBeGreaterThan(0);

    //Descarga de todas las capturas en formato PDF
    const exportarPDF = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar PDF' }).click();
    const descargaPDF = await exportarPDF;
    expect(descargaPDF.suggestedFilename()).toMatch(/\.pdf$/);

    const rutaPDF = await descargaPDF.path();
    expect(rutaPDF).not.toBeNull();
    const statsPDF = fs.statSync(rutaPDF);
    expect(statsPDF.size).toBeGreaterThan(0);



});

