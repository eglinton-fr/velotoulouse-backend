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

    // Intercepter les réponses réseau
    page.on("response", async (response) => {
      const url = response.url();
      if (
        url.includes("api.cyclocity.fr") &&
        url.includes(`stationNumber=${stationNumber}`)
      ) {
        try {
          stationData = await response.json();
        } catch (err) {
          console.error("Erreur en lisant la réponse Cyclocity:", err);
        }
      }
    });

    await page.goto("https://velotoulouse.tisseo.fr/fr/mapping", {
      waitUntil: "load",
      timeout: 0
    });

    // Attendre la barre de recherche et taper le numéro
    await page.waitForSelector("input[placeholder='Rechercher']", { timeout: 15000 });
    await page.type("input[placeholder='Rechercher']", stationNumber, { delay: 50 });

    // Attendre un item contenant "N°" dans le texte
    await page.waitForFunction(
      () => {
        const items = document.querySelectorAll(".v-list-item");
        return Array.from(items).some(item => item.innerText.includes("N°"));
      },
      { timeout: 10000 }
    );

    // Cliquer sur le 1er résultat qui contient "N°"
    await page.evaluate(() => {
      const items = document.querySelectorAll(".v-list-item");
      const target = Array.from(items).find(item => item.innerText.includes("N°"));
      if (target) target.click();
    });

    // Attendre que la requête parte et la réponse revienne
    await page.waitForTimeout(4000);

    await browser.close();

    if (stationData) {
      res.json(stationData);
    } else {
      res.status(404).json({ error: "Données introuvables pour cette station." });
    }

  } catch (err) {
    console.error("Erreur attrapée :", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur en ligne sur le port ${PORT}`);
});
