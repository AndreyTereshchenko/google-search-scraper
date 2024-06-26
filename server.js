const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

async function run() {
    let browser;
    try {
      browser = await puppeteer.launch({
        executablePath: process.env.GOOGLE_CHROME_BIN,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.goto('https://example.com');
      // Далее ваши действия с Puppeteer
    } catch (error) {
      console.error('Ошибка при запуске браузера:', error);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
  
  run();

// Сервирование статических файлов из папки 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Эндпоинт для парсинга результатов поиска Google
app.get('/search', async (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).send({ error: 'Требуется параметр запроса' });
    }

    try {
        console.log(`Запрос на поиск: ${query}`);
        const results = await scrapeGoogleSearch(query);
        res.json({ results });
    } catch (error) {
        console.error('Ошибка при обработке запроса /search:', error);
        res.status(500).send({ error: 'Ошибка при обработке запроса поиска. Пожалуйста, попробуйте позже.' });
    }
});

// Функция для парсинга результатов поиска Google
async function scrapeGoogleSearch(query) {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: true });
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

        console.log(`Найдено результатов: ${results.length}`);
        await browser.close();
        return results;
    } catch (error) {
        console.error('Ошибка при парсинге результатов поиска:', error);
        if (browser) {
            await browser.close();
        }
        // Возвращаем пустой массив в случае ошибки
        return [];
    }
}

// Сервирование index.html для корневого пути
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});