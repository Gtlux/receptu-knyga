// ============================================================
// AUTENTIKACIJOS MODULIS (Frontend)
// Šis failas valdo prisijungimo ir registracijos logiką:
// - Formų pateikimo (submit) apdorojimą
// - Persijungimą tarp prisijungimo ir registracijos
// - Vartotojo sesijos būsenos valdymą
// ============================================================

// Kintamasis, nurodantis dabartinį režimą: 'login' arba 'register'
let authMode = 'login';

// ============================================================
// INICIALIZACIJA
// DOMContentLoaded – įvykis, kuris iškviečiamas kai HTML pilnai užsikrovė.
// Tai garantuoja, kad visi DOM elementai jau egzistuoja prieš bandant juos pasiekti.
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

  // Gauname nuorodas į DOM elementus pagal jų ID
  const authForm = document.getElementById('auth-form');
  const authSwitchLink = document.getElementById('auth-switch-link');
  const logoutBtn = document.getElementById('logout-btn');

  // Pridedame submit event listener'į autentikacijos formai.
  // Event listener – funkcija, kuri iškviečiama kai įvyksta nurodytas įvykis.
  authForm.addEventListener('submit', handleAuthSubmit);

  // Pridedame click event listener'į persijungimo nuorodai
  authSwitchLink.addEventListener('click', toggleAuthMode);

  // Pridedame click event listener'į atsijungimo mygtukui
  logoutBtn.addEventListener('click', handleLogout);
});

// ============================================================
// FORMOS PATEIKIMO APDOROJIMAS
// Ši funkcija iškviečiama kai vartotojas paspaudžia "Prisijungti" arba "Registruotis".
// ============================================================
async function handleAuthSubmit(event) {
  // preventDefault() – sustabdo numatytąjį formos elgesį (puslapio perkrovimą).
  // Be šio – naršyklė perkrautų puslapį, o mes norime apdoroti formos duomenis per JS.
  event.preventDefault();

  // Gauname formos laukų reikšmes
  const username = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value;
  const errorDiv = document.getElementById('auth-error');

  // Išvalome ankstesnę klaidos žinutę
  errorDiv.textContent = '';

  // try/catch blokas – bandom vykdyti kodą, o jei įvyksta klaida – pagaunam ją
  try {
    let result;

    // Priklausomai nuo režimo – kviečiame atitinkamą API funkciją
    if (authMode === 'register') {
      // Kviečiame registracijos API endpoint'ą
      result = await API.register(username, password);
      // Po sėkmingos registracijos – automatiškai prisijungiame
      result = await API.login(username, password);
    } else {
      // Kviečiame prisijungimo API endpoint'ą
      result = await API.login(username, password);
    }

    // Jei pavyko – parodome pagrindinį turinį
    showMainContent(result.username);

  } catch (error) {
    // Jei API grąžino klaidą – parodome ją vartotojui
    errorDiv.textContent = error.message;
  }
}

// ============================================================
// PERSIJUNGIMAS TARP PRISIJUNGIMO IR REGISTRACIJOS
// ============================================================
function toggleAuthMode(event) {
  // Sustabdome numatytąjį nuorodos elgesį (navigaciją)
  event.preventDefault();

  // Gauname DOM elementus, kuriuos reikia atnaujinti
  const title = document.getElementById('auth-title');
  const submitBtn = document.getElementById('auth-submit-btn');
  const switchText = document.getElementById('auth-switch-text');
  const switchLink = document.getElementById('auth-switch-link');
  const errorDiv = document.getElementById('auth-error');

  // Pakeičiame režimą: jei buvo 'login' – tampa 'register', ir atvirkščiai
  if (authMode === 'login') {
    authMode = 'register';
    title.textContent = 'Registracija';
    submitBtn.textContent = 'Registruotis';
    switchText.textContent = 'Jau turite paskyrą?';
    switchLink.textContent = 'Prisijungti';
  } else {
    authMode = 'login';
    title.textContent = 'Prisijungimas';
    submitBtn.textContent = 'Prisijungti';
    switchText.textContent = 'Neturite paskyros?';
    switchLink.textContent = 'Registruotis';
  }

  // Išvalome klaidos žinutę perjungiant režimą
  errorDiv.textContent = '';
}

// ============================================================
// RODYTI PAGRINDINĮ TURINĮ (po prisijungimo)
// Ši funkcija slepia auth sekcija ir rodo pagrindine aplikacija.
// ============================================================
function showMainContent(username) {
  // Slepiame autentikacijos sekciją
  document.getElementById('auth-section').style.display = 'none';
  // Rodome pagrindinį turinį
  document.getElementById('main-content').style.display = 'block';
  // Rodome navigaciją
  document.getElementById('main-nav').style.display = 'flex';
  // Atnaujiname vartotojo vardo rodymą header'yje
  document.getElementById('user-name-display').textContent = username;

  // Inicializuojame pagrindinę aplikaciją (app.js funkcija)
  // Tai užkraus kategorijas ir mėgstamus receptus
  if (typeof initApp === 'function') {
    initApp();
  }
}

// ============================================================
// ATSIJUNGIMAS
// ============================================================
async function handleLogout() {
  try {
    // Kviečiame atsijungimo API – serveris ištrina cookie
    await API.logout();

    // Rodome auth sekciją, slepiame pagrindinį turinį ir navigaciją
    document.getElementById('auth-section').style.display = 'flex';
    document.getElementById('main-content').style.display = 'none';
    // Paslepiame navigaciją – ji neturi būti matoma prisijungimo puslapyje
    document.getElementById('main-nav').style.display = 'none';

    // Išvalome formos laukus
    document.getElementById('auth-username').value = '';
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-error').textContent = '';

    // Atnaujiname režimą į prisijungimą
    authMode = 'login';
    document.getElementById('auth-title').textContent = 'Prisijungimas';
    document.getElementById('auth-submit-btn').textContent = 'Prisijungti';
    // Atnaujiname persijungimo tekstą ir nuorodą apačioje
    document.getElementById('auth-switch-text').textContent = 'Neturite paskyros?';
    document.getElementById('auth-switch-link').textContent = 'Registruotis';

    // Parodome pranešimą
    showToast('Sėkmingai atsijungėte!', 'success');

  } catch (error) {
    showToast('Klaida atsijungiant: ' + error.message, 'error');
  }
}
