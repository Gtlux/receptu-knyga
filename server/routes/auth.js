// ============================================================
// AUTENTIKACIJOS MARŠRUTAI
// Šis failas apibrėžia registracijos ir prisijungimo endpoint'us.
// Visi maršrutai prasideda /api/auth/ prefiksu (nustatyta server.js faile).
// ============================================================

// Importuojame Express biblioteką – web framework'ą, kuris supaprastina serverio kūrimą.
const express = require('express');

// Sukuriame Router objektą – tai leidžia grupuoti susijusius maršrutus viename faile.
// Vėliau šis router bus prijungtas prie pagrindinio Express app su app.use().
const router = express.Router();

// Importuojame bcryptjs – biblioteką slaptažodžių hashinimui.
// Hashavimas paverčia slaptažodį į neatpažįstamą simbolių seką (vienakryptis šifravimas).
const bcrypt = require('bcryptjs');

// Importuojame jsonwebtoken – biblioteką JWT tokenų kūrimui.
// JWT (JSON Web Token) – standartas saugiam duomenų perdavimui tarp serverio ir kliento.
const jwt = require('jsonwebtoken');

// Importuojame PostgreSQL prisijungimo pool'ą iš duomenų saugyklos.
// pool.query() leidžia vykdyti SQL užklausas duomenų bazėje.
const { pool } = require('../data/store');

// Importuojame slaptą raktą ir middleware iš auth middleware failo.
// SECRET – naudojamas JWT pasirašymui.
// authMiddleware – naudojamas /me endpoint'e sesijos tikrinimui.
const { SECRET, authMiddleware } = require('../middleware/auth');

// ============================================================
// POST /api/auth/register
// Registruoja naują vartotoją. Priima body: { username, password }.
// ============================================================
router.post('/register', async (req, res) => {

  // Ištraukiame username ir password iš užklausos kūno (body).
  // req.body veikia dėka express.json() middleware, kuris parsuoja JSON formatą.
  const { username, password } = req.body;

  // --- VALIDACIJA: tikriname ar gauti duomenys atitinka laukiamą formatą ---

  // Tikriname ar abu laukai pateikti (ne tušti, ne undefined, ne null).
  if (!username || !password) {
    // 400 Bad Request – kliento klaida, trūksta privalomų duomenų.
    return res.status(400).json({ error: 'Įveskite vartotojo vardą ir slaptažodį' });
  }

  // Tikriname ar vartotojo vardas pakankamai ilgas (mažiausiai 3 simboliai).
  if (username.length < 3) {
    return res.status(400).json({ error: 'Vartotojo vardas turi būti bent 3 simbolių' });
  }

  // Tikriname ar slaptažodis pakankamai ilgas (mažiausiai 4 simboliai).
  if (password.length < 4) {
    return res.status(400).json({ error: 'Slaptažodis turi būti bent 4 simbolių' });
  }

  try {
    // Tikriname ar toks vartotojo vardas jau neužregistruotas.
    // $1 – parametrizuota reikšmė (apsauga nuo SQL injection atakų).
    // SQL injection – ataka, kai piktavalis įterpia SQL kodą per vartotojo įvestį.
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    // rows – masyvas su rastais įrašais; jei length > 0 – vartotojas jau egzistuoja.
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Toks vartotojo vardas jau užimtas' });
    }

    // --- SLAPTAŽODŽIO HASHINIMAS ---

    // bcrypt.hash() paverčia slaptažodį į hash'ą su 10 „salt rounds".
    // Salt – atsitiktinė reikšmė, pridedama prie slaptažodžio prieš hashavimą,
    // kad vienodi slaptažodžiai turėtų skirtingus hash'us.
    const hashedPassword = await bcrypt.hash(password, 10);

    // INSERT INTO – SQL komanda naujam įrašui pridėti į lentelę.
    // RETURNING id – grąžina naujai sukurto įrašo ID.
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
      [username, hashedPassword]
    );

    // Grąžiname 201 Created statusą – tai reiškia, kad resursas sėkmingai sukurtas.
    res.status(201).json({
      message: 'Registracija sėkminga!',
      userId: result.rows[0].id
    });

  } catch (error) {
    console.error('Registracijos klaida:', error);
    res.status(500).json({ error: 'Serverio klaida' });
  }
});

// ============================================================
// POST /api/auth/login
// Prisijungimas. Priima body: { username, password }.
// Sėkmingai prisijungus – nustato JWT cookie.
// ============================================================
router.post('/login', async (req, res) => {

  // Ištraukiame prisijungimo duomenis iš užklausos kūno.
  const { username, password } = req.body;

  // Tikriname ar abu laukai pateikti.
  if (!username || !password) {
    return res.status(400).json({ error: 'Įveskite vartotojo vardą ir slaptažodį' });
  }

  try {
    // Ieškome vartotojo pagal vardą duomenų bazėje.
    // SELECT * – paima visus stulpelius iš lentelės.
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    // Jei vartotojas nerastas – grąžiname bendrą klaidos žinutę.
    // Saugumo sumetimais nesakome, ar blogas vardas ar slaptažodis.
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Neteisingi prisijungimo duomenys' });
    }

    // Gauname rastą vartotojo objektą iš rezultatų masyvo.
    const user = result.rows[0];

    // bcrypt.compare() palygina pateiktą slaptažodį su saugomu hash'u.
    // Grąžina true, jei slaptažodžiai sutampa; false – jei ne.
    const passwordMatch = await bcrypt.compare(password, user.password);

    // Jei slaptažodis nesutampa – grąžiname tą pačią bendrą klaidą.
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Neteisingi prisijungimo duomenys' });
    }

    // --- JWT TOKENO KŪRIMAS ---

    // jwt.sign() sukuria JWT tokeną su nurodytais duomenimis (payload).
    // Payload: vartotojo id ir username – šie duomenys bus prieinami iš tokeno.
    const token = jwt.sign(
      { id: user.id, username: user.username },
      SECRET,
      { expiresIn: '24h' }
    );

    // --- COOKIE NUSTATYMAS ---

    // res.cookie() nustato cookie naršyklėje.
    // httpOnly: true – cookie nepasiekiama per JavaScript (apsauga nuo XSS atakų).
    // sameSite: 'strict' – cookie siunčiama tik tame pačiame domene (apsauga nuo CSRF).
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'strict'
    });

    // Grąžiname sėkmingo prisijungimo atsakymą su vartotojo vardu.
    res.json({ message: 'Prisijungimas sėkmingas!', username: user.username });

  } catch (error) {
    console.error('Prisijungimo klaida:', error);
    res.status(500).json({ error: 'Serverio klaida' });
  }
});

// ============================================================
// POST /api/auth/logout
// Atsijungimas. Ištrina JWT cookie iš naršyklės.
// ============================================================
router.post('/logout', (req, res) => {

  // res.clearCookie() ištrina cookie pagal pavadinimą.
  res.clearCookie('token');

  // Grąžiname patvirtinimą, kad atsijungimas sėkmingas.
  res.json({ message: 'Atsijungimas sėkmingas!' });
});
// ============================================================
// GET /api/auth/me
// Tikrina ar vartotojas vis dar prisijungęs (ar cookie galioja).
// Naudojama puslapio krovimo metu – jei sesija aktyvi, nereikia
// vėl prisijungti. Naudoja authMiddleware tokeno tikrinimui.
// ============================================================


router.get('/me', authMiddleware, (req, res) => {
  // Jei authMiddleware praleido – tokenas galioja.
  // req.user buvo nustatytas middleware (dekoduotas iš JWT).
  res.json({ username: req.user.username });
});

// Eksportuojame router, kad server.js galėtų jį prijungti prie aplikacijos.
module.exports = router;
