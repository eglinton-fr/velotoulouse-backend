const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/velos', async (req, res) => {
  const station = req.query.stationNumber;
  if (!station) return res.status(400).send({ error: 'stationNumber requis' });

  try {
    const response = await axios.get(`https://api.cyclocity.fr/contracts/toulouse/bikes?stationNumber=${station}`, {
      headers: {
        'accept': 'application/vnd.bikes.v4+json',
        'accept-language': 'fr',
        'cache-control': 'no-cache',
        'referer': 'https://velotoulouse.tisseo.fr/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 OPR/117.0.0.0'
      }
    });

    // Vérifiez si les données sont présentes dans la réponse
    if (response.data && response.data.bikes) {
      const bikeData = response.data.bikes[0]; // Supposons que vous voulez les données de la première station
      const data = {
        name: bikeData.name,
        dispo: bikeData.available_bikes,
        docks: bikeData.available_docks
      };
      res.json(data);
    } else {
      res.status(404).send({ error: 'Aucune donnée trouvée pour cette station' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Erreur pendant la récupération des données' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
