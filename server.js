const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Сервирование статических файлов из папки 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Эндпоинт для парсинга результатов поиска Google
app.get('/search', async (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).send({ error: 'Требуется параметр запроса' });
    }

    try {
        const results = await scrapeGoogleSearch(query);
        res.json({ results });
    } catch (error) {
        console.error('Ошибка парсинга результатов поиска Google:', error);
        res.status(500).send({ error: 'Не удалось получить результаты поиска Google' });
    }
});

// Функция для парсинга результатов поиска Google
async function scrapeGoogleSearch(query) {
    const browser = await puppeteer.launch({ headless: true }); // Запуск Puppeteer в headless-режиме
    const page = await browser.newPage();
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'networkidle2' });

    const results = await page.evaluate(() => {
        const scrapedResults = [];
        document.querySelectorAll('.tF2Cxc').forEach(item => {
            const titleElement = item.querySelector('h3');
            const urlElement = item.querySelector('a');
            const descriptionElement = item.querySelector('.r025kc');

            if (titleElement && urlElement) {
                const result = {
                    title: titleElement.innerText.trim(),
                    url: urlElement.href,
                    description: descriptionElement ? descriptionElement.innerText.trim() : ''
                };
                scrapedResults.push(result);
            }
        });
        return scrapedResults;
    });

    await browser.close();
    return results;
}

// Сервирование index.html для корневого пути
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});