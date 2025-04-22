const express = require('express');
const fetch = require('node-fetch');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/bike', async (req, res) => {
  const stationNumber = req.query.stationNumber;

  if (!stationNumber) {
    return res.status(400).json({ error: 'stationNumber requis' });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  let token = null;

  page.on('request', (request) => {
    if (request.url().includes('https://api.cyclocity.fr/contracts/toulouse')) {
      const headers = request.headers();
      if (headers['authorization']) {
        token = headers['authorization'];
      }
    }
  });

  await page.goto('https://velotoulouse.tisseo.fr/fr/mapping', {
    waitUntil: 'networkidle2'
  });

  // Attendre que le token soit trouvé
  let attempts = 0;
  while (!token && attempts < 10) {
    await new Promise(r => setTimeout(r, 500));
    attempts++;
  }

  await browser.close();

  if (!token) {
    return res.status(500).json({ error: 'Token non trouvé' });
  }

  try {
    const response = await fetch(`https://api.cyclocity.fr/contracts/toulouse/bikes?stationNumber=${stationNumber}`, {
      headers: {
        'Content-Type': 'application/vnd.bikes.v4+json',
        'Authorization': token
      }
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des données', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚲 Serveur vélo Toulouse prêt sur le port ${PORT}`);
});
