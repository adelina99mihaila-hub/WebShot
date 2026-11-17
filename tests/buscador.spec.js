import { test, expect } from '@playwright/test';

test('Buscar una url', async ({ page }) => {

    //Abre la app y localiza los elementos
    await page.goto('http://localhost:3000');

    const formulario = page.locator('#search-box');
    const loader = page.getByRole('status');
    const pagina1 = page.locator('#pagina-1');

    //Comprobamos que el loader no esta visible
    await expect(loader).toBeHidden();

    //Introducimos la url
    await formulario.getByRole('textbox', { name: 'Buscar URL' }).fill('www.cofre.io');

    //Esperamos la respuesta del servidor
    const respuestaCrawl = page.waitForResponse(response =>
        response.url().includes('/api/crawl') &&
        response.request().method() === 'POST'
    );

    //Pulsamos el boton de Analizando
    await formulario.getByRole('button').click();

    //Aparece el loader
    await expect(loader).toBeVisible();

    //Recogemos la respuesta del servidor
    const respuesta = await respuestaCrawl;

    expect(respuesta.status()).toBe(200);

    //Comprobamos los datos
    const datos = await respuesta.json();

    expect(Array.isArray(datos.pages)).toBe(true);
    expect(datos.pages.length).toBeGreaterThan(0);
    expect(typeof datos.crawlId).toBe('string');
    expect(datos.crawlId).not.toBe('');

    //Termina la carga, desaparece el loader y aparece la pagina 1 con la tabla
    await expect(loader).toBeHidden();

    await expect(pagina1).toBeVisible({ timeout: 60000 });
    
    //La tabla coincide con los resultados
    const count = await pagina1.locator('#results-body tr').count();

    expect(count).toBe(datos.pages.length);           
});

