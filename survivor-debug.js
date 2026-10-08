/* ============================================================
   SURVIVOR-DEBUG.JS  —  WERSJA TYLKO DO PODGLĄDU / TESTÓW
   Ładowany PO survivor-game.js (patrz survivor-debug.html).
   Nie zmienia żadnego z oryginalnych plików gry.

   Co robi:
   - wszystkie 12 itemów odblokowane,
   - wszystkie 5 slotów affixów odblokowane i wylosowane,
   - WSZYSTKIE ulepszenia itemów już nałożone (w tym Wskrzeszenie),
   - 999 Zmianek (odnawiane przy każdym STARCIE),
   - wyłączone okno wyboru ulepszenia (i tak nie ma już czego ulepszać),
   - mały panel z przyciskami do testów (prawy dolny róg).
   ============================================================ */

const DEBUG_ZMIANKI = 999;

/* Jednorazowo na starcie strony: odblokuj i wylosuj wszystko. */
function debugInit() {
  const wszystkieId = Object.keys(itemy).map(Number);

  stan[1].odblokowaneItemy = new Set(wszystkieId);
  odblokowaneSloty = 5;

  wszystkieId.forEach(id => {
    losujItem(1, id, false, iloscOdblokowanychAffixowDlaItemu(id), false);
  });

  debugOdswiez();
}

/* Nakłada wszystkie ulepszenia + Zmianki + pełne PŻ. Wołane przy starcie
   strony i po każdym STARCIE (bo rozpocznijGre() czyści ulepszenia). */
function debugOdswiez() {
  ulepszoneItemySet = new Set();
  stan[1].ulepszeniaAffixy = {};

  Object.keys(itemy).map(Number).forEach(id => {
    const nazwaAffixu = MAPA_ULEPSZEN_ITEMOW[itemy[id].nazwa];
    const definicja = nazwaAffixu && znajdzAffix(nazwaAffixu);
    if (!definicja) return;

    stan[1].ulepszeniaAffixy[id] = {
      nazwa: definicja.nazwa,
      wartosc: definicja.max,
      suffix: definicja.suffix || "",
      pasywka: !!definicja.pasywka,
      opis: definicja.opis || "",
      ulepszenie: true
    };
    ulepszoneItemySet.add(id);
  });

  stan[1].zmianki = DEBUG_ZMIANKI;

  obliczStatystyki(1);
  utworzItemy(1);
  aktualizujZmianki();

  postac.maxHp = stan[1].staty.pz;
  postac.hp = postac.maxHp;
  aktualizujPasekPostaci();
}

/* STARTuj grę normalnie, a potem od razu nałóż ulepszenia (oryginał je czyści). */
const _oryginalnyRozpocznijGre = rozpocznijGre;
rozpocznijGre = function () {
  _oryginalnyRozpocznijGre();
  if (graTrwa) debugOdswiez();
};

/* Wszystko jest już ulepszone — okno wyboru nie miałoby czego oferować
   i nie dałoby się go zamknąć (soft-lock), więc je wyłączamy. */
sprawdzWywołanieUlepszenia = function () {};

/* ----------------- przyciski panelu debug ----------------- */

function debugJedenPz() {
  if (!graTrwa) return;
  postac.hp = 1;
  aktualizujPasekPostaci();
}

function debugResetWskrzeszenia() {
  wykorzystaneWskrzeszenie = false;
  wskrzeszenieDoCzasu = 0;
}

function debugFalaArcybossa() {
  if (!graTrwa || falaArcybossAktywna) return;
  nastepnyProgArcybossa = liczbaZabitych;
  sprawdzFaleArcybossa();
}

function debugDodajZmianki() {
  stan[1].zmianki += 100;
  aktualizujZmianki();
}

debugInit();
