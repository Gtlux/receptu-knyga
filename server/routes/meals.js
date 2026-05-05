// ============================================================
// RECEPTŲ PAIEŠKOS MARŠRUTAS
// Proxy tarp frontend'o ir TheMealDB API.
// ============================================================

const express = require('express');
const router = express.Router();

// TheMealDB API bazinis URL (nemokama versija, raktas "1")
const MEALDB_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

// GET /api/meals/search?q=chicken&category=Seafood
// Ieško receptų pagal pavadinimą arba kategoriją (QUERY parametrai)
router.get('/search', async (req, res) => {
  // Ištraukiame query parametrus iš URL
  const { q, category } = req.query;

  try {
    let url;
    if (q) {
      // encodeURIComponent() užkoduoja specialius simbolius URL'e
      url = `${MEALDB_BASE_URL}/search.php?s=${encodeURIComponent(q)}`;
    } else if (category) {
      url = `${MEALDB_BASE_URL}/filter.php?c=${encodeURIComponent(category)}`;
    } else {
      // Tuščia paieška – grąžins populiarius receptus
      url = `${MEALDB_BASE_URL}/search.php?s=`;
    }

    // fetch() – Node.js 18+ built-in HTTP užklausų funkcija
    const response = await fetch(url);
    // Parsuojame JSON atsakymą į JavaScript objektą
    const data = await response.json();
    // Grąžiname duomenis frontend'ui
    res.json(data);
  } catch (error) {
    console.error('Klaida kreipiantis į TheMealDB:', error.message);
    res.status(500).json({ error: 'Nepavyko gauti receptų iš TheMealDB' });
  }
});

// GET /api/meals/categories – grąžina visas receptų kategorijas
router.get('/categories', async (req, res) => {
  try {
    const response = await fetch(`${MEALDB_BASE_URL}/categories.php`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Klaida gaunant kategorijas:', error.message);
    res.status(500).json({ error: 'Nepavyko gauti kategorijų' });
  }
});

// ============================================================
// GET /api/meals/:id – grąžina pilną recepto informaciją pagal ID
// PATH parametras: :id (TheMealDB recepto ID)
// ============================================================
router.get('/:id', async (req, res) => {
  // Ištraukiame recepto ID iš URL kelio (path parametras)
  const mealId = req.params.id;

  // Tikriname ar ID pateiktas
  if (!mealId) {
    return res.status(400).json({ error: 'Trūksta recepto ID' });
  }

  try {
    // Kreipiamės į TheMealDB lookup endpoint'ą su recepto ID
    const response = await fetch(`${MEALDB_BASE_URL}/lookup.php?i=${mealId}`);
    // Parsuojame JSON atsakymą
    const data = await response.json();
    // Grąžiname recepto duomenis frontend'ui
    res.json(data);
  } catch (error) {
    console.error('Klaida gaunant recepto detales:', error.message);
    res.status(500).json({ error: 'Nepavyko gauti recepto detalių' });
  }
});

// ============================================================
// POST /api/meals/translate
// Verčia tekstą iš anglų kalbos į lietuvių kalbą.
// Naudoja nemokamą MyMemory Translation API.
// BODY: { text } – tekstas, kurį reikia išversti.
// ============================================================
router.post('/translate', async (req, res) => {
  // Ištraukiame tekstą iš užklausos kūno
  const { text } = req.body;

  // Validuojame – tikriname ar tekstas pateiktas
  if (!text) {
    return res.status(400).json({ error: 'Trūksta teksto vertimui' });
  }

  try {
    // MyMemory API turi 500 simbolių limitą vienai užklausai.
    // Todėl ilgą tekstą skaidome į mažesnes dalis (chunks).

    // 1. Skaidome tekstą į sakinius pagal taškus, šauktukus, klaustukus
    const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text];

    // 2. Grupuojame sakinius į dalis, kad kiekviena būtų iki 450 simbolių
    const chunks = [];
    let currentChunk = '';
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > 450 && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      currentChunk += sentence;
    }
    // Pridedame paskutinę dalį
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    // 3. Verčiame kiekvieną dalį atskirai
    const translatedParts = [];
    for (const chunk of chunks) {
      // langpair=en|lt – verčiame iš anglų (en) į lietuvių (lt) kalbą
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|lt`;
      const response = await fetch(url);
      const data = await response.json();

      // Tikriname ar vertimas pavyko
      if (data.responseData && data.responseData.translatedText) {
        translatedParts.push(data.responseData.translatedText);
      } else {
        translatedParts.push(chunk); // Jei nepavyko – paliekame originalą
      }
    }

    // 4. Sujungiame visas išverstas dalis ir grąžiname
    res.json({ translatedText: translatedParts.join(' ') });

  } catch (error) {
    console.error('Klaida verčiant tekstą:', error.message);
    res.status(500).json({ error: 'Nepavyko išversti teksto' });
  }
});

module.exports = router;
