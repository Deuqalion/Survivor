/* ============================================================
   SURVIVOR-UMIEJETNOSCI.JS
   Okno "Umiejętności pasywne" (4. przycisk na dolnym pasku).
   Tło okna: wiki-podglad.png. Każda umiejętność ma własny kafelek PNG
   (duża ikona, pole opisu, poziomy I–IV) — wszystkie mają ten sam rozmiar
   i układ, więc korzystają z jednej mapy (UMIEJ_UKLAD_KAFLA).
   Okno kupowania i ulepszania. Działanie umiejętności w walce jest w
   survivor-game.js (poziomUmiejetnosci, wystrzelOdlamki, wystrzelMagicznaStrzale...).
   ============================================================ */

/* Wszystkie pozycje podane są w pikselach grafik i przeliczane na procenty,
   więc okno skaluje się razem z tłem.

   1) Tło okna (wiki-podglad.png) – układ kafelków na oknie.            */
const UMIEJ_REF_W = 3000;
const UMIEJ_REF_H = 1800;

/* 2) Kafelek umiejętności (np. elektryczna.png) – wszystkie mają ten sam rozmiar. */
const UMIEJ_KAFEL_W = 970;
const UMIEJ_KAFEL_H = 405;
const UMIEJ_KAFEL_SKALA = 1.1; // o ile powiększony jest kafelek względem pliku (w px tła okna)

/* Siatka 2 kolumny x 3 wiersze: lewy górny róg kafelka w px tła okna. */
const UMIEJ_KOLUMNY_X = [368, 1565];
const UMIEJ_WIERSZE_Y = [150, 648, 1146];

/* Mapa wnętrza kafelka (px pliku kafelka). */
const UMIEJ_UKLAD_KAFLA = {
  ikona: { x: 192, y: 205, r: 170 },                 // duża okrągła ikona
  nazwaBox: { x: 345, y: 6, w: 610, h: 56 },         // nazwa nad złotą tabliczką
  tekst: { x: 345, y: 82, w: 610, h: 148 },          // pole opisu na tabliczce
  poziomy: [{ x: 433, y: 327 }, { x: 584, y: 327 }, { x: 733, y: 327 }, { x: 882, y: 327 }]
};

const UMIEJ_PROMIEN_POZIOMU = 56; // promień małej ikonki z cyfrą rzymską (px kafelka)

const KOSZT_ODBLOKOWANIA_UMIEJETNOSCI = 120;
const KOSZT_ULEPSZENIA_UMIEJETNOSCI = 120;

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

/* kol / wiersz = pozycja kafelka w siatce okna (patrz UMIEJ_KOLUMNY_X / UMIEJ_WIERSZE_Y) */
const UMIEJETNOSCI = [
  {
    id: "elektryczna",
    nazwa: "Elektryczna strzała",
    plik: "elektryczna.png",
    kol: 0, wiersz: 0,
    bonus: "Może trafić krytycznie.",
    opis: p => `Trafienia mają 33% szansy na zadanie <span class="umiej-dmg">${dmgMagiczne(1)}</span> obrażeń magicznych dodatkowym celom w ilości: <span class="umiej-lvl">${1 + p}</span>.`
  },
  {
    id: "ognista",
    nazwa: "Ognista strzała",
    plik: "ognista.png",
    kol: 1, wiersz: 0,
    bonus: "Podpala wrogów.",
    opis: p => `Trafienia mają 33% szansy na zadanie <span class="umiej-lvl">${60 + 15 * p}%</span> obrażeń magicznych pobliskim wrogom.`
  },
  {
    id: "odlamkowa",
    nazwa: "Odłamkowa strzała",
    plik: "odlamkowa.png",
    kol: 0, wiersz: 1,
    bonus: "Atakuje podwójnie.",
    opis: p => `Wystrzeliwujesz mniejsze strzały w pobliskich wrogów w ilości: <span class="umiej-lvl">${1 + p}</span> zadając <span class="umiej-dmg">${dmgMagiczne(1 / 4)}</span> obrażeń magicznych.`
  },
  {
    id: "magiczna",
    nazwa: "Magiczna strzała",
    plik: "magiczna.png",
    kol: 1, wiersz: 1,
    bonus: "Większy zasięg.",
    opis: p => `Co <span class="umiej-lvl">${7 - p}</span> atak wystrzeliwujesz obszarową magiczną strzałę zadając <span class="umiej-dmg">${dmgMagiczne(1 / 2)}</span> obrażeń magicznych.`
  },
  {
    id: "wampiryczna",
    nazwa: "Wampiryczna strzała",
    plik: "wampiryczna.png",
    kol: 1, wiersz: 2,
    bonus: "Kradzież życia: 5%",
    opis: p => `Otrzymujesz wampiryzm zaklęć, który leczy Cię za <span class="umiej-lvl">${1 + p}%</span> zadanych obrażeń magicznych.`
  },
  {
    id: "potrojna",
    nazwa: "Potrójna strzała",
    plik: "potrojna.png",
    kol: 0, wiersz: 2,
    bonus: "Nakłada efekty przy trafieniu.",
    opis: p => `Wystrzeliwujesz 2 dodatkowe strzały, które zadają <span class="umiej-lvl">${20 + 15 * p}%</span> obrażeń fizycznych.`
  }
];

/* poziom = ile ulepszeń (I–IV) kupiono; odblokowana = czy umiejętność kupiona */
const umiejetnosciStan = {};
UMIEJETNOSCI.forEach(u => { umiejetnosciStan[u.id] = { odblokowana: false, poziom: 0 }; });

/* ---------- pomocnicze: pozycje w % ---------- */

/* Prostokąt w px kafelka -> % kafelka. */
function stylProstokata(b) {
  return `left:${b.x / UMIEJ_KAFEL_W * 100}%;top:${b.y / UMIEJ_KAFEL_H * 100}%;` +
         `width:${b.w / UMIEJ_KAFEL_W * 100}%;height:${b.h / UMIEJ_KAFEL_H * 100}%;`;
}

/* Koło w px kafelka + zmienne CSS, dzięki którym szara nakładka pokazuje dokładnie
   ten sam fragment grafiki kafelka (patrz ::before w survivor-umiejetnosci.css). */
function stylKola(cx, cy, r) {
  const L = (cx - r) / UMIEJ_KAFEL_W * 100;
  const T = (cy - r) / UMIEJ_KAFEL_H * 100;
  const w = 2 * r / UMIEJ_KAFEL_W * 100;
  const h = 2 * r / UMIEJ_KAFEL_H * 100;
  return `left:${L}%;top:${T}%;width:${w}%;height:${h}%;` +
         `--bsx:${100 / w * 100}%;--bsy:${100 / h * 100}%;` +
         `--bpx:${L / (100 - w) * 100}%;--bpy:${T / (100 - h) * 100}%;`;
}

/* Położenie kafelka w oknie (px tła okna -> %) + jego grafika. */
function stylKafla(u) {
  const x = UMIEJ_KOLUMNY_X[u.kol];
  const y = UMIEJ_WIERSZE_Y[u.wiersz];
  const w = UMIEJ_KAFEL_W * UMIEJ_KAFEL_SKALA;
  return `left:${x / UMIEJ_REF_W * 100}%;top:${y / UMIEJ_REF_H * 100}%;` +
         `width:${w / UMIEJ_REF_W * 100}%;--umiej-tlo:url('${u.plik}');`;
}

/* ---------- budowa okna ---------- */

function zbudujOknoUmiejetnosci() {
  const okno = document.getElementById("umiejetnosci-okno");
  if (!okno) return;

  const L = UMIEJ_UKLAD_KAFLA;

  let html = `<h1 class="umiej-tytul">Umiejętności pasywne</h1>
    <div id="umiej-monety" class="umiej-monety"><span>🪙</span><span id="umiej-monety-wartosc">0</span></div>`;

  UMIEJETNOSCI.forEach(u => {
    html += `<div class="umiej-kafel" id="umiej-kafel-${u.id}" style="${stylKafla(u)}">`;

    html += `<div class="umiej-nazwa" style="${stylProstokata(L.nazwaBox)}">${u.nazwa}</div>`;

    html += `<div class="umiej-ikona" id="umiej-ikona-${u.id}" data-umiej="${u.id}" style="${stylKola(L.ikona.x, L.ikona.y, L.ikona.r)}">
      <span class="umiej-ikona-koszt">${KOSZT_ODBLOKOWANIA_UMIEJETNOSCI}🪙</span>
    </div>`;

    L.poziomy.forEach((p, i) => {
      html += `<div class="umiej-poziom" id="umiej-poziom-${u.id}-${i}" data-umiej="${u.id}" data-poziom="${i}" style="${stylKola(p.x, p.y, UMIEJ_PROMIEN_POZIOMU)}">
        <span class="umiej-poziom-koszt">${KOSZT_ULEPSZENIA_UMIEJETNOSCI}🪙</span>
      </div>`;
    });

    html += `<div class="umiej-tekst" id="umiej-tekst-${u.id}" style="${stylProstokata(L.tekst)}"></div>`;

    html += `</div>`;
  });

  html += `<button class="umiej-zamknij" type="button" onclick="zamknijUmiejetnosci()"><img src="ZAMKNIJ.png" alt="ZAMKNIJ"></button>`;

  okno.innerHTML = html;
  okno.addEventListener("click", obsluzKlikUmiejetnosci);

  // Najechanie na dużą ikonę: zamiast opisu pokazuje się "Zadane obrażenia"
  okno.querySelectorAll(".umiej-ikona").forEach(ikona => {
    const id = ikona.dataset.umiej;
    ikona.addEventListener("mouseenter", () => pokazZadaneObrazenia(id, true));
    ikona.addEventListener("mouseleave", () => pokazZadaneObrazenia(id, false));
  });
}

/* ---------- tooltip: obrażenia zadane przez umiejętność ---------- */

/* Ile obrażeń dana umiejętność zadała w tej grze (licznik prowadzi survivor-game.js). */
function zadaneObrazeniaUmiej(id) {
  return (typeof zadaneObrazeniaUmiejetnosci === "function") ? zadaneObrazeniaUmiejetnosci(id) : 0;
}

function trescZadanychObrazen(id) {
  const wartosc = fmtUmiej(zadaneObrazeniaUmiej(id));
  // Wampiryczna nic nie zadaje, tylko leczy; Potrójna bije fizycznie (nie magią)
  if (id === "wampiryczna") return `Wyleczone PŻ:<br>💚<span class="umiej-dmg umiej-dmg-duze">${wartosc}</span>`;
  const ikona = id === "potrojna" ? "🏹" : "✨";
  const kolor = id === "potrojna" ? " umiej-dmg-bialy" : ""; // fizyczne = białe, magiczne = granatowe
  return `Zadane obrażenia:<br>${ikona}<span class="umiej-dmg umiej-dmg-duze${kolor}">${wartosc}</span>`;
}

function pokazZadaneObrazenia(id, pokaz) {
  const tekst = document.getElementById(`umiej-tekst-${id}`);
  if (!tekst) return;
  // Niekupiona umiejętność: cały czas widać opis, bez tooltipa z obrażeniami
  if (pokaz && !(umiejetnosciStan[id] && umiejetnosciStan[id].odblokowana)) return;
  if (pokaz) {
    const obr = tekst.querySelector(".umiej-tekst-obr");
    if (obr) obr.innerHTML = trescZadanychObrazen(id); // świeża wartość w momencie najechania
  }
  tekst.classList.toggle("pokaz-obrazenia", pokaz);
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

    UMIEJ_UKLAD_KAFLA.poziomy.forEach((_, i) => {
      const el = document.getElementById(`umiej-poziom-${u.id}-${i}`);
      if (!el) return;
      el.classList.toggle("zablokowana", i >= s.poziom);
      // napis z kosztem tylko na PIERWSZYM niekupionym poziomie
      el.classList.toggle("nastepny", i === s.poziom);
    });

    const tekst = document.getElementById(`umiej-tekst-${u.id}`);
    if (tekst) {
      const bonus = (s.odblokowana && s.poziom >= 4 && u.bonus) ? `<div class="umiej-bonus">${u.bonus}</div>` : "";
      tekst.innerHTML = `<div class="umiej-tekst-wew umiej-tekst-opis">${u.opis(s.poziom)}${bonus}</div>` +
        `<div class="umiej-tekst-wew umiej-tekst-obr">${trescZadanychObrazen(u.id)}</div>`;
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

  // Bonusy za max poziom (kradzież życia, obrażenia umiejętności) wchodzą do statystyk
  if (typeof obliczStatystyki === "function" && typeof stan !== "undefined" && stan[1] && stan[1].wylosowane) {
    obliczStatystyki(1);
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
