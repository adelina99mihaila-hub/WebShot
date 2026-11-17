import { test, expect } from '@playwright/test';

test('Redirección de cofre.io a www.cofre.io', async ({ page }) => {

    //Abre la app y localiza los elementos
    await page.goto('http://localhost:3000');

    const formulario = page.locator('#search-box');
    const pagina1 = page.locator('#pagina-1');

    //Introducimos la url
    await formulario.getByRole('textbox', { name: 'Buscar URL' }).fill('cofre.io');

    //Esperamos la respuesta del servidor
    const respuestaCrawl = page.waitForResponse(response =>
        response.url().includes('/api/crawl') &&
        response.request().method() === 'POST'
    );

    //Pulsamos el boton de Analizando
    await formulario.getByRole('button').click();

    //Recogemos la respuesta del servidor y comprobamos su estado
    const respuesta = await respuestaCrawl;
    expect(respuesta.status()).toBe(200);

    const datos = await respuesta.json();

    expect(datos.pages.length).toBeGreaterThan(1);

    //La URL inicial terminó en www.cofre.io
    const urlInicialFinal = new URL(datos.pages[0].url);
    expect(urlInicialFinal.hostname).toBe('www.cofre.io');

    //El rastreador también encontró otra página bajo ese host
    const encontroOtraPaginaEnWww = datos.pages.slice(1).some(({ url }) =>
        new URL(url).hostname === 'www.cofre.io'
    );

    expect(encontroOtraPaginaEnWww).toBe(true);

    //Termina la carga y aparece la pagina 1 con la tabla
    await expect(pagina1).toBeVisible({ timeout: 60000 });



});
