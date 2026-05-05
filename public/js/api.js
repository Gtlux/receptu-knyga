// ============================================================
// API MODULIS – Fetch Wrapper
// Šis failas centralizuoja visus API kvietimus vienoje vietoje.
// Kiekviena funkcija atitinka vieną backend endpoint'ą.
// credentials: 'include' – būtina, kad naršyklė siųstų cookies.
// ============================================================

// API objektas – visos API funkcijos saugomos čia.
// Naudojant objektą – visos funkcijos pasiekiamos per API.functionName().
const API = {

  // ============================================================
  // AUTENTIKACIJA
  // ============================================================

  // Registracija – POST /api/auth/register
  // Siunčia vartotojo vardą ir slaptažodį į serverį.
  // Parametrai: username (string), password (string)
  register: async function(username, password) {
    // fetch() – naršyklės built-in funkcija HTTP užklausoms siųsti
    const response = await fetch('/api/auth/register', {
      method: 'POST',                                    // HTTP metodas
      headers: { 'Content-Type': 'application/json' },   // Nurodome, kad siunčiame JSON
      credentials: 'include',                             // Siunčiame/priimame cookies
      body: JSON.stringify({ username, password })         // Paverčiame objektą į JSON string
    });
    // response.json() – parsuojame serverio atsakymą iš JSON
    const data = await response.json();
    // Jei atsakymo statusas ne 2xx – metame klaidą su serverio pranešimu
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  // Prisijungimas – POST /api/auth/login
  // Sėkmės atveju serveris nustato JWT cookie naršyklėje.
  login: async function(username, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  // Atsijungimas – POST /api/auth/logout
  // Serveris ištrina JWT cookie.
  logout: async function() {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  // ============================================================
  // RECEPTŲ PAIEŠKA (TheMealDB proxy)
  // ============================================================

  // Ieškoti receptų – GET /api/meals/search?q=...&category=...
  // QUERY parametrai: q (paieškos tekstas), category (kategorija)
  searchMeals: async function(query, category) {
    // URLSearchParams – pagalbinė klasė URL query string kūrimui
    const params = new URLSearchParams();
    // Pridedame parametrus tik jei jie pateikti (ne tušti)
    if (query) params.append('q', query);
    if (category) params.append('category', category);

    const response = await fetch(`/api/meals/search?${params.toString()}`, {
      credentials: 'include'
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  // Gauti kategorijas – GET /api/meals/categories
  getCategories: async function() {
    const response = await fetch('/api/meals/categories', {
      credentials: 'include'
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  // Gauti pilną recepto informaciją – GET /api/meals/:id
  // PATH parametras: id (TheMealDB recepto ID)
  getMealDetails: async function(mealId) {
    const response = await fetch(`/api/meals/${mealId}`, {
      credentials: 'include'
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  // Versti tekstą – POST /api/meals/translate
  // Verčia tekstą iš anglų į lietuvių kalbą per MyMemory API.
  // BODY: { text } – tekstas vertimui
  translateText: async function(text) {
    const response = await fetch('/api/meals/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ text })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  // ============================================================
  // MĖGSTAMI RECEPTAI (CRUD)
  // ============================================================

  // Gauti mėgstamus – GET /api/favorites?sort=...
  // HEADER: Cookie (automatiškai siunčiama su credentials: 'include')
  // QUERY parametras: sort (rūšiavimo tvarka)
  getFavorites: async function(sort) {
    // Sudarome URL su arba be sort parametro
    const url = sort ? `/api/favorites?sort=${sort}` : '/api/favorites';
    const response = await fetch(url, {
      credentials: 'include'
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  // Pridėti mėgstamą – POST /api/favorites
  // BODY: { mealId, name, image, category, notes }
  addFavorite: async function(mealData) {
    const response = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(mealData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  // Atnaujinti mėgstamą – PUT /api/favorites/:id
  // PATH parametras: id (recepto ID URL kelyje)
  // BODY: { notes }
  updateFavorite: async function(id, notes) {
    const response = await fetch(`/api/favorites/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ notes })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  // Pašalinti mėgstamą – DELETE /api/favorites/:id
  // PATH parametras: id (recepto ID URL kelyje)
  deleteFavorite: async function(id) {
    const response = await fetch(`/api/favorites/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  }
};
