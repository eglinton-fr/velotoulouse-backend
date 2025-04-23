const express = require('express');
const puppeteer = require('puppeteer-core');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/token', async (req, res) => {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/chromium-browser',
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

    // Attendre que le token soit intercepté
    let tries = 0;
    while (!token && tries < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      tries++;
    }

    await browser.close();

    if (!token) {
      return res.status(500).json({ error: "Token introuvable" });
    }

    res.json({ token });

  } catch (error) {
    if (browser) await browser.close();
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
