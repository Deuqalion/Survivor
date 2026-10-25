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
    opis: p => `Atakujesz <span class="umiej-lvl">${2 + p}</span> wrogów na raz. Ataki mają 33% szansy na porażenie go i najbliższego wroga zadając <span class="umiej-dmg">${dmgMagiczne(1)}</span> obrażeń magicznych.`
  },
  {
    id: "ognista", nazwa: "Ogień", plik: "KOSTURY/ogien.png", kol: 1, wiersz: 0,
    bonus: () => `Zwykłe ataki mają 40% szansy na wybuch (${dmgMagiczne(1, 700)}).`,
    opis: p => `Twoje umiejętności mają 33% szansy na podpalenie wrogów zadając <span class="umiej-lvl">${5 + p}%</span> ich maksymalnego zdrowia w ciągu 3 sekund.`
  },
  {
    id: "odlamkowa", nazwa: "Ziemia", plik: "KOSTURY/ziemia.png", kol: 0, wiersz: 1,
    bonus: "Wybuch ma 33% szansy na omdlenie (1s).",
    opis: p => `Co <span class="umiej-lvl">${9 - p}</span> sekund rzucasz głazem zadając <span class="umiej-dmg">${dmgMagiczne(1)}</span> obrażeń magicznych wszystkim wrogom w obszarze wybuchu.`
  },
  {
    id: "magiczna", nazwa: "Powietrze", plik: "KOSTURY/powietrze.png", kol: 1, wiersz: 1,
    bonus: "Spowalnia wrogów o 20%.",
    opis: p => `Co 8 sekund przywołujesz tornada w ilości <span class="umiej-lvl">${1 + 2 * p}</span> zadając <span class="umiej-dmg">${dmgMagiczne(1 / 2)}</span> obrażeń magicznych wszystkim wrogom na drodze.`
  },
  {
    id: "potrojna", nazwa: "Woda", plik: "KOSTURY/woda.png", kol: 0, wiersz: 2,
    bonus: "33% szansy na odepchnięcie wroga.",
    opis: p => `Co <span class="umiej-lvl">${7 - p}</span> sekund przywołujesz falę wody zadając <span class="umiej-dmg">${dmgMagiczne(1 / 2)}</span> obrażeń magicznych wszystkim wrogom na drodze.`
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
    opis: p => `Co 10 ataków namierzasz cel o największym maksymalnym zdrowiu i po 1 sekundzie wystrzeliwujesz w niego pocisk zadając <span class="umiej-dmg">${dmgMagiczne(2 + p)}</span> obrażeń magicznych.`
  },
  {
    id: "potrojna", nazwa: "Shotgun", plik: "PISTOLETY/shotgun.png", kol: 1, wiersz: 0,
    bonus: "Salwa przebija wrogów.",
    opis: p => `Co drugi atak wystrzeliwujesz salwę śrutu w ilości <span class="umiej-lvl">${2 + 2 * p}</span> zadając <span class="umiej-dmg">${dmgMagiczne(1 / 2)}</span> obrażeń magicznych.`
  },
  {
    id: "odlamkowa", nazwa: "Minigun", plik: "PISTOLETY/minigun.png", kol: 0, wiersz: 1,
    bonus: "25% szansy na rykoszet.",
    opis: p => `Na każdy atak wystrzeliwujesz dodatkowo <span class="umiej-lvl">${[3, 6, 9, 13, 16][p]}</span> pocisków zadających <span class="umiej-dmg">${dmgMagiczne(1 / 6)}</span> obrażeń magicznych.`
  },
  {
    id: "magiczna", nazwa: "Granaty", plik: "PISTOLETY/granaty.png", kol: 1, wiersz: 1,
    bonus: "Wybuch podpala wrogów.",
    opis: p => `Co <span class="umiej-lvl">${7 - p}</span> atak rzucasz granatem zadając celowi i pobliskim wrogom <span class="umiej-dmg">${dmgMagiczne(1)}</span> obrażeń magicznych.`
  },
  {
    id: "ognista", nazwa: "Miny", plik: "PISTOLETY/miny.png", kol: 0, wiersz: 2,
    bonus: "Umiejętności mogą krytować za +50%.",
    opis: p => `Co <span class="umiej-lvl">${6 - p}</span> atak rozstawiasz miny (max. <span class="umiej-lvl">${3 + p}</span>) wybuchające pod wrogami i zadające <span class="umiej-dmg">${dmgMagiczne(1)}</span> obrażeń magicznych pobliskim wrogom.`
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
    bonus: "Efektywność 100% obrażeń.",
    opis: p => `Twój atak wyrzuca dodatkowe Shurikeny w ilości <span class="umiej-lvl">${1 + p}</span> zadając 75% obrażeń fizycznych.`
  },
  {
    id: "ognista", nazwa: "Ognisty shuriken", plik: "SHURIKENY/ognisty.png", kol: 1, wiersz: 0,
    bonus: "Obrażenia obszarowe podpalają.",
    opis: p => `Trafienia mają 25% szansy na zadanie <span class="umiej-lvl">${[40, 55, 70, 85, 100][p]}%</span> obrażeń magicznych pobliskim wrogom.`
  },
  {
    id: "elektryczna", nazwa: "Rykoszet", plik: "SHURIKENY/rykoszet.png", kol: 0, wiersz: 1,
    bonus: "Każde odbicie: +15% obrażeń.",
    opis: p => `Ataki odbijają się w kolejnych wrogów w ilości <span class="umiej-lvl">${1 + p}</span>.`
  },
  {
    id: "magiczna", nazwa: "Bumerang", plik: "SHURIKENY/bumerang.png", kol: 1, wiersz: 1,
    bonus: "Hitbox bumerangów 2,5x większy.",
    opis: p => `Wokół Ciebie orbitują bumerangi w ilości <span class="umiej-lvl">${2 + p}</span> zadając <span class="umiej-dmg">${dmgMagiczne(1 / 2)}</span> obrażeń magicznych.`
  },
  {
    id: "odlamkowa", nazwa: "Lotos Śmierci", plik: "SHURIKENY/ostrzal.png", kol: 0, wiersz: 2,
    bonus: "Ostrzał przebija wrogów.",
    opis: p => `Co <span class="umiej-lvl">${7 - p}</span> atak rzucasz shurikenami w ilości <span class="umiej-lvl">${12 + 3 * p}</span> w każdą stronę zadając <span class="umiej-dmg">${dmgMagiczne(1 / 2)}</span> obrażeń magicznych.`
  },
  {
    id: "wampiryczna", nazwa: "Shuriken Wampira", plik: "SHURIKENY/wampszur.png", kol: 1, wiersz: 2,
    bonus: "Kradzież życia: 5%",
    opis: p => `Otrzymujesz wampiryzm zaklęć, który leczy Cię za <span class="umiej-lvl">${1 + p}%</span> zadanych obrażeń magicznych.`
  }
];

/* ---------- BRONIE ---------- */

const BRONIE = {
  luk: {
    nazwa: "Łuk", nazwaAmunicji: "Strzała", ikona: "🏹",
    bron: "bron.png", amunicja: "strzala.png",
    umiejetnosci: UMIEJETNOSCI_LUK
  },
  kostur: {
    nazwa: "Kostur", nazwaAmunicji: "Księga", ikona: "🔮",
    bron: "kostur.png", amunicja: "ksiega.png",
    umiejetnosci: UMIEJETNOSCI_KOSTUR
  },
  pistolet: {
    nazwa: "Pistolet", nazwaAmunicji: "Amunicja", ikona: "🔫",
    bron: "pistolet.png", amunicja: "amunicja.png",
    umiejetnosci: UMIEJETNOSCI_PISTOLET
  },
  shuriken: {
    nazwa: "Shuriken", nazwaAmunicji: "Suriken", ikona: "✴️",
    bron: "shuriken.png", amunicja: "shuriken2.png",
    umiejetnosci: UMIEJETNOSCI_SHURIKEN
  }
};

const ITEM_BRON = 8;   // itemy[8]  = "bron"
// ITEM_STRZALA (12) pochodzi z config.js

let aktualnaBron = "luk";
let bronZatwierdzona = false;      // czy gracz wybrał broń na tę grę
let wyborBroniOtwarty = false;
let startPoWyborzeBroni = false;   // true: po wyborze od razu uruchom grę (START po porażce)

/* Podmienia grafiki itemów i zestaw umiejętności. */
function zastosujBron(id) {
  const b = BRONIE[id];
  if (!b) return;
  aktualnaBron = id;

  itemy[ITEM_BRON].obraz = b.bron;
  itemy[ITEM_STRZALA].obraz = b.amunicja;

  const naglowek = document.querySelector(".postac-naglowek");
  if (naglowek) naglowek.textContent = `🛡️ Ekwipunek ${b.ikona}`;

  ustawZestawUmiejetnosci(b.umiejetnosci);
  utworzItemy(1);   // przebudowa planszy z nowymi grafikami
}

/* ---------- okno wyboru ---------- */

function zbudujKartyBroni() {
  const kontener = document.getElementById("wybor-broni-karty");
  if (!kontener) return;

  kontener.innerHTML = Object.entries(BRONIE).map(([id, b], i) => `
    <div class="bron-karta${id === aktualnaBron && bronZatwierdzona ? " wybrana" : ""}" data-bron="${id}" tabindex="0">
      <div class="bron-klawisz">${i + 1}</div>
      <div class="bron-obrazy">
        <img src="${b.bron}" alt="${b.nazwa}">
        <img src="${b.amunicja}" alt="${b.nazwaAmunicji}">
      </div>
      <div class="bron-nazwa">${b.nazwa}<span class="bron-plus"> + </span>${b.nazwaAmunicji}</div>
      <ul class="bron-umiejetnosci">
        ${b.umiejetnosci.map(u => `<li>${u.nazwa}</li>`).join("")}
      </ul>
    </div>
  `).join("");

  kontener.querySelectorAll(".bron-karta").forEach(karta => {
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
  zastosujBron(id);
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
}

/* Klawisze 1-4 wybierają broń, gdy okno jest otwarte. */
document.addEventListener("keydown", event => {
  if (!wyborBroniOtwarty) return;
  const idx = Number(event.key) - 1;
  const ids = Object.keys(BRONIE);
  if (idx >= 0 && idx < ids.length) wybierzBron(ids[idx]);
});

/* Start strony: okno wyboru broni (po wyborze gracz klika START). */
zastosujBron("luk");
otworzWyborBroni(false);
