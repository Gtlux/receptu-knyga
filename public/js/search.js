// ============================================================
// PAIEŠKOS MODULIS (search.js)
// Šis failas valdo:
// - Kategorijų užkrovimą į dropdown meniu
// - Receptų paiešką per API
// - Kortelių (cards) HTML generavimą ir atvaizdavimą
// ============================================================

// ============================================================
// KATEGORIJŲ UŽKROVIMAS
// Kreipiamės į API ir užpildome dropdown meniu kategorijomis.
// ============================================================
async function loadCategories() {
  try {
    // Kviečiame API – gauname visas kategorijas iš TheMealDB
    const data = await API.getCategories();

    // Gauname <select> elementą pagal ID
    const select = document.getElementById('category-select');

    // Jei API grąžino kategorijas – sukuriame <option> elementus
    if (data.categories) {
      // forEach – iteruojame per kiekvieną kategoriją
      data.categories.forEach(cat => {
        // Sukuriame naują <option> HTML elementą
        const option = document.createElement('option');
        // Nustatome reikšmę (value) – tai bus siunčiama į API
        option.value = cat.strCategory;
        // Nustatome rodomą tekstą
        option.textContent = cat.strCategory;
        // Pridedame <option> prie <select> elemento
        select.appendChild(option);
      });
    }
  } catch (error) {
    // Jei nepavyko – informuojame vartotoją
    console.error('Nepavyko užkrauti kategorijų:', error);
  }
}

// ============================================================
// RECEPTŲ PAIEŠKA
// Ši funkcija iškviečiama paspaudus "Ieškoti" arba Enter.
// ============================================================
async function handleSearch() {
  // Gauname paieškos lauko reikšmę ir pašaliname tarpus iš kraštų
  const query = document.getElementById('search-input').value.trim();
  // Gauname pasirinktos kategorijos reikšmę
  const category = document.getElementById('category-select').value;

  // Gauname rezultatų konteinerį
  const resultsContainer = document.getElementById('search-results');

  // Rodome krovimosi animaciją (spinner)
  resultsContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    // Kviečiame API su paieškos parametrais
    const data = await API.searchMeals(query, category);

    // Jei receptai rasti – rodome juos
    if (data.meals) {
      renderMeals(data.meals, resultsContainer, 'search');
    } else {
      // Jei nerasta – rodome pranešimą
      resultsContainer.innerHTML =
        '<p class="placeholder-text">Receptų nerasta. Pabandykite kitą paiešką 🔍</p>';
    }
  } catch (error) {
    resultsContainer.innerHTML =
      '<p class="placeholder-text">Klaida ieškant receptų. Bandykite dar kartą.</p>';
    showToast('Klaida: ' + error.message, 'error');
  }
}

// ============================================================
// RECEPTŲ ATVAIZDAVIMAS (kortelių generavimas)
// Ši funkcija sukuria HTML korteles kiekvienam receptui.
// Parametrai:
//   meals – receptų masyvas
//   container – HTML elementas, kuriame rodysime korteles
//   type – 'search' arba 'favorites' (skirtingi mygtukai)
// ============================================================
function renderMeals(meals, container, type) {
  // Išvalome konteinerį nuo ankstesnio turinio
  container.innerHTML = '';

  // Iteruojame per kiekvieną receptą
  meals.forEach(meal => {
    // Sukuriame kortelės div elementą
    const card = document.createElement('div');
    // Pridedame CSS klasę stilizavimui
    card.className = 'meal-card';

    // Nustatome kortelės vidinį HTML turinį
    // Template literals (` `) – leidžia įterpti kintamuosius su ${}
    if (type === 'search') {
      // Paieškos rezultato kortelė – su "Pridėti" ir "Peržiūrėti" mygtukais
      card.innerHTML = `
        <div class="meal-card-image-wrapper" onclick="openMealDetail('${meal.idMeal}')" style="cursor: pointer;">
          <img class="meal-card-image"
               src="${meal.strMealThumb || ''}"
               alt="${meal.strMeal || 'Receptas'}"
               loading="lazy">
        </div>
        <div class="meal-card-body">
          ${meal.strCategory ? `<span class="meal-card-category">${meal.strCategory}</span>` : ''}
          <h3 class="meal-card-title" onclick="openMealDetail('${meal.idMeal}')" style="cursor: pointer;">${meal.strMeal}</h3>
          <div class="meal-card-actions">
            <button class="btn btn-secondary btn-sm"
                    onclick="openMealDetail('${meal.idMeal}')">
              👁️ Peržiūrėti
            </button>
            <button class="btn btn-primary btn-sm"
                    onclick="addToFavorites('${meal.idMeal}', '${escapeSingleQuotes(meal.strMeal)}', '${meal.strMealThumb || ''}', '${meal.strCategory || ''}')">
              ⭐ Pridėti
            </button>
          </div>
        </div>
      `;
    } else {
      // Mėgstamo recepto kortelė – su "Peržiūrėti", "Redaguoti" ir "Šalinti" mygtukais
      card.innerHTML = `
        <div class="meal-card-image-wrapper" onclick="openMealDetail('${meal.mealId}')" style="cursor: pointer;">
          <img class="meal-card-image"
               src="${meal.image || ''}"
               alt="${meal.name || 'Receptas'}"
               loading="lazy">
        </div>
        <div class="meal-card-body">
          ${meal.category ? `<span class="meal-card-category">${meal.category}</span>` : ''}
          <h3 class="meal-card-title" onclick="openMealDetail('${meal.mealId}')" style="cursor: pointer;">${meal.name}</h3>
          ${meal.notes ? `<p class="meal-card-notes">"${meal.notes}"</p>` : ''}
          <div class="meal-card-actions">
            <button class="btn btn-secondary btn-sm"
                    onclick="openMealDetail('${meal.mealId}')">
              👁️ Peržiūrėti
            </button>
            <button class="btn btn-secondary btn-sm"
                    onclick="openEditModal(${meal.id}, '${escapeSingleQuotes(meal.notes || '')}')">
              ✏️ Pastabos
            </button>
            <button class="btn btn-danger btn-sm"
                    onclick="removeFavorite(${meal.id})">
              🗑️ Šalinti
            </button>
          </div>
        </div>
      `;
    }

    // Pridedame kortelę prie konteinerio
    container.appendChild(card);
  });
}
