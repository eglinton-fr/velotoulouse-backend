const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/velos', async (req, res) => {
  const station = req.query.stationNumber;
  if (!station) return res.status(400).send({ error: 'stationNumber requis' });

  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(`https://www.velo.toulouse.fr/station/${station}`, {
      waitUntil: 'networkidle2'
    });

    const data = await page.evaluate(() => {
      const dispo = document.querySelector('.disponibles strong')?.innerText;
      const docks = document.querySelector('.borneslibres strong')?.innerText;
      const name = document.querySelector('h2')?.innerText;
      return { name, dispo, docks };
    });

    await browser.close();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Erreur pendant le scrap' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
