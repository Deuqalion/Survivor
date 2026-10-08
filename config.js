/* ============================================================
   CONFIG.JS
   Konfiguracja itemów, affixów, stałe gry oraz stan graczy.
   ============================================================ */

let TRYB_SURVIVOR = false;

const itemy = {
  1: {
    nazwa: "helm",
    obraz: "helm.png",
    pozycja: { kolumna: 2, wiersz: 1 },
    stalyAffix: null,
    mozliweAffixy: [
      "Szansa na krwawienie",
      "Pancerz",
      "Szansa na omdlenie",
      "Szansa na otrucie",
      "Dodatkowe PŻ"
    ]
  },
  2: {
    nazwa: "zbroja",
    obraz: "zbroja.png",
    pozycja: { kolumna: 2, wiersz: 2 },
    stalyAffix: "Podstawowe PŻ",
    mozliweAffixy: [
      "Szansa na krwawienie",
      "Dodatkowe PŻ",
      "Pancerz",
      "Szansa na omdlenie",
      "Szansa na otrucie",
      "Szansa na blok",
      "Kradzież życia"
    ]
  },
  3: {
    nazwa: "naramienniki",
    obraz: "naramienniki.png",
    pozycja: { kolumna: 3, wiersz: 2 },
    stalyAffix: null,
    mozliweAffixy: [
      "Szansa na krwawienie",
      "Dodatkowe PŻ",
      "Wartość ataku",
      "Pancerz",
      "Szansa na omdlenie",
      "Szansa na otrucie",
      "Kradzież życia"
    ]
  },
  4: {
    nazwa: "rekawice",
    obraz: "rekawice.png",
    pozycja: { kolumna: 1, wiersz: 2 },
    stalyAffix: null,
    mozliweAffixy: [
      "Szansa na krwawienie",
      "Dodatkowe PŻ",
      "Wartość ataku",
      "Szansa na omdlenie",
      "Szansa na otrucie",
      "Pancerz"
    ]
  },
  5: {
    nazwa: "spodnie",
    obraz: "spodnie.png",
    pozycja: { kolumna: 2, wiersz: 3 },
    stalyAffix: null,
    mozliweAffixy: [
      "Szansa na krwawienie",
      "Dodatkowe PŻ",
      "Pancerz",
      "Szansa na omdlenie",
      "Szansa na blok",
      "Szansa na otrucie",
      "Kradzież życia"
    ]
  },
  6: {
    nazwa: "buty",
    obraz: "buty.png",
    pozycja: { kolumna: 3, wiersz: 3 },
    stalyAffix: null,
    mozliweAffixy: [
      "Szansa na krwawienie",
      "Dodatkowe PŻ",
      "Szansa na omdlenie",
      "Szansa na otrucie",
      "Szansa na blok",
      "Pancerz",
      "Kradzież życia"
    ]
  },
  7: {
    nazwa: "bransoleta",
    obraz: "bransoleta.png",
    pozycja: { kolumna: 4, wiersz: 2 },
    stalyAffix: null,
    mozliweAffixy: [
      "Szansa na krwawienie",
      "Dodatkowe PŻ",
      "Wartość ataku",
      "Szansa na kryta",
      "Szansa na przeszywkę",
      "Szansa na omdlenie",
      "Szansa na otrucie"
    ]
  },
  8: {
    nazwa: "bron",
    obraz: "bron.png",
    pozycja: { kolumna: 1, wiersz: 3 },
    staleAffixy: [
      "Podstawowe obrażenia",
      "Obrażenia umiejętności"
    ],
    mozliweAffixy: [
      "Szansa na krwawienie",
      "Wartość ataku",
      "Szansa na kryta",
      "Szansa na przeszywkę",
      "Szansa na omdlenie",
      "Szansa na otrucie"
    ]
  },
  9: {
    nazwa: "kolczyki",
    obraz: "kolczyki.png",
    pozycja: { kolumna: 3, wiersz: 1 },
    stalyAffix: null,
    mozliweAffixy: [
      "Szansa na krwawienie",
      "Dodatkowe PŻ",
      "Szansa na kryta",
      "Szansa na przeszywkę",
      "Szansa na omdlenie",
      "Szansa na blok",
      "Szansa na otrucie"
    ]
  },
  10: {
    nazwa: "naszyjnik",
    obraz: "naszyjnik.png",
    pozycja: { kolumna: 4, wiersz: 1 },
    stalyAffix: null,
    mozliweAffixy: [
      "Szansa na krwawienie",
      "Dodatkowe PŻ",
      "Szansa na kryta",
      "Szansa na przeszywkę",
      "Szansa na omdlenie",
      "Szansa na otrucie",
      "Kradzież życia"
    ]
  },
  11: {
    nazwa: "pierscien",
    obraz: "pierscien.png",
    pozycja: { kolumna: 4, wiersz: 3 },
    staleAffixy: [ 
      "Wzmocnienie PŻ",
      "Wzmocnienie Pancerza",
      "Wzmocnienie trucizny",
      "Wzmocnienie krwawienia",
      "Wzmocnienie krytyczne"
    ],
    mozliweAffixy: [
      "Wzmocnienie PŻ",
      "Wzmocnienie Pancerza",
      "Wzmocnienie trucizny",
      "Wzmocnienie krwawienia",
      "Wzmocnienie krytyczne"
    ]
  },
  12: {
    nazwa: "strzala",
    obraz: "strzala.png",
    pozycja: { kolumna: 1, wiersz: 1 },
    staleAffixy: [ 
      "Wartość ataku",
      "Prędkość ataku"
    ],
    mozliweAffixy: [
      "Zwykła strzała",
      "Ognista strzała",
      "Elektryczna strzała",
      "Diamentowa strzała",
      "Prędkość ataku"
    ]
  }
};

const affixy = [
  { nazwa: "Podstawowe PŻ", min: 15000, max: 32000, suffix: "" },
  { nazwa: "Podstawowe obrażenia", min: 4000, max: 5500, suffix: "" },
  { nazwa: "Obrażenia umiejętności", min: 1, max: 30, suffix: "%" },
  { nazwa: "Szansa na kryta", min: 5, max: 15, suffix: "%" },
  { nazwa: "Szansa na przeszywkę", min: 5, max: 15, suffix: "%" },
  { nazwa: "Szansa na omdlenie", min: 1, max: 2, suffix: "%" },
  { nazwa: "Szansa na blok", min: 1, max: 5, suffix: "%" },
  { nazwa: "Szansa na otrucie", min: 1, max: 3, suffix: "%" },
  { nazwa: "Szansa na krwawienie", min: 1, max: 3, suffix: "%" },
  { nazwa: "Dodatkowe PŻ", min: 1500, max: 4000, suffix: "" },
  { nazwa: "Wartość ataku", min: 50, max: 400, suffix: "" },
  { nazwa: "Pancerz", min: 5, max: 34, suffix: "" },
  { nazwa: "Kradzież życia", min: 1, max: 10, suffix: "%" },
  { nazwa: "Wzmocnienie PŻ", min: 0, max: 20, suffix: "%" },
  { nazwa: "Wzmocnienie Pancerza", min: 0, max: 15, suffix: "%" },
  { nazwa: "Wzmocnienie trucizny", min: 0, max: 15, suffix: "%" },
  { nazwa: "Wzmocnienie krwawienia", min: 0, max: 5, suffix: "%" },
  { nazwa: "Wzmocnienie krytyczne", min: 0, max: 15, suffix: "%" },
  { nazwa: "Prędkość ataku", min: 0, max: 35, suffix: "%" },
  
  // Affixy ulepszeń
  { nazwa: "Obrażenia umiejętności: +10%", min: 10, max: 10, suffix: "%", ulepszenie: true },
  { nazwa: "Prędkość ruchu: +15%", min: 15, max: 15, suffix: "%", ulepszenie: true },
  { nazwa: "Regeneracja PŻ 5%/sek", min: 5, max: 5, suffix: "%", ulepszenie: true },
  { nazwa: "Wskrzeszenie", min: 1, max: 1, suffix: "", pasywka: true, ulepszenie: true, opis: "Może być użyte raz na grę. Po śmiertelnych obrażeniach unieruchamia wrogów na 3s, przywraca 75% PŻ i daje odporność." },
  { nazwa: "Dodatkowe PŻ: 4000", min: 4000, max: 4000, suffix: "", ulepszenie: true },
  { nazwa: "Prędkość ataku: +20%", min: 20, max: 20, suffix: "%", ulepszenie: true },
  { nazwa: "Pancerz: 35", min: 35, max: 35, suffix: "", ulepszenie: true },
  { nazwa: "Szansa na kryta: 10%", min: 10, max: 10, suffix: "%", ulepszenie: true },
  { nazwa: "Szansa na przeszywkę: 10%", min: 10, max: 10, suffix: "%", ulepszenie: true },
  { nazwa: "Szansa na otrucie: 10%", min: 10, max: 10, suffix: "%", ulepszenie: true },
  { nazwa: "Szansa na omdlenie: 10%", min: 10, max: 10, suffix: "%", ulepszenie: true },
  { nazwa: "Wartość ataku: +150", min: 150, max: 150, suffix: "", ulepszenie: true },

  { 
    nazwa: "Zwykła strzała", 
    min: 100, 
    max: 400, 
    suffix: "",
    pasywka: true,
    opis: "Dodaje {x} Wartości Ataku."
  },
  { 
    nazwa: "Ognista strzała", 
    min: 65, 
    max: 130, 
    suffix: "%",
    pasywka: true,
    opis: "Atak ma 33% szansy na zadanie {x} obrażeń obszarowych."
  },
  { 
    nazwa: "Elektryczna strzała", 
    min: 1, 
    max: 5, 
    suffix: "",
    pasywka: true,
    opis: "Atak ma 33% szansy na zadanie dodatkowym {x} wrogom obrażeń."
  },
  { 
    nazwa: "Diamentowa strzała", 
    min: 1, 
    max: 1, 
    suffix: "%",
    pasywka: true,
    opis: "Atak ma 100% Szansy na przeszywkę"
  }
];

const SZANSA_PIERWOTNY = 0.05;
const MNOZNIK_PRZESZYWKI = 1.6667;
const ROZRZUT_PODSTAWOWYCH_OBRAZEN = 185;
const TRUCIZNA_LICZBA_ATAKOW = 3;
const TRUCIZNA_BONUS = 0.15;
const KRWAWIENIE_PROCENT_HP = 0.1;
const KRWAWIENIE_LICZBA_TUR = 3;

const ITEMY_START_AKTYWNE = [1, 2, 3, 4, 5, 6, 8];
const ITEMY_BIZUTERIA = [9, 10, 7, 11];
const ITEM_STRZALA = 12;

const PROGI_ODBLOKOWANIA_ITEMOW = [50, 100, 150, 200, 250];
const PROGI_ODBLOKOWANIA_AFFIXOW = [55, 105, 155, 205];
const SZANSA_ZMIANKA_Z_MOBA = 0.20;
const PROG_FALI_ARCYBOSSA = 100;

function pustePodsumowanie() {
  return {
    zadane: { bazowe: 0, zKryta: 0, zTrucizny: 0, zPrzeszywki: 0, zKrwawienia: 0, liczbaTrafien: 0, liczbaKrytow: 0, liczbaPrzeszywek: 0, liczbaOmdlen: 0, uleczenieKradziez: 0 },
    otrzymane: { bazowe: 0, zKryta: 0, zTrucizny: 0, zPrzeszywki: 0, zKrwawienia: 0, liczbaTrafien: 0, liczbaKrytow: 0, liczbaPrzeszywek: 0, liczbaBlokow: 0, liczbaOmdlonych: 0 }
  };
}

const stan = {
  1: {
    wylosowane: {},
    pierwotne: {},
    staty: null,
    hp: 0,
    ogluszony: false,
    zatruteAtaki: 0,
    krwawienieTury: 0,
    krwawienieZGracza: null,
    podsumowanie: pustePodsumowanie(),
    odblokowaneItemy: new Set(Object.keys(itemy).map(Number)),
    zmianki: 0
  },
  2: {
    wylosowane: {},
    pierwotne: {},
    staty: null,
    hp: 0,
    ogluszony: false,
    zatruteAtaki: 0,
    krwawienieTury: 0,
    krwawienieZGracza: null,
    podsumowanie: pustePodsumowanie(),
    odblokowaneItemy: new Set(Object.keys(itemy).map(Number)),
    zmianki: 0
  }
};

let walkaTrwa = false;
let aktywnyAtakujacy = 1;
let autoplayInterval = null;

const tooltip = document.getElementById("tooltip");
const tooltipItem = document.getElementById("tooltip-item");
const tooltipAffixList = document.getElementById("tooltip-affix-list");
const logWalki = document.getElementById("log-walki");