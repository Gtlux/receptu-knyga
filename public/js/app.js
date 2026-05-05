// ============================================================
// PAGRINDINĖ APLIKACIJOS LOGIKA (app.js)
// Šis failas yra pagrindinis – inicializuoja aplikaciją:
// - Prijungia event listener'ius prie HTML elementų
// - Valdo navigaciją tarp sekcijų
//
// Kiti moduliai (įkraunami prieš šį failą):
//   utils.js    – Toast pranešimai, teksto formatavimas
//   search.js   – Receptų paieška ir kortelių atvaizdavimas
//   favorites.js – Mėgstamų receptų CRUD operacijos
//   detail.js   – Recepto detalių modalas ir vertimas
// ============================================================

// ============================================================
// INICIALIZACIJA
// Ši funkcija kviečiama iš auth.js po sėkmingo prisijungimo.
// ============================================================
function initApp() {
  // Užkrauname kategorijas į dropdown meniu
  loadCategories();
  // Užkrauname vartotojo mėgstamus receptus
  loadFavorites();
  // Nustatome event listener'ius (mygtukų paspaudimų klausymą)
  setupEventListeners();
}

// ============================================================
// EVENT LISTENER'IŲ NUSTATYMAS
// Čia sujungiame HTML elementus su JavaScript funkcijomis.
// ============================================================
function setupEventListeners() {
  // Paieškos mygtuko paspaudimas
  document.getElementById('search-btn').addEventListener('click', handleSearch);

  // Enter klavišo paspaudimas paieškos lauke
  document.getElementById('search-input').addEventListener('keypress', (event) => {
    // event.key – kuris klavišas paspaustas; 'Enter' – enter klavišas
    if (event.key === 'Enter') handleSearch();
  });

  // Kategorijos pasirinkimo pakeitimas – automatinė paieška
  document.getElementById('category-select').addEventListener('change', handleSearch);

  // Rūšiavimo pasirinkimo pakeitimas mėgstamuose
  document.getElementById('sort-select').addEventListener('change', handleSortChange);

  // Navigacijos nuorodų paspaudimai
  document.getElementById('nav-search').addEventListener('click', (e) => {
    e.preventDefault();
    showSection('search');
  });

  document.getElementById('nav-favorites').addEventListener('click', (e) => {
    e.preventDefault();
    showSection('favorites');
  });

  // Hamburger meniu mygtukas (mobile)
  document.getElementById('hamburger-btn').addEventListener('click', () => {
    // toggle() – prideda klasę jei jos nėra, pašalina jei yra
    document.getElementById('nav-links').classList.toggle('open');
  });

  // Modalo uždarymo mygtukas
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);

  // Modalo uždarymas paspaudus ant fono (overlay)
  document.getElementById('edit-modal').addEventListener('click', (event) => {
    // event.target – elementas, ant kurio paspaudė; tikrina ar tai overlay, ne modal-card
    if (event.target.id === 'edit-modal') closeModal();
  });

  // Pastabų redagavimo formos pateikimas
  document.getElementById('edit-form').addEventListener('submit', handleEditSubmit);

  // Recepto detalių modalo uždarymo mygtukas
  document.getElementById('detail-close-btn').addEventListener('click', closeDetailModal);

  // Recepto detalių modalo uždarymas paspaudus ant fono
  document.getElementById('detail-modal').addEventListener('click', (event) => {
    if (event.target.id === 'detail-modal') closeDetailModal();
  });
}

// ============================================================
// NAVIGACIJA TARP SEKCIJŲ
// Perjungia tarp paieškos ir mėgstamų sekcijų.
// ============================================================
function showSection(sectionName) {
  // Gauname abi sekcijas
  const searchSection = document.getElementById('search-section');
  const favoritesSection = document.getElementById('favorites-section');

  // Gauname navigacijos nuorodas
  const navSearch = document.getElementById('nav-search');
  const navFavorites = document.getElementById('nav-favorites');

  // Parodome/paslepiame atitinkamas sekcijas ir pažymime aktyvią nuorodą
  if (sectionName === 'search') {
    searchSection.style.display = 'block';
    favoritesSection.style.display = 'none';
    navSearch.classList.add('active');
    navFavorites.classList.remove('active');
  } else {
    searchSection.style.display = 'none';
    favoritesSection.style.display = 'block';
    navFavorites.classList.add('active');
    navSearch.classList.remove('active');
    // Perkrauname mėgstamus, kai perjungiame į šią sekciją
    loadFavorites();
  }

  // Uždarome mobilųjį meniu (jei atidarytas)
  document.getElementById('nav-links').classList.remove('open');
}
