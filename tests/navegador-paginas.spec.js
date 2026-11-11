import { test, expect } from '@playwright/test';

test('Navegación entre páginas con el navbar', async ({ page }) => {

    //Abre la app y localiza los elementos
    await page.goto('http://localhost:3000');

    const formulario = page.locator('#search-box');
    const pagina1 = page.locator('#pagina-1');
    const pagina2 = page.locator('#pag2');
    const pagina3 = page.locator('#pag3');
    const pagina4 = page.locator('#pag4');

    //Introducimos la url
    await formulario.getByRole('textbox', { name: 'Buscar URL' }).fill('www.cofre.io');

    //Pulsamos el boton de Analizando
    await formulario.getByRole('button').click();
    
    await expect(pagina1).toBeVisible({ timeout: 60000 });

    await page.getByRole('checkbox', { name: 'Seleccionar https://www.cofre.io/', exact: true }).check();

    await page.getByRole('button', { name: 'Config global' }).click();

    //Aparece la página 2 (configuración global)
    await expect(pagina2).toBeVisible({ timeout: 60000 });

    await page.getByRole('button', { name: 'Config por página' }).click();

    //Página 3 (configuracion por página)
    await expect(pagina3).toBeVisible({ timeout: 60000 });

    await page.getByRole('button', { name: 'Generar capturas' }).click();

    //Pasado el tiempo se generan las capturas y se pasa a la página 4 (resultados)
    await expect(pagina4).toBeVisible({ timeout: 60000 });

    //Se vuelve a inicio
    await page.getByRole('button', { name: 'Inicio' }).click();

});
