// ============================================================
// AUTENTIKACIJOS MIDDLEWARE
// Middleware – tai tarpinė funkcija, kuri vykdoma PRIEŠ pagrindinį
// maršruto handler'į. Ši funkcija tikrina, ar vartotojas prisijungęs.
// ============================================================

// Importuojame jsonwebtoken biblioteką – ji leidžia kurti ir tikrinti JWT tokenus.
const jwt = require('jsonwebtoken');

// Slaptas raktas, naudojamas JWT tokenų pasirašymui ir tikrinimui.
// Produkcijoje šis raktas turėtų būti aplinkos kintamajame (process.env.SECRET).
const SECRET = 'receptu-knyga-slaptas-raktas-2024';

// Middleware funkcija, tikrinanti ar užklausoje yra galiojantis JWT tokenas.
// Parametrai: req – užklausa, res – atsakymas, next – funkcija tęsti vykdymą.
const authMiddleware = (req, res, next) => {

  // Paimame token reikšmę iš cookie, pavadinimu 'token'.
  // req.cookies veikia dėka cookie-parser middleware, kuris parsuoja cookie header'į.
  const token = req.cookies.token;

  // Jei cookie neturi 'token' reikšmės – vartotojas neprisijungęs.
  // Grąžiname 401 (Unauthorized) klaidos kodą su klaidos žinute.
  if (!token) {
    return res.status(401).json({ error: 'Reikia prisijungti' });
  }

  // Bandome patikrinti (verify) JWT tokeną su slaptu raktu.
  // try/catch blokas pagauna klaidas, jei tokenas negalioja arba pasibaigęs.
  try {

    // jwt.verify() dekoduoja tokeną ir patikrina jo parašą.
    // Jei tokenas galioja – grąžina dekoduotus duomenis (id, username).
    const decoded = jwt.verify(token, SECRET);

    // Pridedame dekoduotus vartotojo duomenis prie užklausos objekto.
    // Tai leidžia vėlesniems handler'iams žinoti, kas yra prisijungęs vartotojas.
    req.user = decoded;

    // Kviečiame next() – tai reiškia, kad middleware leido užklausai tęsti.
    // Be next() kvietimo – užklausa „užstrigtų" ir niekada nepasiektų handler'io.
    next();

  } catch (err) {
    // Jei jwt.verify() sukelia klaidą – tokenas negalioja (pasibaigęs arba suklastotas).
    // Grąžiname 401 klaidą, kad vartotojas žinotų, jog reikia prisijungti iš naujo.
    return res.status(401).json({ error: 'Sesija pasibaigė, prisijunkite iš naujo' });
  }
};

// Eksportuojame middleware funkciją ir slaptą raktą.
// SECRET eksportuojamas, nes jį taip pat naudoja auth.js maršrutas tokenui sukurti.
module.exports = { authMiddleware, SECRET };
