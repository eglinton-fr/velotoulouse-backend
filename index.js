const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/station", async (req, res) => {
  const stationNumber = req.query.stationNumber;

  if (!stationNumber) {
    return res.status(400).json({ error: "stationNumber is required" });
  }

  try {
    // Lancer Puppeteer pour simuler la visite du site
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto("https://velotoulouse.tisseo.fr/fr/mapping");
    await page.waitForTimeout(2000);
    await browser.close();

    // Utiliser le fetch natif de Node 18+
    const apiRes = await fetch(`https://api.cyclocity.fr/contracts/toulouse/bikes?stationNumber=${stationNumber}`, {
      headers: {
        accept: "application/vnd.bikes.v4+json",
        "content-type": "application/vnd.bikes.v4+json",
        origin: "https://velotoulouse.tisseo.fr",
        referer: "https://velotoulouse.tisseo.fr/"
      }
    });

    const data = await apiRes.json();
    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Une erreur s'est produite." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur en ligne sur le port ${PORT}`);
});
