const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/search', async (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).send({ error: 'Query parameter is required' });
    }

    try {
        const results = await scrapeGoogleSearch(query);
        res.json(results);
    } catch (error) {
        res.status(500).send({ error: 'Failed to scrape Google search results' });
    }
});

async function scrapeGoogleSearch(query) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'networkidle2' });

    const results = await page.evaluate(() => {
        let htmlString = ''; 

        document.querySelectorAll('.tF2Cxc').forEach(item => {
            const titleElement = item.querySelector('h3');
            const urlElement = item.querySelector('a');
            const descriptionElement = item.querySelector('.r025kc');

            if (titleElement && urlElement) {
                htmlString += `<div class="result">`;
                htmlString += `<h3 class="title" href="${urlElement.href}">${titleElement.innerText}</h3>`;
                htmlString += `<a class="url" href="${urlElement.href}" target="_blank">${urlElement.href}</a>`; 
                 
                if (descriptionElement) {
                    htmlString += `<p class="description">${descriptionElement.innerText}</p>`;
                }
                htmlString += '</div><br>';
            }
        });

        return htmlString;
    });

    await browser.close();
    return results;
}

// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});