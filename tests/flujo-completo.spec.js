import { test, expect } from '@playwright/test';

test('Flujo completo', async ({ page }) => {

    //Abre la app y localiza los elementos
    await page.goto('http://localhost:3000/#inicio');

    const formulario = page.locator('#search-box');
    const pagina1 = page.locator('#pagina-1');
    const pagina2 = page.locator('#pag2');
    const pagina3 = page.locator('#pag3');
    const pagina4 = page.locator('#pag4');
    const paginaCarga = page.locator('#pantalla-generando');

    //-------------------------------------------BUSCADOR-----------------------------------------------------------------------------
    
    //Introducimos la url
    await formulario.getByRole('textbox', { name: 'Buscar URL' }).fill('www.cofre.io');

    //Esperamos la respuesta del servidor
    const respuestaCrawl = page.waitForResponse(response =>
        response.url().includes('/api/crawl') &&
        response.request().method() === 'POST'
    );

    //Pulsamos el boton de Analizando
    await formulario.getByRole('button').click();

    //Recogemos la respuesta del servidor
    const respuesta = await respuestaCrawl;
    expect(respuesta.status()).toBe(200);

    //Pasamos a la pagina 1 (tabla de resultados)
    await expect(pagina1).toBeVisible({ timeout: 60000 });

    //-------------------------------------------SELECTOR DE URL----------------------------------------------------------------------

    //Seleccionamos un resultado para probar las capturas
    await page.getByRole('checkbox', { name: 'Seleccionar https://www.cofre.io/', exact: true }).check();

    //Procesamos la url seleccionada
    await page.getByRole('button', { name: 'Procesar URLs seleccionadas' }).click();

    //Aparece la página 2 (configuración global)
    await expect(pagina2).toBeVisible({ timeout: 60000 });

    //-------------------------------------------COFIGURACIÓN POR DEFECTO-------------------------------------------------------------

    //Dejamos la configuración por defecto y avanzamos
    await page.getByRole('button', { name: 'Continuar' }).click();

    //Página 3 (configuracion por página)
    await expect(pagina3).toBeVisible({ timeout: 60000 });

    //La vista previa carga
    const vistaPrevia = page.getByRole('img', { name: 'Vista previa de la página' });
    await expect(vistaPrevia).toBeVisible({ timeout: 60000 });

    //-------------------------------------------GENERAR CAPTURAS-------------------------------------------------------------------------

    //Generamos las capturas con la configuración por defecto
    await page.getByRole('button', { name: 'Generar capturas' }).click();

    //Aparece la página de carga de generación de capturas
    await expect(paginaCarga).toBeVisible();

    //Pasado el tiempo se generan las capturas y se pasa a la página 4 (resultados)
    await expect(pagina4).toBeVisible({ timeout: 160000 });

    //-------------------------------------------DESCARGA (ZIP Y PDF)---------------------------------------------------------------------

    //Descarga de una captura en formato png
    const descarga = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Descargar captura 0%' }).first().click();
    const descargaCaptura = await descarga;
    expect(descargaCaptura.suggestedFilename()).toMatch(/\.png$/);

    //Descarga de todas las capturas en formato ZIP
    const exportarZIP = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar todo (ZIP)' }).click();
    const descargaZIP = await exportarZIP;
    expect(descargaZIP.suggestedFilename()).toMatch(/\.zip$/);

    //Descarga de todas las capturas en formato PDF
    const exportarPDF = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar PDF' }).click();
    const descargaPDF = await exportarPDF;
    expect(descargaPDF.suggestedFilename()).toMatch(/\.pdf$/);

});  