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
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    // Intercepter les réponses du site
    let stationData = null;
    page.on("response", async (response) => {
      const url = response.url();
      if (
        url.includes(`stationNumber=${stationNumber}`) &&
        url.includes("api.cyclocity.fr")
      ) {
        try {
          stationData = await response.json();
        } catch (err) {
          console.error("Erreur de parsing de la réponse:", err);
        }
      }
    });

    // Charger le site
    await page.goto(`https://velotoulouse.tisseo.fr/fr/mapping`, {
      waitUntil: "networkidle2"
    });

    // On clique sur la station depuis la page pour déclencher l’appel (facultatif)
    // await page.click(`selector-de-la-station-${stationNumber}`)

    // Attendre un peu que les requêtes se fassent
    await new Promise((resolve) => setTimeout(resolve, 4000));

    await browser.close();

    if (stationData) {
      res.json(stationData);
    } else {
      res.status(404).json({ error: "Station data not found in site requests" });
    }
  } catch (err) {
    console.error("Erreur attrapée :", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur en ligne sur le port ${PORT}`);
});
