/* ============================================================
   SURVIVOR-PAJAK.JS
   Mechaniki walki broni PAJĄK (+ item Jad). Ładować PO survivor-game.js
   i survivor-kostur.js (korzysta z jego ruchZPodkrokami i naAreniePoz).

   Id umiejętności (z survivor-bronie.js) -> mechanika Pająka:
     elektryczna = Tarantula        ognista   = Kwasowa chmura
     odlamkowa   = Ptasznik         magiczna  = Arachnofobia (wzmocnienia Pająków)
     potrojna    = Pajęczyna        wampiryczna = Wampiryczny pająk (survivor-game.js)

   Obrażenia umiejętności (wszystkie magiczne):
     (Podstawowe obrażenia + zabici) * mnożnik * (1 + Obrażenia umiejętności %)
   Zwykły atak: jadowy pocisk (fizyczny), przebija wrogów jak strzała.
   ============================================================ */

const PAJAK_PREDKOSC_JADU = 900;
const PAJAK_PROMIEN_TRAFIENIA_JADU = 10;

/* Pająki (Tarantula i Ptasznik) */
const PAJAK_PREDKOSC = 480;
const PAJAK_PROMIEN_TRAFIENIA = 14;
const PAJAK_ZWROTNOSC = 9;                 // rad/s: jak szybko Pająk skręca w stronę celu (płynny łuk)
const PAJAK_ZWROTNOSC_BLISKO = 28;         // przy celu skręca ostrzej, żeby nie krążył wokół wroga
const PAJAK_PROMIEN_STARTU = 14;           // Pająki wychodzą z krawędzi postaci

/* Tarantula */
const TARANTULA_CZAS_S = [2, 1.75, 1.5, 1.25, 1];
const TARANTULA_MNOZNIK = [0.7, 0.95, 1.2, 1.45, 1.7];

/* Kwasowa chmura */
const KWAS_CZAS_S = 10;
const KWAS_MNOZNIK = [0.7, 1, 1.3, 1.6, 1.9];
const KWAS_PROMIEN = PROMIEN_OGNIA * 2;             // tyle co wybuch Ziemi Kostura (220)
const KWAS_PREDKOSC = 560;
const KWAS_SKAZENIE_CZAS_MS = 5000;                 // max poziom: skażony obszar
const KWAS_SKAZENIE_TIK_MS = 1000;
const KWAS_SKAZENIE_MNOZNIK = 0.35;
const KOLOR_WYBUCHU_KWASU = "160, 80, 230";          // fiolet

/* Ptasznik */
const PTASZNIK_CZAS_S = [6, 5.25, 4.5, 3.75, 3];
const PTASZNIK_MNOZNIK = [1, 1.175, 1.35, 1.525, 1.7];
const PTASZNIK_PROMIEN = PROMIEN_OGNIA;
const PTASZNIK_MNOZNIK_KRYTU = 1.5;                 // max poziom: obrażenia mogą krytować (szansa = Szansa na kryta)
const KOLOR_WYBUCHU_PTASZNIKA = "230, 70, 50";       // czerwień (jak Pająki Ptasznika)

/* Arachnofobia (wzmocnienia Pająków; poziom p = 0..4):
     p0: Pająki mają szansę na otrucie, p1: + spowolnienie, p2/p3/p4: + obrażenia +10/20/30%.
   Max (4 ulepszenia): 2x więcej Pająków. */
const ARACHNOFOBIA_SZANSA_OTRUCIA = 25;             // % (dodawane do Twojej Szansy na otrucie)
const ARACHNOFOBIA_SPOWOLNIENIE = 0.2;
const ARACHNOFOBIA_CZAS_SPOWOLNIENIA_MS = 3000;
const ARACHNOFOBIA_BONUS_OBRAZEN = [0, 0, 10, 20, 30];   // %

/* Pajęczyna */
const PAJECZYNA_CZAS_S = [12, 11, 10, 9, 8];
const PAJECZYNA_MNOZNIK = [1, 1.75, 2.5, 3.25, 4];
const PAJECZYNA_PREDKOSC = 520;
const PAJECZYNA_PROMIEN = 24;

const PAJAK_TYPY_POCISKOW = ["jad", "pajak", "kwas", "pajeczyna"];

let pajakTarantulaMs = 0;
let pajakKwasMs = 0;
let pajakPtasznikMs = 0;
let pajakPajeczynaMs = 0;
let plamyKwasu = [];                                 // skażone obszary (max poziom Kwasowej chmury)

function czyPajak() {
  return typeof aktualnaBron !== "undefined" && aktualnaBron === "pajak";
}

function jestPociskPajaka(p) {
  return PAJAK_TYPY_POCISKOW.includes(p.typ);
}

function resetujPajaka() {
  pajakTarantulaMs = TARANTULA_CZAS_S[0] * 1000;
  pajakKwasMs = KWAS_CZAS_S * 1000;
  pajakPtasznikMs = PTASZNIK_CZAS_S[0] * 1000;
  pajakPajeczynaMs = PAJECZYNA_CZAS_S[0] * 1000;
  plamyKwasu = [];
}

/* ---------- Arachnofobia: wzmocnienia Pająków ---------- */

function wzmocnieniaPajakow() {
  const p = poziomUmiejetnosci("magiczna");
  if (p < 0) return { aktywne: false, bonusDmg: 0, szansaOtrucia: 0, spowolnienie: false, mnoznikLiczby: 1 };
  return {
    aktywne: true,
    bonusDmg: ARACHNOFOBIA_BONUS_OBRAZEN[p],
    szansaOtrucia: ARACHNOFOBIA_SZANSA_OTRUCIA,
    spowolnienie: p >= 1,
    mnoznikLiczby: p >= MAX_POZIOM_UMIEJETNOSCI ? 2 : 1       // max: 2x więcej Pająków
  };
}

/* Obrażenia Pająka + efekty Arachnofobii (otrucie / spowolnienie / bonus obrażeń). */
function trafieniePajaka(w, staty1, x, y, mnoznik, zrodlo, opcje = {}) {
  if (!w || w.hp <= 0) return 0;
  const wz = wzmocnieniaPajakow();
  const mnozBonus = 1 + wz.bonusDmg / 100;

  const dmg = wykonajAtakMagiczny(w, staty1, x, y, mnoznik * mnozBonus, Object.assign({ zrodlo, bezLinii: true }, opcje));

  // bonus +% obrażeń Arachnofobii zapisuje się jej "zadanym obrażeniom"
  if (wz.bonusDmg > 0 && dmg > 0) dodajDmgUmiejetnosci("magiczna", dmg - dmg / mnozBonus);

  if (wz.aktywne && w.hp > 0) {
    if (losujProcent() < wz.szansaOtrucia + (staty1.otrucie || 0)) {
      w.zatruteAtaki = TRUCIZNA_LICZBA_ATAKOW;
      w.silaTrucizny = 1;
    }
    if (wz.spowolnienie) {
      w.spowolnionyDoCzasu = czasWirt() + ARACHNOFOBIA_CZAS_SPOWOLNIENIA_MS;
      w.silaSpowolnienia = ARACHNOFOBIA_SPOWOLNIENIE;
    }
  }
  return dmg;
}

/* ---------- ZWYKŁY ATAK: jadowy pocisk (przebija) ---------- */

function atakPajaka(cel, staty1) {
  const dx = cel.x - postac.x, dy = cel.y - postac.y;
  const d = Math.hypot(dx, dy) || 1;
  pociskiGracza.push({ typ: "jad", x: postac.x, y: postac.y, dx: dx / d, dy: dy / d, trafieni: new Set(), mnoznikPrzebicia: 1 });
}

/* ---------- PAJĄKI (Tarantula, Ptasznik) ---------- */

function wypuscPajaki(liczba, rodzaj, mnoznik, zrodlo) {
  const cele = znajdzNajblizszychWrogow(liczba, new Set());
  if (!cele.length) return false;

  // Pająki "wychodzą" z postaci w losowym miejscu, zwrócone na zewnątrz; kilka Pająków na raz
  // rozchodzi się w równych odstępach kąta (dla 2: po przeciwnych stronach), więc nie nakładają się.
  const kat0 = Math.random() * Math.PI * 2;
  for (let i = 0; i < liczba; i++) {
    const cel = cele[i % cele.length];                  // brakuje osobnych celów: kilka Pająków na tego samego
    const kat = kat0 + i * Math.PI * 2 / liczba;
    pociskiGracza.push({
      typ: "pajak", rodzaj, cel, mnoznik, zrodlo,
      x: postac.x + Math.cos(kat) * PAJAK_PROMIEN_STARTU,
      y: postac.y + Math.sin(kat) * PAJAK_PROMIEN_STARTU,
      kier: kat, dx: Math.cos(kat), dy: Math.sin(kat),
      t: Math.random() * 6
    });
  }
  return true;
}

function wybuchPtasznika(x, y, staty1, mnoznik) {
  const maks = poziomUmiejetnosci("odlamkowa") >= MAX_POZIOM_UMIEJETNOSCI;
  dodajEfektWybuchu(x, y, PTASZNIK_PROMIEN, KOLOR_WYBUCHU_PTASZNIKA);

  wrogowie.slice().forEach(w => {
    if (w.hp <= 0 || Math.hypot(x - w.x, y - w.y) > PTASZNIK_PROMIEN) return;
    // max poziom: obrażenia mogą krytować (szansa = Twoja Szansa na kryta, +50%)
    const opcje = maks ? { szansaKrytu: staty1.kryt || 0, mnoznikKrytu: PTASZNIK_MNOZNIK_KRYTU } : {};
    trafieniePajaka(w, staty1, x, y, mnoznik, "odlamkowa", opcje);
  });
}

/* ---------- KWASOWA CHMURA ---------- */

function znajdzSkupiskoWrogow() {
  let najlepsze = null, najwiecej = 0, najblizej = Infinity;
  for (const w of wrogowie) {
    if (w.hp <= 0) continue;
    let n = 0, sx = 0, sy = 0;
    for (const o of wrogowie) {
      if (o.hp <= 0) continue;
      if (Math.hypot(w.x - o.x, w.y - o.y) <= KWAS_PROMIEN) { n++; sx += o.x; sy += o.y; }
    }
    const d = Math.hypot(postac.x - w.x, postac.y - w.y);
    if (n > najwiecej || (n === najwiecej && d < najblizej)) {
      najlepsze = { x: sx / n, y: sy / n };
      najwiecej = n;
      najblizej = d;
    }
  }
  return najlepsze;
}

function wystrzelKwas() {
  const cel = znajdzSkupiskoWrogow();
  if (!cel) return false;
  const dx = cel.x - postac.x, dy = cel.y - postac.y;
  const d = Math.hypot(dx, dy) || 1;
  pociskiGracza.push({ typ: "kwas", x: postac.x, y: postac.y, dx: dx / d, dy: dy / d, cx: cel.x, cy: cel.y, t: 0 });
  return true;
}

function wybuchKwasu(x, y, staty1) {
  const p = poziomUmiejetnosci("ognista");
  dodajEfektWybuchu(x, y, KWAS_PROMIEN, KOLOR_WYBUCHU_KWASU);

  wrogowie.slice().forEach(w => {
    if (w.hp <= 0 || Math.hypot(x - w.x, y - w.y) > KWAS_PROMIEN) return;
    wykonajAtakMagiczny(w, staty1, x, y, KWAS_MNOZNIK[Math.max(0, p)], { bezLinii: true, zrodlo: "ognista" });
  });

  // max poziom: obszar zostaje skażony na 5 s (obrażenia co 1 s)
  if (p >= MAX_POZIOM_UMIEJETNOSCI) {
    plamyKwasu.push({ x, y, zycie: KWAS_SKAZENIE_CZAS_MS, zycieMax: KWAS_SKAZENIE_CZAS_MS, doTiku: KWAS_SKAZENIE_TIK_MS, t: Math.random() * 6 });
  }
}

/* ---------- PAJĘCZYNA ---------- */

function wystrzelPajeczyne() {
  const cel = znajdzNajblizszegoWroga();
  if (!cel) return false;
  const dx = cel.x - postac.x, dy = cel.y - postac.y;
  const d = Math.hypot(dx, dy) || 1;
  const p = Math.max(0, poziomUmiejetnosci("potrojna"));
  pociskiGracza.push({
    typ: "pajeczyna", x: postac.x, y: postac.y, dx: dx / d, dy: dy / d,
    trafieni: new Set(), zostalo: 1 + 2 * p, kat: 0     // przebija 1/3/5/7/9 wrogów
  });
  return true;
}

/* ---------- pętla ---------- */

function aktualizujPajaka(dtMs) {
  // skażone obszary: tiki obrażeń co 1 s przez 5 s
  const staty1 = stan[1].staty;
  plamyKwasu.forEach(pl => {
    pl.zycie -= dtMs;
    pl.t += dtMs / 1000;
    pl.doTiku -= dtMs;
    if (pl.doTiku <= 0 && staty1) {
      pl.doTiku += KWAS_SKAZENIE_TIK_MS;
      wrogowie.slice().forEach(w => {
        if (w.hp <= 0 || Math.hypot(pl.x - w.x, pl.y - w.y) > KWAS_PROMIEN) return;
        wykonajAtakMagiczny(w, staty1, pl.x, pl.y, KWAS_SKAZENIE_MNOZNIK, { bezLinii: true, zrodlo: "ognista" });
      });
    }
  });
  plamyKwasu = plamyKwasu.filter(pl => pl.zycie > 0);

  if (!czyPajak() || !staty1) return;

  // Tarantula: co 2/1,75/1,5/1,25/1 s; max: 2 Pająki (Arachnofobia max: x2)
  const pTar = poziomUmiejetnosci("elektryczna");
  if (pTar < 0) pajakTarantulaMs = czasUmiejetnosciMs(TARANTULA_CZAS_S[0]);
  else {
    pajakTarantulaMs -= dtMs;
    if (pajakTarantulaMs <= 0) {
      const liczba = (pTar >= MAX_POZIOM_UMIEJETNOSCI ? 2 : 1) * wzmocnieniaPajakow().mnoznikLiczby;
      if (wypuscPajaki(liczba, "tarantula", TARANTULA_MNOZNIK[pTar], "elektryczna")) pajakTarantulaMs = czasUmiejetnosciMs(TARANTULA_CZAS_S[pTar]);
    }
  }

  // Kwasowa chmura: co 10 s
  const pKwas = poziomUmiejetnosci("ognista");
  if (pKwas < 0) pajakKwasMs = czasUmiejetnosciMs(KWAS_CZAS_S);
  else {
    pajakKwasMs -= dtMs;
    if (pajakKwasMs <= 0 && wystrzelKwas()) pajakKwasMs = czasUmiejetnosciMs(KWAS_CZAS_S);
  }

  // Ptasznik: co 6/5,25/4,5/3,75/3 s (Arachnofobia max: 2 Pająki)
  const pPtasz = poziomUmiejetnosci("odlamkowa");
  if (pPtasz < 0) pajakPtasznikMs = czasUmiejetnosciMs(PTASZNIK_CZAS_S[0]);
  else {
    pajakPtasznikMs -= dtMs;
    if (pajakPtasznikMs <= 0) {
      if (wypuscPajaki(wzmocnieniaPajakow().mnoznikLiczby, "ptasznik", PTASZNIK_MNOZNIK[pPtasz], "odlamkowa")) pajakPtasznikMs = czasUmiejetnosciMs(PTASZNIK_CZAS_S[pPtasz]);
    }
  }

  // Pajęczyna: co 12/11/10/9/8 s
  const pWeb = poziomUmiejetnosci("potrojna");
  if (pWeb < 0) pajakPajeczynaMs = czasUmiejetnosciMs(PAJECZYNA_CZAS_S[0]);
  else {
    pajakPajeczynaMs -= dtMs;
    if (pajakPajeczynaMs <= 0 && wystrzelPajeczyne()) pajakPajeczynaMs = czasUmiejetnosciMs(PAJECZYNA_CZAS_S[pWeb]);
  }
}

/* Zwraca true, jeśli pocisk ma zostać (false = usuń). */
function aktualizujPociskPajaka(p, dtMs, staty1) {
  if (!staty1) return naAreniePoz(p);

  switch (p.typ) {
    case "jad":
      return ruchZPodkrokami(p, PAJAK_PREDKOSC_JADU, dtMs, pk => {
        for (const w of wrogowie.slice()) {
          if (w.hp <= 0 || pk.trafieni.has(w.id)) continue;
          if (Math.hypot(w.x - pk.x, w.y - pk.y) > promienWroga(w) + PAJAK_PROMIEN_TRAFIENIA_JADU) continue;
          pk.trafieni.add(w.id);
          const dmg = wykonajPojedynczyAtak(w, staty1, pk.x, pk.y, pk.mnoznikPrzebicia);
          procAffixuOgnistejStrzaly(w, dmg, staty1);
          pk.mnoznikPrzebicia += WZROST_DMG_NA_PRZEBICIE;   // przebija: +15% obrażeń za każdego wroga
        }
        return false;
      });

    case "pajak": {
      p.t += dtMs / 1000;
      // cel zginął po drodze: szukaj najbliższego od Pająka
      if (!p.cel || p.cel.hp <= 0) {
        let najblizszy = null, naj = Infinity;
        wrogowie.forEach(w => {
          if (w.hp <= 0) return;
          const d = Math.hypot(w.x - p.x, w.y - p.y);
          if (d < naj) { naj = d; najblizszy = w; }
        });
        if (!najblizszy) return false;
        p.cel = najblizszy;
      }

      // ruch w podkrokach: kierunek (p.kier) obraca się w stronę celu z ograniczoną prędkością kątową
      const dystansRuchu = PAJAK_PREDKOSC * dtMs / 1000;
      const kroki = Math.max(1, Math.ceil(dystansRuchu / 8));
      for (let i = 0; i < kroki; i++) {
        const dx = p.cel.x - p.x, dy = p.cel.y - p.y;
        const d = Math.hypot(dx, dy) || 1;

        if (d <= promienWroga(p.cel) + PAJAK_PROMIEN_TRAFIENIA) {
          const cel = p.cel;
          if (p.rodzaj === "ptasznik") wybuchPtasznika(cel.x, cel.y, staty1, p.mnoznik);
          else trafieniePajaka(cel, staty1, p.x, p.y, p.mnoznik, p.zrodlo);
          return false;                                 // Pająk znika po ataku
        }

        let roznica = Math.atan2(dy, dx) - p.kier;
        while (roznica > Math.PI) roznica -= Math.PI * 2;
        while (roznica < -Math.PI) roznica += Math.PI * 2;
        const maxObrot = (d < 110 ? PAJAK_ZWROTNOSC_BLISKO : PAJAK_ZWROTNOSC) * (dtMs / 1000) / kroki;
        p.kier += Math.max(-maxObrot, Math.min(maxObrot, roznica));

        p.dx = Math.cos(p.kier);
        p.dy = Math.sin(p.kier);
        p.x += p.dx * dystansRuchu / kroki;
        p.y += p.dy * dystansRuchu / kroki;
      }
      return true;
    }

    case "kwas": {
      p.t += dtMs / 1000;
      const dx = p.cx - p.x, dy = p.cy - p.y;
      const d = Math.hypot(dx, dy);
      const krok = KWAS_PREDKOSC * dtMs / 1000;
      if (d <= krok) {
        wybuchKwasu(p.cx, p.cy, staty1);
        return false;
      }
      p.x += (dx / d) * krok;
      p.y += (dy / d) * krok;
      return true;
    }

    case "pajeczyna": {
      p.kat += dtMs / 1000 * 3;
      const pWeb = poziomUmiejetnosci("potrojna");
      const mnoznik = PAJECZYNA_MNOZNIK[Math.max(0, pWeb)];
      const ogluszaj = pWeb >= MAX_POZIOM_UMIEJETNOSCI;

      return ruchZPodkrokami(p, PAJECZYNA_PREDKOSC, dtMs, pk => {
        for (const w of wrogowie.slice()) {
          if (w.hp <= 0 || pk.trafieni.has(w.id)) continue;
          if (Math.hypot(w.x - pk.x, w.y - pk.y) > PAJECZYNA_PROMIEN + promienWroga(w) * 0.6) continue;

          pk.trafieni.add(w.id);
          wykonajAtakMagiczny(w, staty1, pk.x, pk.y, mnoznik, { bezLinii: true, zrodlo: "potrojna" });

          // max poziom: Pajęczyna powoduje omdlenie (Arcybossy są odporne)
          if (ogluszaj && w.hp > 0 && w.typ !== "arcyboss") {
            w.ogluszonyDoCzasu = czasWirt() + CZAS_OGLUSZENIA_MS;
            rundaStaty.omdlenia += 1;
          }
          pk.zostalo -= 1;
          if (pk.zostalo <= 0) return true;              // wyczerpała przebicia
        }
        return false;
      });
    }
  }
  return naAreniePoz(p);
}

/* ---------- rysowanie ---------- */

function rysujPajakaPostac(x, y, kat, skala, t, kol) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(kat);
  ctx.scale(skala, skala);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // 8 odnóży: 4 pary rozchylone wachlarzem (przednie w przód, tylne w tył), każda para pod innym kątem
  // od osi poprzecznej, więc stopy są wyraźnie rozsunięte i odnóża się nie nakładają.
  const pary = [
    { hip: 2.6, kat: 66 * Math.PI / 180 },
    { hip: 1.0, kat: 24 * Math.PI / 180 },
    { hip: -1.0, kat: -24 * Math.PI / 180 },
    { hip: -2.6, kat: -66 * Math.PI / 180 }
  ];
  const rysujNogi = (szer, kolor) => {
    ctx.lineWidth = szer;
    ctx.strokeStyle = kolor;
    pary.forEach((n, i) => {
      for (const strona of [-1, 1]) {
        const wymach = Math.sin(t * 22 + i * 1.6 + (strona > 0 ? Math.PI : 0)) * 1.4;
        const kolanoX = n.hip + Math.sin(n.kat) * 5.5;
        const kolanoY = strona * (3 + Math.cos(n.kat) * 5.5);
        const stopaX = n.hip + Math.sin(n.kat) * 13 + wymach;
        const stopaY = strona * (3 + Math.cos(n.kat) * 14);
        ctx.beginPath();
        ctx.moveTo(n.hip * 0.6, strona * 2);
        ctx.lineTo(kolanoX, kolanoY);
        ctx.lineTo(stopaX, stopaY);
        ctx.stroke();
      }
    });
  };
  rysujNogi(2.9, kol.obrys);          // ciemny kontur odnóży (kontrast)
  rysujNogi(1.4, kol.nogi);

  // krótkie ciało: duży, prawie okrągły odwłok + mały głowotułów
  const ciemnaObwodka = kol.obrys;
  ctx.shadowColor = kol.poswiata;
  ctx.shadowBlur = 3;                  // lekki glow
  ctx.fillStyle = kol.cialo;
  ctx.strokeStyle = ciemnaObwodka;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(-2.6, 0, 4.8, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(2.9, 0, 2.7, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // oczka
  ctx.shadowBlur = 0;
  ctx.fillStyle = kol.oczy;
  ctx.beginPath(); ctx.arc(4.6, -0.9, 0.7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(4.6, 0.9, 0.7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

const KOLORY_TARANTULI = { cialo: "#3fae35", nogi: "#86e86a", obrys: "#0a2407", poswiata: "#5bd44a", oczy: "#eaffc8" };   // zielony
const KOLORY_PTASZNIKA = { cialo: "#c42a20", nogi: "#ff6a5c", obrys: "#2b0604", poswiata: "#ff4a3a", oczy: "#ffe0b0" };   // czerwony

/* Zwraca true, jeśli pocisk został narysowany (rysujGre pomija wtedy strzałę). */
function rysujPociskPajaka(p) {
  switch (p.typ) {
    case "jad": {
      ctx.save();
      ctx.lineCap = "round";
      ctx.shadowColor = "#7dff4d";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(p.x - p.dx * 22, p.y - p.dy * 22);
      ctx.lineTo(p.x, p.y);
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(110, 230, 70, 0.3)";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.6, 0, Math.PI * 2);
      ctx.fillStyle = "#a6ff6b";
      ctx.fill();
      ctx.restore();
      return true;
    }

    case "pajak": {
      const kat = Math.atan2(p.dy, p.dx);
      if (p.rodzaj === "ptasznik") rysujPajakaPostac(p.x, p.y, kat, 1.5, p.t, KOLORY_PTASZNIKA);
      else rysujPajakaPostac(p.x, p.y, kat, 1.1, p.t, KOLORY_TARANTULI);
      return true;
    }

    case "kwas": {
      const puls = 1 + 0.12 * Math.sin(p.t * 14);
      ctx.save();
      ctx.lineCap = "round";
      // fioletowa smuga z glow
      ctx.shadowColor = "#b46bff";
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.moveTo(p.x - p.dx * 28, p.y - p.dy * 28);
      ctx.lineTo(p.x, p.y);
      ctx.lineWidth = 9;
      ctx.strokeStyle = "rgba(170, 90, 240, 0.35)";
      ctx.stroke();
      // pocisk
      const g = ctx.createRadialGradient(p.x - 2, p.y - 2, 1, p.x, p.y, 9 * puls);
      g.addColorStop(0, "#f0d6ff");
      g.addColorStop(0.5, "#b36bff");
      g.addColorStop(1, "#6a24b5");
      ctx.beginPath();
      ctx.arc(p.x, p.y, 9 * puls, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
      return true;
    }

    case "pajeczyna": {
      const R = PAJECZYNA_PROMIEN;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.kat);
      ctx.shadowColor = "rgba(230, 240, 255, 0.95)";
      ctx.shadowBlur = 14;
      ctx.strokeStyle = "rgba(240, 246, 255, 0.92)";
      ctx.lineWidth = 1.5;
      const promienie = 8;
      for (let i = 0; i < promienie; i++) {           // promienie sieci
        const a = i * Math.PI * 2 / promienie;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R);
        ctx.stroke();
      }
      for (const r of [R * 0.38, R * 0.68, R]) {      // wielokątne "oczka" sieci
        ctx.beginPath();
        for (let i = 0; i <= promienie; i++) {
          const a = i * Math.PI * 2 / promienie;
          const x = Math.cos(a) * r, y = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
      return true;
    }
  }
  return false;
}

/* Skażone obszary: rysowane POD wrogami (hak w rysujGre), zielone, bulgoczące, zanikają pod koniec. */
function rysujPlamyPajaka() {
  plamyKwasu.forEach(pl => {
    const alpha = Math.min(1, pl.zycie / 700);
    const R = KWAS_PROMIEN;
    ctx.save();
    ctx.globalAlpha = alpha;

    const g = ctx.createRadialGradient(pl.x, pl.y, 0, pl.x, pl.y, R);
    g.addColorStop(0, "rgba(160, 80, 230, 0.38)");
    g.addColorStop(0.75, "rgba(130, 60, 200, 0.30)");
    g.addColorStop(1, "rgba(100, 40, 170, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(pl.x, pl.y, R, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(200, 130, 255, 0.55)";
    ctx.beginPath();
    ctx.arc(pl.x, pl.y, R * 0.97, 0, Math.PI * 2);
    ctx.stroke();

    // bąbelki
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4 + pl.t * 0.4;
      const r = R * (0.15 + 0.7 * ((i * 0.37) % 1));
      const faza = (pl.t * 1.3 + i * 0.7) % 1;
      ctx.beginPath();
      ctx.arc(pl.x + Math.cos(a) * r, pl.y + Math.sin(a) * r, 2 + faza * 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(225, 180, 255, ${0.6 * (1 - faza)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  });
}
