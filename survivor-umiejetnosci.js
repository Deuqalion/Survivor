/* ============================================================
   SURVIVOR-UMIEJETNOSCI.JS
   Okno "Umiejętności pasywne" (4. przycisk na dolnym pasku).
   Okno kupowania i ulepszania. Działanie umiejętności w walce jest w
   survivor-game.js (poziomUmiejetnosci, wystrzelOdlamki, wystrzelMagicznaStrzale...).
   ============================================================ */

/* Wymiary grafiki tła okna (umiejetnosci-podglad.png). Wszystkie pozycje
   poniżej podane są w pikselach TEJ grafiki i przeliczane na procenty,
   więc okno skaluje się razem z obrazkiem. */
const UMIEJ_REF_W = 2474;
const UMIEJ_REF_H = 1484;

const KOSZT_ODBLOKOWANIA_UMIEJETNOSCI = 120;
const KOSZT_ULEPSZENIA_UMIEJETNOSCI = 120;

const UMIEJ_PROMIEN_POZIOMU = 56; // promień małej ikonki z cyfrą rzymską

/* Monety zdobywa się za zabójstwa (patrz zabijWroga w survivor-game.js).
   Na czas testów można tu wpisać więcej niż 0. */
const MONETY_START = 0;
let monety = MONETY_START;

let umiejetnosciOtwarte = false;
let umiejetnosciZatrzymalyGre = false;

function fmtUmiej(n) {
  return Math.round(n || 0).toLocaleString("pl-PL");
}

function statyUmiejetnosci() {
  const s = (typeof stan !== "undefined" && stan[1] && stan[1].staty) || {};
  return {
    podst: s["podstawoweObrażenia"] || 3000,
    um: s.obrazeniaUmiejetnosci || 0
  };
}

/* Obrażenia magiczne pokazywane w opisach:
   (Podstawowe obrażenia + ilość zabitych) * mnożnik umiejętności * (1 + Obrażenia umiejętności %). */
function dmgMagiczne(mnoznik) {
  const { podst, um } = statyUmiejetnosci();
  const zabici = (typeof bonusObrazenZZabojstw === "function") ? bonusObrazenZZabojstw() : 0;
  return fmtUmiej((podst + zabici) * mnoznik * (1 + um / 100));
}

const UMIEJETNOSCI = [
  {
    id: "elektryczna",
    nazwa: "Elektryczna strzała",
    ikona: { x: 367, y: 420, r: 181 },
    nazwaBox: { x: 517, y: 205, w: 681, h: 75 },
    tekst: { x: 600, y: 290, w: 515, h: 162 },
    poziomy: [{ x: 622, y: 549 }, { x: 783, y: 549 }, { x: 940, y: 549 }, { x: 1099, y: 549 }],
    opis: p => `Trafienia mają 33% szansy na zadanie ✨<span class="umiej-dmg">${dmgMagiczne(1)}</span> obrażeń magicznych dodatkowym celom w ilości: <span class="umiej-lvl">${1 + p}</span>.`
  },
  {
    id: "ognista",
    nazwa: "Ognista strzała",
    ikona: { x: 1453, y: 420, r: 181 },
    nazwaBox: { x: 1603, y: 205, w: 680, h: 75 },
    tekst: { x: 1687, y: 290, w: 511, h: 162 },
    poziomy: [{ x: 1709, y: 552 }, { x: 1870, y: 552 }, { x: 2030, y: 552 }, { x: 2190, y: 552 }],
    opis: p => `Trafienia mają 33% szansy na zadanie ✨<span class="umiej-lvl">${60 + 15 * p}%</span> obrażeń magicznych pobliskim wrogom.`
  },
  {
    id: "odlamkowa",
    nazwa: "Odłamkowa strzała",
    ikona: { x: 367, y: 1000, r: 181 },
    nazwaBox: { x: 517, y: 780, w: 681, h: 75 },
    tekst: { x: 600, y: 865, w: 515, h: 162 },
    poziomy: [{ x: 625, y: 1122 }, { x: 783, y: 1122 }, { x: 941, y: 1122 }, { x: 1100, y: 1122 }],
    opis: p => `Wystrzeliwujesz mniejsze strzały w pobliskich wrogów w ilości: <span class="umiej-lvl">${1 + p}</span>, zadając ✨<span class="umiej-dmg">${dmgMagiczne(1 / 5)}</span> obrażeń magicznych.`
  },
  {
    id: "magiczna",
    nazwa: "Magiczna strzała",
    ikona: { x: 1453, y: 1003, r: 181 },
    nazwaBox: { x: 1603, y: 783, w: 680, h: 75 },
    tekst: { x: 1687, y: 868, w: 511, h: 162 },
    poziomy: [{ x: 1709, y: 1125 }, { x: 1870, y: 1125 }, { x: 2030, y: 1125 }, { x: 2190, y: 1125 }],
    opis: p => `Co <span class="umiej-lvl">${7 - p}</span> atak wystrzeliwujesz magiczną strzałę zadając celowi i pobliskim wrogom ✨<span class="umiej-dmg">${dmgMagiczne(1 / 2)}</span> obrażeń magicznych.`
  }
];

/* poziom = ile ulepszeń (I–IV) kupiono; odblokowana = czy umiejętność kupiona */
const umiejetnosciStan = {};
UMIEJETNOSCI.forEach(u => { umiejetnosciStan[u.id] = { odblokowana: false, poziom: 0 }; });

/* ---------- pomocnicze: pozycje w % okna ---------- */

function stylProstokata(b) {
  return `left:${b.x / UMIEJ_REF_W * 100}%;top:${b.y / UMIEJ_REF_H * 100}%;` +
         `width:${b.w / UMIEJ_REF_W * 100}%;height:${b.h / UMIEJ_REF_H * 100}%;`;
}

/* Koło + zmienne CSS, dzięki którym szara nakładka pokazuje dokładnie ten sam
   fragment grafiki tła (patrz ::before w survivor-umiejetnosci.css). */
function stylKola(cx, cy, r) {
  const L = (cx - r) / UMIEJ_REF_W * 100;
  const T = (cy - r) / UMIEJ_REF_H * 100;
  const w = 2 * r / UMIEJ_REF_W * 100;
  const h = 2 * r / UMIEJ_REF_H * 100;
  return `left:${L}%;top:${T}%;width:${w}%;height:${h}%;` +
         `--bsx:${100 / w * 100}%;--bsy:${100 / h * 100}%;` +
         `--bpx:${L / (100 - w) * 100}%;--bpy:${T / (100 - h) * 100}%;`;
}

/* ---------- budowa okna ---------- */

function zbudujOknoUmiejetnosci() {
  const okno = document.getElementById("umiejetnosci-okno");
  if (!okno) return;

  let html = `<h1 class="umiej-tytul">Umiejętności pasywne</h1>
    <div id="umiej-monety" class="umiej-monety"><span>🪙</span><span id="umiej-monety-wartosc">0</span></div>`;

  UMIEJETNOSCI.forEach(u => {
    html += `<div class="umiej-nazwa" style="${stylProstokata(u.nazwaBox)}">${u.nazwa}</div>`;

    html += `<div class="umiej-ikona" id="umiej-ikona-${u.id}" data-umiej="${u.id}" style="${stylKola(u.ikona.x, u.ikona.y, u.ikona.r)}">
      <span class="umiej-ikona-koszt">${KOSZT_ODBLOKOWANIA_UMIEJETNOSCI}🪙</span>
    </div>`;

    u.poziomy.forEach((p, i) => {
      html += `<div class="umiej-poziom" id="umiej-poziom-${u.id}-${i}" data-umiej="${u.id}" data-poziom="${i}" style="${stylKola(p.x, p.y, UMIEJ_PROMIEN_POZIOMU)}">
        <span class="umiej-poziom-koszt">${KOSZT_ULEPSZENIA_UMIEJETNOSCI}🪙</span>
      </div>`;
    });

    html += `<div class="umiej-tekst" id="umiej-tekst-${u.id}" style="${stylProstokata(u.tekst)}"></div>`;
  });

  html += `<button class="umiej-zamknij" type="button" onclick="zamknijUmiejetnosci()"><img src="ZAMKNIJ.png" alt="ZAMKNIJ"></button>`;

  okno.innerHTML = html;
  okno.addEventListener("click", obsluzKlikUmiejetnosci);
}

/* ---------- monety ---------- */

function odswiezLicznikMonet() {
  const wartosc = fmtUmiej(monety);
  const wOknie = document.getElementById("umiej-monety-wartosc");
  if (wOknie) wOknie.textContent = wartosc;
  const wPasku = document.getElementById("monety-licznik");
  if (wPasku) wPasku.textContent = wartosc;
}

function dodajMonety(ile) {
  monety += ile;
  odswiezLicznikMonet();
}

/* Nowa gra: monety i umiejętności wracają do stanu początkowego. */
function resetujUmiejetnosci() {
  monety = MONETY_START;
  UMIEJETNOSCI.forEach(u => { umiejetnosciStan[u.id] = { odblokowana: false, poziom: 0 }; });
  odswiezUmiejetnosci();
}

/* ---------- odświeżanie wyglądu ---------- */

function odswiezUmiejetnosci() {
  odswiezLicznikMonet();

  UMIEJETNOSCI.forEach(u => {
    const s = umiejetnosciStan[u.id];

    const ikona = document.getElementById(`umiej-ikona-${u.id}`);
    if (ikona) ikona.classList.toggle("zablokowana", !s.odblokowana);

    u.poziomy.forEach((_, i) => {
      const el = document.getElementById(`umiej-poziom-${u.id}-${i}`);
      if (!el) return;
      el.classList.toggle("zablokowana", i >= s.poziom);
      // napis z kosztem tylko na PIERWSZYM niekupionym poziomie
      el.classList.toggle("nastepny", i === s.poziom);
    });

    const tekst = document.getElementById(`umiej-tekst-${u.id}`);
    if (tekst) {
      tekst.innerHTML = `<div class="umiej-tekst-wew">${u.opis(s.poziom)}</div>`;
      tekst.classList.toggle("przygaszony", !s.odblokowana);
    }
  });
}

function potrzasnij(el) {
  if (!el) return;
  el.classList.remove("brak");
  void el.offsetWidth;
  el.classList.add("brak");
}

function obsluzKlikUmiejetnosci(event) {
  const cel = event.target.closest("[data-umiej]");
  if (!cel) return;

  const u = UMIEJETNOSCI.find(x => x.id === cel.dataset.umiej);
  if (!u) return;
  const s = umiejetnosciStan[u.id];
  const monetyEl = document.getElementById("umiej-monety");

  if (cel.dataset.poziom === undefined) {
    // klik w dużą ikonę: odblokowanie umiejętności
    if (s.odblokowana) return;
    if (monety < KOSZT_ODBLOKOWANIA_UMIEJETNOSCI) { potrzasnij(monetyEl); return; }
    monety -= KOSZT_ODBLOKOWANIA_UMIEJETNOSCI;
    s.odblokowana = true;
  } else {
    // klik w małą ikonę: ulepszenie — tylko następny poziom i tylko odblokowanej umiejętności
    const i = Number(cel.dataset.poziom);
    if (i !== s.poziom) return;
    if (!s.odblokowana) { potrzasnij(document.getElementById(`umiej-ikona-${u.id}`)); return; }
    if (monety < KOSZT_ULEPSZENIA_UMIEJETNOSCI) { potrzasnij(monetyEl); return; }
    monety -= KOSZT_ULEPSZENIA_UMIEJETNOSCI;
    s.poziom += 1;
  }

  odswiezUmiejetnosci();
}

/* ---------- otwieranie / zamykanie (jak wiki: pauzuje grę) ---------- */

function otworzUmiejetnosci() {
  const overlay = document.getElementById("umiejetnosci-overlay");
  if (!overlay || umiejetnosciOtwarte) return;
  if (typeof wikiOtwarta !== "undefined" && wikiOtwarta) return;

  if (graTrwa && !oczekiwanieNaUlepszenieItemu) {
    graTrwa = false;
    ustawPrzyciski("pauza");
    umiejetnosciZatrzymalyGre = true;
  }

  odswiezUmiejetnosci();
  overlay.classList.add("visible");
  overlay.setAttribute("aria-hidden", "false");
  umiejetnosciOtwarte = true;
}

function zamknijUmiejetnosci() {
  const overlay = document.getElementById("umiejetnosci-overlay");
  if (!overlay) return;

  overlay.classList.remove("visible");
  overlay.setAttribute("aria-hidden", "true");
  umiejetnosciOtwarte = false;

  if (umiejetnosciZatrzymalyGre) {
    umiejetnosciZatrzymalyGre = false;
    if (!graTrwa && !oczekiwanieNaUlepszenieItemu) {
      graTrwa = true;
      ostatniCzas = 0;
      ustawPrzyciski("gra");
      requestAnimationFrame(petlaGry);
    }
  }
}

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && umiejetnosciOtwarte) zamknijUmiejetnosci();
});

zbudujOknoUmiejetnosci();
odswiezUmiejetnosci();
