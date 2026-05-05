// ============================================================
// PAGALBINĖS FUNKCIJOS (utils.js)
// Šis failas apima:
// - Toast pranešimų rodymą
// - Teksto formatavimo pagalbines funkcijas
// ============================================================

// ============================================================
// TOAST PRANEŠIMAI
// Trumpi pranešimai ekrano kampe, kurie automatiškai dingsta.
// ============================================================
function showToast(message, type) {
  // Gauname toast konteinerį
  const container = document.getElementById('toast-container');

  // Sukuriame naują toast elementą
  const toast = document.createElement('div');
  // Pridedame CSS klases: 'toast' ir 'toast-success' arba 'toast-error'
  toast.className = `toast toast-${type}`;
  // Nustatome pranešimo tekstą
  toast.textContent = message;

  // Pridedame toast prie konteinerio (rodome ekrane)
  container.appendChild(toast);

  // setTimeout – iškviečia funkciją po nurodyto laiko (milisekundėmis)
  // Po 3 sekundžių (3000 ms) – pašaliname toast elementą iš DOM
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ============================================================
// TEKSTO FORMATAVIMAS
// Pakeičia viengubas kabutes, kad nesulaužytų HTML onclick atributų.
// ============================================================
function escapeSingleQuotes(text) {
  // replace() su reguliaria išraiška /'/g – pakeičia visas viengubas kabutes
  // &#39; – HTML entitetas, kuris naršyklėje rodomas kaip '
  return text.replace(/'/g, '&#39;');
}
