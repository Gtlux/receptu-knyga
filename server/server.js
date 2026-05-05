// ============================================================
// PAGRINDINIS SERVERIO FAILAS
// Čia sukuriama Express aplikacija, prijungiami visi middleware
// ir maršrutai, bei paleidžiamas HTTP serveris.
// ============================================================

// Importuojame Express – web framework'ą serverio kūrimui
const express = require('express');

// Importuojame cookie-parser – middleware, kuris parsuoja Cookie header'į
// ir padaro cookies prieinamas per req.cookies objektą
const cookieParser = require('cookie-parser');

// Importuojame path – Node.js modulį failų kelių sudarymui.
// __dirname – dabartinio failo direktorija (server/)
const path = require('path');

// Importuojame mūsų sukurtus maršrutų failus
const authRoutes = require('./routes/auth');
const mealsRoutes = require('./routes/meals');
const favoritesRoutes = require('./routes/favorites');

// Sukuriame Express aplikacijos objektą – tai yra mūsų serveris
const app = express();

// Nustatome porto numerį, kuriuo serveris klausysis užklausų
// process.env.PORT – aplinkos kintamasis, kurį nustato cloud servisai (pvz. Render)
// Jei aplinkos kintamasis nenustatytas – naudojame 3000 (lokaliam darbui)
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE REGISTRACIJA
// Middleware – tai funkcijos, kurios vykdomos su KIEKVIENA užklausa
// prieš ją pasiekiant konkrečius maršrutus.
// ============================================================

// express.json() – parsuoja JSON formatą iš užklausos body.
// Be šio middleware, req.body būtų undefined.
app.use(express.json());

// cookieParser() – parsuoja Cookie header'į iš užklausos.
// Be šio middleware, req.cookies būtų undefined.
app.use(cookieParser());

// express.static() – aptarnauja statinius failus (HTML, CSS, JS, paveikslėlius).
// path.join() saugiai sujungia kelio dalis (veikia tiek Windows, tiek Linux).
// '../public' – nurodome, kad statiniai failai yra vienu lygiu aukščiau, public/ aplanke.
app.use(express.static(path.join(__dirname, '..', 'public')));

// ============================================================
// MARŠRUTŲ REGISTRACIJA
// app.use(prefiksas, router) – prijungia router'io maršrutus su nurodytu URL prefiksu.
// ============================================================

// Visi auth maršrutai bus pasiekiami per /api/auth/...
app.use('/api/auth', authRoutes);

// Visi meals maršrutai bus pasiekiami per /api/meals/...
app.use('/api/meals', mealsRoutes);

// Visi favorites maršrutai bus pasiekiami per /api/favorites/...
app.use('/api/favorites', favoritesRoutes);

// ============================================================
// SERVERIO PALEIDIMAS
// app.listen() paleidžia HTTP serverį nurodytame porte.
// Callback funkcija iškviečiama, kai serveris sėkmingai paleistas.
// ============================================================
app.listen(PORT, () => {
  console.log('===========================================');
  console.log(`  Receptų Knyga – serveris paleistas!`);
  console.log(`  Adresas: http://localhost:${PORT}`);
  console.log('===========================================');
});
