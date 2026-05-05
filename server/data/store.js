// ============================================================
// DUOMENŲ SAUGYKLA (In-Memory)
// Visi duomenys saugomi JavaScript masyvuose serverio atmintyje.
// Kai serveris perkraunamas – duomenys dingsta (tai normalu demo versijai).
// ============================================================

// Masyvas, kuriame saugomi visi registruoti vartotojai.
// Kiekvienas vartotojas turi: { id, username, password (hashuotas) }
const users = [];

// Masyvas, kuriame saugomi visi mėgstami receptai.
// Kiekvienas įrašas turi: { id, userId, mealId, name, image, category, notes, addedAt }
const favorites = [];

// Skaitliukas, naudojamas generuoti unikalius ID mėgstamiems receptams.
// Kiekvieną kartą iškvietus getNextFavoriteId() – skaitliukas padidėja vienetu.
let nextFavoriteId = 1;

// Funkcija, kuri grąžina dabartinį ID ir padidina skaitliuką kitam kartui.
// Tai užtikrina, kad kiekvienas mėgstamas receptas turės unikalų ID.
const getNextFavoriteId = () => nextFavoriteId++;

// Eksportuojame visus duomenis ir funkcijas, kad kiti failai galėtų juos naudoti.
// module.exports – Node.js būdas dalintis kodu tarp failų.
module.exports = { users, favorites, getNextFavoriteId };
