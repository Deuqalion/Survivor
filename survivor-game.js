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
const CZAS_OGLUSZENIA_MS = 2500;
const PROMIEN_OGNIA = 110;
const SZANSA_PROCKA_STRZALY = 33;
const CZAS_TRWANIA_WYBUCHU_MS = 350;

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

const canvas = document.getElementById("gra-canvas");
const ctx = canvas.getContext("2d");

const postac = { x: 0, y: 0, hp: 0, maxHp: 0 };

let wrogowie = [];
let pociski = [];
let pociskiGracza = [];
let efekty = [];
let nastepneIdWroga = 1;

let graTrwa = false;
let ostatniCzas = 0;
let czasDoSpawnu = 0;
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
let wskrzeszenieDoCzasu = 0; // performance.now() do kiedy trwa pulsowanie areny

/* ============================================================
   FUNKCJA OBLICZANIA STATYSTYK GRACZA (ZABEZPIECZONA PRZED NaN)
   ============================================================ */

function obliczStatystyki(gracz) {
  let pz = 15000;
  let podstawoweObrażenia = 3000;
  let obrazeniaUmiejetnosci = 0;
  let kryt = 5;
  let przeszywka = 5;
  let omdlenie = 1;
  let blok = 1;
  let otrucie = 1;
  let krwawienie = 1;
  let dodatkowePz = 0;
  let wartoscAtaku = 0;
  let pancerz = 5;
  let kradziezZycia = 0;
  let predkoscAtaku = 0;
  let predkoscRuchuBonus = 0;
  let regeneracjaPzSek = 0;
  let wskrzeszenieDostepne = false;

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
  const wszystkieListyAffixow = Object.values(wylosowaneItemy)
    .concat(Object.values(ulepszeniaAffixy).map(affix => [affix]));

  wszystkieListyAffixow.forEach(affixyList => {
    if (!affixyList) return;

    affixyList.forEach(affix => {
      const val = Number(affix.wartosc) || 0;
      const nazwa = affix.nazwa;

      if (nazwa === "Podstawowe PŻ") pz = val;
      else if (nazwa === "Podstawowe obrażenia") podstawoweObrażenia = val;
      else if (nazwa === "Obrażenia umiejętności" || nazwa === "Obrażenia umiejętności: +10%") obrazeniaUmiejetnosci += val;
      else if (nazwa === "Szansa na kryta" || nazwa === "Szansa na kryta: 10%") kryt += val;
      else if (nazwa === "Szansa na przeszywkę" || nazwa === "Szansa na przeszywkę: 10%") przeszywka += val;
      else if (nazwa === "Szansa na omdlenie" || nazwa === "Szansa na omdlenie: 10%") omdlenie += val;
      else if (nazwa === "Szansa na blok") blok += val;
      else if (nazwa === "Szansa na otrucie" || nazwa === "Szansa na otrucie: 10%") otrucie += val;
      else if (nazwa === "Szansa na krwawienie") krwawienie += val;
      else if (nazwa === "Dodatkowe PŻ" || nazwa === "Dodatkowe PŻ: 4000") dodatkowePz += val;
      else if (nazwa === "Wartość ataku" || nazwa === "Wartość ataku: +150") wartoscAtaku += val;
      else if (nazwa === "Pancerz" || nazwa === "Pancerz: 35") pancerz += val;
      else if (nazwa === "Kradzież życia") kradziezZycia += val;
      else if (nazwa === "Prędkość ataku" || nazwa === "Prędkość ataku: +20%") predkoscAtaku += val;
      else if (nazwa === "Prędkość ruchu: +15%") predkoscRuchuBonus += val;
      else if (nazwa === "Regeneracja PŻ 5%/sek") regeneracjaPzSek += val;
      else if (nazwa === "Wskrzeszenie") wskrzeszenieDostepne = true;

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

  const finalnePz = Math.round((pz + dodatkowePz) * (1 + wzmocnieniePz / 100));
  const finalnyPancerz = Math.round(pancerz * (1 + wzmocnieniePancerza / 100));

  stan[gracz].staty = {
    pz: isNaN(finalnePz) ? 15000 : finalnePz,
    podstawoweObrażenia: isNaN(podstawoweObrażenia) ? 3000 : podstawoweObrażenia,
    wartoscAtaku: isNaN(wartoscAtaku) ? 0 : wartoscAtaku,
    bazoweObrazenia: (isNaN(podstawoweObrażenia) ? 3000 : podstawoweObrażenia) + (isNaN(wartoscAtaku) ? 0 : wartoscAtaku),
    obrazeniaUmiejetnosci: isNaN(obrazeniaUmiejetnosci) ? 0 : obrazeniaUmiejetnosci,
    kryt: isNaN(kryt) ? 5 : kryt,
    przeszywka: isNaN(przeszywka) ? 5 : przeszywka,
    omdlenie: isNaN(omdlenie) ? 1 : omdlenie,
    blok: isNaN(blok) ? 1 : blok,
    otrucie: isNaN(otrucie) ? 1 : otrucie,
    krwawienie: isNaN(krwawienie) ? 1 : krwawienie,
    pancerz: isNaN(finalnyPancerz) ? 5 : finalnyPancerz,
    kradziezZycia: isNaN(kradziezZycia) ? 0 : kradziezZycia,
    predkoscAtaku: isNaN(predkoscAtaku) ? 0 : predkoscAtaku,
    predkoscRuchuBonus: isNaN(predkoscRuchuBonus) ? 0 : predkoscRuchuBonus,
    regeneracjaPzSek: isNaN(regeneracjaPzSek) ? 0 : regeneracjaPzSek,
    wskrzeszenieDostepne: !!wskrzeszenieDostepne,
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
  "bron": "Obrażenia umiejętności: +10%",
  "buty": "Prędkość ruchu: +15%",
  "helm": "Regeneracja PŻ 5%/sek",
  "zbroja": "Wskrzeszenie",
  "naramienniki": "Dodatkowe PŻ: 4000",
  "rekawice": "Prędkość ataku: +20%",
  "spodnie": "Pancerz: 35",
  "kolczyki": "Szansa na kryta: 10%",
  "naszyjnik": "Szansa na przeszywkę: 10%",
  "bransoleta": "Szansa na otrucie: 10%",
  "pierscien": "Szansa na omdlenie: 10%",
  "strzala": "Wartość ataku: +150"
};

let oczekiwanieNaUlepszenieItemu = false;
let ulepszoneItemySet = new Set();

function sprawdzWywołanieUlepszenia() {
  if (arcybossyPokonane >= 4 && !oczekiwanieNaUlepszenieItemu) {
    otworzOknoUlepszeniaItemu();
  }
}

function otworzOknoUlepszeniaItemu() {
  oczekiwanieNaUlepszenieItemu = true;
  graTrwa = false;

  let overlay = document.getElementById("wybor-ulepszenia-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "wybor-ulepszenia-overlay";
    overlay.innerHTML = `
      <div class="ulepszenie-okno-kontener">
        <div class="ulepszenie-tytul">ULEPSZ PRZEDMIOT</div>
        <div id="ulepszenie-grid"></div>
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
    el.setAttribute("data-tooltip-ulepszenia", nazwaAffixuUlepszenia || "Ulepszenie");
    
    el.innerHTML = `
      <img src="${item.obraz}" alt="${item.nazwa}">
    `;

    if (!czyUlepszony) {
      el.addEventListener("click", () => wykonajUlepszenieItemu(id));
    }
    grid.appendChild(el);
  });
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

function czasSpawnuMs() {
  return arcybossyPokonane >= ARCYBOSSY_DO_ULEPSZENIA
    ? CZAS_SPAWNU_MS * MNOZNIK_CZASU_SPAWNU_PO_ULEPSZENIU
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
window.addEventListener("keyup", event => ustawKlawisz(event.code, false));

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

const infoEl = document.getElementById("survivor-info");

function aktualizujHudPostaci(graczId) {
  if (graczId !== 1) return;
  if (typeof renderujStatyGracza === "function") renderujStatyGracza();

  const staty = stan[1].staty;
  if (!staty) return;

  postac.maxHp = staty.pz;
  if (!graTrwa) postac.hp = postac.maxHp;
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
    ostatniAtak: performance.now(),
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
  if (performance.now() < wskrzeszenieDoCzasu) return;

  const staty1 = stan[1].staty;
  if (!staty1) return;

  if (losujProcent() < (staty1.blok || 0)) {
    log("🔰 BLOKUJESZ atak wroga! (0 obrażeń)", "log-blok");
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
  aktualizujPasekPostaci();

  if (postac.hp <= 0) {
    if (staty1.wskrzeszenieDostepne && !wykorzystaneWskrzeszenie) {
      wykorzystaneWskrzeszenie = true;
      postac.hp = Math.round(postac.maxHp * 0.75);
      aktualizujPasekPostaci();

      const teraz = performance.now();
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
    postac.hp = Math.min(postac.maxHp, postac.hp + leczenie);
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

function wykonajPojedynczyAtak(cel, staty1, xZrodla, yZrodla, mnoznikPrzebicia = 1) {
  if (!cel || cel.hp <= 0) return 0;

  const podstObrazenia = staty1.podstawoweObrażenia || 3000;
  const losowePodstawoweObrazenia = losujLiczbe(
    Math.max(0, podstObrazenia - ROZRZUT_PODSTAWOWYCH_OBRAZEN),
    podstObrazenia + ROZRZUT_PODSTAWOWYCH_OBRAZEN
  );

  const dmgBazowe = (losowePodstawoweObrazenia + (staty1.wartoscAtaku || 0) + bonusObrazenZZabojstw()) * (1 + (staty1.obrazeniaUmiejetnosci || 0) / 100);

  const truciznaAktywna = cel.zatruteAtaki > 0;
  if (truciznaAktywna) cel.zatruteAtaki -= 1;
  const mnoznikTrucizny = truciznaAktywna ? 1 + TRUCIZNA_BONUS + ((staty1.obrazeniaTrucizny || 0) / 100) : 1;

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
  const dmg = Math.round(dmgBazowe * mnoznikTrucizny * mnoznikKryta * redukcja * mnoznikPrzebicia * mnoznikOdpornosci);

  cel.hp -= dmg;

  let dmgWyswietlany = dmg;
  let dmgTrucizny = 0;
  if (truciznaAktywna) {
    const dmgBezTrucizny = Math.round(dmgBazowe * mnoznikKryta * redukcja * mnoznikPrzebicia * mnoznikOdpornosci);
    dmgTrucizny = Math.max(0, dmg - dmgBezTrucizny);
    if (dmgTrucizny > 0) dmgWyswietlany = dmgBezTrucizny;
  }

  dodajEfektAtaku(cel.x, cel.y, dmgWyswietlany, {
    dmgTrucizny,
    kryt,
    przeszywka: przeszywkaAktywna,
    xZrodla,
    yZrodla
  });

  if ((staty1.kradziezZycia || 0) > 0) {
    const skradzione = Math.round(dmg * staty1.kradziezZycia / 100);
    postac.hp = Math.min(postac.maxHp, postac.hp + skradzione);
    aktualizujPasekPostaci();
  }

  if (losujProcent() < (staty1.otrucie || 0)) cel.zatruteAtaki = TRUCIZNA_LICZBA_ATAKOW;
  // ARCYBOSSY są odporne na omdlenie (zwykłe moby i Bossy nie).
  if (cel.typ !== "arcyboss" && losujProcent() < (staty1.omdlenie || 0)) cel.ogluszonyDoCzasu = performance.now() + CZAS_OGLUSZENIA_MS;
  if (losujProcent() < (staty1.krwawienie || 0)) {
    // Pierwszy tik dopiero po 0,5s (tylko gdy nie krwawił już wcześniej —
    // ponowny proc odświeża czas trwania, ale nie resetuje rytmu tików).
    if (cel.krwawienieTury <= 0) cel.ostatniTikKrwawienia = performance.now();
    cel.krwawienieTury = KRWAWIENIE_LICZBA_TIKOW;
  }

  if (cel.hp <= 0) zabijWroga(cel);
  return dmg;
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
}

function trafienieStrzalaGracza(cel, staty1, pocisk) {
  const dmg = wykonajPojedynczyAtak(cel, staty1, pocisk.x, pocisk.y, pocisk.mnoznikPrzebicia);

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
      dodajEfektAtaku(wrog.x, wrog.y, dmgPoPancerzu, { xZrodla: cel.x, yZrodla: cel.y });
      if (wrog.hp <= 0) zabijWroga(wrog);
    });
  }

  if ((staty1.elektrycznaStrzala || 0) > 0 && losujProcent() < SZANSA_PROCKA_STRZALY) {
    let poprzedniCel = cel;
    const wykluczone = new Set([cel.id]);
    for (let i = 0; i < staty1.elektrycznaStrzala; i++) {
      const kolejnyCel = znajdzNajblizszegoWrogaOd(poprzedniCel, wykluczone);
      if (!kolejnyCel) break;
      wykluczone.add(kolejnyCel.id);
      wykonajPojedynczyAtak(kolejnyCel, staty1, poprzedniCel.x, poprzedniCel.y);
      poprzedniCel = kolejnyCel;
    }
  }
}

function aktualizujPociskiGracza(dtMs) {
  const staty1 = stan[1].staty;
  pociskiGracza = pociskiGracza.filter(pocisk => {
    pocisk.x += pocisk.dx * PREDKOSC_STRZALY_GRACZA * (dtMs / 1000);
    pocisk.y += pocisk.dy * PREDKOSC_STRZALY_GRACZA * (dtMs / 1000);

    if (staty1) {
      for (const wrog of wrogowie) {
        if (wrog.hp <= 0) continue;
        if (pocisk.trafieni.has(wrog.id)) continue;

        const dystans = Math.hypot(wrog.x - pocisk.x, wrog.y - pocisk.y);
        if (dystans <= promienWroga(wrog) + PROMIEN_TRAFIENIA_STRZALY) {
          pocisk.trafieni.add(wrog.id);
          trafienieStrzalaGracza(wrog, staty1, pocisk);
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

  if (wrog.typ === "boss") log("🏆 Boss pokonany!", "log-zwyciestwo");
  if (wrog.typ === "arcyboss") {
    log("🏆 ARCYBOSS pokonany!", "log-zwyciestwo");
    arcybossyPokonane += 1;

    if (arcybossyPokonane === ARCYBOSSY_DO_ULEPSZENIA) {
      nastepnyProgArcybossa += PROG_FALI_ARCYBOSSA_PO_ULEPSZENIU - PROG_FALI_ARCYBOSSA;
      log("⚡ Wrogowie respią się 2x szybciej, a ARCYBOSSY co 200 zabójstw!", "log-zwyciestwo");
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
    const dmg = Math.round(wrog.maxHp * procentTiku * mnoznikOdpornosci);
    wrog.hp -= dmg;

    dodajEfektAtaku(wrog.x, wrog.y, dmg, { krwawienie: true, xZrodla: wrog.x, yZrodla: wrog.y });
    if (wrog.hp <= 0) zabijWroga(wrog);
  });
}

function aktywneKoloryWroga(wrog, teraz) {
  const kolory = [];
  if (wrog.zatruteAtaki > 0) kolory.push(KOLOR_TRUCIZNA);
  if (teraz < wrog.ogluszonyDoCzasu) kolory.push(KOLOR_OMDLENIE);
  if (wrog.krwawienieTury > 0) kolory.push(KOLOR_KRWAWIENIE);
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
  efekty.push({
    typ: "linia",
    x1: opcje.xZrodla ?? postac.x,
    y1: opcje.yZrodla ?? postac.y,
    x2: x,
    y2: y,
    zycie: 120,
    zycieMax: 120
  });

  let styl;
  let prefix = "";

  if (opcje.krwawienie) {
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

function dodajEfektWybuchu(x, y, promien) {
  efekty.push({
    typ: "wybuch",
    x: x,
    y: y,
    promien: promien,
    zycie: CZAS_TRWANIA_WYBUCHU_MS,
    zycieMax: CZAS_TRWANIA_WYBUCHU_MS
  });
}

function aktualizujEfekty(dtMs) {
  efekty.forEach(e => e.zycie -= dtMs);
  efekty = efekty.filter(e => e.zycie > 0);
}

function rysujGre() {
  if (!canvas.width || !canvas.height) return;
  const teraz = performance.now();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = KOLOR_ARENY;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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
    const dlugoscStrzaly = 22;
    const xTyl = p.x - p.dx * dlugoscStrzaly;
    const yTyl = p.y - p.dy * dlugoscStrzaly;

    ctx.beginPath();
    ctx.moveTo(xTyl, yTyl);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = "#eaffd0";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  });

  efekty.forEach(e => {
    if (e.typ === "wybuch") {
      const postep = Math.max(0, e.zycie / e.zycieMax);
      const alpha = postep;
      const promienAktualny = e.promien * (1 - 0.4 * (1 - postep));

      ctx.beginPath();
      ctx.arc(e.x, e.y, promienAktualny, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 140, 26, ${0.18 * alpha})`;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(255, 140, 26, ${0.9 * alpha})`;
      ctx.stroke();
    } else if (e.typ === "linia") {
      ctx.beginPath();
      ctx.moveTo(e.x1, e.y1);
      ctx.lineTo(e.x2, e.y2);
      ctx.strokeStyle = `rgba(220,255,220,${Math.max(0, e.zycie / e.zycieMax)})`;
      ctx.lineWidth = 2;
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
}

function petlaGry(teraz) {
  if (!graTrwa) return;

  const dtMs = ostatniCzas ? teraz - ostatniCzas : 16;
  ostatniCzas = teraz;

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

  wrogowie.forEach(wrog => aktualizujWroga(wrog, dtMs, teraz));
  aktualizujKrwawienieWrogow(teraz);
  aktualizujPociski(dtMs);
  aktualizujPociskiGracza(dtMs);
  aktualizujEfekty(dtMs);

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
  czasDoAtakuGracza = pobierzCzasAtakuGracza();
  ostatniCzas = 0;
  licznikRegeneracjiMs = 0;
  wykorzystaneWskrzeszenie = false;
  wskrzeszenieDoCzasu = 0;

  ulepszoneItemySet.clear();
  stan[1].ulepszeniaAffixy = {};
  obliczStatystyki(1);
  utworzItemy(1);

  postac.maxHp = stan[1].staty.pz;
  postac.hp = postac.maxHp;
  aktualizujPasekPostaci();
  aktualizujInfo();

  if (logGry) logGry.innerHTML = "";
  log("⚔️ Fale wrogów nadciągają!", "log-info");

  graTrwa = true;
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

function zakonczGre(wygrana) {
  graTrwa = false;
  ustawPrzyciski("przed");

  if (!wygrana) {
    stan[1].zmianki = 0;
    aktualizujZmianki();
  }

  log(wygrana ? "🏆 WYGRANA!" : "💀 PRZEGRANA — polegasz na arenie.", "log-zwyciestwo");
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
function zbudujWikiItem(item) { const mozliwe = (item.mozliweAffixy || []).map(nazwa => znajdzAffix(nazwa)).filter(Boolean); const affixyHtml = mozliwe.length ? mozliwe.map(affix => `<div class="wiki-affix" data-affix="${wikiEsc(affix.nazwa)}"><span class="wiki-affix-nazwa">${wikiEsc(affix.nazwa)}</span><span class="wiki-affix-zakres"> ${wikiEsc(formatZakresAffixu(affix))}</span></div>`).join("") : `<div class="wiki-brak">Brak możliwych affixów</div>`; return `<article class="wiki-item"><img class="wiki-item-obraz" src="${wikiEsc(item.obraz)}" alt="${wikiEsc(item.nazwa)}"><div class="wiki-item-tresc"><div class="wiki-item-nazwa">${wikiEsc(item.nazwa)}</div>${affixyHtml}</div></article>`; }
function wypelnijWiki() { const grid = document.getElementById("wiki-grid"); if (!grid || typeof itemy === "undefined") return; grid.innerHTML = Object.values(itemy).map(zbudujWikiItem).join(""); }
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