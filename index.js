const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/token', async (req, res) => {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    let token = null;

    page.on('request', request => {
      if (request.url().includes('https://api.cyclocity.fr/contracts/toulouse')) {
        const headers = request.headers();
        if (headers.authorization) {
          token = headers.authorization;
        }
      }
    });

    await page.goto('https://velotoulouse.tisseo.fr/fr/mapping', { waitUntil: 'networkidle2' });

    // Attendre max 5s pour le token
    let attempts = 0;
    while (!token && attempts < 10) {
      await new Promise(r => setTimeout(r, 500));
      attempts++;
    }

    await browser.close();

    if (!token) {
      return res.status(500).json({ error: 'Token introuvable' });
    }

    return res.json({ token });

  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur le port ${PORT}`);
});
