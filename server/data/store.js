// ============================================================
// DUOMENŲ BAZĖS SAUGYKLA (store.js)
// Šis failas valdo prisijungimą prie PostgreSQL duomenų bazės
// ir sukuria reikiamas lenteles, jei jų dar nėra.
//
// PostgreSQL – reliacinė duomenų bazė, kuri saugo duomenis
// lentelėse su eilutėmis ir stulpeliais (panašiai kaip Excel).
// ============================================================

// Importuojame pg (node-postgres) – Node.js biblioteką PostgreSQL prisijungimui.
// Pool – ryšių telkinys, kuris efektyviai valdo kelis prisijungimus prie DB.
const { Pool } = require('pg');

// ============================================================
// PRISIJUNGIMAS PRIE DUOMENŲ BAZĖS
// Pool sukuria kelis prisijungimus ir pakartotinai juos naudoja.
// DATABASE_URL – aplinkos kintamasis, kurį nustato Render.com
// automatiškai, kai prijungiame PostgreSQL duomenų bazę.
// ============================================================
const pool = new Pool({
  // process.env.DATABASE_URL – pilnas prisijungimo URL formatu:
  // postgres://user:password@host:port/database
  connectionString: process.env.DATABASE_URL,

  // SSL nustatymai – reikalingi cloud duomenų bazėms (Render, Heroku).
  // rejectUnauthorized: false – leidžia self-signed SSL sertifikatus.
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// ============================================================
// LENTELIŲ KŪRIMAS
// Ši funkcija sukuria dvi lenteles, jei jų dar nėra:
// - users – vartotojų duomenys
// - favorites – mėgstami receptai
//
// CREATE TABLE IF NOT EXISTS – sukuria lentelę tik jei ji neegzistuoja.
// Tai leidžia saugiai kviesti šią funkciją kiekvieną kartą paleidžiant serverį.
// ============================================================
async function initializeDatabase() {
  try {
    // pool.query() – siunčia SQL užklausą į duomenų bazę.
    // SERIAL PRIMARY KEY – automatiškai didėjantis unikalus identifikatorius.
    // VARCHAR – tekstinis laukas su maksimaliu ilgiu.
    // UNIQUE – užtikrina, kad reikšmė būtų unikali visoje lentelėje.
    // TEXT – neriboto ilgio tekstinis laukas.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);

    // INTEGER REFERENCES users(id) – užsienio raktas (foreign key),
    // kuris susieja favorites lentelę su users lentele.
    // TIMESTAMP DEFAULT NOW() – automatiškai nustatomas dabartinis laikas.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        meal_id VARCHAR(50) NOT NULL,
        name TEXT NOT NULL,
        image TEXT,
        category VARCHAR(100),
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Duomenų bazės lentelės paruoštos');
  } catch (error) {
    console.error('❌ Duomenų bazės klaida:', error.message);
  }
}

// Eksportuojame pool objektą (naudojamas routes failuose SQL užklausoms)
// ir initializeDatabase funkciją (kviečiama server.js paleidimo metu).
module.exports = { pool, initializeDatabase };
