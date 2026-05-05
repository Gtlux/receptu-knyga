// ============================================================
// RECEPTO DETALIŲ MODULIS (detail.js)
// Šis failas valdo:
// - Recepto detalių modalo atidarymą ir uždarymą
// - Ingredientų surinkimą iš API duomenų
// - Recepto vertimą iš anglų į lietuvių kalbą
// ============================================================

// ============================================================
// RECEPTO DETALIŲ MODALAS
// Atidaro modalą su pilna recepto informacija (ingredientai, instrukcijos).
// ============================================================
async function openMealDetail(mealId) {
  // Rodome modalą
  const modal = document.getElementById('detail-modal');
  modal.style.display = 'flex';

  // Gauname turinio konteinerį ir rodome krovimosi animaciją
  const content = document.getElementById('detail-content');
  content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    // Kviečiame API, kad gautume pilną recepto informaciją pagal ID
    const data = await API.getMealDetails(mealId);

    // Jei receptas nerastas – rodome klaidos pranešimą
    if (!data.meals || data.meals.length === 0) {
      content.innerHTML = '<p class="placeholder-text">Receptas nerastas</p>';
      return;
    }

    // Gauname pirmą (ir vienintelį) receptą iš atsakymo
    const meal = data.meals[0];

    // Atnaujiname modalo pavadinimą recepto pavadinimu
    document.getElementById('detail-modal-title').textContent = meal.strMeal;

    // Surenkame ingredientus – TheMealDB juos saugo kaip atskirus laukus
    // strIngredient1..strIngredient20 ir strMeasure1..strMeasure20
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      // Dinamiškai pasiekiame laukus: meal['strIngredient1'], meal['strIngredient2'], ...
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      // Pridedame tik jei ingredientas nėra tuščias
      if (ingredient && ingredient.trim()) {
        ingredients.push(`<li>${measure ? measure.trim() : ''} ${ingredient.trim()}</li>`);
      }
    }

    // Sukuriame detalių HTML turinį
    content.innerHTML = `
      <div class="translate-btn-wrapper">
        <button class="btn btn-secondary btn-sm" onclick="translateRecipe()">
          🌐 Versti į lietuvių kalbą
        </button>
        <span class="translate-status" id="translate-status"></span>
      </div>
      <div class="detail-grid">
        <div class="detail-image-wrapper">
          <img class="detail-image" src="${meal.strMealThumb}" alt="${meal.strMeal}">
        </div>
        <div class="detail-info">
          <div class="detail-meta">
            ${meal.strCategory ? `<span class="meal-card-category">${meal.strCategory}</span>` : ''}
            ${meal.strArea ? `<span class="meal-card-category">${meal.strArea}</span>` : ''}
          </div>
          <h4 class="detail-subtitle">Ingredientai</h4>
          <ul class="detail-ingredients" id="detail-ingredients-list">
            ${ingredients.join('')}
          </ul>
        </div>
      </div>
      <div class="detail-instructions" id="detail-instructions-text">
        <h4 class="detail-subtitle">Gaminimo instrukcijos</h4>
        <p>${meal.strInstructions ? meal.strInstructions.replace(/\n/g, '<br>') : 'Instrukcijų nėra'}</p>
      </div>
      ${meal.strYoutube ? `
        <div class="detail-video">
          <h4 class="detail-subtitle">Video</h4>
          <a href="${meal.strYoutube}" target="_blank" class="btn btn-primary">▶️ Žiūrėti YouTube</a>
        </div>
      ` : ''}
    `;

  } catch (error) {
    content.innerHTML = '<p class="placeholder-text">Klaida kraunant receptą</p>';
    showToast('Klaida: ' + error.message, 'error');
  }
}

// Uždaro recepto detalių modalą
function closeDetailModal() {
  document.getElementById('detail-modal').style.display = 'none';
}

// ============================================================
// RECEPTO VERTIMAS Į LIETUVIŲ KALBĄ
// Siunčia ingredientų ir instrukcijų tekstą į backend'ą,
// kuris per MyMemory API išverčia iš anglų į lietuvių kalbą.
// ============================================================
async function translateRecipe() {
  // Gauname būsenos indikatorių
  const status = document.getElementById('translate-status');

  // Rodome vertimo būseną vartotojui
  status.textContent = 'Verčiama...';

  try {
    // === 1. Verčiame ingredientus ===
    const ingredientsList = document.getElementById('detail-ingredients-list');
    if (ingredientsList) {
      const items = ingredientsList.querySelectorAll('li');
      // Surenkame visus ingredientus į vieną tekstą, atskirtą kableliu
      const ingredientsText = Array.from(items).map(li => li.textContent).join(', ');

      if (ingredientsText) {
        status.textContent = 'Verčiami ingredientai...';
        // Kviečiame vertimo API su ingredientų tekstu
        const ingResult = await API.translateText(ingredientsText);
        // Suskaidome išverstą tekstą atgal į atskirus ingredientus
        const translatedIngredients = ingResult.translatedText.split(', ');
        // Atnaujiname kiekvieną <li> elementą išverstu tekstu
        items.forEach((li, index) => {
          if (translatedIngredients[index]) {
            li.textContent = translatedIngredients[index].trim();
          }
        });
      }
    }

    // === 2. Verčiame instrukcijas ===
    const instructionsDiv = document.getElementById('detail-instructions-text');
    const textElement = instructionsDiv ? instructionsDiv.querySelector('p') : null;

    if (textElement) {
      status.textContent = 'Verčiamos instrukcijos...';
      const originalText = textElement.textContent;
      // Kviečiame vertimo API – backend pats suskaldo ilgą tekstą dalimis
      const result = await API.translateText(originalText);
      textElement.innerHTML = result.translatedText.replace(/\n/g, '<br>');
    }

    // Informuojame, kad vertimas baigtas
    status.textContent = '✅ Išversta!';

  } catch (error) {
    status.textContent = '❌ Nepavyko išversti';
    showToast('Vertimo klaida: ' + error.message, 'error');
  }
}
