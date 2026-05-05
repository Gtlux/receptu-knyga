// ============================================================
// MĖGSTAMŲ RECEPTŲ MARŠRUTAI
// CRUD operacijos su mėgstamais receptais naudojant PostgreSQL.
// Visi maršrutai apsaugoti authMiddleware – reikalauja prisijungimo.
// ============================================================

const express = require('express');
const router = express.Router();

// Importuojame autentikacijos middleware – tikrina JWT tokeną.
const { authMiddleware } = require('../middleware/auth');

// Importuojame PostgreSQL prisijungimo pool'ą.
const { pool } = require('../data/store');

// Pridedame authMiddleware VISIEMS šio router'io maršrutams.
// Tai reiškia, kad kiekviena užklausa į /api/favorites/* bus patikrinta.
router.use(authMiddleware);

// ============================================================
// GET /api/favorites
// Grąžina prisijungusio vartotojo mėgstamus receptus.
// QUERY parametras: sort (rūšiavimo tvarka)
// COOKIE: token (JWT autentikacijai)
// ============================================================
router.get('/', async (req, res) => {
  // req.user – vartotojo duomenys iš JWT tokeno (pridėti authMiddleware).
  const userId = req.user.id;

  // req.query.sort – rūšiavimo parametras iš URL query string.
  // Pvz.: /api/favorites?sort=name
  const sort = req.query.sort || 'date';

  // Nustatome SQL ORDER BY dalį pagal rūšiavimo pasirinkimą.
  // ORDER BY – SQL sąlyga, nurodanti rezultatų rikiavimo tvarką.
  let orderBy = 'created_at DESC'; // Numatytasis – naujausi viršuje
  if (sort === 'name') {
    orderBy = 'name ASC'; // Pagal pavadinimą (A-Z)
  } else if (sort === 'category') {
    orderBy = 'category ASC, name ASC'; // Pagal kategoriją, tada pavadinimą
  }

  try {
    // SELECT – SQL užklausa duomenims gauti.
    // WHERE user_id = $1 – filtruojame tik prisijungusio vartotojo receptus.
    const result = await pool.query(
      `SELECT id, meal_id AS "mealId", name, image, category, notes, created_at
       FROM favorites
       WHERE user_id = $1
       ORDER BY ${orderBy}`,
      [userId]
    );

    // Grąžiname mėgstamų receptų sąrašą.
    res.json({ favorites: result.rows });

  } catch (error) {
    console.error('Klaida kraunant mėgstamus:', error);
    res.status(500).json({ error: 'Serverio klaida' });
  }
});

// ============================================================
// POST /api/favorites
// Prideda receptą prie mėgstamų.
// BODY: { mealId, name, image, category, notes }
// ============================================================
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const { mealId, name, image, category, notes } = req.body;

  // Validacija – tikriname ar pateikti privalomi laukai.
  if (!mealId || !name) {
    return res.status(400).json({ error: 'Trūksta recepto duomenų' });
  }

  try {
    // Tikriname ar šis receptas jau pridėtas prie mėgstamų.
    const existing = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND meal_id = $2',
      [userId, mealId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Šis receptas jau yra mėgstamuose' });
    }

    // INSERT INTO – SQL komanda naujam įrašui pridėti.
    // RETURNING * – grąžina visą naujai sukurtą įrašą.
    const result = await pool.query(
      `INSERT INTO favorites (user_id, meal_id, name, image, category, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, meal_id AS "mealId", name, image, category, notes`,
      [userId, mealId, name, image || '', category || '', notes || '']
    );

    // 201 Created – resursas sėkmingai sukurtas.
    res.status(201).json({
      message: 'Receptas pridėtas prie mėgstamų!',
      favorite: result.rows[0]
    });

  } catch (error) {
    console.error('Klaida pridedant mėgstamą:', error);
    res.status(500).json({ error: 'Serverio klaida' });
  }
});

// ============================================================
// PUT /api/favorites/:id
// Atnaujina mėgstamo recepto pastabas.
// PATH parametras: id (recepto ID URL kelyje)
// BODY: { notes }
// ============================================================
router.put('/:id', async (req, res) => {
  const userId = req.user.id;
  // parseInt() – konvertuoja string į sveikąjį skaičių.
  const favoriteId = parseInt(req.params.id);
  const { notes } = req.body;

  // Tikriname ar ID yra validus skaičius.
  if (isNaN(favoriteId)) {
    return res.status(400).json({ error: 'Neteisingas ID' });
  }

  try {
    // UPDATE – SQL komanda esamam įrašui atnaujinti.
    // SET notes = $1 – nustatome naują pastabų reikšmę.
    // WHERE id = $2 AND user_id = $3 – atnaujiname tik jei priklauso šiam vartotojui.
    // RETURNING * – grąžina atnaujintą įrašą.
    const result = await pool.query(
      `UPDATE favorites SET notes = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, meal_id AS "mealId", name, image, category, notes`,
      [notes || '', favoriteId, userId]
    );

    // Jei rowCount === 0 – receptas nerastas arba nepriklauso šiam vartotojui.
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Receptas nerastas' });
    }

    res.json({
      message: 'Pastabos atnaujintos!',
      favorite: result.rows[0]
    });

  } catch (error) {
    console.error('Klaida atnaujinant:', error);
    res.status(500).json({ error: 'Serverio klaida' });
  }
});

// ============================================================
// DELETE /api/favorites/:id
// Pašalina receptą iš mėgstamų.
// PATH parametras: id (recepto ID URL kelyje)
// ============================================================
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;
  const favoriteId = parseInt(req.params.id);

  if (isNaN(favoriteId)) {
    return res.status(400).json({ error: 'Neteisingas ID' });
  }

  try {
    // DELETE FROM – SQL komanda įrašui pašalinti.
    // WHERE id = $1 AND user_id = $2 – šaliname tik jei priklauso šiam vartotojui.
    const result = await pool.query(
      'DELETE FROM favorites WHERE id = $1 AND user_id = $2',
      [favoriteId, userId]
    );

    // rowCount – kiek eilučių buvo pašalinta.
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Receptas nerastas' });
    }

    res.json({ message: 'Receptas pašalintas iš mėgstamų!' });

  } catch (error) {
    console.error('Klaida šalinant:', error);
    res.status(500).json({ error: 'Serverio klaida' });
  }
});

module.exports = router;
