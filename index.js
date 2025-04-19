const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 8080;

app.get("/station", async (req, res) => {
  const stationNumber = req.query.stationNumber;

  if (!stationNumber) {
    return res.status(400).json({ error: "stationNumber is required" });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto("https://velotoulouse.tisseo.fr/fr/mapping", {
      waitUntil: 'networkidle0' // attendre que le site charge bien
    });

    // Évaluer du JS dans le navigateur pour que ce soit la page qui appelle l'API
    const data = await page.evaluate(async (stationNumber) => {
      const res = await fetch(`https://api.cyclocity.fr/contracts/toulouse/bikes?stationNumber=${stationNumber}`, {
        headers: {
          accept: "application/vnd.bikes.v4+json",
          "content-type": "application/vnd.bikes.v4+json"
        }
      });

      return await res.json();
    }, stationNumber);

    await browser.close();
    res.json(data);

  } catch (err) {
    console.error("Erreur attrapée :", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur en ligne sur le port ${PORT}`);
});
