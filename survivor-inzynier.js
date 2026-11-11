/* ============================================================
   SURVIVOR-INZYNIER.JS
   Mechaniki walki klasy INŻYNIER. Ładować PO survivor-game.js i survivor-kostur.js
   (korzysta z jego ruchZPodkrokami i naAreniePoz).

   Id umiejętności (z survivor-bronie.js) -> mechanika Inżyniera:
     elektryczna = Działka plazmowe    potrojna = Wieżyczki (fizyczne)
     ognista     = Kolczatki           odlamkowa = Gryzaki
     magiczna    = Rakiety             wampiryczna = Wampiryzm (survivor-game.js)

   Skróty: PO = Podstawowe obrażenia, Z = zabici, OU = Obrażenia umiejętności %, CO = Całkowite obrażenia.
   Obrażenia magiczne: (PO + Z) * mnożnik * (1 + OU/100). Wieżyczki (fizyczne): CO * mnożnik.
   ============================================================ */

/* Zwykły atak */
const INZ_PREDKOSC_POCISKU = 900;
const INZ_PROMIEN_TRAFIENIA = 10;

/* Działka i wieżyczki stoją na okręgu wokół środka areny, 3 miejsca co 120° */
const INZ_PROMIEN_OKREGU = 343;
const INZ_LICZBA_STANOWISK = [1, 1, 2, 2, 3];

/* Działka plazmowe */
const DZIALKO_CO_MS = 1000;
const DZIALKO_PREDKOSC = 1300;            // szybki "laser" — wróg nie zdąży zejść z linii strzału
const DZIALKO_DLUGOSC_LASERA = 64;         // wzmocniony: 2x dłuższy
const DZIALKO_PROMIEN_POCISKU = 6;
const DZIALKO_WZMOCNIONY_CO = 3;            // max poziom: co 3. strzał wzmocniony
const DZIALKO_WZMOCNIONY_ROZMIAR = 3;       // 3x większy
const DZIALKO_WZMOCNIONY_OBRAZENIA = 2;     // 2x więcej obrażeń, przebija wrogów

/* Wieżyczki */
const WIEZYCZKA_CO_MS = 1500;               // max poziom: 750 ms
const WIEZYCZKA_PREDKOSC = 1500;
const WIEZYCZKA_MNOZNIK = [0.6, 0.7, 0.8, 0.9, 1];

/* Kolczatki */
const KOLCZATKI_CO_S = 5;
const KOLCZATKI_CZAS_S = [28, 36, 44, 52, 60];
const KOLCZATKI_KOLCE = [4, 6, 8, 10, 12];
const KOLCZATKI_MNOZNIK = [0.15, 0.25, 0.35, 0.45, 0.5];
const KOLCZATKA_PROMIEN = 11;
const KOLCZATKA_PROMIEN_WYBUCHU = PROMIEN_OGNIA;       // max poziom: wybuch obszarowy
const KOLOR_WYBUCHU_KOLCZATKI = "205, 210, 220";

/* Gryzaki */
const GRYZAKI_CO_S = 10;
const GRYZAKI_CZAS_S = [10, 15, 20, 25, 30];
const GRYZAKI_MNOZNIK = [0.5, 1, 1.5, 2, 2.5];         // łączne obrażenia z 3 s gryzienia
const GRYZAK_PROMIEN = 14;
const GRYZAK_CZAS_GRYZIENIA_MS = 3000;
const GRYZAK_TIK_MS = 500;

/* Rakiety */
const RAKIETY_CO_S = 10;
const RAKIETY_LICZBA = [3, 5, 7, 9, 11];
const RAKIETY_MNOZNIK = [0.15, 0.25, 0.35, 0.45, 0.5];
const RAKIETA_PREDKOSC = 540;
const RAKIETA_ODSTEP_STARTU_MS = 35;       // krótki odstęp między wystrzałami kolejnych rakiet
const RAKIETA_SZANSA_WYBUCHU = 33;          // max poziom
const KOLOR_WYBUCHU_RAKIETY = "255, 150, 50";

const INZ_TYPY_POCISKOW = ["inz", "plazma", "szpilka", "rakieta"];

let inzDzialka = [];
let inzWiezyczki = [];
let inzKolczatki = [];
let inzGryzaki = [];
let inzGryzienia = [];                       // aktywne "podgryzania" (DoT) na wrogach
let inzKolczatkiMs = 0;
let inzGryzakiMs = 0;
let inzRakietyMs = 0;

function czyInzynier() {
  return typeof aktualnaBron !== "undefined" && aktualnaBron === "inzynier";
}

function jestPociskInzyniera(p) {
  return INZ_TYPY_POCISKOW.includes(p.typ);
}

function resetujInzyniera() {
  inzDzialka = [];
  inzWiezyczki = [];
  inzKolczatki = [];
  inzGryzaki = [];
  inzGryzienia = [];
  inzKolczatkiMs = KOLCZATKI_CO_S * 1000;
  inzGryzakiMs = GRYZAKI_CO_S * 1000;
  inzRakietyMs = RAKIETY_CO_S * 1000;
}

/* ---------- pomocnicze ---------- */

function najblizszyWrogDo(x, y) {
  let wynik = null, naj = Infinity;
  for (const w of wrogowie) {
    if (w.hp <= 0) continue;
    const d = Math.hypot(w.x - x, w.y - y);
    if (d < naj) { naj = d; wynik = w; }
  }
  return wynik;
}

/* Stanowisko i (0..2) na okręgu o promieniu 343 wokół środka areny, co 120°.
   Działka zaczynają od DOŁU, wieżyczki od GÓRY. */
function pozycjaStanowiska(i, odGory) {
  const kat = (odGory ? -Math.PI / 2 : Math.PI / 2) + i * Math.PI * 2 / 3;
  return {
    x: canvas.width / 2 + Math.cos(kat) * INZ_PROMIEN_OKREGU,
    y: canvas.height / 2 + Math.sin(kat) * INZ_PROMIEN_OKREGU
  };
}

function losowePunktNaArenie(margines = 40) {
  return {
    x: margines + Math.random() * Math.max(1, canvas.width - 2 * margines),
    y: margines + Math.random() * Math.max(1, canvas.height - 2 * margines)
  };
}

/* ---------- ZWYKŁY ATAK ---------- */

function atakInzyniera(cel, staty1) {
  const dx = cel.x - postac.x, dy = cel.y - postac.y;
  const d = Math.hypot(dx, dy) || 1;
  pociskiGracza.push({ typ: "inz", x: postac.x, y: postac.y, dx: dx / d, dy: dy / d, trafieni: new Set(), mnoznikPrzebicia: 1 });
}

/* ---------- STANOWISKA (działka, wieżyczki) ---------- */

function strzalDzialka(d, cel) {
  const dx = cel.x - d.x, dy = cel.y - d.y;
  const dl = Math.hypot(dx, dy) || 1;
  d.licznik += 1;
  const pDzialko = poziomUmiejetnosci("elektryczna");
  const wzmocniony = pDzialko >= MAX_POZIOM_UMIEJETNOSCI && d.licznik % DZIALKO_WZMOCNIONY_CO === 0;
  pociskiGracza.push({
    typ: "plazma", x: d.x + (dx / dl) * 18, y: d.y + (dy / dl) * 18, dx: dx / dl, dy: dy / dl,
    wzmocniony, trafieni: new Set()
  });
  d.kat = Math.atan2(dy, dx);
}

function strzalWiezyczki(w, cel) {
  const dx = cel.x - w.x, dy = cel.y - w.y;
  const dl = Math.hypot(dx, dy) || 1;
  pociskiGracza.push({
    typ: "szpilka", x: w.x + (dx / dl) * 18, y: w.y + (dy / dl) * 18, dx: dx / dl, dy: dy / dl, trafieni: new Set()
  });
  w.kat = Math.atan2(dy, dx);
}

/* ---------- KOLCZATKI ---------- */

function rozstawKolczatke(p) {
  const pkt = losowePunktNaArenie();
  const n = KOLCZATKI_KOLCE[p];
  inzKolczatki.push({
    x: pkt.x, y: pkt.y,
    kolce: new Array(n).fill(true),               // pozycje kolców zostają, zużyte znikają
    zycie: KOLCZATKI_CZAS_S[p] * 1000, zycieMax: KOLCZATKI_CZAS_S[p] * 1000,
    dotyka: new Set()
  });
}

function wybuchKolczatki(k, staty1) {
  dodajEfektWybuchu(k.x, k.y, KOLCZATKA_PROMIEN_WYBUCHU, KOLOR_WYBUCHU_KOLCZATKI);
  wrogowie.slice().forEach(w => {
    if (w.hp <= 0 || Math.hypot(k.x - w.x, k.y - w.y) > KOLCZATKA_PROMIEN_WYBUCHU) return;
    wykonajAtakMagiczny(w, staty1, k.x, k.y, 1, { bezLinii: true, zrodlo: "ognista" });   // (PO+Z) + OU
  });
}

function aktualizujKolczatki(dtMs, staty1) {
  const p = Math.max(0, poziomUmiejetnosci("ognista"));
  const mnoznik = KOLCZATKI_MNOZNIK[p];
  const maks = poziomUmiejetnosci("ognista") >= MAX_POZIOM_UMIEJETNOSCI;

  inzKolczatki = inzKolczatki.filter(k => {
    k.zycie -= dtMs;

    for (const w of wrogowie.slice()) {
      if (w.hp <= 0) { k.dotyka.delete(w.id); continue; }
      const nakladaSie = Math.hypot(w.x - k.x, w.y - k.y) <= KOLCZATKA_PROMIEN + promienWroga(w) * 0.7;
      if (!nakladaSie) { k.dotyka.delete(w.id); continue; }
      if (k.dotyka.has(w.id)) continue;           // ten wróg już uruchomił kolczatkę przy tym wejściu
      k.dotyka.add(w.id);

      // kolce wbijają się w wroga jeden po drugim, aż zginie albo skończą się kolce
      for (let i = 0; i < k.kolce.length && w.hp > 0; i++) {
        if (!k.kolce[i]) continue;
        k.kolce[i] = false;
        wykonajAtakMagiczny(w, staty1, k.x, k.y, mnoznik, { bezLinii: true, zrodlo: "ognista" });
      }
    }

    const pustaKolczatka = !k.kolce.some(Boolean);
    if (pustaKolczatka || k.zycie <= 0) {
      if (maks) wybuchKolczatki(k, staty1);       // max: wybuch po zużyciu kolców LUB po upływie czasu
      return false;
    }
    return true;
  });
}

/* ---------- GRYZAKI ---------- */

function rozstawGryzaka(p) {
  const pkt = losowePunktNaArenie();
  inzGryzaki.push({
    x: pkt.x, y: pkt.y, kat: Math.random() * 6,
    zycie: GRYZAKI_CZAS_S[p] * 1000, zycieMax: GRYZAKI_CZAS_S[p] * 1000,
    pasc: Math.random() * 6
  });
}

/* Jeden tik gryzienia: obrażenia magiczne w stylu podpalenia (🔥). */
function tikGryzienia(g, staty1) {
  const w = g.wrog;
  const dmg = Math.round(g.dmgTik * (w.odporny ? MNOZNIK_DMG_ODPORNEGO : 1));
  if (dmg <= 0) return;
  w.hp -= dmg;
  rundaStaty.obrazenia += dmg;
  rundaStaty.magiczne += dmg;
  dodajDmgUmiejetnosci("odlamkowa", dmg);
  wampiryzmZaklec(dmg);
  dodajEfektAtaku(w.x, w.y, dmg, { podpalenie: true, bezLinii: true });
  if (w.hp <= 0) zabijWroga(w);
}

function aktualizujGryzaki(dtMs, staty1) {
  const p = Math.max(0, poziomUmiejetnosci("odlamkowa"));
  const lacznie = ((staty1.podstawoweObrażenia || 3000) + bonusObrazenZZabojstw()) * GRYZAKI_MNOZNIK[p] * (1 + (staty1.obrazeniaUmiejetnosci || 0) / 100);
  const tikow = Math.round(GRYZAK_CZAS_GRYZIENIA_MS / GRYZAK_TIK_MS);

  inzGryzaki = inzGryzaki.filter(g => {
    g.zycie -= dtMs;
    g.kat += dtMs / 1000 * 3.5;
    g.pasc += dtMs / 1000 * 11;                    // faza otwierania/zamykania szczęki

    for (const w of wrogowie) {
      if (w.hp <= 0) continue;
      if (Math.hypot(w.x - g.x, w.y - g.y) > GRYZAK_PROMIEN + promienWroga(w) * 0.7) continue;
      // wróg wszedł w gryzaka: zaczyna być gryziony przez 3 s (tik co 0,5 s), a gryzak znika
      inzGryzienia.push({ wrog: w, dmgTik: lacznie / tikow, zostalo: tikow, doTiku: GRYZAK_TIK_MS });
      return false;
    }
    return g.zycie > 0;
  });

  inzGryzienia = inzGryzienia.filter(gr => {
    if (gr.wrog.hp <= 0) return false;
    gr.doTiku -= dtMs;
    while (gr.doTiku <= 0 && gr.zostalo > 0 && gr.wrog.hp > 0) {
      gr.doTiku += GRYZAK_TIK_MS;
      gr.zostalo -= 1;
      tikGryzienia(gr, staty1);
    }
    return gr.zostalo > 0 && gr.wrog.hp > 0;
  });
}

/* ---------- RAKIETY ---------- */

/* Punkt, w którym pocisk lecący z prędkością v z (x, y) spotka idącego do gracza wroga
   (przybliżenie: wróg idzie prosto na gracza z prędkością wrog.predkosc, ranged zatrzymuje się w zasięgu). */
function punktPrzechwycenia(w, x, y, v) {
  const dxp = postac.x - w.x, dyp = postac.y - w.y;
  const dp = Math.hypot(dxp, dyp) || 1;
  const vw = (w.ogluszonyDoCzasu > czasWirt()) ? 0 : (w.predkosc || 0);
  const zasieg = w.typ === "ranged" ? 350 : 40;
  const maxRuch = Math.max(0, dp - zasieg);
  let t = Math.hypot(w.x - x, w.y - y) / v;
  let px = w.x, py = w.y;
  for (let i = 0; i < 3; i++) {
    const ruch = Math.min(vw * t, maxRuch);
    px = w.x + dxp / dp * ruch;
    py = w.y + dyp / dp * ruch;
    t = Math.hypot(px - x, py - y) / v;
  }
  return { x: px, y: py };
}

function wystrzelRakiety(p) {
  // Cel (najbliższy wróg) wybierany jest RAZ, na początku salwy — wszystkie rakiety lecą w jego stronę
  // i nie zmieniają celu. Każda leci po prostej od momentu startu.
  const cel = najblizszyWrogDo(postac.x, postac.y);
  if (!cel) return false;
  const n = RAKIETY_LICZBA[p];
  const mnoznik = RAKIETY_MNOZNIK[p];
  const kierunekBazowy = Math.atan2(cel.y - postac.y, cel.x - postac.x);   // gdyby cel zginął przed startem rakiety

  for (let i = 0; i < n; i++) {
    // rakiety startują kolejno (krótki odstęp) i są lekko przesunięte na boki
    zaplanujAkcje(i * RAKIETA_ODSTEP_STARTU_MS, () => {
      if (!graTrwa || !czyInzynier()) return;
      const bok = ((i % 3) - 1) * 9;
      const xs = postac.x - Math.sin(kierunekBazowy) * bok;
      const ys = postac.y + Math.cos(kierunekBazowy) * bok;

      // celowanie z wyprzedzeniem w TEN SAM cel (jeśli już zginął: wcześniej wyliczony kierunek)
      let kierunek = kierunekBazowy;
      if (cel.hp > 0) {
        const punkt = punktPrzechwycenia(cel, xs, ys, RAKIETA_PREDKOSC);
        kierunek = Math.atan2(punkt.y - ys, punkt.x - xs);
      }

      pociskiGracza.push({
        typ: "rakieta", mnoznik,
        x: xs, y: ys, kier: kierunek,
        dx: Math.cos(kierunek), dy: Math.sin(kierunek),
        slad: [], t: Math.random() * 6
      });
    });
  }
  return true;
}

function trafienieRakiety(r, cel, staty1) {
  const xT = cel.x, yT = cel.y;
  wykonajAtakMagiczny(cel, staty1, r.x, r.y, r.mnoznik, { bezLinii: true, zrodlo: "magiczna" });

  // max poziom: 33% szansy na dodatkowy wybuch obszarowy o tej samej sile
  if (poziomUmiejetnosci("magiczna") >= MAX_POZIOM_UMIEJETNOSCI && losujProcent() < RAKIETA_SZANSA_WYBUCHU) {
    dodajEfektWybuchu(xT, yT, PROMIEN_OGNIA, KOLOR_WYBUCHU_RAKIETY);
    wrogowie.slice().forEach(w => {
      if (w.id === cel.id || w.hp <= 0 || Math.hypot(xT - w.x, yT - w.y) > PROMIEN_OGNIA) return;
      wykonajAtakMagiczny(w, staty1, xT, yT, r.mnoznik, { bezLinii: true, zrodlo: "magiczna" });
    });
  }
}

/* ---------- pętla ---------- */

function aktualizujInzyniera(dtMs) {
  const staty1 = stan[1].staty;
  // struktury istnieją tylko w tej klasie
  if (!czyInzynier() || !staty1) return;

  // --- Działka plazmowe: stoją na okręgu od dołu, strzelają co 1 s w najbliższego wroga
  const pDzialko = poziomUmiejetnosci("elektryczna");
  if (pDzialko >= 0) {
    while (inzDzialka.length < INZ_LICZBA_STANOWISK[pDzialko]) {
      const pos = pozycjaStanowiska(inzDzialka.length, false);
      inzDzialka.push({ x: pos.x, y: pos.y, kat: -Math.PI / 2, doStrzalu: 400 + inzDzialka.length * 250, licznik: 0 });
    }
    inzDzialka.forEach(d => {
      d.doStrzalu -= dtMs;
      if (d.doStrzalu > 0) return;
      const cel = najblizszyWrogDo(d.x, d.y);
      if (!cel) { d.doStrzalu = 0; return; }
      strzalDzialka(d, cel);
      d.doStrzalu = DZIALKO_CO_MS;
    });
  }

  // --- Wieżyczki: od góry, co 1,5 s (max: co 0,75 s)
  const pWiez = poziomUmiejetnosci("potrojna");
  if (pWiez >= 0) {
    while (inzWiezyczki.length < INZ_LICZBA_STANOWISK[pWiez]) {
      const pos = pozycjaStanowiska(inzWiezyczki.length, true);
      inzWiezyczki.push({ x: pos.x, y: pos.y, kat: Math.PI / 2, doStrzalu: 600 + inzWiezyczki.length * 300 });
    }
    const interwal = pWiez >= MAX_POZIOM_UMIEJETNOSCI ? WIEZYCZKA_CO_MS / 2 : WIEZYCZKA_CO_MS;
    inzWiezyczki.forEach(w => {
      w.doStrzalu -= dtMs;
      if (w.doStrzalu > 0) return;
      const cel = najblizszyWrogDo(w.x, w.y);
      if (!cel) { w.doStrzalu = 0; return; }
      strzalWiezyczki(w, cel);
      w.doStrzalu = interwal;
    });
  }

  // --- Kolczatki: co 5 s nowa
  const pKol = poziomUmiejetnosci("ognista");
  if (pKol < 0) inzKolczatkiMs = czasUmiejetnosciMs(KOLCZATKI_CO_S);
  else {
    inzKolczatkiMs -= dtMs;
    if (inzKolczatkiMs <= 0) {
      rozstawKolczatke(pKol);
      inzKolczatkiMs = czasUmiejetnosciMs(KOLCZATKI_CO_S);
    }
  }
  aktualizujKolczatki(dtMs, staty1);

  // --- Gryzaki: co 10 s (max: 3 naraz)
  const pGry = poziomUmiejetnosci("odlamkowa");
  if (pGry < 0) inzGryzakiMs = czasUmiejetnosciMs(GRYZAKI_CO_S);
  else {
    inzGryzakiMs -= dtMs;
    if (inzGryzakiMs <= 0) {
      const ile = pGry >= MAX_POZIOM_UMIEJETNOSCI ? 3 : 1;
      for (let i = 0; i < ile; i++) rozstawGryzaka(pGry);
      inzGryzakiMs = czasUmiejetnosciMs(GRYZAKI_CO_S);
    }
  }
  aktualizujGryzaki(dtMs, staty1);

  // --- Rakiety: co 10 s salwa
  const pRak = poziomUmiejetnosci("magiczna");
  if (pRak < 0) inzRakietyMs = czasUmiejetnosciMs(RAKIETY_CO_S);
  else {
    inzRakietyMs -= dtMs;
    if (inzRakietyMs <= 0 && wystrzelRakiety(pRak)) inzRakietyMs = czasUmiejetnosciMs(RAKIETY_CO_S);
  }
}

/* Zwraca true, jeśli pocisk ma zostać (false = usuń). */
function aktualizujPociskInzyniera(p, dtMs, staty1) {
  if (!staty1) return naAreniePoz(p);

  switch (p.typ) {
    case "inz":
      p.kat = (p.kat ?? 0) + dtMs / 1000 * 16;                  // klucz kręci się w locie
      return ruchZPodkrokami(p, INZ_PREDKOSC_POCISKU, dtMs, pk => {
        for (const w of wrogowie.slice()) {
          if (w.hp <= 0 || pk.trafieni.has(w.id)) continue;
          if (Math.hypot(w.x - pk.x, w.y - pk.y) > promienWroga(w) + INZ_PROMIEN_TRAFIENIA) continue;
          pk.trafieni.add(w.id);
          const dmg = wykonajPojedynczyAtak(w, staty1, pk.x, pk.y, pk.mnoznikPrzebicia);
          procAffixuOgnistejStrzaly(w, dmg, staty1);
          pk.mnoznikPrzebicia += WZROST_DMG_NA_PRZEBICIE;   // przebija jak strzała
        }
        return false;
      });

    case "plazma": {
      const rozmiar = p.wzmocniony ? DZIALKO_WZMOCNIONY_ROZMIAR : 1;
      const promienPocisku = DZIALKO_PROMIEN_POCISKU * rozmiar;
      const mnoznik = p.wzmocniony ? DZIALKO_WZMOCNIONY_OBRAZENIA : 1;
      return ruchZPodkrokami(p, DZIALKO_PREDKOSC, dtMs, pk => {
        for (const w of wrogowie.slice()) {
          if (w.hp <= 0 || pk.trafieni.has(w.id)) continue;
          if (Math.hypot(w.x - pk.x, w.y - pk.y) > promienWroga(w) + promienPocisku) continue;
          pk.trafieni.add(w.id);
          wykonajAtakMagiczny(w, staty1, pk.x, pk.y, mnoznik, { bezLinii: true, zrodlo: "elektryczna" });
          if (!p.wzmocniony) return true;          // zwykły pocisk bije tylko pierwszy cel
        }
        return false;                               // wzmocniony przebija
      });
    }

    case "szpilka": {
      const pWiez = Math.max(0, poziomUmiejetnosci("potrojna"));
      return ruchZPodkrokami(p, WIEZYCZKA_PREDKOSC, dtMs, pk => {
        for (const w of wrogowie.slice()) {
          if (w.hp <= 0 || pk.trafieni.has(w.id)) continue;
          if (Math.hypot(w.x - pk.x, w.y - pk.y) > promienWroga(w) + 8) continue;
          pk.trafieni.add(w.id);
          // fizyczne: CO * mnożnik; tylko kryt i przeszywka, bez trucizny/krwawienia/omdlenia
          wykonajPojedynczyAtak(w, staty1, pk.x, pk.y, 1, { bezEfektow: true, mnoznikSkilla: WIEZYCZKA_MNOZNIK[pWiez], zrodloDmg: "potrojna" });
        }
        return false;                               // przebija wrogów
      });
    }

    case "rakieta": {
      p.t += dtMs / 1000;
      // lot po prostej; trafia pierwszego wroga na drodze (jeśli cel już zginął, leci dalej w kolejnego)
      const zyje = ruchZPodkrokami(p, RAKIETA_PREDKOSC, dtMs, pk => {
        const w = pierwszyWrogWZasiegu(pk, 10);
        if (!w) return false;
        trafienieRakiety(pk, w, staty1);
        return true;
      });
      p.slad.push({ x: p.x, y: p.y });
      if (p.slad.length > 16) p.slad.shift();
      return zyje;
    }
  }
  return naAreniePoz(p);
}

/* ---------- rysowanie ---------- */

const KOLORY_DZIALKA = { stopa: "#3a4a63", ciemny: "#1d46a0", jasny: "#74b8ff", lufa: "#cfe8ff", obrys: "#0a1630", poswiata: "#4fa6ff" };
const KOLORY_WIEZYCZKA = { stopa: "#5a4630", ciemny: "#a9570f", jasny: "#ffc766", lufa: "#fff2d0", obrys: "#2b1706", poswiata: "#ffb347" };

/* Widok z góry: 3 okrągłe stopki, okrągły korpus, obracana lufa. */
function rysujStanowisko(x, y, kat, kol) {
  ctx.save();
  ctx.translate(x, y);

  // stopki (3 okrągłe, co 120°)
  for (let i = 0; i < 3; i++) {
    const a = Math.PI / 6 + i * Math.PI * 2 / 3;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 14, Math.sin(a) * 14, 5, 0, Math.PI * 2);
    ctx.fillStyle = kol.stopa;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = kol.obrys;
    ctx.stroke();
  }

  // korpus
  const g = ctx.createRadialGradient(-3, -3, 1, 0, 0, 12);
  g.addColorStop(0, kol.jasny);
  g.addColorStop(1, kol.ciemny);
  ctx.shadowColor = kol.poswiata;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2;
  ctx.strokeStyle = kol.obrys;
  ctx.stroke();

  // lufa
  ctx.rotate(kat);
  ctx.fillStyle = kol.lufa;
  ctx.strokeStyle = kol.obrys;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.rect(3, -3, 19, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = kol.ciemny;
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function rysujKolczatke(k) {
  const migot = k.zycie < 3000 ? (Math.floor(k.zycie / 250) % 2 ? 0.45 : 1) : 1;   // ostatnie 3 s: miga
  const n = k.kolce.length;
  ctx.save();
  ctx.globalAlpha = migot;
  ctx.translate(k.x, k.y);

  // kolce
  ctx.fillStyle = "#e9edf3";
  ctx.strokeStyle = "#3a3f48";
  ctx.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    if (!k.kolce[i]) continue;
    const a = i * Math.PI * 2 / n;
    const px = -Math.sin(a), py = Math.cos(a);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 9 + px * 3.2, Math.sin(a) * 9 + py * 3.2);
    ctx.lineTo(Math.cos(a) * 19, Math.sin(a) * 19);
    ctx.lineTo(Math.cos(a) * 9 - px * 3.2, Math.sin(a) * 9 - py * 3.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // okrągły środek (szary + biały)
  const g = ctx.createRadialGradient(-2, -2, 1, 0, 0, KOLCZATKA_PROMIEN);
  g.addColorStop(0, "#c8ced8");
  g.addColorStop(1, "#6b727e");
  ctx.beginPath();
  ctx.arc(0, 0, KOLCZATKA_PROMIEN - 1, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = "#2f343c";
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();
}

/* Robotyczna szczęka: metalowa podstawa z diodą, dwie szczęki z zębami otwierają się i zatrzaskują;
   cała maszyna się trzęsie i powoli obraca. */
function rysujGryzaka(g) {
  const migot = g.zycie < 3000 ? (Math.floor(g.zycie / 250) % 2 ? 0.5 : 1) : 1;
  const tx = (Math.random() - 0.5) * 2.4, ty = (Math.random() - 0.5) * 2.4;
  const rozwarcie = 0.08 + 0.62 * Math.abs(Math.sin(g.pasc));      // kąt otwarcia szczęk
  ctx.save();
  ctx.globalAlpha = migot;
  ctx.translate(g.x + tx, g.y + ty);
  ctx.rotate(g.kat);

  const szczeka = strona => {
    ctx.save();
    ctx.rotate(strona * rozwarcie);
    const gr = ctx.createLinearGradient(0, 0, 0, strona * 6);
    gr.addColorStop(0, "#c7cfda");
    gr.addColorStop(1, "#59616f");
    ctx.fillStyle = gr;
    ctx.strokeStyle = "#1c2028";
    ctx.lineWidth = 1.3;
    ctx.beginPath();                                                // ramię szczęki
    ctx.rect(-2, strona > 0 ? 0 : -5, 19, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f1f4f8";                                      // metalowe zęby (5)
    for (let i = 0; i < 5; i++) {
      const x = 2 + i * 3.4;
      ctx.beginPath();
      ctx.moveTo(x, strona > 0 ? 0 : 0);
      ctx.lineTo(x + 1.7, strona > 0 ? -4.2 : 4.2);
      ctx.lineTo(x + 3.4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  };
  szczeka(1);
  szczeka(-1);

  // podstawa / zawias z diodą
  const g2 = ctx.createRadialGradient(-6, -2, 1, -5, 0, 9);
  g2.addColorStop(0, "#d4dae3");
  g2.addColorStop(1, "#4a515e");
  ctx.beginPath();
  ctx.arc(-5, 0, 8.5, 0, Math.PI * 2);
  ctx.fillStyle = g2;
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = "#1c2028";
  ctx.stroke();
  ctx.shadowColor = "#ff5a2a";
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(-5, 0, 2.6, 0, Math.PI * 2);
  ctx.fillStyle = Math.sin(g.pasc * 2) > 0 ? "#ff5a2a" : "#ffb347";   // pulsująca dioda
  ctx.fill();
  ctx.restore();
}

/* Struktury Inżyniera (działka, wieżyczki, kolczatki, gryzaki): rysowane POD wrogami (hak w rysujGre). */
function rysujObiektyInzyniera() {
  if (!czyInzynier()) return;
  inzKolczatki.forEach(rysujKolczatke);
  inzGryzaki.forEach(rysujGryzaka);
  inzWiezyczki.forEach(w => rysujStanowisko(w.x, w.y, w.kat, KOLORY_WIEZYCZKA));
  inzDzialka.forEach(d => rysujStanowisko(d.x, d.y, d.kat, KOLORY_DZIALKA));
}

/* Zwraca true, jeśli pocisk został narysowany (rysujGre pomija wtedy strzałę). */
function rysujPociskInzyniera(p) {
  switch (p.typ) {
    case "inz": {
      // klucz płasko-oczkowy: jeden koniec otwarty (płaski, litera C), drugi zamknięty (oczko); kręci się w locie
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.kat ?? 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const rysuj = (kolor, dod) => {
        ctx.strokeStyle = kolor;
        ctx.lineWidth = 4.2 + dod;                              // trzonek
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(7, 0);
        ctx.stroke();
        ctx.lineWidth = 3.2 + dod;                              // oczko (zamknięty koniec)
        ctx.beginPath();
        ctx.arc(10.5, 0, 4.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();                                        // koniec płaski (otwarty)
        ctx.arc(-10.5, 0, 4.6, Math.PI + 0.65, Math.PI - 0.65);
        ctx.stroke();
      };
      ctx.shadowColor = "rgba(200, 220, 255, 0.7)";
      ctx.shadowBlur = 5;
      rysuj("#1d222b", 2);                                      // ciemny kontur
      ctx.shadowBlur = 0;
      rysuj("#cfd6e2", 0);                                      // stalowy kolor
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";            // połysk na trzonku
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-6, -1);
      ctx.lineTo(6, -1);
      ctx.stroke();
      ctx.restore();
      return true;
    }

    case "plazma": {
      // pocisk-laser: długa jasna smuga z gorącą głowicą (wzmocniony: 3x grubszy i 2x dłuższy)
      const grub = p.wzmocniony ? DZIALKO_WZMOCNIONY_ROZMIAR : 1;
      const dl = DZIALKO_DLUGOSC_LASERA * (p.wzmocniony ? 2 : 1);
      const xT = p.x - p.dx * dl, yT = p.y - p.dy * dl;
      ctx.save();
      ctx.lineCap = "round";
      const gr = ctx.createLinearGradient(xT, yT, p.x, p.y);
      gr.addColorStop(0, "rgba(40, 120, 255, 0)");
      gr.addColorStop(0.7, "rgba(90, 175, 255, 0.85)");
      gr.addColorStop(1, "rgba(200, 235, 255, 1)");
      ctx.shadowColor = "#3d9bff";
      ctx.shadowBlur = p.wzmocniony ? 24 : 14;
      ctx.beginPath();
      ctx.moveTo(xT, yT);
      ctx.lineTo(p.x, p.y);
      ctx.lineWidth = 3.2 * grub;
      ctx.strokeStyle = gr;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.beginPath();                                          // biały rdzeń lasera
      ctx.moveTo(p.x - p.dx * dl * 0.55, p.y - p.dy * dl * 0.55);
      ctx.lineTo(p.x, p.y);
      ctx.lineWidth = 1.3 * grub;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.stroke();
      ctx.restore();
      return true;
    }

    case "szpilka": {
      // "T": krótka biała szpilka z poprzeczką z tyłu
      const dl = 24;
      const px = -p.dy, py = p.dx;
      const xT = p.x - p.dx * dl, yT = p.y - p.dy * dl;
      ctx.save();
      ctx.lineCap = "round";
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(xT, yT);
      ctx.lineTo(p.x, p.y);
      ctx.lineWidth = 1.7;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xT + px * 4.2, yT + py * 4.2);
      ctx.lineTo(xT - px * 4.2, yT - py * 4.2);
      ctx.lineWidth = 2.1;
      ctx.stroke();
      ctx.restore();
      return true;
    }

    case "rakieta": {
      // dym: coraz bledsze i większe puffy za rakietą
      ctx.save();
      for (let i = 0; i < p.slad.length; i++) {
        const t = (i + 1) / p.slad.length;               // 0 (stary) .. 1 (świeży)
        ctx.beginPath();
        ctx.arc(p.slad[i].x, p.slad[i].y, 2 + (1 - t) * 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(190, 190, 195, ${0.32 * t})`;
        ctx.fill();
      }
      ctx.restore();

      // cienka rakieta: korpus, szpic, statecznik i płomień
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.kier);
      ctx.shadowColor = "#ff9a3a";
      ctx.shadowBlur = 6;
      ctx.beginPath();                                    // płomień
      ctx.moveTo(-9, 0);
      ctx.lineTo(-17 - Math.random() * 4, 0);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#ffb347";
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#d9dde5";                          // korpus
      ctx.strokeStyle = "#2b2f38";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(-9, -2, 14, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#e5483a";                          // szpic
      ctx.beginPath();
      ctx.moveTo(5, -2);
      ctx.lineTo(11, 0);
      ctx.lineTo(5, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#8a909c";                          // statecznik
      ctx.beginPath();
      ctx.moveTo(-9, -2);
      ctx.lineTo(-12, -5);
      ctx.lineTo(-5, -2);
      ctx.closePath();
      ctx.moveTo(-9, 2);
      ctx.lineTo(-12, 5);
      ctx.lineTo(-5, 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return true;
    }
  }
  return false;
}
