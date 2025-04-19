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

    await page.goto("https://velotoulouse.tisseo.fr/fr/mapping", {
      waitUntil: "networkidle2"
    });

    // Taper dans la barre de recherche
    await page.waitForSelector("input[placeholder='Rechercher']");
    await page.type("input[placeholder='Rechercher']", stationNumber, { delay: 100 });

    // Attendre que le résultat apparaisse (affiché dans une liste)
    await page.waitForSelector(".v-autocomplete__content .v-list-item", {
      timeout: 5000
    });

    // Cliquer sur le premier résultat (c'est celui qu'on veut)
    await page.click(".v-autocomplete__content .v-list-item");

    // Attendre que la requête parte et la réponse revienne
    await page.waitForTimeout(3000); // Donne un peu de temps à la requête pour se faire

    await browser.close();

    if (stationData) {
      res.json(stationData);
    } else {
      res.status(404).json({ error: "Données non trouvées, peut-être mauvais numéro" });
    }
  } catch (err) {
    console.error("Erreur attrapée :", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur en ligne sur le port ${PORT}`);
});
