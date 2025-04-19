const puppeteer = require("puppeteer");
const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/station", async (req, res) => {
  const stationNumber = req.query.stationNumber;

  if (!stationNumber) {
    return res.status(400).json({ error: "stationNumber parameter is required" });
  }

  try {
    // Lancer le navigateur Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto("https://velotoulouse.tisseo.fr/fr/mapping");
    await page.waitForTimeout(3000); // attendre que le site charge

    await browser.close(); // Fermer après avoir simulé une visite

    // Faire la requête API côté serveur (Node.js)
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

  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Une erreur s'est produite" });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});
