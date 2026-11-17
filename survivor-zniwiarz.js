/* ============================================================
   SURVIVOR-ZNIWIARZ.JS
   Mechaniki walki klasy ŻNIWIARZ (broń: Kosa, item: Latarnia).
   Ładować PO survivor-game.js i survivor-kostur.js (korzysta z jego ruchZPodkrokami i naAreniePoz).

   Id umiejętności (z survivor-bronie.js) -> mechanika Żniwiarza:
     elektryczna = Kosa            ognista  = Rozdarcie
     odlamkowa   = Ściana bólu     magiczna = Dusze
     potrojna    = Banshee         wampiryczna = Wampiryzm (survivor-game.js)

   Obrażenia (magiczne): (PO + Z) * mnożnik * (1 + OU/100),
   gdzie Z = zabiciDlaUmiejetnosci() (zabici zwiększeni o "Nekromancję" z Latarni).

   Wszystkie byty Żniwiarza (kosy, duszki, ściany, dusze, banshee) mają WŁASNE tablice,
   żeby nie ginęły przy podmianie pociskiGracza w aktualizujPociskiGracza (filter()).
   ============================================================ */

/* Zwykły atak: duchowy pocisk, przebija wrogów */
const ZNIW_PREDKOSC_POCISKU = 900;
const ZNIW_PROMIEN_TRAFIENIA = 10;

/* Kosa */
const KOSA_CO_S = 10;
const KOSA_MNOZNIK = [0.4, 0.5, 0.6, 0.7, 0.8];
const KOSA_PROMIEN = 70;                     // szerokość 140 px
const KOSA_PREDKOSC = 650;
const KOSA_PREDKOSC_POWROTU = 800;
const KOSA_ZWROTNOSC = 5;                    // rad/s (powrót: skręca ku graczowi)
const KOSA_BONUS_POWROTU = 1.2;              // wracając kosa zadaje +20% obrażeń
const KOSA_LECZENIE_PROCENT = 0.04;          // max poziom: zabicie Kosą leczy 4% max PŻ

/* Rozdarcie */
const ROZDARCIE_CZESCI = [2, 4, 6, 8, 10];
const ROZDARCIE_MNOZNIK = [0.4, 0.47, 0.54, 0.61, 0.68];
const ROZDARCIE_PRZEZROCZYSTOSC = 0.8;         // duszki lekko transparentne (80% widoczności)
const ROZDARCIE_PREDKOSC = 380;
const ROZDARCIE_MAX_DYSTANS = 650;
const ROZDARCIE_PROMIEN = 10;                // wielkość podstawowych wrogów
const ROZDARCIE_PROG_EGZEKUCJI = 0.1;        // max poziom: wróg ginie przy 10% PŻ
const ROZDARCIE_MAX_DUSZKOW = 160;

/* Ściana bólu */
const SCIANA_CO_S = 15;
const SCIANA_CZAS_S = 10;
const SCIANA_SZEROKOSC = [150, 250, 350, 450, 550];
const SCIANA_GRUBOSC = 26;
const SCIANA_MNOZNIK = 1;
const SCIANA_TIK_MS = 1000;
const SCIANA_SPOWOLNIENIE = 0.3;
const SCIANA_CZAS_SPOWOLNIENIA_MS = 5000;
const SCIANA_PODATNOSC_MNOZNIK = 1.2;        // spowolnieni wrogowie dostają o 20% więcej obrażeń

/* Dusze (krążące) */
const DUSZE_LICZBA = [5, 9, 13, 17, 21];
const DUSZE_MNOZNIK = [1, 1.25, 1.5, 1.75, 2];
const DUSZA_PROMIEN = 11.2;                  // 20% mniejsze (głowa i hitbox; blur i ślad skalują się razem)
const DUSZE_MIN_ODLEGLOSC = 150;
const DUSZE_MAX_ODLEGLOSC = 530;
const DUSZA_CZAS_ZANIKU_MS = 5000;
const DUSZA_COOLDOWN_NA_WROGA_MS = 800;      // max poziom: dusza przebija, ten sam wróg nie częściej niż co 0,8 s

/* Banshee */
const BANSHEE_CO_S = [15, 14, 13, 12, 11];
const BANSHEE_DZIELNIK = [7, 6.5, 6, 5.5, 5];
const BANSHEE_MAX_CELOW = [3, 5, 7, 9, 11];
const BANSHEE_ZASIEG = 130;
const BANSHEE_TIK_MS = 100;
const BANSHEE_PROMIEN = 30;                  // 1,5x wielkości gracza
const BANSHEE_POKAZ_LICZBE_MS = 500;         // obrażenia z tików są sumowane i pokazywane co 0,5 s

const ZNIW_TYPY_POCISKOW = ["zniw"];

let zniwKosy = [];
let zniwDuszki = [];                         // Rozdarcie
let zniwSciany = [];
let zniwDusze = [];                          // krążące
let zniwBanshee = [];
let zniwKolejka = [];                        // prośby o rozdarcie duszy: { x, y, n }
let zniwKosaMs = 0;
let zniwScianaMs = 0;
let zniwBansheeMs = 0;
let zniwCzas = 0;                            // czas gry Żniwiarza (animacje, cooldowny)

function czyZniwiarz() {
  return typeof aktualnaBron !== "undefined" && aktualnaBron === "zniwiarz";
}

function jestPociskZniwiarza(p) {
  return ZNIW_TYPY_POCISKOW.includes(p.typ);
}

function resetujZniwiarza() {
  zniwKosy = [];
  zniwDuszki = [];
  zniwSciany = [];
  zniwDusze = [];
  zniwBanshee = [];
  zniwKolejka = [];
  zniwKosaMs = KOSA_CO_S * 1000;
  zniwScianaMs = SCIANA_CO_S * 1000;
  zniwBansheeMs = BANSHEE_CO_S[0] * 1000;
  zniwCzas = 0;
}

/* Hak z zabijWroga (survivor-game.js): Rozdarcie — dusza zabitego wroga rozpada się na części. */
function naZabiciuZniwiarza(wrog) {
  if (!czyZniwiarz()) return;
  const p = poziomUmiejetnosci("ognista");
  if (p < 0) return;
  zniwKolejka.push({ x: wrog.x, y: wrog.y, n: ROZDARCIE_CZESCI[p] });
}

/* ---------- pomocnicze ---------- */

function zniwPredkoscGracza() {
  const s = stan[1].staty;
  const bonus = s ? (s.predkoscRuchuBonus || 0) : 0;
  return BAZOWA_PREDKOSC_GRACZA * (1 + bonus / 100);
}

function zniwLosowyPunkt(margines) {
  return {
    x: margines + Math.random() * Math.max(1, canvas.width - 2 * margines),
    y: margines + Math.random() * Math.max(1, canvas.height - 2 * margines)
  };
}

/* Odległość punktu od odcinka (do ścian). */
function zniwOdlegloscOdOdcinka(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const dl2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / dl2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function zniwUlecz(procentMaxHp) {
  if (postac.hp <= 0) return;
  const ile = Math.round(postac.maxHp * procentMaxHp);
  const przed = postac.hp;
  postac.hp = Math.min(postac.maxHp, postac.hp + ile);
  rundaStaty.wyleczono += postac.hp - przed;
  aktualizujPasekPostaci();
}

/* ---------- ZWYKŁY ATAK ---------- */

function atakZniwiarza(cel, staty1) {
  const dx = cel.x - postac.x, dy = cel.y - postac.y;
  const d = Math.hypot(dx, dy) || 1;
  pociskiGracza.push({ typ: "zniw", x: postac.x, y: postac.y, dx: dx / d, dy: dy / d, trafieni: new Set(), mnoznikPrzebicia: 1, t: 0 });
}

/* ---------- KOSA ---------- */

function rzucKose(p) {
  const cel = znajdzNajblizszegoWroga();
  if (!cel) return false;
  const dx = cel.x - postac.x, dy = cel.y - postac.y;
  const d = Math.hypot(dx, dy) || 1;
  zniwKosy.push({
    x: postac.x, y: postac.y, dx: dx / d, dy: dy / d,
    faza: "tam", kat: 0, trafieni: new Set(), mnoznik: KOSA_MNOZNIK[p], slad: []
  });
  return true;
}

function aktualizujKosy(dtMs, staty1) {
  const dt = dtMs / 1000;
  const lecznicza = poziomUmiejetnosci("elektryczna") >= MAX_POZIOM_UMIEJETNOSCI;

  zniwKosy = zniwKosy.filter(k => {
    k.kat += dt * 11;
    k.slad.push({ x: k.x, y: k.y, kat: k.kat });                // historia do rozmazania za kosą
    if (k.slad.length > 20) k.slad.shift();

    if (k.faza === "tam") {
      k.x += k.dx * KOSA_PREDKOSC * dt;
      k.y += k.dy * KOSA_PREDKOSC * dt;
      if (k.x < 0 || k.x > canvas.width || k.y < 0 || k.y > canvas.height) {
        k.faza = "powrot";                       // uderzyła w ścianę: wraca i może trafić ponownie
        k.trafieni = new Set();
        k.kierunek = Math.atan2(postac.y - k.y, postac.x - k.x);
      }
    } else {
      // powrót: skręca w stronę gracza (który może się przemieszczać), żeby fizycznie do niego wrócić
      const dx = postac.x - k.x, dy = postac.y - k.y;
      const d = Math.hypot(dx, dy);
      if (d <= 34) return false;                 // wróciła
      let roznica = Math.atan2(dy, dx) - k.kierunek;
      while (roznica > Math.PI) roznica -= Math.PI * 2;
      while (roznica < -Math.PI) roznica += Math.PI * 2;
      const maxObrot = KOSA_ZWROTNOSC * (d < 220 ? 4 : 1) * dt;
      k.kierunek += Math.max(-maxObrot, Math.min(maxObrot, roznica));
      k.dx = Math.cos(k.kierunek);
      k.dy = Math.sin(k.kierunek);
      k.x += k.dx * KOSA_PREDKOSC_POWROTU * dt;
      k.y += k.dy * KOSA_PREDKOSC_POWROTU * dt;
    }

    // obrażenia: każdy wróg raz na przelot (tam i z powrotem osobno)
    for (const w of wrogowie.slice()) {
      if (w.hp <= 0 || k.trafieni.has(w.id)) continue;
      if (Math.hypot(w.x - k.x, w.y - k.y) > KOSA_PROMIEN + promienWroga(w) * 0.3) continue;
      k.trafieni.add(w.id);
      const mnoznikKosy = k.mnoznik * (k.faza === "powrot" ? KOSA_BONUS_POWROTU : 1);
      wykonajAtakMagiczny(w, staty1, k.x, k.y, mnoznikKosy, { bezLinii: true, zrodlo: "elektryczna" });
      if (lecznicza && w.hp <= 0) zniwUlecz(KOSA_LECZENIE_PROCENT);   // max: zabicie Kosą leczy 4% max PŻ
    }
    return true;
  });
}

/* ---------- ROZDARCIE ---------- */

/* Losowy odcień czerwieni: od lekko jaśniejszego do lekko ciemniejszego. Zwraca {rgb, ciemny}. */
function losowyOdcienCzerwieni() {
  const t = Math.random();                                 // 0 = ciemniejszy, 1 = jaśniejszy
  const r = Math.round(165 + t * 80);                      // 165..245
  const g = Math.round(18 + t * 70);                       // 18..88
  const b = Math.round(22 + t * 66);                       // 22..88
  return { rgb: `${r}, ${g}, ${b}`, twarz: `rgb(${Math.round(r * 0.28)}, ${Math.round(g * 0.25)}, ${Math.round(b * 0.25)})` };
}

function utworzDuszki() {
  const p = poziomUmiejetnosci("ognista");
  const mnoznik = ROZDARCIE_MNOZNIK[Math.max(0, p)];
  zniwKolejka.forEach(z => {
    for (let i = 0; i < z.n && zniwDuszki.length < ROZDARCIE_MAX_DUSZKOW; i++) {
      const kat = Math.random() * Math.PI * 2;
      zniwDuszki.push({
        x0: z.x, y0: z.y, x: z.x, y: z.y,
        dx: Math.cos(kat), dy: Math.sin(kat),
        s: 0, faza: Math.random() * 6.28, amplituda: 28 + Math.random() * 20, czestosc: 0.0033 + Math.random() * 0.0012,   // 1 fala na ok. 220-300 px
        mnoznik, slad: [], kolor: losowyOdcienCzerwieni()
      });
    }
  });
  zniwKolejka = [];
}

function aktualizujDuszki(dtMs, staty1) {
  const dt = dtMs / 1000;
  zniwDuszki = zniwDuszki.filter(d => {
    d.s += ROZDARCIE_PREDKOSC * dt;
    const boczne = Math.sin(d.s * d.czestosc * 6.28 + d.faza) * d.amplituda;     // falowana trajektoria
    d.x = d.x0 + d.dx * d.s - d.dy * boczne;
    d.y = d.y0 + d.dy * d.s + d.dx * boczne;
    d.slad.push({ x: d.x, y: d.y });
    if (d.slad.length > 18) d.slad.shift();

    if (d.s > ROZDARCIE_MAX_DYSTANS || d.x < -40 || d.x > canvas.width + 40 || d.y < -40 || d.y > canvas.height + 40) return false;

    for (const w of wrogowie.slice()) {
      if (w.hp <= 0) continue;
      if (Math.hypot(w.x - d.x, w.y - d.y) > ROZDARCIE_PROMIEN + promienWroga(w)) continue;
      wykonajAtakMagiczny(w, staty1, d.x, d.y, d.mnoznik, { bezLinii: true, zrodlo: "ognista" });
      return false;                                                              // duszka znika po trafieniu
    }
    return true;
  });
}

/* Max poziom Rozdarcia: wróg z PŻ ≤ 10% maks. PŻ ginie. */
function egzekucjaRozdarcia() {
  if (poziomUmiejetnosci("ognista") < MAX_POZIOM_UMIEJETNOSCI) return;
  wrogowie.slice().forEach(w => {
    if (w.hp > 0 && w.hp <= w.maxHp * ROZDARCIE_PROG_EGZEKUCJI) zabijWroga(w);
  });
}

/* ---------- ŚCIANA BÓLU ---------- */

function postawSciany(p) {
  const ile = p >= MAX_POZIOM_UMIEJETNOSCI ? 2 : 1;
  const dl = SCIANA_SZEROKOSC[p];
  for (let i = 0; i < ile; i++) {
    const pkt = zniwLosowyPunkt(60);
    zniwSciany.push({
      x: pkt.x, y: pkt.y, kat: Math.random() * Math.PI, dlugosc: dl,
      zycie: SCIANA_CZAS_S * 1000, zycieMax: SCIANA_CZAS_S * 1000, doTiku: SCIANA_TIK_MS, t: Math.random() * 6
    });
  }
}

function koncePosciany(s) {
  const dx = Math.cos(s.kat) * s.dlugosc / 2, dy = Math.sin(s.kat) * s.dlugosc / 2;
  return { ax: s.x - dx, ay: s.y - dy, bx: s.x + dx, by: s.y + dy };
}

function aktualizujSciany(dtMs, staty1) {
  zniwSciany = zniwSciany.filter(s => {
    s.zycie -= dtMs;
    s.t += dtMs / 1000;
    s.doTiku -= dtMs;
    const { ax, ay, bx, by } = koncePosciany(s);
    const tik = s.doTiku <= 0;
    if (tik) s.doTiku += SCIANA_TIK_MS;

    for (const w of wrogowie.slice()) {
      if (w.hp <= 0) continue;
      if (zniwOdlegloscOdOdcinka(w.x, w.y, ax, ay, bx, by) > SCIANA_GRUBOSC / 2 + promienWroga(w) * 0.6) continue;
      // spowolnienie 30% na 5 s (odświeżane, póki wróg stoi w ścianie)
      w.spowolnionyDoCzasu = Math.max(w.spowolnionyDoCzasu || 0, czasWirt() + SCIANA_CZAS_SPOWOLNIENIA_MS);
      w.silaSpowolnienia = Math.max(w.silaSpowolnienia || 0, SCIANA_SPOWOLNIENIE);
      w.oslabionyDoCzasu = Math.max(w.oslabionyDoCzasu || 0, czasWirt() + SCIANA_CZAS_SPOWOLNIENIA_MS);   // +20% otrzymywanych obrażeń
      if (tik) wykonajAtakMagiczny(w, staty1, s.x, s.y, SCIANA_MNOZNIK, { bezLinii: true, zrodlo: "odlamkowa" });   // obrażenia co 1 s
    }
    return s.zycie > 0;
  });
}

/* ---------- DUSZE (krążące) ---------- */

function nowaDusza() {
  const srodek = (DUSZE_MIN_ODLEGLOSC + DUSZE_MAX_ODLEGLOSC) / 2;
  const d = {
    kat: Math.random() * Math.PI * 2,
    om: (0.5 + Math.random() * 0.4) * (Math.random() < 0.5 ? -1 : 1),              // rad/s: raz w jedną, raz w drugą stronę (min. podniesione)
    srodek, amp: (DUSZE_MAX_ODLEGLOSC - DUSZE_MIN_ODLEGLOSC) / 2,
    wr: 0.45 + Math.random() * 0.4, fr: Math.random() * 6.28,                       // falowanie promienia (bliżej / dalej)
    wk: 0.5 + Math.random() * 0.4, fk: Math.random() * 6.28,                        // lekkie falowanie kąta
    t: Math.random() * 20,
    nieaktywnaMs: 0, cooldowny: new Map(), slad: [], obrot: Math.random() * 6.28
  };
  const pkt = celDuszy(d);
  d.x = pkt.x; d.y = pkt.y;
  return d;
}

function celDuszy(d) {
  const promien = d.srodek + d.amp * Math.sin(d.t * d.wr + d.fr);                    // zawsze 150..530 od gracza
  const kat = d.kat + 0.5 * Math.sin(d.t * d.wk + d.fk);
  return { x: postac.x + Math.cos(kat) * promien, y: postac.y + Math.sin(kat) * promien };
}

function aktualizujDusze(dtMs, staty1) {
  const dt = dtMs / 1000;
  const p = poziomUmiejetnosci("magiczna");
  const maks = p >= MAX_POZIOM_UMIEJETNOSCI;
  const mnoznik = DUSZE_MNOZNIK[Math.max(0, p)];

  while (zniwDusze.length < DUSZE_LICZBA[Math.max(0, p)]) zniwDusze.push(nowaDusza());

  zniwDusze.forEach(d => {
    d.t += dt;
    d.kat += d.om * dt;
    const przedX = d.x, przedY = d.y;
    if (d.nieaktywnaMs > 0) d.nieaktywnaMs = Math.max(0, d.nieaktywnaMs - dtMs);

    // płynnie podąża za celem (gdy gracz się przemieszcza, dusze nadlatują łagodnie, bez skoków)
    const cel = celDuszy(d);
    const wygladzenie = 1 - Math.exp(-2.6 * dt);
    d.x += (cel.x - d.x) * wygladzenie;
    d.y += (cel.y - d.y) * wygladzenie;

    // kierunek lotu (łagodnie wygładzany): głowa duszy zwrócona w stronę ruchu
    const mx = d.x - przedX, my = d.y - przedY;
    if (Math.hypot(mx, my) > 0.15) {
      let roznica = katDuszkaDoLotu(mx, my) - d.obrot;
      while (roznica > Math.PI) roznica -= Math.PI * 2;
      while (roznica < -Math.PI) roznica += Math.PI * 2;
      d.obrot += roznica * Math.min(1, 6 * dt);
    }

    // ślad za duszą (punkty co kilka px ruchu)
    const ost = d.slad[d.slad.length - 1];
    if (!ost || Math.hypot(d.x - ost.x, d.y - ost.y) >= 3) {
      d.slad.push({ x: d.x, y: d.y });
      if (d.slad.length > 29) d.slad.shift();      // ślad krótszy o 20%
    }

    if (!maks && d.nieaktywnaMs > 0) return;                                          // zanikła po trafieniu
    for (const w of wrogowie.slice()) {
      if (w.hp <= 0) continue;
      if (Math.hypot(w.x - d.x, w.y - d.y) > DUSZA_PROMIEN + promienWroga(w) * 0.7) continue;
      if (maks) {
        // max poziom: dusza jest zawsze aktywna i przebija (ten sam wróg nie częściej niż co 0,8 s)
        if (zniwCzas - (d.cooldowny.get(w.id) ?? -1e9) < DUSZA_COOLDOWN_NA_WROGA_MS) continue;
        d.cooldowny.set(w.id, zniwCzas);
      }
      wykonajAtakMagiczny(w, staty1, d.x, d.y, mnoznik, { bezLinii: true, zrodlo: "magiczna" });
      if (!maks) { d.nieaktywnaMs = DUSZA_CZAS_ZANIKU_MS; break; }                    // zanika na 5 s
    }
    if (maks && d.cooldowny.size > 120) d.cooldowny.forEach((t, id) => { if (zniwCzas - t > DUSZA_COOLDOWN_NA_WROGA_MS) d.cooldowny.delete(id); });
  });
}

/* ---------- BANSHEE ---------- */

function wypuscBanshee(p) {
  const cel = znajdzNajblizszegoWroga();
  if (!cel) return false;
  const bazowy = Math.atan2(cel.y - postac.y, cel.x - postac.x);
  const kierunki = p >= MAX_POZIOM_UMIEJETNOSCI
    ? [bazowy, bazowy + Math.PI * 2 / 3, bazowy - Math.PI * 2 / 3]                    // max: 3 kule (co 120°)
    : [bazowy];
  const predkosc = zniwPredkoscGracza();

  kierunki.forEach(kat => {
    zniwBanshee.push({
      x: postac.x, y: postac.y, dx: Math.cos(kat), dy: Math.sin(kat), predkosc,
      kat: Math.random() * 6, doTiku: BANSHEE_TIK_MS, p,
      cele: [], akum: new Map(), t: 0
    });
  });
  return true;
}

function aktualizujBanshee(dtMs, staty1) {
  const dt = dtMs / 1000;
  zniwBanshee = zniwBanshee.filter(b => {
    b.t += dt;
    b.kat += dt * 6;
    b.x += b.dx * b.predkosc * dt;                          // leci po prostej z prędkością gracza, przebija
    b.y += b.dy * b.predkosc * dt;
    if (b.x < -80 || b.x > canvas.width + 80 || b.y < -80 || b.y > canvas.height + 80) return false;

    b.doTiku -= dtMs;
    // lasery utrzymują się, dopóki wróg jest w zasięgu — odświeżamy listę celów co tik
    if (b.doTiku <= 0) {
      b.doTiku += BANSHEE_TIK_MS;
      const w = wrogowie
        .filter(e => e.hp > 0 && Math.hypot(e.x - b.x, e.y - b.y) <= BANSHEE_ZASIEG)
        .sort((e1, e2) => Math.hypot(e1.x - b.x, e1.y - b.y) - Math.hypot(e2.x - b.x, e2.y - b.y))
        .slice(0, BANSHEE_MAX_CELOW[b.p]);
      b.cele = w;

      const baza = ((staty1.podstawoweObrażenia || 3000) + zabiciDlaUmiejetnosci()) / BANSHEE_DZIELNIK[b.p]
        * (1 + (staty1.obrazeniaUmiejetnosci || 0) / 100);
      w.forEach(e => {
        const dmg = Math.round(baza * (e.odporny ? MNOZNIK_DMG_ODPORNEGO : 1) * mnoznikOslabienia(e));
        if (dmg <= 0) return;
        e.hp -= dmg;
        rundaStaty.obrazenia += dmg;
        rundaStaty.magiczne += dmg;
        dodajDmgUmiejetnosci("potrojna", dmg);
        wampiryzmZaklec(dmg);

        // pływające liczby: sumujemy tiki i pokazujemy co 0,5 s (zamiast 10 liczb na sekundę na wroga)
        const a = b.akum.get(e.id) || { suma: 0, ms: 0 };
        a.suma += dmg; a.ms += BANSHEE_TIK_MS;
        if (a.ms >= BANSHEE_POKAZ_LICZBE_MS || e.hp <= 0) {
          dodajEfektAtaku(e.x, e.y, a.suma, { magia: true, bezLinii: true });
          a.suma = 0; a.ms = 0;
        }
        b.akum.set(e.id, a);
        if (e.hp <= 0) zabijWroga(e);
      });
    }
    b.cele = b.cele.filter(e => e.hp > 0 && Math.hypot(e.x - b.x, e.y - b.y) <= BANSHEE_ZASIEG + 20);
    return true;
  });
}

/* ---------- pętla ---------- */

function aktualizujZniwiarza(dtMs) {
  if (!czyZniwiarz()) return;
  const staty1 = stan[1].staty;
  if (!staty1) return;
  zniwCzas += dtMs;

  utworzDuszki();
  egzekucjaRozdarcia();

  // Kosa: co 11 s (czeka na pierwszego wroga)
  const pKosa = poziomUmiejetnosci("elektryczna");
  if (pKosa < 0) zniwKosaMs = czasUmiejetnosciMs(KOSA_CO_S);
  else {
    zniwKosaMs -= dtMs;
    if (zniwKosaMs <= 0 && rzucKose(pKosa)) zniwKosaMs = czasUmiejetnosciMs(KOSA_CO_S);
  }
  aktualizujKosy(dtMs, staty1);

  aktualizujDuszki(dtMs, staty1);

  // Ściana bólu: co 15 s
  const pSciana = poziomUmiejetnosci("odlamkowa");
  if (pSciana < 0) zniwScianaMs = czasUmiejetnosciMs(SCIANA_CO_S);
  else {
    zniwScianaMs -= dtMs;
    if (zniwScianaMs <= 0) {
      postawSciany(pSciana);
      zniwScianaMs = czasUmiejetnosciMs(SCIANA_CO_S);
    }
  }
  aktualizujSciany(dtMs, staty1);

  // Dusze krążące
  if (poziomUmiejetnosci("magiczna") >= 0) aktualizujDusze(dtMs, staty1);

  // Banshee: co 15/14/13/12/11 s
  const pBan = poziomUmiejetnosci("potrojna");
  if (pBan < 0) zniwBansheeMs = czasUmiejetnosciMs(BANSHEE_CO_S[0]);
  else {
    zniwBansheeMs -= dtMs;
    if (zniwBansheeMs <= 0 && wypuscBanshee(pBan)) zniwBansheeMs = czasUmiejetnosciMs(BANSHEE_CO_S[pBan]);
  }
  aktualizujBanshee(dtMs, staty1);
}

/* Zwraca true, jeśli pocisk ma zostać (false = usuń). */
function aktualizujPociskZniwiarza(p, dtMs, staty1) {
  if (!staty1) return naAreniePoz(p);
  if (p.typ === "zniw") {
    p.t += dtMs / 1000;
    return ruchZPodkrokami(p, ZNIW_PREDKOSC_POCISKU, dtMs, pk => {
      for (const w of wrogowie.slice()) {
        if (w.hp <= 0 || pk.trafieni.has(w.id)) continue;
        if (Math.hypot(w.x - pk.x, w.y - pk.y) > promienWroga(w) + ZNIW_PROMIEN_TRAFIENIA) continue;
        pk.trafieni.add(w.id);
        const dmg = wykonajPojedynczyAtak(w, staty1, pk.x, pk.y, pk.mnoznikPrzebicia);
        procAffixuOgnistejStrzaly(w, dmg, staty1);
        pk.mnoznikPrzebicia += WZROST_DMG_NA_PRZEBICIE;     // przebija jak strzała
      }
      return false;
    });
  }
  return naAreniePoz(p);
}

/* ---------- rysowanie ---------- */

/* Kąt obrotu duszka tak, by jego "czoło" (góra sprite'a) było zwrócone w stronę lotu. */
function katDuszkaDoLotu(dx, dy) {
  return Math.atan2(dy, dx) + Math.PI / 2;
}

/* Kierunek lotu z historii pozycji (ostatnie dwa różne punkty); gdy brak — wartości domyślne. */
function katLotuZeSladu(slad, dxDom, dyDom) {
  for (let i = slad.length - 1; i > 0; i--) {
    const dx = slad[i].x - slad[i - 1].x, dy = slad[i].y - slad[i - 1].y;
    if (Math.hypot(dx, dy) > 0.2) return katDuszkaDoLotu(dx, dy);
  }
  return katDuszkaDoLotu(dxDom, dyDom);
}

function rysujDuszka(x, y, rozmiar, alpha, faza, obrot = 0) {
  // smutna duszka: głowa + poszarpany ogon; obrót: głowa (czoło) zwrócona w stronę lotu
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(obrot);
  const szer = rozmiar;
  ctx.beginPath();
  ctx.moveTo(-szer, szer * 0.2);
  ctx.arc(0, -szer * 0.1, szer, Math.PI, 0);
  ctx.lineTo(szer, szer * 0.9);
  for (let i = 0; i < 4; i++) {                                           // poszarpany dół
    const x1 = szer - (i + 0.5) * szer * 0.5;
    ctx.lineTo(x1, szer * (i % 2 ? 0.55 : 1.0) + Math.sin(faza + i) * 1.5);
  }
  ctx.lineTo(-szer, szer * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* Wspólna smutna twarz duszka (oczy + buzia w dół). */
function rysujTwarzDuszka(x, y, rozmiar, kolor, obrot = 0) {
  const k = rozmiar / 8.5;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(obrot);                                   // twarz obrócona razem z duszkiem
  ctx.fillStyle = kolor;
  ctx.strokeStyle = kolor;
  ctx.beginPath(); ctx.arc(-3 * k, -2 * k, 1.5 * k, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(3 * k, -2 * k, 1.5 * k, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 4.2 * k, 2.6 * k, 1.8 * k, 0, Math.PI * 1.1, Math.PI * 1.9);
  ctx.lineWidth = 1.2 * k;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.restore();
}

/* Dusza krążąca: miękki, zielony duszek jak w Rozdarciu (głowa + poszarpany dół, smutna twarz),
   z KRÓTKIM zanikającym blurem ZA sobą (wzdłuż toru ruchu). Po trafieniu bardzo transparentna. */
function rysujDusze(d) {
  const aktywna = poziomUmiejetnosci("magiczna") >= MAX_POZIOM_UMIEJETNOSCI || d.nieaktywnaMs <= 0;
  const alpha = aktywna ? 1 : 0.14;
  const rozmiar = DUSZA_PROMIEN * 0.95;

  // blur ZA duszą: szerokość głowy, długość 3x większa, zanikający ku końcowi (jedna smuga z gradientem)
  if (d.slad.length > 1) {
    const pierwszy = d.slad[0], ostatni = d.slad[d.slad.length - 1];
    const g = ctx.createLinearGradient(pierwszy.x, pierwszy.y, ostatni.x, ostatni.y);
    g.addColorStop(0, "rgba(120, 235, 95, 0)");
    g.addColorStop(1, "rgba(120, 235, 95, 0.34)");
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(130, 255, 110, 0.8)";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(pierwszy.x, pierwszy.y);
    for (let i = 1; i < d.slad.length; i++) ctx.lineTo(d.slad[i].x, d.slad[i].y);
    ctx.lineTo(d.x, d.y);
    ctx.lineWidth = rozmiar * 2;                                   // szerokość głowy
    ctx.strokeStyle = g;
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.shadowColor = "#8dff6a";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#a6f58a";
  rysujDuszka(d.x, d.y, rozmiar, alpha, d.t * 4, d.obrot);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = alpha;
  rysujTwarzDuszka(d.x, d.y, rozmiar, "#14502a", d.obrot);         // ciemnozielone smutne oczy i buzia
  ctx.restore();
}

function rysujScianePodWrogami() {
  zniwSciany.forEach(s => {
    const alpha = Math.min(1, s.zycie / 1000) * Math.min(1, (s.zycieMax - s.zycie) / 300 + 0.25);
    const dl = s.dlugosc;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(s.x, s.y);
    ctx.rotate(s.kat);

    // turkusowy pas
    const g = ctx.createLinearGradient(0, -SCIANA_GRUBOSC / 2, 0, SCIANA_GRUBOSC / 2);
    g.addColorStop(0, "rgba(40, 220, 200, 0.05)");
    g.addColorStop(0.5, "rgba(60, 240, 220, 0.55)");
    g.addColorStop(1, "rgba(40, 220, 200, 0.05)");
    ctx.shadowColor = "#2fe8d4";
    ctx.shadowBlur = 14;
    ctx.fillStyle = g;
    ctx.fillRect(-dl / 2, -SCIANA_GRUBOSC / 2, dl, SCIANA_GRUBOSC);
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(150, 255, 240, 0.8)";
    ctx.beginPath();
    ctx.moveTo(-dl / 2, 0);
    ctx.lineTo(dl / 2, 0);
    ctx.stroke();

    // dym unoszący się z ściany
    const puffow = Math.max(4, Math.floor(dl / 16));
    for (let i = 0; i < puffow; i++) {
      const faza = (s.t * 0.7 + i * 0.37) % 1;
      const px = -dl / 2 + (i + 0.5) * dl / puffow + Math.sin(s.t * 2 + i) * 4;
      const py = -faza * 30 + Math.sin(i * 2.1) * 4;
      ctx.beginPath();
      ctx.arc(px, py, 6 + faza * 11, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(110, 245, 230, ${0.32 * (1 - faza)})`;
      ctx.fill();
    }
    ctx.restore();
  });
}

/* Sylwetka kosy (trzonek + sierp) — używana do rozmazania za kosą. */
function rysujSylwetkeKosy(x, y, kat, kolor) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(kat);
  ctx.lineCap = "round";
  ctx.strokeStyle = kolor;
  ctx.fillStyle = kolor;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-68, 0);
  ctx.lineTo(48, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(48, 0);
  ctx.quadraticCurveTo(76, -6, 66, -44);
  ctx.quadraticCurveTo(50, -18, 40, -8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function rysujKose(k) {
  // zanikający blur ZA kosą: coraz bledsze, rozmyte kopie z poprzednich klatek
  ctx.save();
  ctx.shadowColor = "rgba(150, 120, 255, 0.8)";
  ctx.shadowBlur = 10;
  for (let i = 0; i < k.slad.length - 1; i++) {
    const t = (i + 1) / k.slad.length;                         // 0 (stare) .. 1 (świeże)
    rysujSylwetkeKosy(k.slad[i].x, k.slad[i].y, k.slad[i].kat, `rgba(165, 140, 255, ${0.14 * t})`);
  }
  ctx.restore();

  // kosa wirująca wokół własnej osi: trzonek + zakrzywione ostrze (szerokość całości ok. 140 px)
  ctx.save();
  ctx.translate(k.x, k.y);
  ctx.rotate(k.kat);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // poświata
  ctx.shadowColor = "rgba(150, 120, 255, 0.9)";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(0, 0, 62, -0.5, 1.9);
  ctx.lineWidth = 5;
  ctx.strokeStyle = "rgba(150, 120, 255, 0.25)";
  ctx.stroke();
  ctx.shadowBlur = 0;

  // trzonek
  ctx.beginPath();
  ctx.moveTo(-68, 0);
  ctx.lineTo(48, 0);
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#2b1f14";
  ctx.stroke();
  ctx.lineWidth = 3.4;
  ctx.strokeStyle = "#8a6a46";
  ctx.stroke();

  // ostrze (sierp)
  ctx.beginPath();
  ctx.moveTo(48, 0);
  ctx.quadraticCurveTo(76, -6, 66, -44);
  ctx.quadraticCurveTo(50, -18, 40, -8);
  ctx.closePath();
  const g = ctx.createLinearGradient(40, -40, 70, 0);
  g.addColorStop(0, "#f4f7ff");
  g.addColorStop(1, "#8b95b0");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#1c2030";
  ctx.stroke();
  ctx.restore();
}

function rysujBanshee(b) {
  const R = BANSHEE_PROMIEN;
  // lasery do trafianych wrogów
  ctx.save();
  ctx.lineCap = "round";
  ctx.shadowColor = "#5cff7a";
  ctx.shadowBlur = 8;
  b.cele.forEach(e => {
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(e.x, e.y);
    ctx.lineWidth = 4.2;                                    // grubszy laser
    ctx.strokeStyle = "rgba(120, 255, 130, 0.85)";
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = "rgba(235, 255, 235, 0.9)";
    ctx.stroke();
    ctx.shadowBlur = 8;
  });
  ctx.restore();

  // kula: wirujący zielony dym (jasne i ciemne odcienie)
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.shadowColor = "#4dff6a";
  ctx.shadowBlur = 16;
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, R);
  g.addColorStop(0, "rgba(190, 255, 170, 0.95)");
  g.addColorStop(0.6, "rgba(60, 190, 80, 0.85)");
  g.addColorStop(1, "rgba(15, 90, 40, 0.55)");
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.rotate(b.kat);
  ctx.lineCap = "round";
  for (let i = 0; i < 4; i++) {                                           // wirujące ramiona dymu
    ctx.beginPath();
    ctx.arc(0, 0, R * (0.35 + i * 0.16), i, i + 2.2);
    ctx.lineWidth = 3.4 - i * 0.5;
    ctx.strokeStyle = i % 2 ? "rgba(20, 100, 45, 0.7)" : "rgba(200, 255, 190, 0.6)";
    ctx.stroke();
  }
  ctx.restore();
}

/* Pod wrogami (hak w rysujGre): ściany bólu. */
function rysujPodlozeZniwiarza() {
  if (!czyZniwiarz()) return;
  rysujScianePodWrogami();
}

/* Nad wrogami (hak w rysujGre): kosy, duszki, dusze, banshee. */
function rysujZniwiarzaNaWierzchu() {
  if (!czyZniwiarz()) return;

  zniwDusze.forEach(rysujDusze);

  zniwDuszki.forEach(d => {
    const kol = d.kolor;
    ctx.save();
    // długi blur za duszką (w kolorze duszka)
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = `rgba(${kol.rgb}, 0.9)`;
    ctx.shadowBlur = 8;
    for (let i = 1; i < d.slad.length; i++) {
      const t = i / d.slad.length;
      ctx.beginPath();
      ctx.moveTo(d.slad[i - 1].x, d.slad[i - 1].y);
      ctx.lineTo(d.slad[i].x, d.slad[i].y);
      ctx.lineWidth = 2 + t * 5;
      ctx.strokeStyle = `rgba(${kol.rgb}, ${0.35 * t})`;
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.shadowColor = `rgba(${kol.rgb}, 0.9)`;
    ctx.shadowBlur = 7;
    ctx.fillStyle = `rgb(${kol.rgb})`;
    const obrotRoz = katLotuZeSladu(d.slad, d.dx, d.dy);
    rysujDuszka(d.x, d.y, ROZDARCIE_PROMIEN * 0.85, ROZDARCIE_PRZEZROCZYSTOSC, d.s * 0.05, obrotRoz);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = ROZDARCIE_PRZEZROCZYSTOSC;
    rysujTwarzDuszka(d.x, d.y, ROZDARCIE_PROMIEN * 0.85, kol.twarz, obrotRoz);    // smutna twarz
    ctx.restore();
  });

  zniwKosy.forEach(rysujKose);
  zniwBanshee.forEach(rysujBanshee);
}

/* Zwraca true, jeśli pocisk został narysowany (rysujGre pomija wtedy strzałę). */
function rysujPociskZniwiarza(p) {
  if (p.typ !== "zniw") return false;

  // rozmycie z tyłu (zanikająca smuga)
  ctx.save();
  ctx.lineCap = "round";
  const g = ctx.createLinearGradient(p.x - p.dx * 38, p.y - p.dy * 38, p.x, p.y);
  g.addColorStop(0, "rgba(235, 242, 255, 0)");
  g.addColorStop(1, "rgba(235, 242, 255, 0.4)");
  ctx.shadowColor = "rgba(230, 240, 255, 0.9)";
  ctx.shadowBlur = 9;
  ctx.beginPath();
  ctx.moveTo(p.x - p.dx * 38, p.y - p.dy * 38);
  ctx.lineTo(p.x, p.y);
  ctx.lineWidth = 11;
  ctx.strokeStyle = g;
  ctx.stroke();
  ctx.restore();

  // biały duszek
  ctx.save();
  ctx.shadowColor = "#e8f0ff";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#ffffff";
  const obrotAtaku = katDuszkaDoLotu(p.dx, p.dy);
  rysujDuszka(p.x, p.y, 9, 1, p.t * 10, obrotAtaku);
  ctx.restore();
  rysujTwarzDuszka(p.x, p.y, 9, "#3a4258", obrotAtaku);
  return true;
}
