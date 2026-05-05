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

// Importuojame vartotojų masyvą iš duomenų saugyklos.
// Čia bus saugomi visi registruoti vartotojai.
const { users } = require('../data/store');

// Importuojame slaptą raktą iš auth middleware – jis naudojamas JWT pasirašymui.
const { SECRET } = require('../middleware/auth');

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

  // Tikriname ar toks vartotojo vardas jau neužregistruotas.
  // Array.find() grąžina pirmą elementą, atitinkantį sąlygą, arba undefined.
  const existingUser = users.find(u => u.username === username);

  // Jei rastas vartotojas su tokiu pačiu vardu – grąžiname 409 Conflict klaidą.
  if (existingUser) {
    return res.status(409).json({ error: 'Toks vartotojo vardas jau užimtas' });
  }

  // --- SLAPTAŽODŽIO HASHINIMAS ---

  // bcrypt.hash() paverčia slaptažodį į hash'ą su 10 „salt rounds".
  // Salt – atsitiktinė reikšmė, pridedama prie slaptažodžio prieš hashavimą,
  // kad vienodi slaptažodžiai turėtų skirtingus hash'us.
  // async/await naudojamas, nes hashavimas – asinchroninė operacija.
  const hashedPassword = await bcrypt.hash(password, 10);

  // Sukuriame naują vartotojo objektą su unikaliu ID.
  // Slaptažodis saugomas tik hashuota forma – originalus niekada neišsaugomas.
  const newUser = {
    id: users.length + 1,
    username: username,
    password: hashedPassword
  };

  // Pridedame naują vartotoją į masyvą (in-memory saugykla).
  users.push(newUser);

  // Grąžiname 201 Created statusą – tai reiškia, kad resursas sėkmingai sukurtas.
  res.status(201).json({
    message: 'Registracija sėkminga!',
    userId: newUser.id
  });
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

  // Ieškome vartotojo pagal vardą mūsų duomenų saugykloje.
  const user = users.find(u => u.username === username);

  // Jei vartotojas nerastas – grąžiname bendrą klaidos žinutę.
  // Saugumo sumetimais nesakome, ar blogas vardas ar slaptažodis.
  if (!user) {
    return res.status(401).json({ error: 'Neteisingi prisijungimo duomenys' });
  }

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
  // SECRET – slaptas raktas, kuriuo pasirašomas tokenas.
  // expiresIn: '24h' – tokenas galioja 24 valandas, po to reikia prisijungti iš naujo.
  const token = jwt.sign(
    { id: user.id, username: user.username },
    SECRET,
    { expiresIn: '24h' }
  );

  // --- COOKIE NUSTATYMAS ---

  // res.cookie() nustato cookie naršyklėje.
  // 'token' – cookie pavadinimas.
  // token – cookie reikšmė (JWT tokenas).
  // Opcijos:
  //   httpOnly: true – cookie nepasiekiama per JavaScript (apsauga nuo XSS atakų).
  //   maxAge – cookie galiojimo laikas milisekundėmis (24 val = 86400000 ms).
  //   sameSite: 'strict' – cookie siunčiama tik tame pačiame domene (apsauga nuo CSRF).
  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'strict'
  });

  // Grąžiname sėkmingo prisijungimo atsakymą su vartotojo vardu.
  res.json({ message: 'Prisijungimas sėkmingas!', username: user.username });
});

// ============================================================
// POST /api/auth/logout
// Atsijungimas. Ištrina JWT cookie iš naršyklės.
// ============================================================
router.post('/logout', (req, res) => {

  // res.clearCookie() ištrina cookie pagal pavadinimą.
  // Naršyklė pašalina šią cookie ir nebesiųs jos su būsimomis užklausomis.
  res.clearCookie('token');

  // Grąžiname patvirtinimą, kad atsijungimas sėkmingas.
  res.json({ message: 'Atsijungimas sėkmingas!' });
});

// Eksportuojame router, kad server.js galėtų jį prijungti prie aplikacijos.
module.exports = router;
