/* ============================================================
   SURVIVOR-KOSTUR.JS
   Mechaniki walki broni KOSTUR. Ładować PO survivor-game.js.

   Id umiejętności (z survivor-bronie.js) -> mechanika Kostura:
     elektryczna = Piorun      ognista   = Ogień
     odlamkowa   = Ziemia      magiczna  = Powietrze
     potrojna    = Woda        wampiryczna = Wampiryzm (obsługuje survivor-game.js)

   Zwykły atak: pusty w środku okrąg, NIE przebija (znika na pierwszym wrogu).
   Wszystkie umiejętności zadają obrażenia magiczne:
     (Podstawowe obrażenia + zabici) * mnożnik * (1 + Obrażenia umiejętności %)
   ============================================================ */

const KOSTUR_PREDKOSC_KOLA = 700;
const KOSTUR_PROMIEN_KOLA = 11;
const KOSTUR_PROMIEN_TRAFIENIA_KOLA = 12;

/* Piorun */
const KOSTUR_SZANSA_PIORUNA = 33;
const KOSTUR_MNOZNIK_PIORUNA = 1;
const KOLOR_WYBUCHU_PIORUNA = "255, 225, 40";          // żółty
const KOLOR_PIORUNA = "255, 235, 80";

/* Ogień */
const KOSTUR_SZANSA_PODPALENIA = 33;                    // umiejętności podpalają
const KOSTUR_PODPALENIE_BAZA = 0.05;                    // 5% + 1% za poziom maks. PŻ w 3s
const KOSTUR_SZANSA_WYBUCHU_ZWYKLEGO = 40;              // max poziom: zwykły atak wybucha
const KOSTUR_PODSTAWA_WYBUCHU_ZWYKLEGO = 700;           // (700 + zabici) * Obr. um.

/* Ziemia */
const KOSTUR_ZIEMIA_CZAS_BAZA_S = 9;                    // co (9 - poziom) s
const KOSTUR_PREDKOSC_GLAZU = 650;
const PROMIEN_WYBUCHU_ZIEMI = PROMIEN_OGNIA * 2;        // 2x zasięg obrażeń obszarowych
const KOLOR_WYBUCHU_ZIEMI = "90, 200, 70";              // zielony
const KOSTUR_SZANSA_OMDLENIA_ZIEMI = 33;
const KOSTUR_CZAS_OMDLENIA_ZIEMI_MS = 1000;

/* Powietrze */
const KOSTUR_POWIETRZE_CZAS_MS = 8000;
const KOSTUR_PREDKOSC_TORNADA = 260;
const KOSTUR_PROMIEN_TORNADA = 36;
const KOSTUR_ODSTEP_TORNAD_MS = 250;                    // kolejne tornada z jednej salwy startują co 0,25s
const KOSTUR_SPOWOLNIENIE = 0.2;
const KOSTUR_CZAS_SPOWOLNIENIA_MS = 3000;

/* Woda */
const KOSTUR_WODA_CZAS_BAZA_S = 7;                      // co (7 - poziom) s
const KOSTUR_PREDKOSC_FALI = 520;
const KOSTUR_POL_SZEROKOSCI_FALI = 40;                  // fala szeroka na 2 średnice postaci (2 * 40 px)
const KOSTUR_SZANSA_ODEPCHNIECIA = 33;
const KOSTUR_DYSTANS_ODEPCHNIECIA = PROMIEN_OGNIA;      // 110 px
const KOSTUR_PREDKOSC_ODEPCHNIECIA = 700;

const KOSTUR_TYPY_POCISKOW = ["kolo", "ziemia", "fala", "tornado"];

let kosturZiemiaMs = 0;
let kosturWodaMs = 0;
let kosturPowietrzeMs = 0;

function czyKostur() {
  return typeof aktualnaBron !== "undefined" && aktualnaBron === "kostur";
}

function jestPociskKostura(p) {
  return KOSTUR_TYPY_POCISKOW.includes(p.typ);
}

function resetujKostura() {
  kosturZiemiaMs = KOSTUR_ZIEMIA_CZAS_BAZA_S * 1000;
  kosturWodaMs = KOSTUR_WODA_CZAS_BAZA_S * 1000;
  kosturPowietrzeMs = KOSTUR_POWIETRZE_CZAS_MS;
}

function naAreniePoz(p, margines = 60) {
  return p.x > -margines && p.x < canvas.width + margines && p.y > -margines && p.y < canvas.height + margines;
}

/* ---------- obrażenia umiejętności Kostura ---------- */

/* Atak magiczny umiejętności + (33%) podpalenie, jeśli kupiono Ogień. */
function atakUmiejetnosciKostura(cel, staty1, xZrodla, yZrodla, mnoznik, zrodlo, opcje = {}) {
  const dmg = wykonajAtakMagiczny(cel, staty1, xZrodla, yZrodla, mnoznik, Object.assign({ zrodlo, bezLinii: true }, opcje));
  if (dmg > 0 && cel.hp > 0 && !opcje.bezPodpalenia) sprobujPodpalenia(cel);
  return dmg;
}

/* Ogień: umiejętności mają 33% szansy podpalić trafionego wroga
   (efekt jak Ognista strzała: 3s, tiki co 0,5s, tylko inny % maks. PŻ). */
function sprobujPodpalenia(cel) {
  const pOgien = poziomUmiejetnosci("ognista");
  if (pOgien < 0 || cel.hp <= 0) return;
  if (losujProcent() >= KOSTUR_SZANSA_PODPALENIA) return;

  if (!(cel.podpalenieTury > 0)) cel.ostatniTikPodpalenia = czasWirt();
  cel.podpalenieTury = PODPALENIE_LICZBA_TIKOW;
  cel.podpalenieProcent = KOSTUR_PODPALENIE_BAZA + pOgien / 100;
}

/* ---------- ZWYKŁY ATAK: okrąg ---------- */

function atakKostura(cel, staty1) {
  // Piorun (kupiony): atak leci naraz w (2 + poziom) najbliższych wrogów
  const pPiorun = poziomUmiejetnosci("elektryczna");
  const cele = pPiorun >= 0 ? znajdzNajblizszychWrogow(2 + pPiorun, new Set()) : [cel];

  cele.forEach(c => {
    const dx = c.x - postac.x;
    const dy = c.y - postac.y;
    const d = Math.hypot(dx, dy) || 1;
    pociskiGracza.push({ typ: "kolo", x: postac.x, y: postac.y, dx: dx / d, dy: dy / d });
  });
}

function trafienieKolem(wrog, staty1, p) {
  const dmg = wykonajPojedynczyAtak(wrog, staty1, p.x, p.y, 1);
  procAffixuOgnistejStrzaly(wrog, dmg, staty1);   // affix "Ognista strzała" z ekwipunku działa jak zawsze
  procPioruna(wrog, staty1);
  procWybuchuZwyklegoAtaku(wrog, staty1);
}

/* ---------- PIORUN ---------- */

function procPioruna(cel, staty1) {
  if (poziomUmiejetnosci("elektryczna") < 0) return;
  if (losujProcent() >= KOSTUR_SZANSA_PIORUNA) return;

  const sasiad = znajdzNajblizszegoWrogaOd(cel, new Set());   // 1 najbliższy wróg od celu
  const trafione = new Set();
  uderzPiorunem(cel, staty1, trafione);
  if (sasiad && sasiad.hp > 0) uderzPiorunem(sasiad, staty1, trafione);
}

/* Max poziom: piorun jest obszarowy — żółty wybuch (zasięg obrażeń obszarowych)
   zadaje te same obrażenia wszystkim wrogom wokół. Każdy wróg dostaje 1 trafienie na procka. */
function uderzPiorunem(cel, staty1, trafione) {
  const obszarowy = poziomUmiejetnosci("elektryczna") >= MAX_POZIOM_UMIEJETNOSCI;
  dodajPiorun(cel.x, cel.y);

  const uderz = w => {
    if (w.hp <= 0 || trafione.has(w.id)) return;
    trafione.add(w.id);
    atakUmiejetnosciKostura(w, staty1, w.x, w.y, KOSTUR_MNOZNIK_PIORUNA, "elektryczna");
  };

  uderz(cel);

  if (obszarowy) {
    const x = cel.x, y = cel.y;
    dodajEfektWybuchu(x, y, PROMIEN_OGNIA, KOLOR_WYBUCHU_PIORUNA);
    wrogowie.slice().forEach(w => {
      if (w.hp > 0 && Math.hypot(x - w.x, y - w.y) <= PROMIEN_OGNIA) uderz(w);
    });
  }
}

function dodajPiorun(x, y) {
  // postrzępiona błyskawica z góry w cel
  const punkty = [];
  const xStart = x + losujLiczbe(-40, 40);
  const yStart = y - 280;
  const kroki = 9;
  for (let i = 0; i <= kroki; i++) {
    const t = i / kroki;
    const jitter = (i === 0 || i === kroki) ? 0 : losujLiczbe(-16, 16);
    punkty.push({ x: xStart + (x - xStart) * t + jitter, y: yStart + (y - yStart) * t });
  }
  efekty.push({ typ: "piorun", punkty, zycie: 260, zycieMax: 260 });
}

function rysujPiorun(e) {
  const alpha = Math.max(0, e.zycie / e.zycieMax);
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.shadowColor = `rgba(${KOLOR_PIORUNA}, ${alpha})`;
  ctx.shadowBlur = 16;

  ctx.beginPath();
  e.punkty.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
  ctx.strokeStyle = `rgba(${KOLOR_PIORUNA}, ${alpha})`;
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.beginPath();
  e.punkty.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

/* ---------- OGIEŃ (max poziom): zwykły atak wybucha ---------- */

function procWybuchuZwyklegoAtaku(cel, staty1) {
  if (poziomUmiejetnosci("ognista") < MAX_POZIOM_UMIEJETNOSCI) return;
  if (losujProcent() >= KOSTUR_SZANSA_WYBUCHU_ZWYKLEGO) return;

  const x = cel.x, y = cel.y;
  dodajEfektWybuchu(x, y, PROMIEN_OGNIA, KOLOR_WYBUCHU_OGNIA);
  wrogowie.slice().forEach(w => {
    if (w.hp <= 0 || Math.hypot(x - w.x, y - w.y) > PROMIEN_OGNIA) return;
    // (700 + zabici) * (1 + Obr. um.) — magiczne; sam wybuch nie podpala
    wykonajAtakMagiczny(w, staty1, x, y, 1, { bezLinii: true, zrodlo: "ognista", podstawa: KOSTUR_PODSTAWA_WYBUCHU_ZWYKLEGO });
  });
}

/* ---------- ZIEMIA: głaz z dużym zielonym wybuchem ---------- */

function wystrzelGlaz() {
  const cel = znajdzNajblizszegoWroga();
  if (!cel) return false;
  const dx = cel.x - postac.x;
  const dy = cel.y - postac.y;
  const d = Math.hypot(dx, dy) || 1;
  pociskiGracza.push({ typ: "ziemia", x: postac.x, y: postac.y, dx: dx / d, dy: dy / d });
  return true;
}

function wybuchZiemi(x, y, staty1) {
  const maks = poziomUmiejetnosci("odlamkowa") >= MAX_POZIOM_UMIEJETNOSCI;
  dodajEfektWybuchu(x, y, PROMIEN_WYBUCHU_ZIEMI, KOLOR_WYBUCHU_ZIEMI);

  wrogowie.slice().forEach(w => {
    if (w.hp <= 0 || Math.hypot(x - w.x, y - w.y) > PROMIEN_WYBUCHU_ZIEMI) return;
    atakUmiejetnosciKostura(w, staty1, x, y, 1, "odlamkowa");

    // max poziom: 33% szansy na omdlenie na 1s (Arcybossy są odporne na omdlenie)
    if (maks && w.hp > 0 && w.typ !== "arcyboss" && losujProcent() < KOSTUR_SZANSA_OMDLENIA_ZIEMI) {
      w.ogluszonyDoCzasu = czasWirt() + KOSTUR_CZAS_OMDLENIA_ZIEMI_MS;
      rundaStaty.omdlenia += 1;
    }
  });
}

/* ---------- POWIETRZE: tornada przez środek areny ---------- */

function wystrzelTornada() {
  const w = canvas.width, h = canvas.height, m = 40;

  // losowy punkt tuż za ścianą (po obwodzie areny)
  let t = Math.random() * 2 * (w + h);
  let x, y;
  if (t < w) { x = t; y = -m; }
  else if ((t -= w) < h) { x = w + m; y = t; }
  else if ((t -= h) < w) { x = w - t; y = h + m; }
  else { t -= w; x = -m; y = h - t; }

  // kierunek przez środek; kończy lot w punkcie symetrycznym (naprzeciwległa ściana)
  const dx = w / 2 - x;
  const dy = h / 2 - y;
  const d = Math.hypot(dx, dy) || 1;

  pociskiGracza.push({
    typ: "tornado", x, y, dx: dx / d, dy: dy / d,
    przebyte: 0, dystans: 2 * d, kat: Math.random() * Math.PI * 2, trafieni: new Set()
  });
}

/* ---------- WODA: fala wody ---------- */

function wystrzelFale() {
  const cel = znajdzNajblizszegoWroga();
  if (!cel) return false;
  const dx = cel.x - postac.x;
  const dy = cel.y - postac.y;
  const d = Math.hypot(dx, dy) || 1;
  pociskiGracza.push({ typ: "fala", x: postac.x, y: postac.y, dx: dx / d, dy: dy / d, trafieni: new Set() });
  return true;
}

function odepchnijWroga(wrog, dx, dy, dystans) {
  wrog.odepchniecie = { dx, dy, zostalo: dystans };
}

function aktualizujOdepchniecia(dtMs) {
  wrogowie.forEach(w => {
    const o = w.odepchniecie;
    if (!o) return;
    const krok = Math.min(o.zostalo, KOSTUR_PREDKOSC_ODEPCHNIECIA * dtMs / 1000);
    w.x += o.dx * krok;
    w.y += o.dy * krok;
    o.zostalo -= krok;
    if (o.zostalo <= 0.01) w.odepchniecie = null;
  });
}

/* ---------- pętla umiejętności czasowych ---------- */

function aktualizujKostura(dtMs) {
  if (!czyKostur()) return;
  aktualizujOdepchniecia(dtMs);
  if (!stan[1].staty) return;

  // Ziemia: co (9 - poziom) s (czeka na pierwszego wroga)
  const pZiemia = poziomUmiejetnosci("odlamkowa");
  if (pZiemia < 0) kosturZiemiaMs = KOSTUR_ZIEMIA_CZAS_BAZA_S * 1000;
  else {
    kosturZiemiaMs -= dtMs;
    if (kosturZiemiaMs <= 0 && wystrzelGlaz()) kosturZiemiaMs = (KOSTUR_ZIEMIA_CZAS_BAZA_S - pZiemia) * 1000;
  }

  // Woda: co (7 - poziom) s
  const pWoda = poziomUmiejetnosci("potrojna");
  if (pWoda < 0) kosturWodaMs = KOSTUR_WODA_CZAS_BAZA_S * 1000;
  else {
    kosturWodaMs -= dtMs;
    if (kosturWodaMs <= 0 && wystrzelFale()) kosturWodaMs = (KOSTUR_WODA_CZAS_BAZA_S - pWoda) * 1000;
  }

  // Powietrze: co 8 s salwa (1 + 2 * poziom) tornad
  const pPowietrze = poziomUmiejetnosci("magiczna");
  if (pPowietrze < 0) kosturPowietrzeMs = KOSTUR_POWIETRZE_CZAS_MS;
  else {
    kosturPowietrzeMs -= dtMs;
    if (kosturPowietrzeMs <= 0 && wrogowie.length > 0) {
      kosturPowietrzeMs = KOSTUR_POWIETRZE_CZAS_MS;
      const liczba = 1 + 2 * pPowietrze;
      for (let i = 0; i < liczba; i++) {
        if (i === 0) wystrzelTornada();
        else zaplanujAkcje(i * KOSTUR_ODSTEP_TORNAD_MS, () => { if (graTrwa && czyKostur()) wystrzelTornada(); });
      }
    }
  }
}

/* ---------- ruch i trafienia pocisków Kostura ---------- */

/* Ruch w małych podkrokach (≤ 8 px), żeby szybkie pociski nie "przeskakiwały" wrogów przy x2. */
function ruchZPodkrokami(p, predkosc, dtMs, czyTrafil) {
  const dystans = predkosc * dtMs / 1000;
  const n = Math.max(1, Math.ceil(dystans / 8));
  const krok = dystans / n;
  for (let i = 0; i < n; i++) {
    p.x += p.dx * krok;
    p.y += p.dy * krok;
    if (czyTrafil(p)) return false;     // pocisk zużyty
  }
  return naAreniePoz(p);
}

function pierwszyWrogWZasiegu(p, dodatek) {
  for (const w of wrogowie) {
    if (w.hp <= 0) continue;
    if (Math.hypot(w.x - p.x, w.y - p.y) <= promienWroga(w) + dodatek) return w;
  }
  return null;
}

/* Zwraca true, jeśli pocisk ma zostać (false = usuń). */
function aktualizujPociskKostura(p, dtMs, staty1) {
  if (!staty1) return naAreniePoz(p);

  switch (p.typ) {
    case "kolo":
      return ruchZPodkrokami(p, KOSTUR_PREDKOSC_KOLA, dtMs, pk => {
        const w = pierwszyWrogWZasiegu(pk, KOSTUR_PROMIEN_TRAFIENIA_KOLA);
        if (!w) return false;
        trafienieKolem(w, staty1, pk);
        return true;                     // nie przebija
      });

    case "ziemia":
      return ruchZPodkrokami(p, KOSTUR_PREDKOSC_GLAZU, dtMs, pk => {
        const w = pierwszyWrogWZasiegu(pk, 20);
        if (!w) return false;
        wybuchZiemi(w.x, w.y, staty1);
        return true;
      });

    case "fala": {
      const pWoda = poziomUmiejetnosci("potrojna");
      return ruchZPodkrokami(p, KOSTUR_PREDKOSC_FALI, dtMs, pk => {
        // półokrąg przed pociskiem: promień = pół szerokości fali
        for (const w of wrogowie.slice()) {
          if (w.hp <= 0 || pk.trafieni.has(w.id)) continue;
          const rx = w.x - pk.x, ry = w.y - pk.y;
          const przod = rx * pk.dx + ry * pk.dy;
          const r = promienWroga(w);
          if (przod < -r) continue;
          if (Math.hypot(rx, ry) > KOSTUR_POL_SZEROKOSCI_FALI + r * 0.5) continue;

          pk.trafieni.add(w.id);
          atakUmiejetnosciKostura(w, staty1, pk.x, pk.y, 1 / 2, "potrojna");
          if (pWoda >= MAX_POZIOM_UMIEJETNOSCI && w.hp > 0 && losujProcent() < KOSTUR_SZANSA_ODEPCHNIECIA) {
            odepchnijWroga(w, pk.dx, pk.dy, KOSTUR_DYSTANS_ODEPCHNIECIA);
          }
        }
        return false;                    // przebija wszystkich
      });
    }

    case "tornado": {
      const krok = KOSTUR_PREDKOSC_TORNADA * dtMs / 1000;
      p.x += p.dx * krok;
      p.y += p.dy * krok;
      p.przebyte += krok;
      p.kat += dtMs / 1000 * 9;

      const maks = poziomUmiejetnosci("magiczna") >= MAX_POZIOM_UMIEJETNOSCI;
      wrogowie.slice().forEach(w => {
        if (w.hp <= 0 || p.trafieni.has(w.id)) return;
        if (Math.hypot(w.x - p.x, w.y - p.y) > KOSTUR_PROMIEN_TORNADA + promienWroga(w) * 0.8) return;

        p.trafieni.add(w.id);
        atakUmiejetnosciKostura(w, staty1, p.x, p.y, 1 / 2, "magiczna");
        if (maks && w.hp > 0) {
          w.spowolnionyDoCzasu = czasWirt() + KOSTUR_CZAS_SPOWOLNIENIA_MS;
          w.silaSpowolnienia = KOSTUR_SPOWOLNIENIE;
        }
      });
      return p.przebyte < p.dystans;     // znika przy przeciwległej ścianie
    }
  }
  return naAreniePoz(p);
}

/* ---------- rysowanie ---------- */

/* Zwraca true, jeśli pocisk został narysowany (rysujGre pomija wtedy strzałę). */
function rysujPociskKostura(p) {
  switch (p.typ) {
    case "kolo": {
      ctx.save();
      ctx.shadowColor = "#b9a4ff";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, KOSTUR_PROMIEN_KOLA, 0, Math.PI * 2);   // pusty w środku
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "#e4dcff";
      ctx.stroke();
      ctx.restore();
      return true;
    }

    case "ziemia": {
      const r = 8, dlugoscOgona = 36;
      const px = -p.dy, py = p.dx;
      ctx.beginPath();
      ctx.moveTo(p.x - p.dx * dlugoscOgona, p.y - p.dy * dlugoscOgona);
      ctx.lineTo(p.x + px * r, p.y + py * r);
      ctx.lineTo(p.x - px * r, p.y - py * r);
      ctx.closePath();
      ctx.fillStyle = "#3fae44";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = "#62d466";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#d4ffc8";
      ctx.stroke();
      return true;
    }

    case "fala": {
      const kat = Math.atan2(p.dy, p.dx);
      const R = KOSTUR_POL_SZEROKOSCI_FALI;
      ctx.save();
      ctx.lineCap = "round";
      ctx.shadowColor = "#4db8ff";
      ctx.shadowBlur = 20;
      // smuga: kilka coraz bledszych łuków za frontem
      for (let i = 3; i >= 0; i--) {
        const cx = p.x - p.dx * i * 9;
        const cy = p.y - p.dy * i * 9;
        ctx.beginPath();
        ctx.arc(cx, cy, R, kat - Math.PI / 2, kat + Math.PI / 2);
        ctx.lineWidth = i === 0 ? 8 : 6;
        ctx.strokeStyle = `rgba(110, 205, 255, ${i === 0 ? 0.95 : 0.55 - i * 0.12})`;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, R, kat - Math.PI / 2, kat + Math.PI / 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(225, 245, 255, 0.95)";
      ctx.stroke();
      ctx.restore();
      return true;
    }

    case "tornado": {
      const R = KOSTUR_PROMIEN_TORNADA;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(190, 225, 255, 0.12)";
      ctx.fill();

      ctx.rotate(p.kat);
      ctx.lineCap = "round";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(220, 240, 255, 0.9)";
      for (let ramie = 0; ramie < 3; ramie++) {   // spiralka z 3 ramion
        ctx.beginPath();
        const przesuniecie = ramie * (Math.PI * 2 / 3);
        for (let a = 0; a <= Math.PI * 2.4; a += 0.2) {
          const promien = R * (1 - a / (Math.PI * 2.4));
          const xx = Math.cos(a + przesuniecie) * promien;
          const yy = Math.sin(a + przesuniecie) * promien;
          if (a === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
      }
      ctx.restore();
      return true;
    }
  }
  return false;
}
