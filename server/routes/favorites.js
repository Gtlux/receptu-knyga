// ============================================================
// MĖGSTAMŲ RECEPTŲ MARŠRUTAI (CRUD)
// Šis failas apibrėžia visas operacijas su mėgstamais receptais:
// GET (skaityti), POST (kurti), PUT (atnaujinti), DELETE (trinti).
// Visi maršrutai reikalauja autentikacijos (JWT cookie).
// ============================================================

const express = require('express');
const router = express.Router();

// Importuojame duomenų saugyklą ir ID generatorių
const { favorites, getNextFavoriteId } = require('../data/store');

// Importuojame autentikacijos middleware
const { authMiddleware } = require('../middleware/auth');

// router.use() pritaiko middleware VISIEMS šio router'io maršrutams.
// Tai reiškia, kad kiekviena užklausa į /api/favorites/* bus tikrinama autentikacija.
router.use(authMiddleware);

// ============================================================
// GET /api/favorites?sort=name
// Grąžina prisijungusio vartotojo mėgstamus receptus.
// QUERY parametras: sort (rūšiavimas: "name" arba "date").
// HEADER: Cookie (JWT tokenas – tikrinamas middleware).
// ============================================================
router.get('/', (req, res) => {
  // req.user.id – prisijungusio vartotojo ID (nustatytas auth middleware)
  const userId = req.user.id;

  // Ištraukiame sort parametrą iš URL query string
  const { sort } = req.query;

  // Filtruojame tik šio vartotojo mėgstamus receptus
  // Array.filter() grąžina naują masyvą tik su atitinkančiais elementais
  let userFavorites = favorites.filter(f => f.userId === userId);

  // Rūšiuojame pagal pasirinktą kriterijų
  if (sort === 'name') {
    // localeCompare() palygina tekstus abėcėlės tvarka (palaiko lietuviškas raides)
    userFavorites.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'date') {
    // Rūšiuojame pagal datą – naujausi pirmiausia (desc)
    userFavorites.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  }

  // Grąžiname mėgstamų receptų sąrašą
  res.json({ favorites: userFavorites });
});

// ============================================================
// POST /api/favorites
// Prideda naują receptą prie mėgstamų.
// HEADER: Cookie (JWT). BODY: { mealId, name, image, category, notes }
// ============================================================
router.post('/', (req, res) => {
  const userId = req.user.id;

  // Ištraukiame duomenis iš užklausos kūno (body)
  const { mealId, name, image, category, notes } = req.body;

  // --- VALIDACIJA ---
  // Tikriname ar privalomi laukai pateikti
  if (!mealId || !name) {
    return res.status(400).json({ error: 'Trūksta privalomų laukų: mealId ir name' });
  }

  // Tikriname ar šis receptas jau nėra mėgstamuose
  const alreadyExists = favorites.find(f => f.userId === userId && f.mealId === mealId);
  if (alreadyExists) {
    return res.status(409).json({ error: 'Šis receptas jau yra jūsų mėgstamuose' });
  }

  // Sukuriame naują mėgstamo recepto objektą
  const newFavorite = {
    id: getNextFavoriteId(),       // Unikalus ID
    userId: userId,                 // Kurio vartotojo receptas
    mealId: mealId,                 // TheMealDB recepto ID
    name: name,                     // Recepto pavadinimas
    image: image || '',             // Nuotraukos URL (arba tuščias)
    category: category || '',       // Kategorija (arba tuščia)
    notes: notes || '',             // Vartotojo pastabos (arba tuščios)
    addedAt: new Date().toISOString() // Pridėjimo data ISO formatu
  };

  // Pridedame į masyvą
  favorites.push(newFavorite);

  // 201 Created – resursas sėkmingai sukurtas
  res.status(201).json({ message: 'Receptas pridėtas prie mėgstamų!', favorite: newFavorite });
});

// ============================================================
// PUT /api/favorites/:id
// Atnaujina mėgstamo recepto pastabas.
// PATH parametras: :id (recepto ID). BODY: { notes }
// ============================================================
router.put('/:id', (req, res) => {
  const userId = req.user.id;

  // parseInt() paverčia string'ą į skaičių (path parametrai visada ateina kaip string)
  const favoriteId = parseInt(req.params.id);

  // Ištraukiame naują pastabų reikšmę iš body
  const { notes } = req.body;

  // Tikriname ar ID yra validus skaičius
  if (isNaN(favoriteId)) {
    return res.status(400).json({ error: 'Neteisingas ID formatas' });
  }

  // Ieškome recepto pagal ID ir vartotojo ID (saugumo dėlei – kad negalėtų redaguoti kitų)
  const favorite = favorites.find(f => f.id === favoriteId && f.userId === userId);

  // Jei nerastas – 404 Not Found
  if (!favorite) {
    return res.status(404).json({ error: 'Receptas nerastas jūsų mėgstamuose' });
  }

  // Atnaujiname pastabas (tik jei notes pateiktas)
  if (notes !== undefined) {
    favorite.notes = notes;
  }

  // Grąžiname atnaujintą receptą
  res.json({ message: 'Receptas atnaujintas!', favorite: favorite });
});

// ============================================================
// DELETE /api/favorites/:id
// Pašalina receptą iš mėgstamų.
// PATH parametras: :id (recepto ID).
// ============================================================
router.delete('/:id', (req, res) => {
  const userId = req.user.id;
  const favoriteId = parseInt(req.params.id);

  if (isNaN(favoriteId)) {
    return res.status(400).json({ error: 'Neteisingas ID formatas' });
  }

  // findIndex() grąžina elemento poziciją masyve, arba -1 jei nerastas
  const index = favorites.findIndex(f => f.id === favoriteId && f.userId === userId);

  if (index === -1) {
    return res.status(404).json({ error: 'Receptas nerastas jūsų mėgstamuose' });
  }

  // splice(index, 1) pašalina vieną elementą iš masyvo nurodytoje pozicijoje
  favorites.splice(index, 1);

  // Grąžiname patvirtinimą
  res.json({ message: 'Receptas pašalintas iš mėgstamų!' });
});

module.exports = router;
