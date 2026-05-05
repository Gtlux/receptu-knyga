// ============================================================
// MĖGSTAMŲ RECEPTŲ MODULIS (favorites.js)
// Šis failas valdo:
// - Mėgstamų receptų užkrovimą ir atvaizdavimą
// - Pridėjimą prie mėgstamų
// - Pašalinimą iš mėgstamų
// - Rūšiavimą
// - Pastabų redagavimo modalą
// ============================================================

// ============================================================
// PRIDĖTI PRIE MĖGSTAMŲ
// Iškviečiama paspaudus "⭐ Pridėti" mygtuką paieškos rezultatuose.
// ============================================================
async function addToFavorites(mealId, name, image, category) {
  try {
    // Kviečiame POST /api/favorites su recepto duomenimis
    await API.addFavorite({
      mealId: mealId,
      name: name,
      image: image,
      category: category,
      notes: ''
    });

    // Rodome sėkmės pranešimą
    showToast('Receptas pridėtas prie mėgstamų! ⭐', 'success');

    // Atnaujintame mėgstamų sąrašą
    loadFavorites();

  } catch (error) {
    // Rodome klaidos pranešimą (pvz. jei jau pridėtas)
    showToast(error.message, 'error');
  }
}

// ============================================================
// MĖGSTAMŲ RECEPTŲ UŽKROVIMAS
// Kreipiamės į API ir rodome vartotojo mėgstamus receptus.
// ============================================================
async function loadFavorites() {
  // Gauname rūšiavimo pasirinkimą
  const sort = document.getElementById('sort-select').value;
  // Gauname mėgstamų grid konteinerį
  const grid = document.getElementById('favorites-grid');

  try {
    // Kviečiame GET /api/favorites su sort parametru
    const data = await API.getFavorites(sort);

    // Jei yra mėgstamų receptų – rodome juos
    if (data.favorites && data.favorites.length > 0) {
      renderMeals(data.favorites, grid, 'favorites');
    } else {
      // Jei mėgstamų nėra – rodome placeholder tekstą
      grid.innerHTML =
        '<p class="placeholder-text">Jūs dar neturite mėgstamų receptų. Ieškokite ir pridėkite! 🍳</p>';
    }
  } catch (error) {
    showToast('Klaida kraunant mėgstamus: ' + error.message, 'error');
  }
}

// ============================================================
// RŪŠIAVIMO VALDYMAS
// Iškviečiama pakeitus rūšiavimo dropdown reikšmę.
// ============================================================
function handleSortChange() {
  // Tiesiog perkrauname mėgstamų sąrašą su nauju rūšiavimo parametru
  loadFavorites();
}

// ============================================================
// PAŠALINTI IŠ MĖGSTAMŲ
// Iškviečiama paspaudus "🗑️ Šalinti" mygtuką.
// ============================================================
async function removeFavorite(favoriteId) {

  try {
    // Kviečiame DELETE /api/favorites/:id
    await API.deleteFavorite(favoriteId);

    // Rodome sėkmės pranešimą
    showToast('Receptas pašalintas! 🗑️', 'success');
    // Perkrauname mėgstamų sąrašą
    loadFavorites();

  } catch (error) {
    console.error('Klaida šalinant:', error);
    showToast('Klaida: ' + error.message, 'error');
  }
}

// ============================================================
// MODALAS – PASTABŲ REDAGAVIMAS
// ============================================================

// Atidaro modalinį langą su dabartinėmis pastabomis
function openEditModal(favoriteId, currentNotes) {
  // Nustatome recepto ID paslėptame lauke
  document.getElementById('edit-favorite-id').value = favoriteId;
  // Nustatome dabartines pastabas textarea lauke
  document.getElementById('edit-notes').value = currentNotes;
  // Rodome modalą (keičiant display stilių)
  document.getElementById('edit-modal').style.display = 'flex';
}

// Uždaro pastabų modalinį langą
function closeModal() {
  document.getElementById('edit-modal').style.display = 'none';
}

// Apdoroja pastabų formos pateikimą
async function handleEditSubmit(event) {
  // Sustabdome numatytąjį formos elgesį
  event.preventDefault();

  // Gauname recepto ID ir naujas pastabas iš formos
  const favoriteId = document.getElementById('edit-favorite-id').value;
  const notes = document.getElementById('edit-notes').value;

  try {
    // Kviečiame PUT /api/favorites/:id su naujomis pastabomis
    await API.updateFavorite(favoriteId, notes);

    // Uždarome modalą
    closeModal();
    // Rodome sėkmės pranešimą
    showToast('Pastabos atnaujintos! ✏️', 'success');
    // Perkrauname mėgstamų sąrašą su atnaujintais duomenimis
    loadFavorites();

  } catch (error) {
    showToast('Klaida: ' + error.message, 'error');
  }
}
