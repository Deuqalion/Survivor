/* ============================================================
   SURVIVOR-GAME.JS
   Tryb "Survivor" — fale wrogów, walka, mechaniki ulepszeń.
   ============================================================ */

const MOB_PZ_START = 5000;
const MOB_PZ_WZROST_NA_ARCYBOSSA = 3125;
const MOB_PANCERZ_START = 30;
const MOB_PANCERZ_WZROST_NA_ARCYBOSSA = 35;
const MOB_PANCERZ_MAX = 100;
const MOB_DMG_MELEE_START = 7500;
const MOB_DMG_MELEE_WZROST_NA_ARCYBOSSA = 2250;
const MOB_DMG_MELEE_MAX = 14250;
const MOB_DMG_RANGED_START = 7500;
const MOB_DMG_RANGED_WZROST_NA_ARCYBOSSA = 6250;
const MOB_DMG_RANGED_MAX = 26250;

const BOSS_PZ_STALE = 100000;
const BOSS_PZ_WZROST_NA_ARCYBOSSA = 3125;
const BOSS_PANCERZ_STALE = 100;
const BOSS_PANCERZ_WZROST_NA_ARCYBOSSA = 20;
const BOSS_PANCERZ_MAX = 200;
const BOSS_DMG_STALE = 30000;
const BOSS_DMG_WZROST_NA_ARCYBOSSA = 2500;
const BOSS_DMG_MAX = 40000;

const ARCYBOSS_PZ = 120000;
const ARCYBOSS_PANCERZ = 250;
const ARCYBOSS_DMG_POCISK = 40000;
const ARCYBOSS_LICZBA_POCISKOW = 16;
const ARCYBOSS_CZAS_SALWY_MS = 2500;

const ARCYBOSS_PZ_PRZYROST = 40000;
const ARCYBOSS_PANCERZ_PRZYROST = 40;
const ARCYBOSS_PANCERZ_MAX = 410;
const ARCYBOSS_DMG_PRZYROST = 30000;
const ARCYBOSS_DMG_MAX = 130000;
const ARCYBOSS_POCISKI_PRZYROST = 2;
const ARCYBOSS_POCISKI_MAX = 24;

const UPG_BRON_OBR_UMIEJETNOSCI = 6;  // ulepszenie broni: +6% Obrażeń umiejętności
const ARCYBOSSY_DO_ULEPSZENIA = 4;
const PROG_FALI_ARCYBOSSA_PO_ULEPSZENIU = 200;
const MNOZNIK_CZASU_SPAWNU_PO_ULEPSZENIU = 0.5;
const ARCYBOSS_ROZRZUT_KATA_STOPNIE = 5;
const ARCYBOSS_MNOZNIK_HITBOX = 2;
const ARCYBOSS_MNOZNIK_PREDKOSCI = 0.5;

const SZANSA_BOSS = 0.05;
const SZANSA_MELEE = 0.8;
const SZANSA_GRUPKA_MELEE = 0.10;
const WIELKOSC_GRUPKI_MELEE = 5;

const CZAS_SPAWNU_MS = 1800;
const CZAS_ATAKU_GRACZA_MS = 1000;

const PREDKOSC_MELEE = 70;
const PREDKOSC_RANGED = 55;
const PREDKOSC_BOSS = 45;

const ZASIEG_MELEE = 34;
const ZASIEG_RANGED = 350;
const PREDKOSC_POCISKU = 320;
const PREDKOSC_STRZALY_GRACZA = 900;
const PROMIEN_TRAFIENIA_STRZALY = 14;
const WZROST_DMG_NA_PRZEBICIE = 0.15;
const COOLDOWN_ATAKU_WROGA_MS = 1100;
const BAZOWA_PREDKOSC_GRACZA = 180;
const CZAS_OGLUSZENIA_MS = 1800;
const PROMIEN_OGNIA = 110;
const SZANSA_PROCKA_STRZALY = 33;
const CZAS_TRWANIA_WYBUCHU_MS = 350;

/* Umiejętności pasywne w walce (poziomy i odblokowanie: survivor-umiejetnosci.js) */
const KAT_POTROJNEJ_STRZALY = 25 * Math.PI / 180;   // boczne strzały: 25° od głównej
const OPOZNIENIE_MAGICZNEJ_MS = 130;                 // ułamek sekundy po ataku, z którego leci Magiczna strzała
const PROMIEN_WYBUCHU_MAGICZNEJ = PROMIEN_OGNIA * 1.6; // 1,6x zasięg Ognistej strzały
const PROMIEN_WYBUCHU_MAGICZNEJ_MAX = PROMIEN_OGNIA * 2.2; // 2,2x po maksymalnym poziomie umiejętności
const MAX_POZIOM_UMIEJETNOSCI = 4;
const MNOZNIK_EFEKTOW_POBOCZNYCH = 0.8; // Potrójna (max): efekty z bocznych strzał w 80% skuteczności
// Elektryczna (max): każde ogniwo ma 25% szansy na +35% obrażeń ("krytyk" magiczny)
const SZANSA_KRYTA_ELEKTRYCZNEJ = 25;
const MNOZNIK_KRYTA_ELEKTRYCZNEJ = 1.35;
// Ognista (max): wrogowie trafieni wybuchem płoną — 10% maks. PŻ w 3s, tik co 0,5s
const PODPALENIE_PROCENT_HP = 0.10;
const PODPALENIE_CZAS_MS = 3000;
const PODPALENIE_CZAS_TIKU_MS = 500;
const PODPALENIE_LICZBA_TIKOW = PODPALENIE_CZAS_MS / PODPALENIE_CZAS_TIKU_MS;
const KOLOR_PODPALENIE = "#ff8c1a";
const KOLOR_WYBUCHU_MAGICZNEJ = "170, 70, 255";      // fiolet
const KOLOR_WYBUCHU_OGNIA = "255, 140, 26";
const KOLOR_LINII_ELEKTRYCZNEJ = "255, 215, 0";      // złoty
const KOLOR_LINII_ZWYKLEJ = "220, 255, 220";

const KOLOR_DOMYSLNY_WROGA = "#ffffff";
const KOLOR_TRUCIZNA = "#4dff6a";
const KOLOR_ARENY = "#0a1330";
const KOLOR_OMDLENIE = "#b347ff";
const KOLOR_KRWAWIENIE = "#ff3b3b";

function bonusObrazenZZabojstw() {
  return liczbaZabitych;
}

const DMG_STYL_ZWYKLY = { kolor: "#ffffff", rozmiar: 14 };
const DMG_STYL_PRZESZYWKA = { kolor: "#c9c9c9", rozmiar: 17 };
const DMG_STYL_KRYT = { kolor: "#ffd700", rozmiar: 20 };
const DMG_STYL_KRYT_PRZESZYWKA = { kolor: "#ff3b3b", rozmiar: 25 };
const DMG_STYL_KRWAWIENIE = { kolor: "#ff5555", rozmiar: 14 };
const DMG_STYL_MAGIA = { kolor: "#6ec8ff", rozmiar: 16 };
const DMG_STYL_MAGIA_KRYT = { kolor: "#6ec8ff", rozmiar: 22 };   // Elektryczna (max): trafienie "krytyczne"
const DMG_STYL_PODPALENIE = { kolor: KOLOR_PODPALENIE, rozmiar: 14 }; // jak krwawienie, pomarańczowe

const canvas = document.getElementById("gra-canvas");
const ctx = canvas.getContext("2d");

const postac = { x: 0, y: 0, hp: 0, maxHp: 0 };

let wrogowie = [];
let pociski = [];
let pociskiGracza = [];
let efekty = [];
let nastepneIdWroga = 1;

let graTrwa = false;
let graWToku = false; // true od START do śmierci — także podczas pauzy / wiki / okna ulepszenia
let ostatniCzas = 0;
let czasDoSpawnu = 0;
let blyskObrazenMs = 0; // pozostały czas czerwonego błysku brzegów areny po otrzymaniu obrażeń
const CZAS_BLYSKU_OBRAZEN_MS = 350;
let czasGryMs = 0; // czas bieżącej gry (liczy się tylko, gdy pętla gry faktycznie działa)
let czasDoAtakuGracza = 0;
let licznikRegeneracjiMs = 0;

let liczbaZabitych = 0;
let bossAktywny = false;
let kolejnoscOdblokowaniaItemow = {};
let falaArcybossAktywna = false;
let nastepnyProgArcybossa = PROG_FALI_ARCYBOSSA;
let arcybossyPokonane = 0;
let numerFaliArcybossa = 0; // którą falę Arcybossa właśnie spawnujemy (1, 2, 3, ...)
let wykorzystaneWskrzeszenie = false;
let wskrzeszenieDoCzasu = 0; // czasWirt() do kiedy trwa pulsowanie areny

/* Zegar gry: idzie tylko gdy pętla działa i uwzględnia prędkość gry (x1 / x1,5 / x2).
   Wszystkie czasy w logice (ogłuszenie, krwawienie, cooldowny wrogów, wskrzeszenie)
   liczone są na nim, dzięki czemu przyspieszają razem z grą i stoją na pauzie. */
let zegarGryMs = 0;
let zaplanowaneAkcje = [];      // akcje opóźnione o ułamek sekundy (czas liczony zegarem gry)
let licznikAtakowMagicznej = 0; // ile ataków minęło od ostatniej Magicznej strzały
let mnoznikPredkosciGry = 1;
const PREDKOSCI_GRY = [1, 1.5, 2];
function czasWirt() { return zegarGryMs; }

/* ============================================================
   FUNKCJA OBLICZANIA STATYSTYK GRACZA (ZABEZPIECZONA PRZED NaN)
   ============================================================ */

function obliczStatystyki(gracz) {
  let pz = 15000;
  let podstawoweObrażenia = 3000;
  let obrazeniaUmiejetnosci = 0;
  let kryt = 0;
  let przeszywka = 0;
  let omdlenie = 0;
  let blok = 0;
  let otrucie = 0;
  let krwawienie = 0;
  let dodatkowePz = 0;
  let wartoscAtaku = 0;
  let pancerz = 5;
  let kradziezZycia = 0;
  let predkoscAtaku = 0;
  let predkoscRuchuBonus = 0;
  let regeneracjaPzSek = 0;
  let wskrzeszenieDostepne = false;
  let obrazeniaObszaroweDostepne = false;

  let wzmocnieniePz = 0;
  let wzmocnieniePancerza = 0;
  let wzmocnienieTrucizny = 0;
  let wzmocnienieKrwawienia = 0;
  let wzmocnienieKrytyczne = 0;

  let diamentowaStrzala = 0;
  let ognistaStrzala = 0;
  let elektrycznaStrzala = 0;

  const wylosowaneItemy = stan[gracz].wylosowane;
  const ulepszeniaAffixy = stan[gracz].ulepszeniaAffixy || {};

  // Połącz zwykłe wylosowane affixy z trwałymi affixami ulepszeń, żeby
  // oba źródła liczyły się do tych samych statystyk.
  // Trzecie źródło: bonusy z kart "WYBIERZ BONUS" (po ulepszeniu wszystkich itemów).
  const bonusyAffixy = stan[gracz].bonusyAffixy || [];

  const wszystkieListyAffixow = Object.values(wylosowaneItemy)
    .concat(Object.values(ulepszeniaAffixy).map(affix => [affix]))
    .concat([bonusyAffixy]);

  wszystkieListyAffixow.forEach(affixyList => {
    if (!affixyList) return;

    affixyList.forEach(affix => {
      const val = Number(affix.wartosc) || 0;
      const nazwa = affix.nazwa;

      if (nazwa === "Podstawowe PŻ") pz = val;
      else if (nazwa === "Podstawowe obrażenia") podstawoweObrażenia = val;
      else if (nazwa === "Obrażenia umiejętności" || nazwa === "Obrażenia umiejętności: +10%") obrazeniaUmiejetnosci += val;
      else if (nazwa === "Szansa na kryta" || nazwa === "Szansa na kryta: 5%") kryt += val;
      else if (nazwa === "Szansa na przeszywkę" || nazwa === "Szansa na przeszywkę: 5%") przeszywka += val;
      else if (nazwa === "Szansa na omdlenie" || nazwa === "Szansa na omdlenie: 5%") omdlenie += val;
      else if (nazwa === "Szansa na blok") blok += val;
      else if (nazwa === "Szansa na otrucie" || nazwa === "Szansa na otrucie: 5%") otrucie += val;
      else if (nazwa === "Szansa na krwawienie") krwawienie += val;
      else if (nazwa === "Dodatkowe PŻ" || nazwa === "Dodatkowe PŻ: 4000") dodatkowePz += val;
      else if (nazwa === "Wartość ataku" || nazwa === "Wartość ataku: +500") wartoscAtaku += val;
      else if (nazwa === "Pancerz" || nazwa === "Pancerz: 35") pancerz += val;
      else if (nazwa === "Kradzież życia" || nazwa === "Kradzież życia: 5%") kradziezZycia += val;
      else if (nazwa === "Ulepszenie broni") { obrazeniaUmiejetnosci += UPG_BRON_OBR_UMIEJETNOSCI; }
      else if (nazwa === "Prędkość ataku" || nazwa === "Prędkość ataku: +35%") predkoscAtaku += val;
      else if (nazwa === "Prędkość ruchu: +15%") predkoscRuchuBonus += val;
      else if (nazwa === "Regeneracja PŻ 5%/sek") regeneracjaPzSek += val;
      else if (nazwa === "Wskrzeszenie") wskrzeszenieDostepne = true;
      else if (nazwa === "Obrażenia obszarowe") obrazeniaObszaroweDostepne = true;
      else if (nazwa === "Zwykła strzała") wartoscAtaku += val; // "Dodaje {x} Wartości Ataku."

      else if (nazwa === "Wzmocnienie PŻ") wzmocnieniePz += val;
      else if (nazwa === "Wzmocnienie Pancerza") wzmocnieniePancerza += val;
      else if (nazwa === "Wzmocnienie trucizny") wzmocnienieTrucizny += val;
      else if (nazwa === "Wzmocnienie krwawienia") wzmocnienieKrwawienia += val;
      else if (nazwa === "Wzmocnienie krytyczne") wzmocnienieKrytyczne += val;

      else if (nazwa === "Diamentowa strzała") diamentowaStrzala += val;
      else if (nazwa === "Ognista strzała") ognistaStrzala += val;
      else if (nazwa === "Elektryczna strzała") elektrycznaStrzala += val;
    });
  });

  // Bonusy za maksymalny poziom umiejętności pasywnych (gracz 1)
  if (gracz === 1 && typeof poziomUmiejetnosci === "function") {
    if (poziomUmiejetnosci("wampiryczna") >= MAX_POZIOM_UMIEJETNOSCI) kradziezZycia += 5;
  }

  const finalnePz = Math.round((pz + dodatkowePz) * (1 + wzmocnieniePz / 100));
  const finalnyPancerz = Math.round(pancerz * (1 + wzmocnieniePancerza / 100));

  stan[gracz].staty = {
    pz: isNaN(finalnePz) ? 15000 : finalnePz,
    podstawoweObrażenia: isNaN(podstawoweObrażenia) ? 3000 : podstawoweObrażenia,
    wartoscAtaku: isNaN(wartoscAtaku) ? 0 : wartoscAtaku,
    bazoweObrazenia: (isNaN(podstawoweObrażenia) ? 3000 : podstawoweObrażenia) + (isNaN(wartoscAtaku) ? 0 : wartoscAtaku),
    obrazeniaUmiejetnosci: isNaN(obrazeniaUmiejetnosci) ? 0 : obrazeniaUmiejetnosci,
    kryt: isNaN(kryt) ? 0 : kryt,
    przeszywka: isNaN(przeszywka) ? 0 : przeszywka,
    omdlenie: isNaN(omdlenie) ? 0 : omdlenie,
    blok: isNaN(blok) ? 0 : blok,
    otrucie: isNaN(otrucie) ? 0 : otrucie,
    krwawienie: isNaN(krwawienie) ? 0 : krwawienie,
    pancerz: isNaN(finalnyPancerz) ? 5 : finalnyPancerz,
    kradziezZycia: isNaN(kradziezZycia) ? 0 : kradziezZycia,
    predkoscAtaku: isNaN(predkoscAtaku) ? 0 : predkoscAtaku,
    predkoscRuchuBonus: isNaN(predkoscRuchuBonus) ? 0 : predkoscRuchuBonus,
    regeneracjaPzSek: isNaN(regeneracjaPzSek) ? 0 : regeneracjaPzSek,
    wskrzeszenieDostepne: !!wskrzeszenieDostepne,
    obrazeniaObszarowe: !!obrazeniaObszaroweDostepne,
    // Wartości procentowe wyświetlane w panelu statystyk (survivor-stats.js).
    // PŻ i pancerz są już przeliczone w pz/pancerz powyżej — to tylko podgląd.
    wzmocnieniePz: isNaN(wzmocnieniePz) ? 0 : wzmocnieniePz,
    wzmocnieniePancerza: isNaN(wzmocnieniePancerza) ? 0 : wzmocnieniePancerza,
    obrazeniaTrucizny: isNaN(wzmocnienieTrucizny) ? 0 : wzmocnienieTrucizny,
    obrazeniaKrwawienia: isNaN(wzmocnienieKrwawienia) ? 0 : wzmocnienieKrwawienia,
    obrazeniaKrytyczne: isNaN(wzmocnienieKrytyczne) ? 0 : wzmocnienieKrytyczne,
    diamentowaStrzala: isNaN(diamentowaStrzala) ? 0 : diamentowaStrzala,
    ognistaStrzala: isNaN(ognistaStrzala) ? 0 : ognistaStrzala,
    elektrycznaStrzala: isNaN(elektrycznaStrzala) ? 0 : elektrycznaStrzala
  };

  if (gracz === 1 && typeof aktualizujHudPostaci === "function") {
    aktualizujHudPostaci(1);
  }
}

/* ============================================================
   NOWY SYSTEM ULEPSZEŃ
   ============================================================ */

const MAPA_ULEPSZEN_ITEMOW = {
  "bron": "Ulepszenie broni",
  "buty": "Prędkość ruchu: +15%",
  "helm": "Regeneracja PŻ 5%/sek",
  "zbroja": "Wskrzeszenie",
  "naramienniki": "Dodatkowe PŻ: 4000",
  "rekawice": "Wartość ataku: +500",
  "spodnie": "Pancerz: 35",
  "kolczyki": "Szansa na kryta: 5%",
  "naszyjnik": "Szansa na przeszywkę: 5%",
  "bransoleta": "Szansa na otrucie: 5%",
  "pierscien": "Szansa na omdlenie: 5%",
  "strzala": "Prędkość ataku: +35%"
};

let oczekiwanieNaUlepszenieItemu = false;
let ulepszoneItemySet = new Set();

function sprawdzWywołanieUlepszenia() {
  if (arcybossyPokonane >= 4 && !oczekiwanieNaUlepszenieItemu) {
    otworzOknoUlepszeniaItemu();
  }
}

/* Czy został choć jeden odblokowany item, który można jeszcze ulepszyć? */
function sąItemyDoUlepszenia() {
  return Object.entries(itemy).some(([itemId, item]) => {
    const id = Number(itemId);
    return stan[1].odblokowaneItemy.has(id) && !ulepszoneItemySet.has(id) && !!MAPA_ULEPSZEN_ITEMOW[item.nazwa];
  });
}

function otworzOknoUlepszeniaItemu() {
  // Wszystko już ulepszone — zamiast pustego, niezamykalnego okna dajemy wybór bonusu.
  if (!sąItemyDoUlepszenia()) {
    otworzOknoBonusu();
    return;
  }

  oczekiwanieNaUlepszenieItemu = true;
  graTrwa = false;

  let overlay = document.getElementById("wybor-ulepszenia-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "wybor-ulepszenia-overlay";
    overlay.innerHTML = `
      <div class="ulepszenie-uklad">
        <div class="ulepszenie-tytul">ULEPSZ PRZEDMIOT</div>
        <div class="ulepszenie-okno-kontener">
          <div id="ulepszenie-grid"></div>
        </div>
      </div>
    `;
    document.querySelector(".survivor-canvas-wrap").appendChild(overlay);
  }

  overlay.classList.add("visible");
  wypelnijSiatkeUlepszen();
}

function wypelnijSiatkeUlepszen() {
  const grid = document.getElementById("ulepszenie-grid");
  if (!grid) return;
  grid.innerHTML = "";

  Object.entries(itemy).forEach(([itemId, item]) => {
    const id = Number(itemId);
    const czyUlepszony = ulepszoneItemySet.has(id);
    const odblokowany = stan[1].odblokowaneItemy.has(id);

    if (!odblokowany) return;

    const nazwaAffixuUlepszenia = MAPA_ULEPSZEN_ITEMOW[item.nazwa];

    const el = document.createElement("div");
    el.className = `item ${czyUlepszony ? "zablokowany" : ""}`;
    el.style.gridColumn = item.pozycja.kolumna;
    el.style.gridRow = item.pozycja.wiersz;
    const defUlepszenia = nazwaAffixuUlepszenia ? znajdzAffix(nazwaAffixuUlepszenia) : null;
    el.setAttribute("data-tooltip-ulepszenia", (defUlepszenia && defUlepszenia.tekstTooltip) || nazwaAffixuUlepszenia || "Ulepszenie");
    
    el.innerHTML = `
      <img src="${item.obraz}" alt="${item.nazwa}">
    `;

    if (!czyUlepszony) {
      el.addEventListener("click", () => wykonajUlepszenieItemu(id));
    }
    grid.appendChild(el);
  });
}

/* Podmienia pasywkę strzały (Zwykła <-> Elektryczna) w już wylosowanej liście
   affixów. Jeśli strzała nie ma jeszcze affixów, nic nie robi — pierwszy rzut
   sam wybierze właściwą pasywkę (nazwaAffixuZUlepszenia w generator.js). */
function zamienPasywkeStrzaly(nazwaNowa) {
  const lista = stan[1].wylosowane[ITEM_STRZALA];
  if (!lista) return;

  const indeks = lista.findIndex(a => a.nazwa === "Zwykła strzała" || a.nazwa === "Elektryczna strzała");
  if (indeks < 0 || lista[indeks].nazwa === nazwaNowa) return;

  const definicja = znajdzAffix(nazwaNowa);
  if (!definicja) return;

  const pierwotny = !!stan[1].pierwotne[ITEM_STRZALA];
  lista[indeks] = {
    nazwa: definicja.nazwa,
    wartosc: pierwotny ? definicja.max : losujLiczbe(definicja.min, definicja.max),
    suffix: definicja.suffix || "",
    pasywka: !!definicja.pasywka,
    opis: definicja.opis || "",
    ulepszenie: false
  };
}

function wykonajUlepszenieItemu(itemId) {
  if (ulepszoneItemySet.has(itemId)) return;

  const item = itemy[itemId];
  const nazwaAffixuUlepszenia = MAPA_ULEPSZEN_ITEMOW[item.nazwa];
  if (!nazwaAffixuUlepszenia) return;

  const definicja = znajdzAffix(nazwaAffixuUlepszenia);
  if (!definicja) return;

  // Przechowywany OSOBNO od stan[1].wylosowane, żeby reroll (LOSUJ) tego
  // itemu nigdy nie skasował affixu z ulepszenia.
  stan[1].ulepszeniaAffixy[itemId] = {
    nazwa: definicja.nazwa,
    wartosc: definicja.max,
    suffix: definicja.suffix || "",
    pasywka: !!definicja.pasywka,
    opis: definicja.opis || "",
    tekst: definicja.tekstTooltip || "",
    ulepszenie: true
  };

  ulepszoneItemySet.add(itemId);

  obliczStatystyki(1);
  utworzItemy(1);

  document.getElementById("wybor-ulepszenia-overlay").classList.remove("visible");
  oczekiwanieNaUlepszenieItemu = false;
  graTrwa = true;
  // Tak jak przy przelaczPauze() — bez tego pierwsza klatka po zamknięciu
  // okna liczy dtMs jako cały czas spędzony na wyborze ulepszenia, więc
  // wrogowie/pociski skaczą o kilka sekund ruchu w jednej klatce.
  ostatniCzas = 0;
  requestAnimationFrame(petlaGry);
}

/* ============================================================
   BONUS PO ULEPSZENIU WSZYSTKICH ITEMÓW — wybór 1 z 3 kart
   Wartości dodają się na stałe (do końca gry) do statystyk.
   ============================================================ */

const BONUSY_PO_ULEPSZENIACH = [
  [{ nazwa: "Wartość ataku", wartosc: 100 }],
  [{ nazwa: "Wartość ataku", wartosc: 50 }, { nazwa: "Dodatkowe PŻ", wartosc: 200 }],
  [{ nazwa: "Dodatkowe PŻ", wartosc: 400 }]
];

function otworzOknoBonusu() {
  oczekiwanieNaUlepszenieItemu = true; // ta sama blokada co przy ulepszaniu: pauza/wiki/umiejętności nie wznowią gry
  graTrwa = false;

  let overlay = document.getElementById("wybor-bonusu-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "wybor-bonusu-overlay";
    overlay.innerHTML = `
      <div class="ulepszenie-uklad">
        <div class="ulepszenie-tytul">WYBIERZ BONUS</div>
        <div id="bonus-karty"></div>
      </div>
    `;
    document.querySelector(".survivor-canvas-wrap").appendChild(overlay);
  }

  const kontener = document.getElementById("bonus-karty");
  kontener.innerHTML = "";

  BONUSY_PO_ULEPSZENIACH.forEach(affixyKarty => {
    const karta = document.createElement("div");
    karta.className = "bonus-karta";
    karta.innerHTML = affixyKarty.map(a => `
      <div class="bonus-affix">
        <div class="bonus-affix-nazwa">${a.nazwa}</div>
        <div class="bonus-affix-wartosc">${a.wartosc}</div>
      </div>
    `).join("");
    karta.addEventListener("click", () => wybierzBonus(affixyKarty));
    kontener.appendChild(karta);
  });

  overlay.classList.add("visible");
}

function wybierzBonus(affixyKarty) {
  if (!stan[1].bonusyAffixy) stan[1].bonusyAffixy = [];
  affixyKarty.forEach(a => stan[1].bonusyAffixy.push({ nazwa: a.nazwa, wartosc: a.wartosc, suffix: "" }));

  obliczStatystyki(1);

  document.getElementById("wybor-bonusu-overlay").classList.remove("visible");
  oczekiwanieNaUlepszenieItemu = false;
  graTrwa = true;
  ostatniCzas = 0; // jak przy zamknięciu okna ulepszenia — bez skoku czasu w pierwszej klatce
  requestAnimationFrame(petlaGry);
}

/* ============================================================ */

function pzZwyklegoMoba() {
  return MOB_PZ_START + arcybossyPokonane * MOB_PZ_WZROST_NA_ARCYBOSSA;
}

function pancerzZwyklegoMoba() {
  return Math.min(MOB_PANCERZ_MAX, MOB_PANCERZ_START + arcybossyPokonane * MOB_PANCERZ_WZROST_NA_ARCYBOSSA);
}

function dmgMeleeZwyklegoMoba() {
  return Math.min(MOB_DMG_MELEE_MAX, MOB_DMG_MELEE_START + arcybossyPokonane * MOB_DMG_MELEE_WZROST_NA_ARCYBOSSA);
}

function dmgRangedZwyklegoMoba() {
  return Math.min(MOB_DMG_RANGED_MAX, MOB_DMG_RANGED_START + arcybossyPokonane * MOB_DMG_RANGED_WZROST_NA_ARCYBOSSA);
}

function pzBossa() {
  return BOSS_PZ_STALE + arcybossyPokonane * BOSS_PZ_WZROST_NA_ARCYBOSSA;
}

function pancerzBossa() {
  return Math.min(BOSS_PANCERZ_MAX, BOSS_PANCERZ_STALE + arcybossyPokonane * BOSS_PANCERZ_WZROST_NA_ARCYBOSSA);
}

function dmgBossa() {
  return Math.min(BOSS_DMG_MAX, BOSS_DMG_STALE + arcybossyPokonane * BOSS_DMG_WZROST_NA_ARCYBOSSA);
}

function maksAffixowItemu(itemId) {
  const nazwa = itemy[itemId].nazwa;
  if (nazwa === "strzala") return 3;
  if (nazwa === "strzaly") return 4;
  return 5;
}

let odblokowaneSloty = 1;

function obliczSlotyZZabojstw() {
  let n = 1;
  PROGI_ODBLOKOWANIA_AFFIXOW.forEach(prog => { if (liczbaZabitych >= prog) n++; });
  return n;
}

function iloscOdblokowanychAffixow() {
  return Math.max(odblokowaneSloty, obliczSlotyZZabojstw());
}

function iloscOdblokowanychAffixowDlaItemu(itemId) {
  return Math.min(maksAffixowItemu(itemId), iloscOdblokowanychAffixow());
}

function zbudujKolejnoscOdblokowaniaItemow() {
  const bizuteria = [...ITEMY_BIZUTERIA];
  const mapa = {};
  PROGI_ODBLOKOWANIA_ITEMOW.forEach((prog, index) => {
    mapa[prog] = (index < bizuteria.length) ? bizuteria[index] : ITEM_STRZALA;
  });
  return mapa;
}

function opisWymoguOdblokowania(itemId) {
  const prog = Object.keys(kolejnoscOdblokowaniaItemow).find(
    p => kolejnoscOdblokowaniaItemow[p] === itemId
  );
  return prog ? `${prog} zabójstw` : "?";
}

function przebudujPlansze() {
  utworzItemy(1);
}

function odblokujKolejneItemy() {
  let cokolwiekOdblokowano = false;
  PROGI_ODBLOKOWANIA_ITEMOW.forEach(prog => {
    if (liczbaZabitych < prog) return;
    const itemId = kolejnoscOdblokowaniaItemow[prog];
    if (itemId === undefined) return;
    if (stan[1].odblokowaneItemy.has(itemId)) return;

    stan[1].odblokowaneItemy.add(itemId);
    cokolwiekOdblokowano = true;
    log(`🔓 Odblokowano nowy ekwipunek: ${itemy[itemId].nazwa}!`, "log-zwyciestwo");
    pokazOgloszenie("Nowy item!", "ogloszenie-item");
  });
  if (cokolwiekOdblokowano) przebudujPlansze();
}

function odblokujKolejneAffixy() {
  const zZabojstw = obliczSlotyZZabojstw();
  if (zZabojstw > odblokowaneSloty) {
    odblokowaneSloty = zZabojstw;
    pokazOgloszenie("Nowy slot!", "ogloszenie-slot");
  }

  const docelowo = iloscOdblokowanychAffixow();
  stan[1].odblokowaneItemy.forEach(itemId => {
    const obecne = stan[1].wylosowane[itemId];
    if (!obecne) return;
    const cel = Math.min(maksAffixowItemu(itemId), docelowo);

    while (stan[1].wylosowane[itemId].length < cel) {
      const dodano = dodajJedenNowyAffix(1, itemId);
      if (!dodano) break;
    }
  });
  obliczStatystyki(1);
}

function interwalFaliArcybossa() {
  return arcybossyPokonane >= ARCYBOSSY_DO_ULEPSZENIA
    ? PROG_FALI_ARCYBOSSA_PO_ULEPSZENIU
    : PROG_FALI_ARCYBOSSA;
}

/* Najwięcej Arcybossów pokonanych w jednej grze od załadowania strony.
   Czas spawnu zostaje na tym poziomie po śmierci/restarcie (jak odblokowane
   itemy) — resetuje się dopiero po odświeżeniu strony. */
let rekordArcybossowDlaSpawnu = 0;

function czasSpawnuMs() {
  // Do 3 pokonanych Arcybossów: stałe 1800 ms. Od 4. działa wzór
  // 1800 / (1 + sqrt(x / 4)), gdzie x = liczba pokonanych Arcybossów
  // (x=4 -> 900 ms, x=5 -> ~849,85 ms, ...).
  const x = Math.max(arcybossyPokonane, rekordArcybossowDlaSpawnu);
  return x >= ARCYBOSSY_DO_ULEPSZENIA
    ? CZAS_SPAWNU_MS / (1 + Math.sqrt(x / 4))
    : CZAS_SPAWNU_MS;
}

/*
  Fale Arcybossa pojawiają się przy 100, 200, 300, 400, a po 4. pokonanym
  Arcybossie już co 200: 600, 800, 1000 ... Dlatego przy 1000 zabitych jest
  dopiero 7. fala. Żeby mechanika wielu/odpornych Arcybossów zaczynała się
  od 1000 zabitych, 7. falę liczymy jako "10." (przesunięcie o 3).
  Zmień tę liczbę, jeśli zmienisz progi fal.
*/
const PRZESUNIECIE_NUMERACJI_FAL = 3;

function numerFaliWgTabeli(numerFali) {
  return numerFali + PRZESUNIECIE_NUMERACJI_FAL;
}

/*
  Ile ARCYBOSSÓW pojawia się w danej fali (numer wg tabeli, liczony od 1):
  fale 1-10 -> 1, fale 11-20 -> 2, fale 21-30 -> 3, fale 31-40 -> 4, ...
  (bez końca, co 10 fal o jednego więcej).
*/
function liczbaArcybossowWFali(numerFali) {
  return Math.floor((numerFali - 1) / 10) + 1;
}

/* Co 10. fala (10, 20, 30, ...) — WSZYSTKIE Arcybossy w niej mają redukcję obrażeń. */
function falaArcybossowOdporna(numerFali) {
  return numerFali % 10 === 0;
}

/*
  Punkty spawnu n Arcybossów rozłożone równomiernie wokół areny, każdy na
  brzegu: 2 -> przeciwległe strony, 3 -> co 120°, 4 -> co 90° itd.
  Punkt startowy (kąt) jest losowy, reszta wynika z podziału okręgu.
*/
function punktySpawnuArcybossow(n) {
  const margines = 50;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const polowaW = cx + margines;
  const polowaH = cy + margines;
  const kat0 = Math.random() * Math.PI * 2;

  const punkty = [];
  for (let i = 0; i < n; i++) {
    const kat = kat0 + (Math.PI * 2 / n) * i;
    const dx = Math.cos(kat);
    const dy = Math.sin(kat);
    // promień od środka areny do prostokąta (arena + margines)
    const t = Math.min(
      Math.abs(dx) > 1e-9 ? polowaW / Math.abs(dx) : Infinity,
      Math.abs(dy) > 1e-9 ? polowaH / Math.abs(dy) : Infinity
    );
    punkty.push({ x: cx + dx * t, y: cy + dy * t });
  }
  return punkty;
}

function sprawdzFaleArcybossa() {
  if (falaArcybossAktywna) return;
  if (liczbaZabitych < nastepnyProgArcybossa) return;

  falaArcybossAktywna = true;
  nastepnyProgArcybossa += interwalFaliArcybossa();
  numerFaliArcybossa += 1;

  const numerWgTabeli = numerFaliWgTabeli(numerFaliArcybossa);
  const liczbaArcybossow = liczbaArcybossowWFali(numerWgTabeli);
  const wszystkieOdporne = falaArcybossowOdporna(numerWgTabeli);

  log(liczbaArcybossow > 1
    ? `💀 ${liczbaArcybossow} ARCYBOSSY i ich świta nadciągają!`
    : "💀 ARCYBOSS i jego świta nadciągają!", "log-zwyciestwo");
  if (wszystkieOdporne) log("🛡️ Arcybossy tej fali są odporne na obrażenia!", "log-zwyciestwo");

  punktySpawnuArcybossow(liczbaArcybossow).forEach(punkt => {
    stworzArcybossa(punkt, wszystkieOdporne);
  });
  for (let i = 0; i < 3; i++) {
    const boss = stworzZwyklegoWroga(losujPunktSpawnu(), false, true);
    boss.falowy = true;
  }
}

function odswiezProgresje() {
  odblokujKolejneItemy();
  odblokujKolejneAffixy();
  sprawdzFaleArcybossa();
}

function aktualizujZmianki() {
  const el = document.getElementById("zmianki-licznik");
  if (el) el.textContent = stan[1].zmianki;
}

function pokazBrakZmianek() {
  log("❌ Brak Zmianek — pokonaj wrogów, by je zdobyć.", "log-info");
  const box = document.getElementById("zmianki-wrap");
  if (!box) return;
  box.classList.remove("brak");
  void box.offsetWidth;
  box.classList.add("brak");
}

const CZAS_OGLOSZENIA_MS = 1000;
const kolejkaOgloszen = [];
let ogloszenieTrwa = false;

function pokazOgloszenie(tekst, klasa) {
  kolejkaOgloszen.push({ tekst, klasa });
  if (!ogloszenieTrwa) pokazNastepneOgloszenie();
}

function pokazNastepneOgloszenie() {
  const wrap = document.querySelector(".survivor-canvas-wrap");
  const o = kolejkaOgloszen.shift();

  if (!o || !wrap) {
    ogloszenieTrwa = false;
    return;
  }

  ogloszenieTrwa = true;
  const el = document.createElement("div");
  el.className = `ogloszenie ${o.klasa}`;
  el.textContent = o.tekst;
  wrap.appendChild(el);

  setTimeout(() => {
    el.remove();
    pokazNastepneOgloszenie();
  }, CZAS_OGLOSZENIA_MS);
}

const klawisze = { w: false, a: false, s: false, d: false };

function ustawKlawisz(kod, wcisniety) {
  switch (kod) {
    case "KeyW": klawisze.w = wcisniety; break;
    case "KeyA": klawisze.a = wcisniety; break;
    case "KeyS": klawisze.s = wcisniety; break;
    case "KeyD": klawisze.d = wcisniety; break;
  }
}

window.addEventListener("keydown", event => ustawKlawisz(event.code, true));
window.addEventListener("keyup", event => {
  ustawKlawisz(event.code, false);
  if (event.code === "Space") event.preventDefault();
});

// SPACJA = pauza / wznów (nie działa przy otwartej wiki ani gdy gra nie wystartowała)
window.addEventListener("keydown", event => {
  if (event.code !== "Space") return;
  event.preventDefault();
  if (event.repeat) return;
  if (wikiOtwarta) return;
  if (typeof umiejetnosciOtwarte !== "undefined" && umiejetnosciOtwarte) return;
  przelaczPauze();
});

function aktualizujRuchGracza(dtMs) {
  let dx = 0;
  let dy = 0;

  if (klawisze.w) dy -= 1;
  if (klawisze.s) dy += 1;
  if (klawisze.a) dx -= 1;
  if (klawisze.d) dx += 1;

  if (dx === 0 && dy === 0) return;

  const dlugosc = Math.hypot(dx, dy);
  dx /= dlugosc;
  dy /= dlugosc;

  const staty1 = stan[1].staty;
  const bonusRuchu = staty1 ? (staty1.predkoscRuchuBonus || 0) : 0;
  const aktualnaPredkoscGracza = BAZOWA_PREDKOSC_GRACZA * (1 + bonusRuchu / 100);

  postac.x += dx * aktualnaPredkoscGracza * (dtMs / 1000);
  postac.y += dy * aktualnaPredkoscGracza * (dtMs / 1000);

  const promienGracza = 20;
  postac.x = Math.max(promienGracza, Math.min(canvas.width - promienGracza, postac.x));
  postac.y = Math.max(promienGracza, Math.min(canvas.height - promienGracza, postac.y));
}

const logGry = document.getElementById("log-gry");
if (logGry) logGry.style.display = "none";
const btnStart = document.getElementById("btn-start-gry");
const btnPauza = document.getElementById("btn-pauza-gry");
const imgPauza = document.getElementById("img-pauza");

function ustawPrzyciski(tryb) {
  btnStart.disabled = tryb !== "przed";
  btnPauza.disabled = tryb === "przed";

  const wznow = tryb === "pauza";
  imgPauza.src = wznow ? "WZNOW.png" : "PAUZA.png";
  imgPauza.alt = wznow ? "WZNÓW" : "PAUZA";

  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
}

/* Przycisk prędkości gry: x1 -> x1,5 -> x2 -> x1 */
function przelaczPredkosc() {
  const i = PREDKOSCI_GRY.indexOf(mnoznikPredkosciGry);
  mnoznikPredkosciGry = PREDKOSCI_GRY[(i + 1) % PREDKOSCI_GRY.length];

  const el = document.getElementById("predkosc-tekst");
  if (el) el.textContent = "x" + String(mnoznikPredkosciGry).replace(".", ","); 

  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
}

const infoEl = document.getElementById("survivor-info");

function aktualizujHudPostaci(graczId) {
  if (graczId !== 1) return;
  if (typeof renderujStatyGracza === "function") renderujStatyGracza();

  const staty = stan[1].staty;
  if (!staty) return;

  postac.maxHp = staty.pz;
  if (!graWToku) postac.hp = postac.maxHp;                 // przed grą / po śmierci: pełne PŻ
  else postac.hp = Math.min(postac.hp, postac.maxHp);      // w trakcie gry (też na pauzie): zachowaj aktualne PŻ
  aktualizujPasekPostaci();
}

function aktualizujPasekPostaci() {
  const fill = document.getElementById("hp-fill-gracz");
  const tekst = document.getElementById("hp-tekst-gracz");
  if (!fill || !tekst) return;

  const procent = postac.maxHp > 0 ? Math.max(0, Math.min(100, (postac.hp / postac.maxHp) * 100)) : 0;
  fill.style.width = `${procent}%`;
  tekst.textContent = `${Math.round(Math.max(0, postac.hp)).toLocaleString("pl-PL")} / ${Math.round(postac.maxHp).toLocaleString("pl-PL")}`;
}

function formatCzasuGry(ms) {
  const sek = Math.floor(ms / 1000);
  const h = Math.floor(sek / 3600);
  const m = Math.floor((sek % 3600) / 60);
  const s = sek % 60;
  const dwie = n => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${dwie(m)}:${dwie(s)}` : `${dwie(m)}:${dwie(s)}`;
}

function aktualizujCzasGry() {
  const el = document.getElementById("czas-gry");
  if (!el) return;
  const tekst = formatCzasuGry(czasGryMs);
  if (el.textContent !== tekst) el.textContent = tekst;
}

function aktualizujInfo() {
  const zabiciEl = document.getElementById("zabici-licznik");
  if (zabiciEl) zabiciEl.textContent = liczbaZabitych;
  if (infoEl) infoEl.textContent = bossAktywny ? "👹 BOSS NA ARENIE" : "";
}

function log(tekst, klasa) {
  if (!logGry) return;
  const div = document.createElement("div");
  div.className = "log-wpis" + (klasa ? ` ${klasa}` : "");
  div.textContent = tekst;
  logGry.appendChild(div);
  logGry.scrollTop = logGry.scrollHeight;

  while (logGry.childNodes.length > 50) {
    logGry.removeChild(logGry.firstChild);
  }
}

function dopasujCanvas() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  postac.x = canvas.width / 2;
  postac.y = canvas.height / 2;
  rysujGre();
}

const SCENA_SZEROKOSC = 1920;
const SCENA_WYSOKOSC = 1080;

function dopasujStage() {
  const stage = document.getElementById("stage");
  if (!stage) return;

  const skala = Math.min(window.innerWidth / SCENA_SZEROKOSC, window.innerHeight / SCENA_WYSOKOSC);
  const przesX = (window.innerWidth - SCENA_SZEROKOSC * skala) / 2;
  const przesY = (window.innerHeight - SCENA_WYSOKOSC * skala) / 2;

  stage.style.transform = `translate(${przesX}px, ${przesY}px) scale(${skala})`;
  document.documentElement.style.setProperty("--skala", skala);
  skalaUi = skala;
}
window.addEventListener("resize", dopasujStage);

function losujPunktSpawnu() {
  const margines = 50;
  const krawedz = Math.floor(Math.random() * 4);
  switch (krawedz) {
    case 0: return { x: Math.random() * canvas.width, y: -margines };
    case 1: return { x: canvas.width + margines, y: Math.random() * canvas.height };
    case 2: return { x: Math.random() * canvas.width, y: canvas.height + margines };
    default: return { x: -margines, y: Math.random() * canvas.height };
  }
}

function stworzZwyklegoWroga(punkt, wymusMelee, wymusBoss = false) {
  const jestBoss = wymusBoss || (!wymusMelee && Math.random() < SZANSA_BOSS);
  const jestMelee = jestBoss ? true : (wymusMelee ? true : Math.random() < SZANSA_MELEE);

  const pz = jestBoss ? pzBossa() : pzZwyklegoMoba();
  const pancerz = jestBoss ? pancerzBossa() : pancerzZwyklegoMoba();

  const wrog = {
    id: nastepneIdWroga++,
    typ: jestBoss ? "boss" : (jestMelee ? "melee" : "ranged"),
    x: punkt.x,
    y: punkt.y,
    hp: pz,
    maxHp: pz,
    pancerz: pancerz,
    predkosc: jestBoss ? PREDKOSC_BOSS : (jestMelee ? PREDKOSC_MELEE : PREDKOSC_RANGED),
    ostatniAtak: 0,
    ostatniTikKrwawienia: 0,
    zatruteAtaki: 0,
    krwawienieTury: 0,
    ogluszonyDoCzasu: 0,
    falowy: false,
    odporny: Math.random() < szansaOdpornegoMoba()
  };

  wrogowie.push(wrog);
  if (jestBoss) {
    bossAktywny = true;
    log("👹 Na arenie pojawia się BOSS!", "log-zwyciestwo");
  }
  return wrog;
}

function stworzArcybossa(punkt, odporny = false) {
  punkt = punkt || losujPunktSpawnu();
  const n = arcybossyPokonane;

  const pz = ARCYBOSS_PZ + n * ARCYBOSS_PZ_PRZYROST;
  const pancerz = Math.min(ARCYBOSS_PANCERZ_MAX, ARCYBOSS_PANCERZ + n * ARCYBOSS_PANCERZ_PRZYROST);
  const dmgPocisk = Math.min(ARCYBOSS_DMG_MAX, ARCYBOSS_DMG_POCISK + n * ARCYBOSS_DMG_PRZYROST);
  const liczbaPociskow = Math.min(ARCYBOSS_POCISKI_MAX, ARCYBOSS_LICZBA_POCISKOW + n * ARCYBOSS_POCISKI_PRZYROST);

  const wrog = {
    id: nastepneIdWroga++,
    typ: "arcyboss",
    x: punkt.x,
    y: punkt.y,
    hp: pz,
    maxHp: pz,
    pancerz: pancerz,
    dmgPocisk: dmgPocisk,
    liczbaPociskow: liczbaPociskow,
    predkosc: PREDKOSC_BOSS * ARCYBOSS_MNOZNIK_PREDKOSCI,
    ostatniAtak: czasWirt(),
    ostatniTikKrwawienia: 0,
    zatruteAtaki: 0,
    krwawienieTury: 0,
    ogluszonyDoCzasu: 0,
    falowy: true,
    odporny: odporny
  };

  wrogowie.push(wrog);
  bossAktywny = true;
  log(odporny ? "👹 ODPORNY ARCYBOSS pojawia się na arenie!" : "👹 ARCYBOSS pojawia się na arenie!", "log-zwyciestwo");
}

function stworzWroga() {
  const punkt = losujPunktSpawnu();
  if (Math.random() < SZANSA_GRUPKA_MELEE) {
    for (let i = 0; i < WIELKOSC_GRUPKI_MELEE; i++) {
      const miejsce = {
        x: punkt.x + losujLiczbe(-40, 40),
        y: punkt.y + losujLiczbe(-40, 40)
      };
      stworzZwyklegoWroga(miejsce, true);
    }
    log("👥 Grupka wrogów nadciąga!", "log-info");
  } else {
    stworzZwyklegoWroga(punkt, false);
  }
  aktualizujInfo();
}

function promienWroga(wrog) {
  if (wrog.typ === "arcyboss") return 34 * ARCYBOSS_MNOZNIK_HITBOX;
  if (wrog.typ === "boss") return 34;
  return 10;
}

function aktualizujWroga(wrog, dtMs, teraz) {
  if (teraz < wrog.ogluszonyDoCzasu) return;

  const dx = postac.x - wrog.x;
  const dy = postac.y - wrog.y;
  const dystans = Math.hypot(dx, dy) || 1;

  if (wrog.typ === "arcyboss" && teraz - wrog.ostatniAtak >= ARCYBOSS_CZAS_SALWY_MS) {
    wrog.ostatniAtak = teraz;
    wystrzelSalweArcybossa(wrog);
  }

  let zasieg;
  if (wrog.typ === "arcyboss") zasieg = promienWroga(wrog) + 20;
  else if (wrog.typ === "ranged") zasieg = ZASIEG_RANGED;
  else zasieg = ZASIEG_MELEE;

  if (dystans > zasieg) {
    wrog.x += (dx / dystans) * wrog.predkosc * (dtMs / 1000);
    wrog.y += (dy / dystans) * wrog.predkosc * (dtMs / 1000);
    return;
  }

  if (wrog.typ === "arcyboss") return;
  if (teraz - wrog.ostatniAtak < COOLDOWN_ATAKU_WROGA_MS) return;
  wrog.ostatniAtak = teraz;

  if (wrog.typ === "ranged") {
    pociski.push({
      x: wrog.x,
      y: wrog.y,
      dx: dx / dystans,
      dy: dy / dystans,
      typWroga: wrog.typ
    });
  } else {
    zadajObrazeniaPostaci(wrog.typ);
  }
}

function wystrzelSalweArcybossa(wrog) {
  const liczba = wrog.liczbaPociskow || ARCYBOSS_LICZBA_POCISKOW;
  for (let i = 0; i < liczba; i++) {
    const rozrzut = (Math.random() * 2 - 1) * ARCYBOSS_ROZRZUT_KATA_STOPNIE * Math.PI / 180;
    const kat = (Math.PI * 2 / liczba) * i + rozrzut;
    pociski.push({
      x: wrog.x,
      y: wrog.y,
      dx: Math.cos(kat),
      dy: Math.sin(kat),
      typWroga: "arcyboss",
      dmg: wrog.dmgPocisk
    });
  }
}

function aktualizujPociski(dtMs) {
  pociski = pociski.filter(pocisk => {
    pocisk.x += pocisk.dx * PREDKOSC_POCISKU * (dtMs / 1000);
    pocisk.y += pocisk.dy * PREDKOSC_POCISKU * (dtMs / 1000);

    const dystans = Math.hypot(postac.x - pocisk.x, postac.y - pocisk.y);
    if (dystans < 16) {
      zadajObrazeniaPostaci(pocisk.typWroga, pocisk.dmg);
      return false;
    }
    return (pocisk.x > -60 && pocisk.x < canvas.width + 60 && pocisk.y > -60 && pocisk.y < canvas.height + 60);
  });
}

function zadajObrazeniaPostaci(typWroga, dmgPocisku) {
  if (!graTrwa) return;

  // Wskrzeszenie: pełna nietykalność na 3s — bez tego pociski WYSTRZELONE
  // tuż przed triggerem (już lecące w stronę gracza) nadal by trafiały,
  // mimo że wrogowie są unieruchomieni i nie mogą zaatakować ponownie.
  if (czasWirt() < wskrzeszenieDoCzasu) return;

  const staty1 = stan[1].staty;
  if (!staty1) return;

  if (losujProcent() < (staty1.blok || 0)) {
    rundaStaty.bloki += 1;
    log("🔰 BLOKUJESZ atak wroga! (0 obrażeń)", "log-blok");
    // Unoszący się napis nad postacią — tak jak liczby obrażeń (efekt "tekst")
    efekty.push({
      typ: "tekst",
      x: postac.x,
      y: postac.y - 32,
      tekst: "🛡️ BLOK 🛡️",
      kolor: "#7fc4ff",
      rozmiar: 25,
      zycie: 700,
      zycieMax: 700
    });
    return;
  }

  let dmgBazowe;
  if (typWroga === "boss") dmgBazowe = dmgBossa();
  else if (typWroga === "arcyboss") dmgBazowe = dmgPocisku || ARCYBOSS_DMG_POCISK;
  else if (typWroga === "ranged") dmgBazowe = dmgRangedZwyklegoMoba();
  else dmgBazowe = dmgMeleeZwyklegoMoba();

  const redukcja = 100 / (100 + (staty1.pancerz || 0));
  const dmg = Math.round(dmgBazowe * redukcja);

  postac.hp = Math.max(0, postac.hp - dmg);
  rundaStaty.otrzymane += dmg;
  if (dmg > 0) blyskObrazenMs = CZAS_BLYSKU_OBRAZEN_MS;
  aktualizujPasekPostaci();

  if (postac.hp <= 0) {
    if (staty1.wskrzeszenieDostepne && !wykorzystaneWskrzeszenie) {
      wykorzystaneWskrzeszenie = true;
      postac.hp = Math.round(postac.maxHp * 0.75);
      aktualizujPasekPostaci();

      const teraz = czasWirt();
      wrogowie.forEach(wrog => {
        wrog.ogluszonyDoCzasu = teraz + 3000;
      });
      wskrzeszenieDoCzasu = teraz + 3000;

      log("✨ WSKRZESZENIE! Przywrócono 75% PŻ i unieruchomiono wrogów na 3s!", "log-zwyciestwo");
      pokazOgloszenie("Wskrzeszenie!", "ogloszenie-item");
      return;
    }

    zakonczGre(false);
  }
}

function aktualizujRegeneracjePz(dtMs) {
  if (!graTrwa) return;
  const staty1 = stan[1].staty;
  if (!staty1 || (staty1.regeneracjaPzSek || 0) <= 0) return;
  if (postac.hp <= 0 || postac.hp >= postac.maxHp) return;

  licznikRegeneracjiMs += dtMs;
  if (licznikRegeneracjiMs >= 1000) {
    licznikRegeneracjiMs = 0;
    const leczenie = Math.round(postac.maxHp * (staty1.regeneracjaPzSek / 100));
    const hpPrzedRegen = postac.hp;
    postac.hp = Math.min(postac.maxHp, postac.hp + leczenie);
    rundaStaty.wyleczono += postac.hp - hpPrzedRegen;
    aktualizujPasekPostaci();
  }
}

function znajdzNajblizszegoWroga() {
  let najblizszy = null;
  let najmniejszyDystans = Infinity;

  wrogowie.forEach(wrog => {
    if (wrog.hp <= 0) return;
    const d = Math.hypot(postac.x - wrog.x, postac.y - wrog.y);
    if (d < najmniejszyDystans) {
      najmniejszyDystans = d;
      najblizszy = wrog;
    }
  });
  return najblizszy;
}

function znajdzNajblizszegoWrogaOd(cel, wykluczone = new Set()) {
  let najblizszy = null;
  let najmniejszyDystans = Infinity;

  wrogowie.forEach(wrog => {
    if (wrog.hp <= 0) return;
    if (wykluczone.has(wrog.id)) return;
    if (wrog.id === cel.id) return;
    const d = Math.hypot(cel.x - wrog.x, cel.y - wrog.y);
    if (d < najmniejszyDystans) {
      najmniejszyDystans = d;
      najblizszy = wrog;
    }
  });
  return najblizszy;
}

/* opcje.poboczny = strzała boczna z umiejętności "Potrójna strzała": obrażenia FIZYCZNE
   (pancerz działa), mogą krytować i przeszywać, ale NIE korzystają z trucizny i nie
   nakładają trucizny/krwawienia/omdlenia ani nie kradną życia.
   opcje.mnoznikSkilla = jaką część obrażeń głównej strzały zadaje (np. 0.2 = 20%). */
function wykonajPojedynczyAtak(cel, staty1, xZrodla, yZrodla, mnoznikPrzebicia = 1, opcje = {}) {
  if (!cel || cel.hp <= 0) return 0;

  const poboczny = !!opcje.poboczny;
  const mnoznikSkilla = opcje.mnoznikSkilla ?? 1;

  const podstObrazenia = staty1.podstawoweObrażenia || 3000;
  const losowePodstawoweObrazenia = losujLiczbe(
    Math.max(0, podstObrazenia - ROZRZUT_PODSTAWOWYCH_OBRAZEN),
    podstObrazenia + ROZRZUT_PODSTAWOWYCH_OBRAZEN
  );

  const dmgBazowe = (losowePodstawoweObrazenia + (staty1.wartoscAtaku || 0) + bonusObrazenZZabojstw());

  const truciznaAktywna = !poboczny && cel.zatruteAtaki > 0;
  if (truciznaAktywna) cel.zatruteAtaki -= 1;
  const mnoznikTrucizny = truciznaAktywna ? 1 + (TRUCIZNA_BONUS + ((staty1.obrazeniaTrucizny || 0) / 100)) * (cel.silaTrucizny ?? 1) : 1;

  const kryt = losujProcent() < (staty1.kryt || 0);
  const mnoznikKryta = kryt ? 2 + ((staty1.obrazeniaKrytyczne || 0) / 100) : 1;

  const szansaNaPrzeszywke = (staty1.diamentowaStrzala || 0) > 0 ? 100 : (staty1.przeszywka || 0);
  const przeszywkaAktywna = losujProcent() < szansaNaPrzeszywke;
  let pancerzEfektywny = cel.pancerz;

  if (przeszywkaAktywna) {
    const ignorujProcent = Math.min(100, szansaNaPrzeszywke * MNOZNIK_PRZESZYWKI);
    pancerzEfektywny = cel.pancerz * (1 - ignorujProcent / 100);
  }

  const redukcja = 100 / (100 + pancerzEfektywny);
  const mnoznikOdpornosci = cel.odporny ? MNOZNIK_DMG_ODPORNEGO : 1;
  const dmg = Math.round(dmgBazowe * mnoznikTrucizny * mnoznikKryta * redukcja * mnoznikPrzebicia * mnoznikOdpornosci * mnoznikSkilla);

  cel.hp -= dmg;

  rundaStaty.obrazenia += dmg;
  rundaStaty.ataki += 1;
  if (kryt) rundaStaty.kryty += 1;
  if (przeszywkaAktywna) rundaStaty.przeszywki += 1;
  if (dmg > rundaStaty.najwiekszyCios) rundaStaty.najwiekszyCios = dmg;

  let dmgWyswietlany = dmg;
  let dmgTrucizny = 0;
  if (truciznaAktywna) {
    const dmgBezTrucizny = Math.round(dmgBazowe * mnoznikKryta * redukcja * mnoznikPrzebicia * mnoznikOdpornosci * mnoznikSkilla);
    dmgTrucizny = Math.max(0, dmg - dmgBezTrucizny);
    if (dmgTrucizny > 0) dmgWyswietlany = dmgBezTrucizny;
  }

  rundaStaty.trucizna += dmgTrucizny;

  dodajEfektAtaku(cel.x, cel.y, dmgWyswietlany, {
    dmgTrucizny,
    kryt,
    przeszywka: przeszywkaAktywna,
    xZrodla,
    yZrodla
  });

  // Kradzież życia (także od bocznych strzał Potrójnej)
  if ((staty1.kradziezZycia || 0) > 0) {
    const skradzione = Math.round(dmg * staty1.kradziezZycia / 100);
    const hpPrzed = postac.hp;
    postac.hp = Math.min(postac.maxHp, postac.hp + skradzione);
    rundaStaty.wyleczono += postac.hp - hpPrzed;
    aktualizujPasekPostaci();
  }

  if (poboczny) {
    // Strzała boczna: obrażenia + kradzież życia. Na maksymalnym poziomie Potrójnej
    // dodatkowo może nałożyć Otrucie i Krwawienie w 80% skuteczności
    // (Ognistą strzałę obsługuje aktualizujPociskiGracza).
    dodajDmgUmiejetnosci("potrojna", dmg);
    if (poziomUmiejetnosci("potrojna") >= MAX_POZIOM_UMIEJETNOSCI && cel.hp > 0) {
      // Ta sama szansa co zwykle, ale siła efektu to 80%.
      if (losujProcent() < (staty1.otrucie || 0)) {
        cel.zatruteAtaki = TRUCIZNA_LICZBA_ATAKOW;
        cel.silaTrucizny = MNOZNIK_EFEKTOW_POBOCZNYCH;
      }
      if (losujProcent() < (staty1.krwawienie || 0)) {
        if (cel.krwawienieTury <= 0) cel.ostatniTikKrwawienia = czasWirt();
        cel.krwawienieTury = KRWAWIENIE_LICZBA_TIKOW;
        cel.silaKrwawienia = MNOZNIK_EFEKTOW_POBOCZNYCH;
      }
    }
    if (cel.hp <= 0) zabijWroga(cel);
    return dmg;
  }

  if (losujProcent() < (staty1.otrucie || 0)) { cel.zatruteAtaki = TRUCIZNA_LICZBA_ATAKOW; cel.silaTrucizny = 1; }
  // ARCYBOSSY są odporne na omdlenie (zwykłe moby i Bossy nie).
  if (cel.typ !== "arcyboss" && losujProcent() < (staty1.omdlenie || 0)) {
    cel.ogluszonyDoCzasu = czasWirt() + CZAS_OGLUSZENIA_MS;
    rundaStaty.omdlenia += 1;
  }
  if (losujProcent() < (staty1.krwawienie || 0)) {
    // Pierwszy tik dopiero po 0,5s (tylko gdy nie krwawił już wcześniej —
    // ponowny proc odświeża czas trwania, ale nie resetuje rytmu tików).
    if (cel.krwawienieTury <= 0) cel.ostatniTikKrwawienia = czasWirt();
    cel.krwawienieTury = KRWAWIENIE_LICZBA_TIKOW;
    cel.silaKrwawienia = 1;
  }

  if (cel.hp <= 0) zabijWroga(cel);
  return dmg;
}

/* Trucizna na obrażeniach MAGICZNYCH: otruty cel dostaje zwiększone obrażenia
   umiejętności (tak samo jak od zwykłego ataku: +TRUCIZNA_BONUS + Wzmocnienie trucizny)
   i każde takie trafienie skraca czas trwania otrucia o 1 atak.
   dmgBazowe = obrażenia magiczne po odporności moba, przed trucizną.
   Zwraca { dmg, dmgTrucizny, dmgWyswietlany }. */
function obrazeniaMagiczneZTrucizna(cel, staty1, dmgBazowe) {
  const bez = Math.round(dmgBazowe);
  if (!(cel.zatruteAtaki > 0)) return { dmg: bez, dmgTrucizny: 0, dmgWyswietlany: bez };

  cel.zatruteAtaki -= 1;
  const mnoznikTrucizny = 1 + (TRUCIZNA_BONUS + ((staty1.obrazeniaTrucizny || 0) / 100)) * (cel.silaTrucizny ?? 1);
  const dmg = Math.round(dmgBazowe * mnoznikTrucizny);
  const dmgTrucizny = Math.max(0, dmg - bez);
  return { dmg, dmgTrucizny, dmgWyswietlany: dmgTrucizny > 0 ? bez : dmg };
}

/* Umiejętność "Wampiryczna strzała": obrażenia MAGICZNE leczą (1 + poziom)% zadanych obrażeń. */
function wampiryzmZaklec(dmg) {
  const p = poziomUmiejetnosci("wampiryczna");
  if (p < 0 || !(dmg > 0) || postac.hp <= 0) return;

  const leczenie = Math.round(dmg * (1 + p) / 100);
  if (leczenie <= 0) return;

  const hpPrzed = postac.hp;
  postac.hp = Math.min(postac.maxHp, postac.hp + leczenie);
  const wyleczone = postac.hp - hpPrzed;
  rundaStaty.wyleczono += wyleczone;
  dodajDmgUmiejetnosci("wampiryczna", wyleczone);
  aktualizujPasekPostaci();
}

/* Atak MAGICZNY (umiejętności): (Podstawowe obrażenia + zabici) * mnożnik umiejętności,
   razy (1 + Obrażenia umiejętności %). Ignoruje pancerz, nie krytuje, nie
   przeszywa, nie nakłada trucizny/krwawienia/omdlenia i nie kradnie życia.
   Odporność moba (redukcja obrażeń) nadal działa. Otruty cel dostaje obrażenia
   zwiększone przez truciznę (patrz obrazeniaMagiczneZTrucizna). */
function wykonajAtakMagiczny(cel, staty1, xZrodla, yZrodla, mnoznik = 1, opcje = {}) {
  if (!cel || cel.hp <= 0) return 0;

  // Elektryczna (max poziom): szansa na zwiększone obrażenia ("krytyk" magiczny)
  const krytMagiczny = !!opcje.mozeKrytowac && losujProcent() < SZANSA_KRYTA_ELEKTRYCZNEJ;
  const baza = ((staty1.podstawoweObrażenia || 3000) + bonusObrazenZZabojstw()) * mnoznik * (krytMagiczny ? MNOZNIK_KRYTA_ELEKTRYCZNEJ : 1);
  const dmgBazowe = baza * (1 + (staty1.obrazeniaUmiejetnosci || 0) / 100) * (cel.odporny ? MNOZNIK_DMG_ODPORNEGO : 1);
  const { dmg, dmgTrucizny, dmgWyswietlany } = obrazeniaMagiczneZTrucizna(cel, staty1, dmgBazowe);

  cel.hp -= dmg;
  rundaStaty.obrazenia += dmg;
  rundaStaty.magiczne += dmg;
  rundaStaty.trucizna += dmgTrucizny;
  if (opcje.zrodlo) dodajDmgUmiejetnosci(opcje.zrodlo, dmg);
  wampiryzmZaklec(dmg);
  if (dmg > rundaStaty.najwiekszyCios) rundaStaty.najwiekszyCios = dmg;

  dodajEfektAtaku(cel.x, cel.y, dmgWyswietlany, {
    magia: true,
    kryt: krytMagiczny,
    dmgTrucizny,
    xZrodla,
    yZrodla,
    kolorLinii: opcje.kolorLinii,
    bezLinii: opcje.bezLinii
  });

  if (cel.hp <= 0) zabijWroga(cel);
  return dmg;
}

/* ---------- UMIEJĘTNOŚCI PASYWNE: pomocnicze ---------- */

/* -1 = umiejętność niekupiona, 0–4 = kupiona + liczba kupionych ulepszeń (I–IV). */
function poziomUmiejetnosci(id) {
  if (typeof umiejetnosciStan === "undefined") return -1;
  const st = umiejetnosciStan[id];
  return st && st.odblokowana ? st.poziom : -1;
}

function zaplanujAkcje(opoznienieMs, fn) {
  zaplanowaneAkcje.push({ kiedy: zegarGryMs + opoznienieMs, fn });
}

function przetworzZaplanowaneAkcje() {
  if (!zaplanowaneAkcje.length) return;
  const gotowe = zaplanowaneAkcje.filter(a => a.kiedy <= zegarGryMs);
  if (!gotowe.length) return;
  zaplanowaneAkcje = zaplanowaneAkcje.filter(a => a.kiedy > zegarGryMs);
  gotowe.forEach(a => a.fn());
}

function znajdzNajblizszychWrogow(liczba, wykluczone) {
  return wrogowie
    .filter(w => w.hp > 0 && !wykluczone.has(w.id))
    .sort((a, b) => Math.hypot(postac.x - a.x, postac.y - a.y) - Math.hypot(postac.x - b.x, postac.y - b.y))
    .slice(0, liczba);
}

/* Odłamkowa strzała: razem ze zwykłym atakiem lecą mniejsze błękitne strzały
   w X najbliższych wrogów (poza celem zwykłego ataku). Nie przebijają. */
function wystrzelOdlamki(celGlowny, liczba) {
  znajdzNajblizszychWrogow(liczba, new Set([celGlowny.id])).forEach(wrog => {
    const dx = wrog.x - postac.x;
    const dy = wrog.y - postac.y;
    const dlugosc = Math.hypot(dx, dy) || 1;
    pociskiGracza.push({
      typ: "odlamek",
      x: postac.x,
      y: postac.y,
      dx: dx / dlugosc,
      dy: dy / dlugosc,
      trafieni: new Set()
    });
  });
}

/* Magiczna strzała: fioletowa łza, wybuch 2x większy niż zwykły. */
function wystrzelMagicznaStrzale() {
  const cel = znajdzNajblizszegoWroga();
  if (!cel) return;

  const dx = cel.x - postac.x;
  const dy = cel.y - postac.y;
  const dlugosc = Math.hypot(dx, dy) || 1;
  pociskiGracza.push({
    typ: "magiczna",
    x: postac.x,
    y: postac.y,
    dx: dx / dlugosc,
    dy: dy / dlugosc,
    trafieni: new Set()
  });
}

function wybuchMagicznejStrzaly(cel, staty1) {
  const x = cel.x;
  const y = cel.y;
  const promien = poziomUmiejetnosci("magiczna") >= MAX_POZIOM_UMIEJETNOSCI ? PROMIEN_WYBUCHU_MAGICZNEJ_MAX : PROMIEN_WYBUCHU_MAGICZNEJ;
  dodajEfektWybuchu(x, y, promien, KOLOR_WYBUCHU_MAGICZNEJ);

  wrogowie.slice().forEach(wrog => {
    if (wrog.hp <= 0) return;
    if (Math.hypot(x - wrog.x, y - wrog.y) > promien) return;
    wykonajAtakMagiczny(wrog, staty1, x, y, 1 / 2, { bezLinii: true, zrodlo: "magiczna" });
  });
}

function atakGracza() {
  if (!graTrwa) return;
  const staty1 = stan[1].staty;
  if (!staty1) return;

  const cel = znajdzNajblizszegoWroga();
  if (!cel) return;

  const dx = cel.x - postac.x;
  const dy = cel.y - postac.y;
  const dlugosc = Math.hypot(dx, dy) || 1;

  pociskiGracza.push({
    x: postac.x,
    y: postac.y,
    dx: dx / dlugosc,
    dy: dy / dlugosc,
    trafieni: new Set(),
    mnoznikPrzebicia: 1
  });

  // Potrójna strzała: 2 dodatkowe strzały po bokach (±25° od głównej), przebijające
  const pPotrojna = poziomUmiejetnosci("potrojna");
  if (pPotrojna >= 0) {
    const ux = dx / dlugosc;
    const uy = dy / dlugosc;
    [-1, 1].forEach(strona => {
      const kat = strona * KAT_POTROJNEJ_STRZALY;
      pociskiGracza.push({
        typ: "boczna",
        x: postac.x,
        y: postac.y,
        dx: ux * Math.cos(kat) - uy * Math.sin(kat),
        dy: ux * Math.sin(kat) + uy * Math.cos(kat),
        trafieni: new Set(),
        mnoznikPrzebicia: 1,
        mnoznikSkilla: (20 + 15 * pPotrojna) / 100
      });
    });
  }

  const pOdlamkowa = poziomUmiejetnosci("odlamkowa");
  if (pOdlamkowa >= 0) {
    wystrzelOdlamki(cel, 1 + pOdlamkowa);
    // Max poziom: druga salwa dokładnie w połowie między tym a następnym atakiem
    // (czyli odłamki strzelają 2x częściej niż zwykły atak, także przy zmianie prędkości ataku)
    if (pOdlamkowa >= MAX_POZIOM_UMIEJETNOSCI) {
      zaplanujAkcje(pobierzCzasAtakuGracza() / 2, () => {
        if (!graTrwa) return;
        const glowny = znajdzNajblizszegoWroga();
        if (glowny) wystrzelOdlamki(glowny, 1 + pOdlamkowa);
      });
    }
  }

  const pMagiczna = poziomUmiejetnosci("magiczna");
  if (pMagiczna >= 0) {
    licznikAtakowMagicznej += 1;
    if (licznikAtakowMagicznej >= 7 - pMagiczna) {
      licznikAtakowMagicznej = 0;
      zaplanujAkcje(OPOZNIENIE_MAGICZNEJ_MS, wystrzelMagicznaStrzale);
    }
  }
}

/* Umiejętność "Ognista strzała": 33% szansy na obrażenia obszarowe przy trafieniu.
   Obrażenia wybuchu = (60 + 15 * poziom)% obrażeń tego trafienia, magiczne.
   Wywoływane dla trafienia strzałą, dla każdego ogniwa łańcucha Elektrycznej strzały
   ORAZ dla każdej trafiającej Odłamkowej strzały. */
function sprobujObrazenObszarowych(cel, dmg, staty1) {
  const pOgnista = poziomUmiejetnosci("ognista");
  if (pOgnista < 0 || !dmg) return;
  if (losujProcent() >= SZANSA_PROCKA_STRZALY) return;

  const mnoznikWybuchu = (60 + 15 * pOgnista) / 100;
  dodajEfektWybuchu(cel.x, cel.y, PROMIEN_OGNIA);

  wrogowie.forEach(wrog => {
    if (wrog.id === cel.id || wrog.hp <= 0) return;
    if (Math.hypot(cel.x - wrog.x, cel.y - wrog.y) > PROMIEN_OGNIA) return;

    const dmgWybuchu = Math.round(dmg * mnoznikWybuchu);
    if (dmgWybuchu <= 0) return;
    // Obrażenia magiczne — pancerz nie działa, trucizna zwiększa i skraca otrucie.
    const dmgPoOdpornosci = dmgWybuchu * (wrog.odporny ? MNOZNIK_DMG_ODPORNEGO : 1);
    const { dmg: dmgMagiczne, dmgTrucizny, dmgWyswietlany } = obrazeniaMagiczneZTrucizna(wrog, staty1, dmgPoOdpornosci);

    wrog.hp -= dmgMagiczne;
    rundaStaty.obrazenia += dmgMagiczne;
    rundaStaty.magiczne += dmgMagiczne;
    rundaStaty.trucizna += dmgTrucizny;
    dodajDmgUmiejetnosci("ognista", dmgMagiczne);
    wampiryzmZaklec(dmgMagiczne);
    dodajEfektAtaku(wrog.x, wrog.y, dmgWyswietlany, { magia: true, dmgTrucizny, xZrodla: cel.x, yZrodla: cel.y });
    if (wrog.hp <= 0) { zabijWroga(wrog); return; }

    // Max poziom: wrogowie trafieni wybuchem płoną (odświeża czas palenia)
    if (pOgnista >= MAX_POZIOM_UMIEJETNOSCI) {
      if (!(wrog.podpalenieTury > 0)) wrog.ostatniTikPodpalenia = czasWirt();
      wrog.podpalenieTury = PODPALENIE_LICZBA_TIKOW;
    }
  });
}

/* Podpalenie (Ognista strzała, max poziom): 10% maks. PŻ w 3s, tiki co 0,5s. */
function aktualizujPodpalenia(teraz) {
  wrogowie.slice().forEach(wrog => {
    if (wrog.hp <= 0 || !(wrog.podpalenieTury > 0)) return;
    if (teraz - wrog.ostatniTikPodpalenia < PODPALENIE_CZAS_TIKU_MS) return;

    wrog.ostatniTikPodpalenia = teraz;
    wrog.podpalenieTury -= 1;

    const dmg = Math.round(wrog.maxHp * PODPALENIE_PROCENT_HP / PODPALENIE_LICZBA_TIKOW * (wrog.odporny ? MNOZNIK_DMG_ODPORNEGO : 1));
    if (dmg <= 0) return;
    wrog.hp -= dmg;
    rundaStaty.obrazenia += dmg;
    rundaStaty.magiczne += dmg;
    dodajDmgUmiejetnosci("ognista", dmg);

    dodajEfektAtaku(wrog.x, wrog.y, dmg, { podpalenie: true, bezLinii: true });
    if (wrog.hp <= 0) zabijWroga(wrog);
  });
}

/* Affix "Ognista strzała": szansa na fizyczny wybuch wokół trafionego celu. */
function procAffixuOgnistejStrzaly(cel, dmg, staty1) {
  if ((staty1.ognistaStrzala || 0) > 0 && losujProcent() < SZANSA_PROCKA_STRZALY) {
    dodajEfektWybuchu(cel.x, cel.y, PROMIEN_OGNIA);
    wrogowie.forEach(wrog => {
      if (wrog.id === cel.id || wrog.hp <= 0) return;
      const dystans = Math.hypot(cel.x - wrog.x, cel.y - wrog.y);
      if (dystans > PROMIEN_OGNIA) return;

      const dmgOgnia = Math.round(dmg * staty1.ognistaStrzala / 100);
      if (dmgOgnia <= 0) return;
      const redukcja = 100 / (100 + wrog.pancerz);
      const dmgPoPancerzu = Math.round(dmgOgnia * redukcja * (wrog.odporny ? MNOZNIK_DMG_ODPORNEGO : 1));

      wrog.hp -= dmgPoPancerzu;
      rundaStaty.obrazenia += dmgPoPancerzu;
      dodajEfektAtaku(wrog.x, wrog.y, dmgPoPancerzu, { xZrodla: cel.x, yZrodla: cel.y });
      if (wrog.hp <= 0) zabijWroga(wrog);
    });
  }
}

function trafienieStrzalaGracza(cel, staty1, pocisk) {
  const dmg = wykonajPojedynczyAtak(cel, staty1, pocisk.x, pocisk.y, pocisk.mnoznikPrzebicia);

  sprobujObrazenObszarowych(cel, dmg, staty1);
  procAffixuOgnistejStrzaly(cel, dmg, staty1);

  const pElektryczna = poziomUmiejetnosci("elektryczna");
  if (pElektryczna >= 0 && losujProcent() < SZANSA_PROCKA_STRZALY) {
    const mozeKrytowac = pElektryczna >= MAX_POZIOM_UMIEJETNOSCI;
    let poprzedniCel = cel;
    const wykluczone = new Set([cel.id]);
    for (let i = 0; i < 1 + pElektryczna; i++) {
      const kolejnyCel = znajdzNajblizszegoWrogaOd(poprzedniCel, wykluczone);
      if (!kolejnyCel) break;
      wykluczone.add(kolejnyCel.id);
      const dmgOgniwa = wykonajAtakMagiczny(kolejnyCel, staty1, poprzedniCel.x, poprzedniCel.y, 1, { kolorLinii: KOLOR_LINII_ELEKTRYCZNEJ, zrodlo: "elektryczna", mozeKrytowac });
      sprobujObrazenObszarowych(kolejnyCel, dmgOgniwa, staty1);
      poprzedniCel = kolejnyCel;
    }
  }
}

function aktualizujPociskiGracza(dtMs) {
  const staty1 = stan[1].staty;
  pociskiGracza = pociskiGracza.filter(pocisk => {
    pocisk.x += pocisk.dx * PREDKOSC_STRZALY_GRACZA * (dtMs / 1000);
    pocisk.y += pocisk.dy * PREDKOSC_STRZALY_GRACZA * (dtMs / 1000);

    if (pocisk.typ === "odlamek" || pocisk.typ === "magiczna") {
      if (staty1) {
        const promienTrafienia = pocisk.typ === "magiczna" ? 20 : 9;
        for (const wrog of wrogowie) {
          if (wrog.hp <= 0) continue;
          if (Math.hypot(wrog.x - pocisk.x, wrog.y - pocisk.y) > promienWroga(wrog) + promienTrafienia) continue;

          if (pocisk.typ === "magiczna") wybuchMagicznejStrzaly(wrog, staty1);
          else {
            const dmgOdlamka = wykonajAtakMagiczny(wrog, staty1, pocisk.x, pocisk.y, 1 / 4, { bezLinii: true, zrodlo: "odlamkowa" });
            sprobujObrazenObszarowych(wrog, dmgOdlamka, staty1); // Odłamkowa też procuje Ognistą
          }
          return false; // nie przebijają
        }
      }
      return (pocisk.x > -60 && pocisk.x < canvas.width + 60 && pocisk.y > -60 && pocisk.y < canvas.height + 60);
    }

    if (staty1) {
      for (const wrog of wrogowie) {
        if (wrog.hp <= 0) continue;
        if (pocisk.trafieni.has(wrog.id)) continue;

        const dystans = Math.hypot(wrog.x - pocisk.x, wrog.y - pocisk.y);
        if (dystans <= promienWroga(wrog) + PROMIEN_TRAFIENIA_STRZALY) {
          pocisk.trafieni.add(wrog.id);
          if (pocisk.typ === "boczna") {
            const dmgBoczny = wykonajPojedynczyAtak(wrog, staty1, pocisk.x, pocisk.y, pocisk.mnoznikPrzebicia, { poboczny: true, mnoznikSkilla: pocisk.mnoznikSkilla });
            // Max poziom Potrójnej: Ognista strzała (umiejętność i affix) w 80% skuteczności
            if (poziomUmiejetnosci("potrojna") >= MAX_POZIOM_UMIEJETNOSCI && dmgBoczny > 0) {
              const dmgEfektu = Math.round(dmgBoczny * MNOZNIK_EFEKTOW_POBOCZNYCH);
              if (wrog.hp > 0) {
                sprobujObrazenObszarowych(wrog, dmgEfektu, staty1);
                procAffixuOgnistejStrzaly(wrog, dmgEfektu, staty1);
              }
            }
          } else {
            trafienieStrzalaGracza(wrog, staty1, pocisk);
          }
          pocisk.mnoznikPrzebicia += WZROST_DMG_NA_PRZEBICIE;
          break;
        }
      }
    }
    return (pocisk.x > -60 && pocisk.x < canvas.width + 60 && pocisk.y > -60 && pocisk.y < canvas.height + 60);
  });
}

function zabijWroga(wrog) {
  wrog.hp = 0;
  wrogowie = wrogowie.filter(w => w.id !== wrog.id);
  liczbaZabitych += 1;
  renderujStatyGracza();

  // Monety: ARCYBOSS zawsze 2, pozostali wrogowie losowo 0–2.
  const monetyZaZabojstwo = wrog.typ === "arcyboss" ? 2 : losujLiczbe(0, 2);
  if (monetyZaZabojstwo > 0 && typeof dodajMonety === "function") {
    dodajMonety(monetyZaZabojstwo);
    efekty.push({
      typ: "tekst",
      x: wrog.x + 8,
      y: wrog.y - 36,
      tekst: `+${monetyZaZabojstwo}🪙`,
      kolor: "#ffd700",
      rozmiar: 18,
      zycie: 900,
      zycieMax: 900
    });
  }

  if (wrog.typ === "boss") log("🏆 Boss pokonany!", "log-zwyciestwo");
  if (wrog.typ === "arcyboss") {
    log("🏆 ARCYBOSS pokonany!", "log-zwyciestwo");
    arcybossyPokonane += 1;
    rekordArcybossowDlaSpawnu = Math.max(rekordArcybossowDlaSpawnu, arcybossyPokonane);

    if (arcybossyPokonane === ARCYBOSSY_DO_ULEPSZENIA) {
      nastepnyProgArcybossa += PROG_FALI_ARCYBOSSA_PO_ULEPSZENIU - PROG_FALI_ARCYBOSSA;
      log("⚡ Wrogowie respią się coraz szybciej, a ARCYBOSSY co 200 zabójstw!", "log-zwyciestwo");
    }

    sprawdzWywołanieUlepszenia();
  }

  const jestBossowy = wrog.typ === "boss" || wrog.typ === "arcyboss";
  const szansaDropu = jestBossowy ? 1 : SZANSA_ZMIANKA_Z_MOBA;

  if (Math.random() < szansaDropu) {
    stan[1].zmianki += 1;
    aktualizujZmianki();
  }

  odswiezProgresje();

  if (falaArcybossAktywna && !wrogowie.some(w => w.falowy)) {
    falaArcybossAktywna = false;
    log("✅ Fala ARCYBOSSA pokonana!", "log-zwyciestwo");
  }

  bossAktywny = wrogowie.some(w => w.typ === "boss" || w.typ === "arcyboss");
  aktualizujInfo();
}

function pobierzCzasAtakuGracza() {
  const staty1 = stan[1].staty;
  const predkoscAtaku = staty1 ? (staty1.predkoscAtaku || 0) : 0;
  return CZAS_ATAKU_GRACZA_MS / (1 + predkoscAtaku / 100);
}

/*
  Krwawienie w Survivorze: 8% maks. PŻ na sekundę przez 3 sekundy,
  zadawane w tikach co 0,5s (6 tików po 4% maks. PŻ). Stałe są lokalne,
  żeby nie ruszać KRWAWIENIE_* z config.js (współdzielone z areną 1v1).
*/
const CZAS_TIKU_KRWAWIENIA_MS = 500;
const KRWAWIENIE_TIK_PROCENT_HP = 0.04;
const KRWAWIENIE_LICZBA_TIKOW = 6;

/*
  Odporny mob: 1% szans, że pojawiający się mob (melee / ranged / boss)
  otrzymuje tylko 30% obrażeń (redukcja 70%). Oznaczony kolcami.
*/
const SZANSA_ODPORNEGO_MOBA = 0.01; // bazowa szansa (przy 0 pokonanych Arcybossach)
const PRZYROST_SZANSY_ODPORNEGO_NA_ARCYBOSSA = 0.01; // +1 punkt procentowy za każdego pokonanego Arcybossa

function szansaOdpornegoMoba() {
  return Math.min(1, SZANSA_ODPORNEGO_MOBA + arcybossyPokonane * PRZYROST_SZANSY_ODPORNEGO_NA_ARCYBOSSA);
}
const MNOZNIK_DMG_ODPORNEGO = 0.25;

function aktualizujKrwawienieWrogow(teraz) {
  const staty1 = stan[1].staty;
  const wzmocnienieKrwawienia = staty1 ? (staty1.obrazeniaKrwawienia || 0) : 0;

  wrogowie.forEach(wrog => {
    if (wrog.hp <= 0) return;
    if (wrog.krwawienieTury <= 0) return;
    if (teraz - wrog.ostatniTikKrwawienia < CZAS_TIKU_KRWAWIENIA_MS) return;

    wrog.ostatniTikKrwawienia = teraz;
    wrog.krwawienieTury -= 1;

    const mnoznikOdpornosci = wrog.odporny ? MNOZNIK_DMG_ODPORNEGO : 1;
    // Wzmocnienie krwawienia dodaje punkty procentowe NA SEKUNDĘ (np. 5% = +5 pp/s),
    // więc na jeden tik (0,5s) przypada połowa: 4% + 2,5% = 6,5% maks. PŻ.
    const procentTiku = KRWAWIENIE_TIK_PROCENT_HP + (wzmocnienieKrwawienia / 100) * (CZAS_TIKU_KRWAWIENIA_MS / 1000);
    const dmg = Math.round(wrog.maxHp * procentTiku * mnoznikOdpornosci * (wrog.silaKrwawienia ?? 1));
    wrog.hp -= dmg;
    rundaStaty.obrazenia += dmg;
    rundaStaty.krwawienie += dmg;

    dodajEfektAtaku(wrog.x, wrog.y, dmg, { krwawienie: true, xZrodla: wrog.x, yZrodla: wrog.y });
    if (wrog.hp <= 0) zabijWroga(wrog);
  });
}

function aktywneKoloryWroga(wrog, teraz) {
  const kolory = [];
  if (wrog.zatruteAtaki > 0) kolory.push(KOLOR_TRUCIZNA);
  if (teraz < wrog.ogluszonyDoCzasu) kolory.push(KOLOR_OMDLENIE);
  if (wrog.krwawienieTury > 0) kolory.push(KOLOR_KRWAWIENIE);
  if (wrog.podpalenieTury > 0) kolory.push(KOLOR_PODPALENIE);
  return kolory;
}

function rysujKoloWroga(x, y, promien, kolory) {
  if (kolory.length === 0) {
    ctx.beginPath();
    ctx.arc(x, y, promien, 0, Math.PI * 2);
    ctx.fillStyle = KOLOR_DOMYSLNY_WROGA;
    ctx.fill();
    return;
  }

  const krok = (Math.PI * 2) / kolory.length;
  kolory.forEach((kolor, i) => {
    const start = -Math.PI / 2 + i * krok;
    const koniec = start + krok;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, promien, start, koniec);
    ctx.closePath();
    ctx.fillStyle = kolor;
    ctx.fill();
  });
}

/*
  Wrogowie dystansowi (typ "ranged") są trójkątami skierowanymi czubkiem w
  stronę gracza. Trójkąt jest równoboczny; promień opisany = promień wroga
  * 1.25, żeby wizualnie nie był mniejszy od kółka (hitbox bez zmian).
*/
const MNOZNIK_ROZMIARU_TROJKATA = 1.25;

function wierzcholkiTrojkata(x, y, promien, kat) {
  const r = promien * MNOZNIK_ROZMIARU_TROJKATA;
  const wierzcholki = [];
  for (let i = 0; i < 3; i++) {
    const a = kat + i * (Math.PI * 2 / 3);
    wierzcholki.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r });
  }
  return wierzcholki;
}

function sciezkaTrojkata(x, y, promien, kat) {
  const w = wierzcholkiTrojkata(x, y, promien, kat);
  ctx.beginPath();
  ctx.moveTo(w[0].x, w[0].y);
  ctx.lineTo(w[1].x, w[1].y);
  ctx.lineTo(w[2].x, w[2].y);
  ctx.closePath();
}

function rysujTrojkatWroga(x, y, promien, kat, kolory) {
  const r = promien * MNOZNIK_ROZMIARU_TROJKATA;

  if (kolory.length === 0) {
    sciezkaTrojkata(x, y, promien, kat);
    ctx.fillStyle = KOLOR_DOMYSLNY_WROGA;
    ctx.fill();
    return;
  }

  // Statusy jak przy kółku: wycinki koła przycięte do trójkąta.
  ctx.save();
  sciezkaTrojkata(x, y, promien, kat);
  ctx.clip();

  const krok = (Math.PI * 2) / kolory.length;
  kolory.forEach((kolor, i) => {
    const start = -Math.PI / 2 + i * krok;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, r * 1.2, start, start + krok);
    ctx.closePath();
    ctx.fillStyle = kolor;
    ctx.fill();
  });

  ctx.restore();
}

/* Kolce odpornego trójkąta: po 4 na każdym boku, skierowane na zewnątrz. */
function rysujKolceTrojkata(x, y, promien, kat) {
  const w = wierzcholkiTrojkata(x, y, promien, kat);
  const dlugosc = 6;
  const naBok = 4;

  ctx.save();
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";

  let licznik = 0;
  for (let i = 0; i < 3; i++) {
    const a = w[i];
    const b = w[(i + 1) % 3];
    // normalna na zewnątrz = kierunek od środka do środka boku
    const katNormalnej = kat + i * (Math.PI * 2 / 3) + Math.PI / 3;
    const nx = Math.cos(katNormalnej);
    const ny = Math.sin(katNormalnej);

    for (let k = 0; k < naBok; k++) {
      const f = (k + 0.5) / naBok;
      const sx = a.x + (b.x - a.x) * f;
      const sy = a.y + (b.y - a.y) * f;

      ctx.strokeStyle = (licznik++ % 2 === 0) ? "#ffd700" : "#ff2d2d";
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + nx * dlugosc, sy + ny * dlugosc);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/* Krótkie kreski (kolce) na przemian żółte i czerwone wokół odpornego moba. */
function rysujKolceOdpornego(x, y, promien) {
  const liczba = promien > 50 ? 36 : (promien > 20 ? 20 : 10);
  const dlugosc = promien > 50 ? 12 : (promien > 20 ? 9 : 6);

  ctx.save();
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";

  for (let i = 0; i < liczba; i++) {
    const kat = (Math.PI * 2 / liczba) * i;
    const cos = Math.cos(kat);
    const sin = Math.sin(kat);

    ctx.strokeStyle = (i % 2 === 0) ? "#ffd700" : "#ff2d2d";
    ctx.beginPath();
    ctx.moveTo(x + cos * (promien - 1), y + sin * (promien - 1));
    ctx.lineTo(x + cos * (promien + dlugosc), y + sin * (promien + dlugosc));
    ctx.stroke();
  }

  ctx.restore();
}

function dodajEfektAtaku(x, y, dmg, opcje) {
  opcje = opcje || {};
  if (!opcje.bezLinii) {
    efekty.push({
      typ: "linia",
      x1: opcje.xZrodla ?? postac.x,
      y1: opcje.yZrodla ?? postac.y,
      x2: x,
      y2: y,
      rgb: opcje.kolorLinii || KOLOR_LINII_ZWYKLEJ,
      zycie: 120,
      zycieMax: 120
    });
  }

  let styl;
  let prefix = "";

  if (opcje.magia && opcje.kryt) {
    styl = DMG_STYL_MAGIA_KRYT;
    prefix = "💥✨";
  } else if (opcje.magia) {
    styl = DMG_STYL_MAGIA;
    prefix = "✨";
  } else if (opcje.podpalenie) {
    styl = DMG_STYL_PODPALENIE;
    prefix = "🔥";
  } else if (opcje.krwawienie) {
    styl = DMG_STYL_KRWAWIENIE;
    prefix = "🩸";
  } else if (opcje.kryt && opcje.przeszywka) {
    styl = DMG_STYL_KRYT_PRZESZYWKA;
    prefix = "💥🗡️";
  } else if (opcje.kryt) {
    styl = DMG_STYL_KRYT;
    prefix = "💥";
  } else if (opcje.przeszywka) {
    styl = DMG_STYL_PRZESZYWKA;
    prefix = "🗡️";
  } else {
    styl = DMG_STYL_ZWYKLY;
  }

  efekty.push({
    typ: "tekst",
    x: x + 8,
    y: y - 12,
    tekst: `${prefix}${dmg.toLocaleString("pl-PL")}`,
    kolor: styl.kolor,
    rozmiar: styl.rozmiar,
    zycie: 700,
    zycieMax: 700
  });

  if (opcje.dmgTrucizny > 0) {
    efekty.push({
      typ: "tekst",
      x: x + 8,
      y: y - 12 + styl.rozmiar + 4,
      tekst: `${opcje.dmgTrucizny.toLocaleString("pl-PL")}`,
      kolor: KOLOR_TRUCIZNA,
      rozmiar: Math.max(13, styl.rozmiar - 3),
      zycie: 700,
      zycieMax: 700
    });
  }
}

function dodajEfektWybuchu(x, y, promien, rgb) {
  efekty.push({
    typ: "wybuch",
    x: x,
    y: y,
    promien: promien,
    rgb: rgb || KOLOR_WYBUCHU_OGNIA,
    zycie: CZAS_TRWANIA_WYBUCHU_MS,
    zycieMax: CZAS_TRWANIA_WYBUCHU_MS
  });
}

function aktualizujEfekty(dtMs) {
  efekty.forEach(e => e.zycie -= dtMs);
  efekty = efekty.filter(e => e.zycie > 0);
  if (blyskObrazenMs > 0) blyskObrazenMs = Math.max(0, blyskObrazenMs - dtMs);
}

function rysujGre() {
  if (!canvas.width || !canvas.height) return;
  const teraz = czasWirt();

  // Tło areny (arena.jpg) jest ustawione w CSS na .survivor-canvas-wrap — canvas tylko czyścimy.
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.arc(postac.x, postac.y, 20, 0, Math.PI * 2);
  ctx.fillStyle = "#7fc4ff";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#dfe9df";
  ctx.stroke();

  wrogowie.forEach(wrog => {
    const promien = promienWroga(wrog);
    const kolory = aktywneKoloryWroga(wrog, teraz);
    const trojkat = wrog.typ === "ranged";
    const katTrojkata = trojkat ? Math.atan2(postac.y - wrog.y, postac.x - wrog.x) : 0;

    if (trojkat) rysujTrojkatWroga(wrog.x, wrog.y, promien, katTrojkata, kolory);
    else rysujKoloWroga(wrog.x, wrog.y, promien, kolory);

    ctx.lineWidth = wrog.typ === "arcyboss" ? 5 : (wrog.typ === "boss" ? 3 : 1.5);
    ctx.strokeStyle = wrog.typ === "arcyboss" ? "rgba(255,215,0,0.9)" : "rgba(255,255,255,0.6)";
    if (trojkat) {
      sciezkaTrojkata(wrog.x, wrog.y, promien, katTrojkata);
    } else {
      ctx.beginPath();
      ctx.arc(wrog.x, wrog.y, promien, 0, Math.PI * 2);
    }
    ctx.stroke();

    if (wrog.odporny) {
      if (trojkat) rysujKolceTrojkata(wrog.x, wrog.y, promien, katTrojkata);
      else rysujKolceOdpornego(wrog.x, wrog.y, promien);
    }

    if (wrog.id === wybranyWrogId) {
      ctx.beginPath();
      ctx.arc(wrog.x, wrog.y, promien * (trojkat ? MNOZNIK_ROZMIARU_TROJKATA : 1) + 8, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ff4d4d";
      ctx.stroke();
    }

    const szerokoscPaska = promien * 2;
    const x0 = wrog.x - promien;
    const y0 = wrog.y - promien - 10;
    const procent = Math.max(0, wrog.hp / wrog.maxHp);

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x0, y0, szerokoscPaska, 5);
    ctx.fillStyle = wrog.typ === "arcyboss" ? "#ffd700" : (wrog.typ === "boss" ? "#c04dff" : "#5fd97a");
    ctx.fillRect(x0, y0, szerokoscPaska * procent, 5);
  });

  pociski.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffe066";
    ctx.fill();
  });

  pociskiGracza.forEach(p => {
    if (p.typ === "magiczna") {
      // fioletowa łza, nieco większa od zwykłej strzały: okrągły czubek z zaostrzonym ogonem
      const r = 7;
      const dlugoscOgona = 34;
      const px = -p.dy;
      const py = p.dx;
      ctx.beginPath();
      ctx.moveTo(p.x - p.dx * dlugoscOgona, p.y - p.dy * dlugoscOgona);
      ctx.lineTo(p.x + px * r, p.y + py * r);
      ctx.lineTo(p.x - px * r, p.y - py * r);
      ctx.closePath();
      ctx.fillStyle = "#a54dff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = "#b866ff";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#e6ccff";
      ctx.stroke();
      return;
    }

    if (p.typ === "odlamek") {
      // mniejsza, błękitna wersja zwykłej strzały
      ctx.beginPath();
      ctx.moveTo(p.x - p.dx * 13, p.y - p.dy * 13);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = "#5cc8ff";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#d6f3ff";
      ctx.fill();
      return;
    }

    const dlugoscStrzaly = 22;
    const xTyl = p.x - p.dx * dlugoscStrzaly;
    const yTyl = p.y - p.dy * dlugoscStrzaly;

    ctx.beginPath();
    ctx.moveTo(xTyl, yTyl);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = p.typ === "boczna" ? "#8fe36f" : "#eaffd0";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = p.typ === "boczna" ? "#c9ffb0" : "#ffffff";
    ctx.fill();
  });

  efekty.forEach(e => {
    if (e.typ === "wybuch") {
      const postep = Math.max(0, e.zycie / e.zycieMax);
      const alpha = postep;
      const promienAktualny = e.promien * (1 - 0.4 * (1 - postep));

      ctx.beginPath();
      ctx.arc(e.x, e.y, promienAktualny, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${e.rgb || KOLOR_WYBUCHU_OGNIA}, ${0.18 * alpha})`;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(${e.rgb || KOLOR_WYBUCHU_OGNIA}, ${0.9 * alpha})`;
      ctx.stroke();
    } else if (e.typ === "linia") {
      ctx.beginPath();
      ctx.moveTo(e.x1, e.y1);
      ctx.lineTo(e.x2, e.y2);
      ctx.strokeStyle = `rgba(${e.rgb || KOLOR_LINII_ZWYKLEJ},${Math.max(0, e.zycie / e.zycieMax)})`;
      ctx.lineWidth = e.rgb === KOLOR_LINII_ELEKTRYCZNEJ ? 3 : 2;
      ctx.stroke();
    } else {
      ctx.globalAlpha = Math.max(0, e.zycie / e.zycieMax);
      ctx.font = `bold ${e.rozmiar || 14}px Arial`;
      ctx.textAlign = "center";

      const tx = e.x;
      const ty = e.y - (e.zycieMax - e.zycie) / 15;

      ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(3, (e.rozmiar || 14) / 4);
      ctx.strokeStyle = "#000";
      ctx.strokeText(e.tekst, tx, ty);

      ctx.fillStyle = e.kolor;
      ctx.fillText(e.tekst, tx, ty);
      ctx.globalAlpha = 1;
    }
  });

  // Pulsowanie areny podczas Wskrzeszenia (3s nietykalności/unieruchomienia wrogów)
  if (teraz < wskrzeszenieDoCzasu) {
    const pozostaleSek = (wskrzeszenieDoCzasu - teraz) / 3000; // 1 -> 0, zanikające pod koniec
    const puls = 0.22 + 0.18 * Math.sin(teraz / 110);
    ctx.fillStyle = `rgba(255, 215, 0, ${Math.max(0, puls * pozostaleSek)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Czerwony błysk brzegów areny po otrzymaniu obrażeń (środek pozostaje przezroczysty)
  if (blyskObrazenMs > 0) {
    const w = canvas.width, h = canvas.height;
    const sila = blyskObrazenMs / CZAS_BLYSKU_OBRAZEN_MS;
    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) / 2);
    grad.addColorStop(0, "rgba(255, 0, 0, 0)");
    grad.addColorStop(1, `rgba(255, 0, 0, ${0.55 * sila})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
}

/* ============================================================
   PANEL WYBRANEGO WROGA (klik LPM na wroga) — pasek PŻ + pancerz
   ============================================================ */

let wybranyWrogId = null;

const NAZWY_TYPOW_WROGOW = {
  melee: "Wróg",
  ranged: "Wróg dystansowy",
  boss: "BOSS",
  arcyboss: "ARCYBOSS"
};

function aktualizujPanelWroga() {
  const panel = document.getElementById("wrog-panel");
  if (!panel) return;

  const wrog = wybranyWrogId === null ? null : wrogowie.find(w => w.id === wybranyWrogId && w.hp > 0);
  if (!wrog) {
    wybranyWrogId = null;
    panel.classList.remove("visible");
    return;
  }

  const procent = wrog.maxHp > 0 ? Math.max(0, Math.min(100, (wrog.hp / wrog.maxHp) * 100)) : 0;
  document.getElementById("wrog-hp-fill").style.width = `${procent}%`;
  document.getElementById("wrog-hp-tekst").textContent = `${fmtLiczbaPL(Math.max(0, wrog.hp))} / ${fmtLiczbaPL(wrog.maxHp)}`;
  document.getElementById("wrog-nazwa").textContent = (NAZWY_TYPOW_WROGOW[wrog.typ] || "Wróg") + (wrog.odporny ? " (odporny)" : "");
  document.getElementById("wrog-pancerz").textContent = fmtLiczbaPL(wrog.pancerz);
  panel.classList.add("visible");
}

canvas.addEventListener("mousedown", event => {
  if (event.button !== 0) return;

  // Canvas jest skalowany razem ze sceną — przelicz pozycję kliknięcia na piksele canvasa.
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const mx = (event.clientX - rect.left) * (canvas.width / rect.width);
  const my = (event.clientY - rect.top) * (canvas.height / rect.height);

  let wybrany = null;
  let najmniejszyDystans = Infinity;
  wrogowie.forEach(wrog => {
    if (wrog.hp <= 0) return;
    const d = Math.hypot(mx - wrog.x, my - wrog.y);
    const zasiegKlikniecia = promienWroga(wrog) * (wrog.typ === "ranged" ? MNOZNIK_ROZMIARU_TROJKATA : 1) + 8;
    if (d <= zasiegKlikniecia && d < najmniejszyDystans) {
      najmniejszyDystans = d;
      wybrany = wrog;
    }
  });

  wybranyWrogId = wybrany ? wybrany.id : null;
  aktualizujPanelWroga();
  rysujGre();
});

function petlaGry(teraz) {
  if (!graTrwa) return;

  const realDtMs = ostatniCzas ? teraz - ostatniCzas : 16;
  ostatniCzas = teraz;
  const dtMs = realDtMs * mnoznikPredkosciGry;
  zegarGryMs += dtMs;
  const czasWirtualny = zegarGryMs;

  czasGryMs += dtMs;
  aktualizujCzasGry();

  aktualizujRuchGracza(dtMs);
  aktualizujRegeneracjePz(dtMs);

  czasDoSpawnu -= dtMs;
  if (!falaArcybossAktywna && czasDoSpawnu <= 0) {
    stworzWroga();
    czasDoSpawnu = czasSpawnuMs();
  }

  czasDoAtakuGracza -= dtMs;
  if (czasDoAtakuGracza <= 0) {
    atakGracza();
    czasDoAtakuGracza = pobierzCzasAtakuGracza();
  }

  przetworzZaplanowaneAkcje();

  wrogowie.forEach(wrog => aktualizujWroga(wrog, dtMs, czasWirtualny));
  aktualizujKrwawienieWrogow(czasWirtualny);
  aktualizujPodpalenia(czasWirtualny);
  aktualizujPociski(dtMs);
  aktualizujPociskiGracza(dtMs);
  aktualizujEfekty(dtMs);
  aktualizujPanelWroga();

  rysujGre();
  requestAnimationFrame(petlaGry);
}

function rozpocznijGre() {
  if (!stan[1].staty || Object.keys(stan[1].wylosowane).length === 0) {
    log("⚠️ Wylosuj najpierw ekwipunek!", "log-info");
    return;
  }

  wrogowie = [];
  pociski = [];
  pociskiGracza = [];
  efekty = [];
  liczbaZabitych = 0;
  renderujStatyGracza();
  bossAktywny = false;
  falaArcybossAktywna = false;
  nastepnyProgArcybossa = PROG_FALI_ARCYBOSSA;
  arcybossyPokonane = 0;
  numerFaliArcybossa = 0;
  czasDoSpawnu = 500;
  czasGryMs = 0;
  zegarGryMs = 0;
  zaplanowaneAkcje = [];
  licznikAtakowMagicznej = 0;
  if (typeof resetujUmiejetnosci === "function") resetujUmiejetnosci(); // monety i umiejętności od zera
  rundaStaty = nowaRundaStaty();
  ukryjEkranKoncowy();
  blyskObrazenMs = 0;
  aktualizujCzasGry();
  czasDoAtakuGracza = pobierzCzasAtakuGracza();
  ostatniCzas = 0;
  licznikRegeneracjiMs = 0;
  wykorzystaneWskrzeszenie = false;
  wskrzeszenieDoCzasu = 0;

  ulepszoneItemySet.clear();
  stan[1].ulepszeniaAffixy = {};
  stan[1].bonusyAffixy = []; // nowa gra = bez bonusów z kart
  const bonusOverlay = document.getElementById("wybor-bonusu-overlay");
  if (bonusOverlay) bonusOverlay.classList.remove("visible");
  zamienPasywkeStrzaly("Zwykła strzała"); // nowa gra = strzała znów nieulepszona
  obliczStatystyki(1);
  utworzItemy(1);

  postac.maxHp = stan[1].staty.pz;
  postac.hp = postac.maxHp;
  aktualizujPasekPostaci();
  aktualizujInfo();

  if (logGry) logGry.innerHTML = "";
  log("⚔️ Fale wrogów nadciągają!", "log-info");

  graTrwa = true;
  graWToku = true;
  ustawPrzyciski("gra");
  requestAnimationFrame(petlaGry);
}

function przelaczPauze() {
  if (btnPauza.disabled) return;
  // Okno wyboru ulepszenia (po 4. i każdym kolejnym Arcybossie) ma
  // pierwszeństwo — bez tej blokady PAUZA dałaby się wznowić grę "pod"
  // wciąż otwartym oknem wyboru, zanim gracz cokolwiek wybierze.
  if (oczekiwanieNaUlepszenieItemu) return;

  if (graTrwa) {
    graTrwa = false;
    ustawPrzyciski("pauza");
  } else {
    graTrwa = true;
    ostatniCzas = 0;
    ustawPrzyciski("gra");
    requestAnimationFrame(petlaGry);
  }
}

/* ============================================================
   EKRAN KOŃCA GRY (Porażka / Zwycięstwo) — tylko na obszarze areny
   ============================================================ */

let rundaStaty = nowaRundaStaty();
let animacjaEkranuKoncowegoId = 0;

function nowaRundaStaty() {
  return {
    obrazenia: 0,        // suma wszystkich zadanych obrażeń
    ataki: 0,            // liczba trafień (strzały + ogniwa łańcucha)
    kryty: 0,
    przeszywki: 0,
    trucizna: 0,         // dodatkowe obrażenia z trucizny
    krwawienie: 0,       // obrażenia z tików krwawienia
    omdlenia: 0,         // ile razy ogłuszyłeś wroga
    wyleczono: 0,        // kradzież życia + regeneracja
    najwiekszyCios: 0,
    bloki: 0,
    otrzymane: 0,
    magiczne: 0,         // część "obrazenia" zadana jako obrażenia magiczne (reszta = fizyczne)
    // Obrażenia zadane przez poszczególne umiejętności pasywne (tooltip w oknie umiejętności)
    umiej: { elektryczna: 0, ognista: 0, odlamkowa: 0, magiczna: 0, potrojna: 0, wampiryczna: 0 }
  };
}

/* Dolicza obrażenia do licznika danej umiejętności (resetuje się z rundaStaty przy nowej grze). */
function dodajDmgUmiejetnosci(id, dmg) {
  if (rundaStaty && rundaStaty.umiej && id in rundaStaty.umiej) rundaStaty.umiej[id] += dmg;
}

/* Ile obrażeń dana umiejętność zadała w tej grze — czyta okno umiejętności. */
function zadaneObrazeniaUmiejetnosci(id) {
  return (rundaStaty && rundaStaty.umiej && rundaStaty.umiej[id]) || 0;
}

function fmtLiczbaPL(n) {
  return Math.round(n || 0).toLocaleString("pl-PL");
}

function fmtProcentOd(czesc, calosc) {
  if (!calosc) return "0%";
  return `${(czesc / calosc * 100).toFixed(1).replace(".", ",")}%`;
}

function animujLiczbeEkranu(el, wartosc, czasMs, opoznienieMs, token) {
  if (!el) return;
  el.textContent = "0";
  const start = performance.now() + opoznienieMs;
  function krok(teraz) {
    if (token !== animacjaEkranuKoncowegoId) return; // przerwane (nowa gra)
    const t = Math.max(0, Math.min(1, (teraz - start) / czasMs));
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = fmtLiczbaPL(wartosc * ease);
    if (t < 1) requestAnimationFrame(krok);
    else el.textContent = fmtLiczbaPL(wartosc);
  }
  requestAnimationFrame(krok);
}

function ustawTekstEkranu(id, tekst) {
  const el = document.getElementById(id);
  if (el) el.textContent = tekst;
}

function pokazEkranKoncowy(wygrana) {
  const overlay = document.getElementById("porazka-overlay");
  if (!overlay) return;

  const rs = rundaStaty;
  animacjaEkranuKoncowegoId += 1;
  const token = animacjaEkranuKoncowegoId;

  ustawTekstEkranu("por-tytul", wygrana ? "Zwycięstwo" : "Zginąłeś");
  overlay.classList.toggle("wygrana", !!wygrana);

  const magiczne = rs.magiczne || 0;
  const fizyczne = Math.max(0, rs.obrazenia - magiczne);
  ustawTekstEkranu("por-fiz", fmtLiczbaPL(fizyczne));
  ustawTekstEkranu("por-fiz-p", `(${fmtProcentOd(fizyczne, rs.obrazenia)})`);
  ustawTekstEkranu("por-mag", fmtLiczbaPL(magiczne));
  ustawTekstEkranu("por-mag-p", `(${fmtProcentOd(magiczne, rs.obrazenia)})`);

  ustawTekstEkranu("por-kryty", fmtLiczbaPL(rs.kryty));
  ustawTekstEkranu("por-kryty-p", `(${fmtProcentOd(rs.kryty, rs.ataki)})`);
  ustawTekstEkranu("por-przeszywki", fmtLiczbaPL(rs.przeszywki));
  ustawTekstEkranu("por-przeszywki-p", `(${fmtProcentOd(rs.przeszywki, rs.ataki)})`);
  ustawTekstEkranu("por-trucizna", fmtLiczbaPL(rs.trucizna));
  ustawTekstEkranu("por-krwawienie", fmtLiczbaPL(rs.krwawienie));
  ustawTekstEkranu("por-omdlenia", `${fmtLiczbaPL(rs.omdlenia)} ${rs.omdlenia === 1 ? "raz" : "razy"}`);
  ustawTekstEkranu("por-wyleczono", `${fmtLiczbaPL(rs.wyleczono)} PŻ`);

  ustawTekstEkranu("por-czas", formatCzasuGry(czasGryMs));
  ustawTekstEkranu("por-zabici", fmtLiczbaPL(liczbaZabitych));
  ustawTekstEkranu("por-arcybossy", fmtLiczbaPL(arcybossyPokonane));
  ustawTekstEkranu("por-cios", fmtLiczbaPL(rs.najwiekszyCios));
  ustawTekstEkranu("por-bloki", fmtLiczbaPL(rs.bloki));

  // Liczby „nabijają się" od zera, gdy okno już się pojawi
  animujLiczbeEkranu(document.getElementById("por-suma"), rs.obrazenia, 1400, 700, token);
  animujLiczbeEkranu(document.getElementById("por-ataki"), rs.ataki, 1000, 900, token);

  // restart animacji CSS przy kolejnej porażce
  overlay.classList.remove("visible");
  void overlay.offsetWidth;
  overlay.classList.add("visible");
  overlay.setAttribute("aria-hidden", "false");
  if (canvas) canvas.classList.add("porazka-przygaszona");
}

function ukryjEkranKoncowy() {
  animacjaEkranuKoncowegoId += 1;
  const overlay = document.getElementById("porazka-overlay");
  if (overlay) {
    overlay.classList.remove("visible");
    overlay.setAttribute("aria-hidden", "true");
  }
  if (canvas) canvas.classList.remove("porazka-przygaszona");
}

function zakonczGre(wygrana) {
  graTrwa = false;
  graWToku = false;
  ustawPrzyciski("przed");

  if (!wygrana) {
    stan[1].zmianki = 0;
    aktualizujZmianki();
  }

  log(wygrana ? "🏆 WYGRANA!" : "💀 PRZEGRANA — polegasz na arenie.", "log-zwyciestwo");
  pokazEkranKoncowy(wygrana);
}

function inicjalizujSurvivora() {
  TRYB_SURVIVOR = true;
  kolejnoscOdblokowaniaItemow = zbudujKolejnoscOdblokowaniaItemow();

  stan[1].odblokowaneItemy = new Set(ITEMY_START_AKTYWNE);
  stan[1].zmianki = 0;

  utworzItemy(1);
  ITEMY_START_AKTYWNE.forEach(id => {
    losujItem(1, id, false, iloscOdblokowanychAffixowDlaItemu(id), true);
  });

  aktualizujZmianki();
  aktualizujInfo();
}

dopasujStage();
dopasujCanvas();
inicjalizujSurvivora();

let wikiOtwarta = false;
function wikiEsc(tekst) { return String(tekst ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
function formatZakresAffixu(affix) { if (!affix) return ""; const suffix = affix.suffix || ""; const min = `${affix.min}${suffix}`; const max = `${affix.max}${suffix}`; return min === max ? min : `${min} – ${max}`; }
const WIKI_SKROTY_AFFIXOW = { "Podstawowe obrażenia": "Podst. obrażenia", "Obrażenia umiejętności": "Obrażenia umiej." };
function wikiAffixHtml(affix, stale) { return `<div class="wiki-affix${stale ? " wiki-affix-stale" : ""}" data-affix="${wikiEsc(affix.nazwa)}"><span class="wiki-affix-nazwa">${wikiEsc(WIKI_SKROTY_AFFIXOW[affix.nazwa] || affix.nazwa)}</span><span class="wiki-affix-zakres"> ${wikiEsc(formatZakresAffixu(affix))}</span></div>`; }
function wikiTekstUlepszenia(item) { const nazwa = (typeof MAPA_ULEPSZEN_ITEMOW !== "undefined") ? MAPA_ULEPSZEN_ITEMOW[item.nazwa] : null; if (!nazwa) return ""; const def = znajdzAffix(nazwa); return (def && def.tekstTooltip) || nazwa; }
function zbudujWikiItem(item) {
  // Affixy stałe (na górze, lekko pogrubione), potem pozostałe możliwe — bez duplikatów.
  const nazwyStale = Array.isArray(item.staleAffixy) ? item.staleAffixy : (item.stalyAffix ? [item.stalyAffix] : []);
  const stale = nazwyStale.map(nazwa => znajdzAffix(nazwa)).filter(Boolean);
  const nazwyStaleSet = new Set(stale.map(a => a.nazwa));
  const mozliwe = (item.mozliweAffixy || []).map(nazwa => znajdzAffix(nazwa)).filter(Boolean).filter(a => !nazwyStaleSet.has(a.nazwa));
  const wszystkie = stale.map(a => wikiAffixHtml(a, true)).concat(mozliwe.map(a => wikiAffixHtml(a, false)));
  const affixyHtml = wszystkie.length ? wszystkie.join("") : `<div class="wiki-brak">Brak możliwych affixów</div>`;
  const tekstUlepszenia = wikiTekstUlepszenia(item);
  const ulepszenieHtml = tekstUlepszenia ? `<div class="wiki-ulepszenie">${wikiEsc(tekstUlepszenia)}</div>` : "";
  return `<article class="wiki-item"><img class="wiki-item-obraz" src="${wikiEsc(item.obraz)}" alt="${wikiEsc(item.nazwa)}"><div class="wiki-item-tresc"><div class="wiki-item-nazwa">${wikiEsc(item.nazwa)}</div>${affixyHtml}${ulepszenieHtml}</div></article>`;
}
function wypelnijWiki() { const grid = document.getElementById("wiki-grid"); if (!grid || typeof itemy === "undefined") return; 
  // Kolejność jak w ekwipunku (od lewej-góry, wiersz po wierszu) — jawna lista, niezależna od config.js.
  const KOLEJNOSC_WIKI = ["strzala", "helm", "kolczyki", "naszyjnik", "rekawice", "zbroja", "naramienniki", "bransoleta", "bron", "spodnie", "buty", "pierscien"];
  const miejsce = nazwa => { const i = KOLEJNOSC_WIKI.indexOf(nazwa); return i === -1 ? 999 : i; };
  const wgEkwipunku = Object.values(itemy).slice().sort((a, b) => miejsce(a.nazwa) - miejsce(b.nazwa));
  grid.innerHTML = wgEkwipunku.map(zbudujWikiItem).join(""); }
/*
  Wikipedia pauzuje grę, ale tylko jeśli ta faktycznie trwała (nie była już
  spauzowana ręcznie, nie czekała na wybór ulepszenia i nie była nierozpoczęta).
  Po zamknięciu wznawia ją tylko wtedy, gdy to właśnie wiki ją zatrzymała.
*/
let wikiZatrzymalaGre = false;

function otworzWiki() { const overlay = document.getElementById("wiki-overlay"); if (!overlay) return; if (wikiOtwarta) return;
  if (graTrwa && !oczekiwanieNaUlepszenieItemu) { graTrwa = false; ustawPrzyciski("pauza"); wikiZatrzymalaGre = true; }
  wypelnijWiki(); wyczyscPodswietlenieWiki(); overlay.classList.add("visible"); overlay.setAttribute("aria-hidden", "false"); wikiOtwarta = true; document.body.classList.add("wiki-aktywna"); }
function zamknijWiki() { const overlay = document.getElementById("wiki-overlay"); if (!overlay) return; overlay.classList.remove("visible"); overlay.setAttribute("aria-hidden", "true"); wikiOtwarta = false; document.body.classList.remove("wiki-aktywna");
  wyczyscPodswietlenieWiki();
  if (wikiZatrzymalaGre) {
    wikiZatrzymalaGre = false;
    if (!graTrwa && !oczekiwanieNaUlepszenieItemu) { graTrwa = true; ostatniCzas = 0; ustawPrzyciski("gra"); requestAnimationFrame(petlaGry); }
  }
}

/*
  Najechanie na dowolny affix w wiki: wszystkie takie same affixy zostają w
  swoim kolorze, pozostałe robią się szare (klasy wiki-filtr / wiki-pasuje,
  style w survivor.css). Dzięki temu widać od razu, które itemy mają dany affix.
*/
function podswietlWikiAffix(nazwa) {
  const grid = document.getElementById("wiki-grid");
  if (!grid) return;
  grid.classList.add("wiki-filtr");
  grid.querySelectorAll(".wiki-affix").forEach(el => el.classList.toggle("wiki-pasuje", el.dataset.affix === nazwa));
}

function wyczyscPodswietlenieWiki() {
  const grid = document.getElementById("wiki-grid");
  if (!grid) return;
  grid.classList.remove("wiki-filtr");
  grid.querySelectorAll(".wiki-pasuje").forEach(el => el.classList.remove("wiki-pasuje"));
}

(function () {
  const grid = document.getElementById("wiki-grid");
  if (!grid) return;
  grid.addEventListener("mouseover", event => {
    const affix = event.target.closest && event.target.closest(".wiki-affix");
    if (affix) podswietlWikiAffix(affix.dataset.affix);
    else wyczyscPodswietlenieWiki();
  });
  grid.addEventListener("mouseleave", wyczyscPodswietlenieWiki);
})();
document.addEventListener("keydown", event => { if (event.key === "Escape" && wikiOtwarta) zamknijWiki(); });