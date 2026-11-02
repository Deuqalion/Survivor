/* ============================================================
   SURVIVOR-BRONIE.JS
   Wybór broni na początku gry: Łuk, Kostur, Pistolet, Shuriken.
   Każda broń podmienia:
     - grafikę itemu "bron" (slot 8) i "strzala" (slot 12) — na razie tylko grafiki,
     - zestaw 6 umiejętności pasywnych (nazwy, grafiki kafelków, opisy).

   Mechaniki walki nadal siedzą w survivor-game.js i mają stałe id
   (elektryczna, ognista, odlamkowa, magiczna, wampiryczna, potrojna).
   Umiejętność każdej broni podpina się pod jedną z nich (pole id), więc
   działa od razu. Gdy będziesz chciał dać np. Minigunowi inną mechanikę,
   dopisz ją w survivor-game.js i zmień tu tylko id/opis.
   ============================================================ */

/* ---------- ZESTAWY UMIEJĘTNOŚCI ----------
   Układ w oknie (kol, wiersz) idzie wierszami, w kolejności z Twojej listy:
   (0,0) (1,0) / (0,1) (1,1) / (0,2) (1,2). Ostatnia umiejętność (wampir) zawsze
   ląduje w prawym dolnym rogu, tak jak Wampiryczna strzała łuku. */

/* Opisy: p = liczba kupionych ulepszeń (0–4), czyli wartości "x/x/x/x/x" z projektu.
   dmgMagiczne(m) = (Podstawowe obrażenia + zabici) * m * (1 + OU%). */
const UMIEJETNOSCI_KOSTUR = [
  {
    id: "elektryczna", nazwa: "Piorun", plik: "KOSTURY/piorun.png", kol: 0, wiersz: 0,
    bonus: "Pioruny są obszarowe.",
    opis: p => `Atakujesz dodatkowe cele:<span class="umiej-lvl">${1 + p}</span> za 50% obrażeń. 33% szansy na porażenie za <span class="umiej-dmg">${dmgMagiczne(0.8 + 0.05 * p)}</span> obrażeń magicznych.`
  },
  {
    id: "ognista", nazwa: "Ogień", plik: "KOSTURY/ogien.png", kol: 1, wiersz: 0,
    bonus: () => `Ataki mają szansę na wybuch (${dmgMagiczne(1, 700)})`,
    opis: p => `Umiejętności mają 33% szansy na podpalenie zadając <span class="umiej-lvl">${5 + p}%</span> ich max. PZ w ciągu 3 sek.`
  },
  {
    id: "odlamkowa", nazwa: "Ziemia", plik: "KOSTURY/ziemia.png", kol: 0, wiersz: 1,
    bonus: "Głaz ma 33% szansy na omdlenie.",
    opis: p => `Co <span class="umiej-lvl">${11 - p}</span> sekund rzucasz głazem zadając <span class="umiej-dmg">${dmgMagiczne(1)}</span> obrażeń magicznych wszystkim wrogom w obszarze.`
  },
  {
    id: "magiczna", nazwa: "Powietrze", plik: "KOSTURY/powietrze.png", kol: 1, wiersz: 1,
    bonus: "Spowalnia wrogów o 20%.",
    opis: p => `Co 8 sekund przywołujesz tornada w ilości <span class="umiej-lvl">${1 + 2 * p}</span> zadające <span class="umiej-dmg">${dmgMagiczne(2)}</span> obrażeń magicznych.`
  },
  {
    id: "potrojna", nazwa: "Woda", plik: "KOSTURY/woda.png", kol: 0, wiersz: 2,
    bonus: "33% szansy na odepchnięcie wroga.",
    opis: p => `Co <span class="umiej-lvl">${8 - p}</span> sekund przywołujesz falę wody zadającą <span class="umiej-dmg">${dmgMagiczne(1)}</span> obrażeń magicznych.`
  },
  {
    id: "wampiryczna", nazwa: "Wampiryzm", plik: "KOSTURY/wampir.png", kol: 1, wiersz: 2,
    bonus: "Kradzież życia: 5%",
    opis: p => `Otrzymujesz wampiryzm zaklęć, który leczy Cię za <span class="umiej-lvl">${1 + p}%</span> zadanych obrażeń magicznych.`
  }
];

const UMIEJETNOSCI_PISTOLET = [
  {
    id: "elektryczna", nazwa: "Snajperka", plik: "PISTOLETY/sniperka.png", kol: 0, wiersz: 0,
    bonus: "Pocisk odbija się w drugi cel.",
    opis: p => `Co 12 sekund wystrzeliwujesz pocisk w największego wroga zadając <span class="umiej-dmg">${dmgMagiczne(3 + p)}</span> obrażeń magicznych.`
  },
  {
    id: "potrojna", fizyczne: true, nazwa: "Shotgun", plik: "PISTOLETY/shotgun.png", kol: 1, wiersz: 0,
    bonus: "Salwa przebija wrogów.",
    opis: p => `Co drugi atak wystrzeliwujesz salwę śrutu w ilości <span class="umiej-lvl">${2 + 2 * p}</span> zadając <span class="umiej-dmg umiej-dmg-bialy">${dmgFizyczne(1)}</span> obrażeń fizycznych.`
  },
  {
    id: "odlamkowa", nazwa: "Minigun", plik: "PISTOLETY/minigun.png", kol: 0, wiersz: 1,
    bonus: "25% szansy na rykoszet.",
    opis: p => `Z każdym atakiem wystrzeliwujesz <span class="umiej-lvl">${[3, 6, 9, 13, 16][p]}</span> pocisków zadających <span class="umiej-dmg">${dmgMagiczne(1 / 7)}</span> obrażeń magicznych.`
  },
  {
    id: "magiczna", nazwa: "Granaty", plik: "PISTOLETY/granaty.png", kol: 1, wiersz: 1,
    bonus: "Wybuch podpala wrogów.",
    opis: p => `Co <span class="umiej-lvl">${7 - p}</span> atak rzucasz granatem zadając celowi i pobliskim wrogom <span class="umiej-dmg">${dmgMagiczne(1)}</span> obrażeń magicznych.`
  },
  {
    id: "ognista", nazwa: "Miny", plik: "PISTOLETY/miny.png", kol: 0, wiersz: 2,
    bonus: "Wszystkie umiejętności mogą krytować za +50% obrażeń.",
    opis: p => `Co<span class="umiej-lvl">${8 - p}</span>sek. kładziesz miny (max<span class="umiej-lvl">${3 + p}</span>) zadające <span class="umiej-dmg">${dmgMagiczne(1 + p)}</span> obrażeń magicznych.`
  },
  {
    id: "wampiryczna", nazwa: "Wampiryczny pistolet", plik: "PISTOLETY/wampgun.png", kol: 1, wiersz: 2,
    bonus: "Kradzież życia: +5%",
    opis: p => `Otrzymujesz wampiryzm zaklęć, który leczy Cię za <span class="umiej-lvl">${1 + p}%</span> zadanych obrażeń magicznych.`
  }
];

const UMIEJETNOSCI_SHURIKEN = [
  {
    id: "potrojna", fizyczne: true, nazwa: "Ninjutsu", plik: "SHURIKENY/multi.png", kol: 0, wiersz: 0,
    bonus: "Efektywność 75% obrażeń.",
    opis: p => `Twój atak wyrzuca dodatkowe Shurikeny w ilości <span class="umiej-lvl">${1 + p}</span> zadając 50% obrażeń fizycznych.`
  },
  {
    id: "ognista", nazwa: "Ognisty shuriken", plik: "SHURIKENY/ognisty.png", kol: 1, wiersz: 0,
    bonus: "Obrażenia obszarowe podpalają.",
    opis: p => `Trafienia mają 25% szansy na zadanie <span class="umiej-lvl">${[15, 30, 45, 60, 75][p]}%</span> obrażeń magicznych pobliskim wrogom.`
  },
  {
    id: "elektryczna", fizyczne: true, nazwa: "Rykoszet", plik: "SHURIKENY/rykoszet.png", kol: 0, wiersz: 1,
    bonus: "Każde odbicie: +15% obrażeń.",
    opis: p => `Ataki odbijają się w kolejnych wrogów w ilości <span class="umiej-lvl">${1 + p}</span> zadając <span class="umiej-lvl">50%</span> obrażeń całkowitych.`
  },
  {
    id: "magiczna", nazwa: "Bumerang", plik: "SHURIKENY/bumerang.png", kol: 1, wiersz: 1,
    bonus: "Większe bumerangi i hitbox.",
    opis: p => `Wokół Ciebie orbitują bumerangi w ilości <span class="umiej-lvl">${2 + p}</span> zadając <span class="umiej-dmg">${dmgMagiczne(1)}</span> obrażeń magicznych.`
  },
  {
    id: "odlamkowa", nazwa: "Lotos Śmierci", plik: "SHURIKENY/ostrzal.png", kol: 0, wiersz: 2,
    bonus: "Pprzebija wrogów.",
    opis: p => `Co <span class="umiej-lvl">${7 - p}</span> atak rzucasz shurikenami w ilości <span class="umiej-lvl">${12 + 3 * p}</span> w każdą stronę zadając <span class="umiej-dmg">${dmgMagiczne(1)}</span> obrażeń magicznych.`
  },
  {
    id: "wampiryczna", nazwa: "Shuriken Wampira", plik: "SHURIKENY/wampszur.png", kol: 1, wiersz: 2,
    bonus: "Kradzież życia: 5%",
    opis: p => `Otrzymujesz wampiryzm zaklęć, który leczy Cię za <span class="umiej-lvl">${1 + p}%</span> zadanych obrażeń magicznych.`
  }
];

/* Liczba z przecinkiem dziesiętnym w opisach (1.75 -> "1,75"). */
function plLiczba(x) { return String(x).replace(".", ","); }

const UMIEJETNOSCI_PAJAK = [
  {
    id: "elektryczna", nazwa: "Tarantula", plik: "PAJĄKI/ptarantula.png", kol: 0, wiersz: 0,
    bonus: "Wypuszczasz 2 Pająki.",
    opis: p => `Co <span class="umiej-lvl">${plLiczba([2, 1.75, 1.5, 1.25, 1][p])}</span> s wypuszczasz Pająka, który atakuje najbliższego wroga zadając <span class="umiej-dmg">${dmgMagiczne([1, 1.25, 1.5, 1.75, 2][p])}</span> obrażeń magicznych.`
  },
  {
    id: "ognista", nazwa: "Kwasowa chmura", plik: "PAJĄKI/pkwas.png", kol: 1, wiersz: 0,
    bonus: () => `Skażony obszar na 5 s: ${dmgMagiczne(0.35)} co 1 s.`,
    opis: p => `Co <span class="umiej-lvl">10</span> s plujesz kwasem w skupisko wrogów zadając <span class="umiej-dmg">${dmgMagiczne([0.7, 1, 1.3, 1.6, 1.9][p])}</span> obrażeń magicznych.`
  },
  {
    id: "odlamkowa", nazwa: "Ptasznik", plik: "PAJĄKI/pptasznik.png", kol: 0, wiersz: 1,
    bonus: "Obrażenia mogą krytować.",
    opis: p => `Co <span class="umiej-lvl">${plLiczba([6, 5.25, 4.5, 3.75, 3][p])}</span> s wypuszczasz Pająka, który zadaje <span class="umiej-dmg">${dmgMagiczne(1)}</span> obrażeń obszarowych magicznych.`
  },
  {
    id: "magiczna", nazwa: "Arachnofobia", plik: "PAJĄKI/parachnofobia.png", kol: 1, wiersz: 1,
    bonus: "2x więcej Pająków.",
    opis: p => `Pająki otrzymują wzmocnienie: szansa na otrucie${p >= 1 ? ", spowolnienie" : ""}${p >= 2 ? `, obrażenia +<span class="umiej-lvl">${[10, 20, 30][p - 2]}%</span>` : ""}.`
  },
  {
    id: "potrojna", nazwa: "Pajęczyna", plik: "PAJĄKI/ppajeczyna.png", kol: 0, wiersz: 2,
    bonus: "Pajęczyna powoduje omdlenie.",
    opis: p => `Co <span class="umiej-lvl">${12 - p}</span> s rzucasz pajęczyną przebijającą <span class="umiej-lvl">${1 + p}</span> wrogów zadając im <span class="umiej-dmg">${dmgMagiczne([1, 1.75, 2.5, 3.25, 4][p])}</span> obrażeń magicznych.`
  },
  {
    id: "wampiryczna", nazwa: "Wampiryczny pająk", plik: "PAJĄKI/pwampir.png", kol: 1, wiersz: 2,
    bonus: "Kradzież życia: 5%",
    opis: p => `Otrzymujesz wampiryzm zaklęć, który leczy Cię za <span class="umiej-lvl">${1 + p}%</span> zadanych obrażeń magicznych.`
  }
];

/* Wspólny zabieg dla Księgi, Amunicji, Shuriken2 i Jada: jeden stały affix specjalny +
   (Wartość ataku ALBO Obrażenia umiejętności) + (Prędkość ataku ALBO Szybkość zaklęcia). */
const AMUNICJA_MOZLIWE = ["Wartość ataku", "Obrażenia umiejętności", "Prędkość ataku", "Szybkość zaklęcia"];
const AMUNICJA_WYKLUCZAJACE = [["Wartość ataku", "Obrażenia umiejętności"], ["Prędkość ataku", "Szybkość zaklęcia"]];

/* ---------- BRONIE ---------- */

const BRONIE = {
  luk: {
    nazwa: "Łuk", nazwaAmunicji: "Strzała", ikona: "🏹",
    zakresyBroni: {},
    bron: "bron.png", amunicja: "strzala.png",
    umiejetnosci: UMIEJETNOSCI_LUK,
    affixyAmunicji: ["Wartość ataku", "Prędkość ataku", "Zwykła strzała"],
    zakresyAmunicji: {},
    ulepszenieAmunicji: "Prędkość ataku: +35%"
  },
  kostur: {
    nazwa: "Kostur", nazwaAmunicji: "Księga", ikona: "🔮",
    zakresyBroni: { "Podstawowe obrażenia": { min: 3000, max: 4000 } },
    bron: "kostur.png", amunicja: "ksiega.png",
    umiejetnosci: UMIEJETNOSCI_KOSTUR,
    affixyAmunicji: ["Czarnoksięstwo"],
    mozliweAmunicji: AMUNICJA_MOZLIWE,
    wykluczajaceAmunicji: AMUNICJA_WYKLUCZAJACE,
    zakresyAmunicji: { "Obrażenia umiejętności": { min: 0, max: 5 }, "Szybkość zaklęcia": { min: 0, max: 20 } },
    ulepszenieAmunicji: "Szybkość zaklęcia: +25%"
  },
  pistolet: {
    nazwa: "Pistolet", nazwaAmunicji: "Amunicja", ikona: "🔫",
    zakresyBroni: { "Podstawowe obrażenia": { min: 4500, max: 6000 } },
    bron: "pistolet.png", amunicja: "amunicja.png",
    umiejetnosci: UMIEJETNOSCI_PISTOLET,
    affixyAmunicji: ["Destrukcja"],
    mozliweAmunicji: AMUNICJA_MOZLIWE,
    wykluczajaceAmunicji: AMUNICJA_WYKLUCZAJACE,
    zakresyAmunicji: { "Obrażenia umiejętności": { min: 0, max: 6 } },
    ulepszenieAmunicji: "Prędkość ataku: +35%"
  },
  shuriken: {
    nazwa: "Shuriken", nazwaAmunicji: "Suriken", ikona: "✴️",
    zakresyBroni: { "Podstawowe obrażenia": { min: 3000, max: 4000 } },
    bron: "shuriken.png", amunicja: "shuriken2.png",
    umiejetnosci: UMIEJETNOSCI_SHURIKEN,
    affixyAmunicji: ["Zręczność"],
    mozliweAmunicji: AMUNICJA_MOZLIWE,
    wykluczajaceAmunicji: AMUNICJA_WYKLUCZAJACE,
    zakresyAmunicji: { "Wartość ataku": { min: 60, max: 300 }, "Obrażenia umiejętności": { min: 0, max: 6 } },
    ulepszenieAmunicji: "Prędkość ataku: +35%"
  },
  pajak: {
    nazwa: "Pająk", nazwaAmunicji: "Jad", ikona: "🕷️",
    zakresyBroni: { "Podstawowe obrażenia": { min: 3000, max: 4500 } },
    bron: "pajak.png", amunicja: "venom.png",
    umiejetnosci: UMIEJETNOSCI_PAJAK,
    // Jad: stały unikalny affix "Jad" + po jednym z dwóch par (albo-albo): Wartość ataku / Obrażenia umiejętności,
    // Prędkość ataku / Szybkość zaklęcia
    affixyAmunicji: ["Jad"],
    mozliweAmunicji: AMUNICJA_MOZLIWE,
    wykluczajaceAmunicji: AMUNICJA_WYKLUCZAJACE,
    zakresyAmunicji: { "Obrażenia umiejętności": { min: 0, max: 6 } },
    ulepszenieAmunicji: "Szybkość zaklęcia: +25%"
  }
};

const ITEM_BRON = 8;   // itemy[8]  = "bron"
// ITEM_STRZALA (12) pochodzi z config.js

let aktualnaBron = "luk";
let bronZatwierdzona = false;      // czy gracz wybrał broń na tę grę
let wyborBroniOtwarty = false;
let startPoWyborzeBroni = false;   // true: po wyborze od razu uruchom grę (START po porażce)
let rozegranoGre = false;          // czy była już jakaś gra (po pierwszej porażce okno pokazuje podpisy pod kartami)
let ostatniaGranaBron = null;      // klasa (broń) z ostatniej gry

/* Podmienia grafiki itemów i zestaw umiejętności. */
function zastosujBron(id) {
  const b = BRONIE[id];
  if (!b) return;
  const poprzedniaBron = aktualnaBron;
  aktualnaBron = id;

  itemy[ITEM_BRON].obraz = b.bron;
  itemy[ITEM_STRZALA].obraz = b.amunicja;

  // Affixy przedmiotu amunicji (slot 12) zależą od broni: stałe = możliwe, zakresy i ulepszenie
  const amunicja = itemy[ITEM_STRZALA];
  amunicja.staleAffixy = b.affixyAmunicji.slice();
  amunicja.mozliweAffixy = (b.mozliweAmunicji || b.affixyAmunicji).slice();
  amunicja.wykluczajace = b.wykluczajaceAmunicji || [];
  amunicja.zakresy = b.zakresyAmunicji;
  amunicja.maxAffixow = b.maxAffixowAmunicji || 3;
  itemy[ITEM_BRON].zakresy = b.zakresyBroni;   // Podstawowe obrażenia zależne od broni
  MAPA_ULEPSZEN_ITEMOW.strzala = b.ulepszenieAmunicji;

  // Zmiana broni: stare affixy amunicji z poprzedniej broni nie pasują do nowych — wyczyść
  // (ta sama broń: affixy zostają — "kontynuuj z odblokowanym ekwipunkiem")
  if (poprzedniaBron !== id && stan[1].wylosowane[ITEM_STRZALA]) {
    delete stan[1].wylosowane[ITEM_STRZALA];
    delete stan[1].pierwotne[ITEM_STRZALA];
    obliczStatystyki(1);
  }

  const naglowek = document.querySelector(".postac-naglowek");
  if (naglowek) naglowek.textContent = `🛡️ Ekwipunek ${b.ikona}`;

  ustawZestawUmiejetnosci(b.umiejetnosci);
  utworzItemy(1);   // przebudowa planszy z nowymi grafikami
}

/* ---------- okno wyboru ---------- */

/* Karty okna wyboru w kolejności wyświetlania: nazwa klasy -> broń (id z BRONIE).
   bron: null = klasa jeszcze niedostępna (karta "Wkrótce"). */
const KLASY_WYBORU = [
  { klasa: "Łucznik", bron: "luk" },
  { klasa: "Mag", bron: "kostur" },
  { klasa: "Żołnierz", bron: "pistolet" },
  { klasa: "Ninja", bron: "shuriken" },
  { klasa: "Szaman", bron: "pajak" }
];

/* Styl samej OKRĄGŁEJ ikony umiejętności "wyciętej" z kafelka: ten sam fragment grafiki co duża
   ikona w oknie umiejętności (UMIEJ_UKLAD_KAFLA.ikona), pokazany przez background-size/position
   (ta sama matematyka co stylKola w survivor-umiejetnosci.js). */
function stylOkraglejIkony(u) {
  const { x: cx, y: cy, r } = UMIEJ_UKLAD_KAFLA.ikona;
  const L = (cx - r) / UMIEJ_KAFEL_W * 100;
  const T = (cy - r) / UMIEJ_KAFEL_H * 100;
  const w = 2 * r / UMIEJ_KAFEL_W * 100;
  const h = 2 * r / UMIEJ_KAFEL_H * 100;
  return `background-image:url('${u.plik}');` +
         `background-size:${100 / w * 100}% ${100 / h * 100}%;` +
         `background-position:${L / (100 - w) * 100}% ${T / (100 - h) * 100}%;`;
}

/* Podpis pod ikonami (tylko po pierwszej grze): ta sama klasa co ostatnio = kontynuacja z ekwipunkiem,
   inna klasa = start od zera. */
function podpisKarty(idBroni) {
  if (!rozegranoGre) return "";
  return idBroni === ostatniaGranaBron
    ? `<div class="bron-podpis kontynuuj">Kontynuuj z odblokowanym ekwipunkiem.</div>`
    : `<div class="bron-podpis">Zacznij od początku.</div>`;
}

function zbudujKartyBroni() {
  const kontener = document.getElementById("wybor-broni-karty");
  if (!kontener) return;

  kontener.innerHTML = KLASY_WYBORU.map((k, i) => {
    const b = k.bron ? BRONIE[k.bron] : null;
    if (!b) {
      return `
    <div class="bron-karta wkrotce">
      <div class="bron-klawisz">${i + 1}</div>
      <div class="bron-nazwa">${k.klasa}</div>
      <div class="bron-wkrotce">Wkrótce</div>
    </div>`;
    }

    // ikony w układzie okna umiejętności: 2 kolumny x 3 wiersze (wierszami: kol 0,1 / 0,1 / 0,1)
    const ikony = b.umiejetnosci.slice()
      .sort((u1, u2) => u1.wiersz - u2.wiersz || u1.kol - u2.kol)
      .map(u => `<div class="bron-ikona" title="${u.nazwa}" style="${stylOkraglejIkony(u)}"></div>`)
      .join("");

    return `
    <div class="bron-karta${k.bron === aktualnaBron && bronZatwierdzona ? " wybrana" : ""}" data-bron="${k.bron}" tabindex="0">
      <div class="bron-klawisz">${i + 1}</div>
      <div class="bron-nazwa">${k.klasa}</div>
      <div class="bron-obrazy">
        <img src="${b.bron}" alt="${b.nazwa}">
        <img src="${b.amunicja}" alt="${b.nazwaAmunicji}">
      </div>
      <div class="bron-ikony">${ikony}</div>
      ${podpisKarty(k.bron)}
    </div>`;
  }).join("");

  kontener.querySelectorAll(".bron-karta[data-bron]").forEach(karta => {
    karta.addEventListener("click", () => wybierzBron(karta.dataset.bron));
    karta.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.code === "Space") { e.preventDefault(); e.stopPropagation(); wybierzBron(karta.dataset.bron); }
    });
  });
}

function otworzWyborBroni(poWyborzeStart) {
  const overlay = document.getElementById("wybor-broni-overlay");
  if (!overlay) return;
  startPoWyborzeBroni = !!poWyborzeStart;
  zbudujKartyBroni();
  overlay.classList.add("visible");
  overlay.setAttribute("aria-hidden", "false");
  wyborBroniOtwarty = true;
  ukryjTooltip();
}

function zamknijWyborBroni() {
  const overlay = document.getElementById("wybor-broni-overlay");
  if (!overlay) return;
  overlay.classList.remove("visible");
  overlay.setAttribute("aria-hidden", "true");
  wyborBroniOtwarty = false;
}

function wybierzBron(id) {
  if (!BRONIE[id]) return;
  const innaKlasa = rozegranoGre && id !== ostatniaGranaBron;
  zastosujBron(id);
  // inna klasa niż ostatnio grana: ekwipunek (odblokowane itemy, affixy, zmianki) od zera
  if (innaKlasa && typeof resetujEkwipunekOdPoczatku === "function") resetujEkwipunekOdPoczatku();
  bronZatwierdzona = true;
  zamknijWyborBroni();

  if (startPoWyborzeBroni) {
    startPoWyborzeBroni = false;
    rozpocznijGre();
  }
}

/* Hak z rozpocznijGre(): jeśli broń nie jest zatwierdzona (po porażce), pokaż wybór. */
function wymagajWyboruBroniPrzedStartem() {
  if (bronZatwierdzona) return false;
  if (!wyborBroniOtwarty) otworzWyborBroni(true);
  return true;
}

/* Hak z zakonczGre(): kolejny START zapyta o broń od nowa. */
function resetujWyborBroni() {
  bronZatwierdzona = false;
  rozegranoGre = true;
  ostatniaGranaBron = aktualnaBron;
}

/* Klawisze 1-5 wybierają klasę (kartę), gdy okno jest otwarte. */
document.addEventListener("keydown", event => {
  if (!wyborBroniOtwarty) return;
  const klasa = KLASY_WYBORU[Number(event.key) - 1];
  if (klasa && klasa.bron) wybierzBron(klasa.bron);
});

/* Start strony: okno wyboru broni (po wyborze gracz klika START). */
zastosujBron("luk");
otworzWyborBroni(false);
