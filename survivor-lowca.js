/* ============================================================
   SURVIVOR-LOWCA.JS
   Mechaniki walki klasy ŁOWCA (broń: Kusza, item: Bełty).
   Ładować PO survivor-game.js i survivor-kostur.js
   (korzysta z jego ruchZPodkrokami i naAreniePoz).

   Id umiejętności (z survivor-bronie.js) -> mechanika Łowcy:
     elektryczna = Przeszywające bełty   ognista  = Odbijające bełty
     odlamkowa   = Diamentowe groty      magiczna = Pogromca olbrzymów
     potrojna    = Precyzja              wampiryczna = Wamp-bełt

   Zwykły atak: złoty bełt z długim rozmyciem, przebija wrogów (+15% obrażeń
   za każdego przebitego, jak strzała).
   WSZYSTKIE umiejętności Łowcy zadają obrażenia FIZYCZNE (pancerz działa),
   nie mogą krytować, a przeszywka działa na nie normalnie. Na maksymalnym
   poziomie Przeszywających bełtów / Diamentowych grotów / Pogromcy każde
   takie trafienie ZAWSZE przeszywa (siła przeszywki = nasza Szansa na przeszywkę).
   ============================================================ */

/* Zwykły atak */
const LOWCA_PREDKOSC_BELTU = 1300;
const LOWCA_PROMIEN_TRAFIENIA = 9;

/* Wartości umiejętności wg liczby ulepszeń p = 0..4 */
const LOWCA_PRZESZYWAJACE_CO = 3;                                   // co 3. trafienie
const LOWCA_PRZESZYWAJACE_MNOZNIK = [0.8, 0.9, 1, 1.1, 1.2];       // x Całkowite obrażenia
const LOWCA_ODBIJAJACE_MNOZNIK = [0.6, 0.7, 0.8, 0.9, 1];          // % obrażeń całkowitych po odbiciu
const LOWCA_DIAMENTOWE_PROCENT = [4, 5.5, 7, 8.5, 10];             // % aktualnego zdrowia wroga
const LOWCA_POGROMCA_CO = 3;                                        // co 3. trafienie tego samego wroga
const LOWCA_POGROMCA_PROCENT = [6, 7, 8, 9, 10];                    // % max PŻ wroga
const LOWCA_PRECYZJA_PREDKOSC = [15, 20, 25, 30, 35];               // +% prędkości ataku
const LOWCA_PRECYZJA_WZMOCNIENIE = [15, 17.5, 20, 22.5, 25];        // Wzmocnienie krytyczne
const LOWCA_PRECYZJA_CZAS_MS = 3000;

/* Precyzja (max): rozerwanie wroga zabitego krytem */
const LOWCA_ODLAMKI_LICZBA = 5;
const LOWCA_ODLAMKI_DYSTANS = 150;
const LOWCA_ODLAMKI_PREDKOSC = 650;
const LOWCA_ODLAMKI_PROMIEN = 8;

const LOWCA_TYPY_POCISKOW = ["belt", "odlamekLowcy"];

let lowcaLicznikTrafien = 0;          // wspólny licznik trafień dla Przeszywających bełtów
let lowcaPrecyzjaDo = 0;              // czasWirt() do kiedy trwa bonus prędkości ataku
let lowcaPrecyzjaAktywna = false;
let lowcaKolejka = [];                // pociski tworzone w trakcie aktualizacji pocisków (patrz survivor-pistolet.js)
let lowcaEfekty = [];                 // własne efekty wizualne (iskry, błyski, rozbicie obwódek)

function czyLowca() {
  return typeof aktualnaBron !== "undefined" && aktualnaBron === "lowca";
}

function jestPociskLowcy(p) {
  return LOWCA_TYPY_POCISKOW.includes(p.typ);
}

function resetujLowce() {
  lowcaLicznikTrafien = 0;
  lowcaPrecyzjaDo = 0;
  lowcaPrecyzjaAktywna = false;
  lowcaKolejka = [];
  lowcaEfekty = [];
}

/* ---------- hooki dla survivor-game.js ---------- */

/* Precyzja: dodatkowe Wzmocnienie krytyczne (liczone w obliczStatystyki). */
function bonusWzmocnieniaKrytycznegoLowcy() {
  if (!czyLowca()) return 0;
  const p = poziomUmiejetnosci("potrojna");
  return p >= 0 ? LOWCA_PRECYZJA_WZMOCNIENIE[p] : 0;
}

/* Precyzja: chwilowy bonus prędkości ataku po trafieniu krytycznym (nie stackuje się). */
function bonusPredkosciAtakuLowcy() {
  if (!czyLowca() || !lowcaPrecyzjaAktywna) return 0;
  const p = poziomUmiejetnosci("potrojna");
  return p >= 0 ? LOWCA_PRECYZJA_PREDKOSC[p] : 0;
}

/* ---------- pomocnicze ---------- */

function lowcaCalkowiteObrazenia() {
  const s = stan[1].staty || {};
  return (s.bazoweObrazenia || 0) + bonusObrazenZZabojstw();
}

function lowcaMax(id) {
  return poziomUmiejetnosci(id) >= MAX_POZIOM_UMIEJETNOSCI;
}

function lowcaDodajEfekt(e) {
  if (lowcaEfekty.length > 220) lowcaEfekty.shift();
  lowcaEfekty.push(e);
}

/* Dodatkowe trafienie umiejętności: fizyczne, bez krytu i bez efektów statusowych.
   dmgBazowe = obrażenia przed pancerzem. Max poziom umiejętności = zawsze przeszywa. */
function lowcaDodatkoweTrafienie(cel, staty1, zrodlo, dmgBazowe, wymusPrzeszywke, slot) {
  if (!cel || cel.hp <= 0 || !(dmgBazowe > 0)) return 0;
  // liczba z lewej góry wroga (każda umiejętność ma swój „slot" wyżej), żeby nie nakładała się na zwykły atak
  const przesuniecieDmg = (slot === undefined) ? undefined
    : { x: -(promienWroga(cel) + 8), y: -promienWroga(cel) * 0.4 - slot * 16 };
  const dmg = wykonajPojedynczyAtak(cel, staty1, cel.x, cel.y, 1, {
    przesuniecieDmg,
    bezEfektow: true,
    bezKryta: true,
    dmgBazoweNadpisane: dmgBazowe,
    wymusPrzeszywke: !!wymusPrzeszywke,
    zrodloDmg: zrodlo
  });
  return dmg;
}

/* ---------- ATAK GRACZA ---------- */

function atakLowcy(cel, staty1) {
  const dx = cel.x - postac.x, dy = cel.y - postac.y;
  const d = Math.hypot(dx, dy) || 1;
  pociskiGracza.push({
    typ: "belt",
    x: postac.x, y: postac.y,
    dx: dx / d, dy: dy / d,
    trafieni: new Set(),
    mnoznikPrzebicia: 1,     // +15% za każdego przebitego; po odbiciu liczy się od nowa
    mnoznikOdbicia: 1,       // 1 na pierwszym odcinku, potem % z Odbijających bełtów
    odbicia: 0
  });
}

/* Trafienie zwykłym atakiem (także po odbiciu) + wszystkie umiejętności „na trafienie". */
function trafienieBeltuLowcy(w, staty1, pk) {
  const wynik = {};
  const poOdbiciu = pk.odbicia > 0;
  const opcje = { wynik };
  if (poOdbiciu) opcje.zrodloDmg = "ognista";               // obrażenia Odbijających bełtów

  const dmg = wykonajPojedynczyAtak(w, staty1, pk.x, pk.y, pk.mnoznikPrzebicia * pk.mnoznikOdbicia, opcje);
  pk.mnoznikPrzebicia += WZROST_DMG_NA_PRZEBICIE;

  // Precyzja: krytyk daje chwilowy bonus prędkości ataku (odświeża, nie stackuje)
  const pPrecyzja = poziomUmiejetnosci("potrojna");
  if (pPrecyzja >= 0 && wynik.kryt) {
    lowcaPrecyzjaDo = czasWirt() + LOWCA_PRECYZJA_CZAS_MS;
    if (!lowcaPrecyzjaAktywna) {
      lowcaPrecyzjaAktywna = true;
      if (typeof renderujStatyGracza === "function") renderujStatyGracza();
    }
    // max poziom: wróg zabity krytem rozrywa się na 5 części
    if (w.hp <= 0 && pPrecyzja >= MAX_POZIOM_UMIEJETNOSCI) rozerwijWroga(w.x, w.y);
  }

  if (w.hp <= 0) {
    lowcaLicznikTrafien += 1;            // trafienie liczy się też, gdy zabiło
    return;
  }

  // Przeszywające bełty: co 3. trafienie (liczone globalnie) = dodatkowe obrażenia
  const pPrzeszywajace = poziomUmiejetnosci("elektryczna");
  lowcaLicznikTrafien += 1;
  if (pPrzeszywajace >= 0 && lowcaLicznikTrafien % LOWCA_PRZESZYWAJACE_CO === 0) {
    lowcaDodajEfekt({ typ: "blysk", x: w.x, y: w.y, zycie: 260, zycieMax: 260 });
    lowcaDodatkoweTrafienie(w, staty1, "elektryczna",
      lowcaCalkowiteObrazenia() * LOWCA_PRZESZYWAJACE_MNOZNIK[pPrzeszywajace],
      lowcaMax("elektryczna"), 0);
  }

  // Diamentowe groty: każde trafienie = x% AKTUALNEGO zdrowia wroga
  const pDiamentowe = poziomUmiejetnosci("odlamkowa");
  if (pDiamentowe >= 0 && w.hp > 0) {
    lowcaDodatkoweTrafienie(w, staty1, "odlamkowa",
      w.hp * LOWCA_DIAMENTOWE_PROCENT[pDiamentowe] / 100,
      lowcaMax("odlamkowa"), 1);
  }

  // Pogromca olbrzymów: 1. i 2. trafienie = obwódki, 3. = rozbicie obwódek + x% max PŻ
  const pPogromca = poziomUmiejetnosci("magiczna");
  if (pPogromca >= 0 && w.hp > 0) {
    w.pogromcaTrafienia = (w.pogromcaTrafienia || 0) + 1;
    if (w.pogromcaTrafienia >= LOWCA_POGROMCA_CO) {
      w.pogromcaTrafienia = 0;
      lowcaDodajEfekt({ typ: "rozbicie", x: w.x, y: w.y, r: promienWroga(w), zycie: 380, zycieMax: 380 });
      lowcaDodatkoweTrafienie(w, staty1, "magiczna",
        w.maxHp * LOWCA_POGROMCA_PROCENT[pPogromca] / 100,
        lowcaMax("magiczna"), 2);
    }
  }
}

/* Precyzja (max): 5 odłamków w równych odstępach kątowych, z losowym obrotem. */
function rozerwijWroga(x, y) {
  const obrot = Math.random() * Math.PI * 2;
  for (let i = 0; i < LOWCA_ODLAMKI_LICZBA; i++) {
    const kat = obrot + i * Math.PI * 2 / LOWCA_ODLAMKI_LICZBA;
    lowcaKolejka.push({
      typ: "odlamekLowcy",
      x, y, x0: x, y0: y,
      dx: Math.cos(kat), dy: Math.sin(kat)
    });
  }
  lowcaDodajEfekt({ typ: "blysk", x, y, zycie: 220, zycieMax: 220, kolor: "gold" });
}

/* Iskry złote i błękitne przy odbiciu od ściany. */
function iskryOdbicia(x, y) {
  const czastki = [];
  for (let i = 0; i < 34; i++) {
    czastki.push({
      kat: Math.random() * Math.PI * 2,
      dystans: 30 + Math.random() * 80,
      dlugosc: 9 + Math.random() * 16,
      kolor: i % 2 ? "#ffd34d" : "#6fd2ff"
    });
  }
  lowcaDodajEfekt({ typ: "iskry", x, y, czastki, zycie: 650, zycieMax: 650 });
}

/* ---------- aktualizacja ---------- */

function aktualizujLowce(dtMs) {
  if (lowcaKolejka.length) {
    pociskiGracza.push(...lowcaKolejka);
    lowcaKolejka = [];
  }

  lowcaEfekty.forEach(e => e.zycie -= dtMs);
  lowcaEfekty = lowcaEfekty.filter(e => e.zycie > 0);

  if (lowcaPrecyzjaAktywna && czasWirt() >= lowcaPrecyzjaDo) {
    lowcaPrecyzjaAktywna = false;
    if (typeof renderujStatyGracza === "function") renderujStatyGracza();
  }
}

/* Zwraca true, jeśli pocisk ma zostać (false = usuń). */
function aktualizujPociskLowcy(p, dtMs, staty1) {
  if (!staty1) return naAreniePoz(p);

  switch (p.typ) {
    case "belt": {
      const pOdbijajace = poziomUmiejetnosci("ognista");
      const maxOdbic = pOdbijajace < 0 ? 0 : (pOdbijajace >= MAX_POZIOM_UMIEJETNOSCI ? 2 : 1);

      return ruchZPodkrokami(p, LOWCA_PREDKOSC_BELTU, dtMs, pk => {
        for (const w of wrogowie.slice()) {
          if (w.hp <= 0 || pk.trafieni.has(w.id)) continue;
          if (Math.hypot(w.x - pk.x, w.y - pk.y) > promienWroga(w) + LOWCA_PROMIEN_TRAFIENIA) continue;
          pk.trafieni.add(w.id);
          trafienieBeltuLowcy(w, staty1, pk);
        }

        // Odbicie od ściany: prosto z powrotem w naszą stronę (bez skręcania)
        const poza = pk.x < 0 || pk.x > canvas.width || pk.y < 0 || pk.y > canvas.height;
        if (poza && pk.odbicia < maxOdbic) {
          pk.x = Math.min(canvas.width, Math.max(0, pk.x));
          pk.y = Math.min(canvas.height, Math.max(0, pk.y));
          iskryOdbicia(pk.x, pk.y);
          pk.dx = -pk.dx;
          pk.dy = -pk.dy;
          pk.odbicia += 1;
          pk.trafieni = new Set();                              // nowy odcinek: wrogowie mogą oberwać ponownie
          pk.mnoznikPrzebicia = 1;                              // +15% za przebicia liczy się od 0
          pk.mnoznikOdbicia = LOWCA_ODBIJAJACE_MNOZNIK[pOdbijajace];
        }
        return false;                                           // przebija — leci dalej
      });
    }

    case "odlamekLowcy":
      return ruchZPodkrokami(p, LOWCA_ODLAMKI_PREDKOSC, dtMs, pk => {
        if (Math.hypot(pk.x - pk.x0, pk.y - pk.y0) > LOWCA_ODLAMKI_DYSTANS) return true;   // koniec zasięgu
        for (const w of wrogowie.slice()) {
          if (w.hp <= 0) continue;
          if (Math.hypot(w.x - pk.x, w.y - pk.y) > promienWroga(w) + LOWCA_ODLAMKI_PROMIEN) continue;
          lowcaDodatkoweTrafienie(w, staty1, "potrojna", lowcaCalkowiteObrazenia(), false);
          return true;                                          // odłamek zużyty
        }
        return false;
      });
  }
  return naAreniePoz(p);
}

/* ---------- rysowanie ---------- */

/* Zwraca true, jeśli pocisk został narysowany. */
function rysujPociskLowcy(p) {
  switch (p.typ) {
    case "belt": {
      const diament = poziomUmiejetnosci("odlamkowa") >= 0;
      ctx.save();
      ctx.lineCap = "round";

      // długie złote rozmycie za bełtem (135 px)
      const dlugosc = 135;
      const g2 = ctx.createLinearGradient(p.x - p.dx * dlugosc, p.y - p.dy * dlugosc, p.x, p.y);
      g2.addColorStop(0, "rgba(255, 200, 60, 0)");
      g2.addColorStop(1, "rgba(255, 215, 90, 0.7)");
      ctx.shadowColor = "#ffcc33";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(p.x - p.dx * dlugosc, p.y - p.dy * dlugosc);
      ctx.lineTo(p.x, p.y);
      ctx.lineWidth = 7;
      ctx.strokeStyle = g2;
      ctx.stroke();

      // Diamentowe groty: wąski turkusowy pas przez środek złotego rozmycia
      if (diament) {
        const dlB = 120;
        const x0 = p.x - p.dx * dlB, y0 = p.y - p.dy * dlB;
        const gBlekit = ctx.createLinearGradient(x0, y0, p.x, p.y);
        gBlekit.addColorStop(0, "rgba(120, 220, 255, 0)");
        gBlekit.addColorStop(1, "rgba(150, 230, 255, 1)");
        ctx.shadowColor = "#7fd8ff";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(p.x, p.y);
        ctx.lineWidth = 2.6;                                  // błękitny środek
        ctx.strokeStyle = gBlekit;
        ctx.stroke();
      }

      // sam bełt: złoty trzon + jasny grot
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(p.x - p.dx * 22, p.y - p.dy * 22);
      ctx.lineTo(p.x, p.y);
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = "#ffcf3a";
      ctx.stroke();

      const px = -p.dy, py = p.dx;
      ctx.beginPath();
      ctx.moveTo(p.x + p.dx * 9, p.y + p.dy * 9);
      ctx.lineTo(p.x - p.dx * 3 + px * 5, p.y - p.dy * 3 + py * 5);
      ctx.lineTo(p.x - p.dx * 3 - px * 5, p.y - p.dy * 3 - py * 5);
      ctx.closePath();
      ctx.fillStyle = "#fff3b8";
      ctx.fill();
      ctx.restore();
      return true;
    }

    case "odlamekLowcy": {
      ctx.save();
      ctx.lineCap = "round";
      ctx.shadowColor = "#fff2b0";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(p.x - p.dx * 14, p.y - p.dy * 14);
      ctx.lineTo(p.x, p.y);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(255, 240, 190, 0.9)";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.restore();
      return true;
    }
  }
  return false;
}

/* Obwódki Pogromcy na wrogach + efekty Łowcy (iskry, błyski, rozbicie). Wołane z rysujGre. */
function rysujEfektyLowcy() {
  if (!czyLowca()) return;

  // obwódki Pogromcy olbrzymów: 1 trafienie = 1 obwódka, 2 trafienia = druga, większa
  if (poziomUmiejetnosci("magiczna") >= 0) {
    wrogowie.forEach(w => {
      const n = w.pogromcaTrafienia || 0;
      if (n <= 0 || w.hp <= 0) return;
      const r = promienWroga(w);
      ctx.save();
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 8;
      for (let i = 1; i <= Math.min(2, n); i++) {
        ctx.beginPath();
        ctx.arc(w.x, w.y, r + 3 + i * 5, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(255, 255, 255, ${i === 1 ? 0.7 : 0.5})`;
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  lowcaEfekty.forEach(e => {
    const t = Math.max(0, e.zycie / e.zycieMax);   // 1 -> 0
    const u = 1 - t;
    ctx.save();
    ctx.lineCap = "round";

    if (e.typ === "iskry") {
      // krótki rozbłysk w miejscu odbicia + rozlatujące się iskry
      const rr = 10 + 34 * u;
      const gi = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, rr);
      gi.addColorStop(0, "rgba(255, 255, 255, 0.85)");
      gi.addColorStop(0.5, "rgba(255, 215, 100, 0.35)");
      gi.addColorStop(1, "rgba(111, 210, 255, 0)");
      ctx.globalAlpha = Math.max(0, 1 - u * 1.6);
      ctx.beginPath();
      ctx.arc(e.x, e.y, rr, 0, Math.PI * 2);
      ctx.fillStyle = gi;
      ctx.fill();
      ctx.globalAlpha = t;
      e.czastki.forEach(c => {
        const d1 = c.dystans * u, d0 = Math.max(0, d1 - c.dlugosc);
        ctx.beginPath();
        ctx.moveTo(e.x + Math.cos(c.kat) * d0, e.y + Math.sin(c.kat) * d0);
        ctx.lineTo(e.x + Math.cos(c.kat) * d1, e.y + Math.sin(c.kat) * d1);
        ctx.lineWidth = 3.6;
        ctx.shadowColor = c.kolor;
        ctx.shadowBlur = 14;
        ctx.strokeStyle = c.kolor;
        ctx.stroke();
      });
    }

    else if (e.typ === "blysk") {
      // biało-turkusowy błysk (Przeszywające bełty); złoty przy rozerwaniu
      const zloty = e.kolor === "gold";
      const r = 12 + 22 * u;
      ctx.globalAlpha = t;
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
      g.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      g.addColorStop(0.45, zloty ? "rgba(255, 220, 110, 0.6)" : "rgba(110, 245, 230, 0.6)");
      g.addColorStop(1, zloty ? "rgba(255, 200, 60, 0)" : "rgba(60, 220, 210, 0)");
      ctx.beginPath();
      ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.shadowColor = zloty ? "#ffd34d" : "#7ff5e6";
      ctx.shadowBlur = 10;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      const dl = r * 1.3;
      [0, Math.PI / 2].forEach(k => {
        ctx.beginPath();
        ctx.moveTo(e.x - Math.cos(k + 0.4) * dl, e.y - Math.sin(k + 0.4) * dl);
        ctx.lineTo(e.x + Math.cos(k + 0.4) * dl, e.y + Math.sin(k + 0.4) * dl);
        ctx.stroke();
      });
    }

    else if (e.typ === "rozbicie") {
      // obwódki Pogromcy roztrzaskują się: dwa pierścienie rozlatują się na odłamki
      ctx.globalAlpha = t;
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 10;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      [8, 13].forEach((odstep, idx) => {
        const rr = e.r + odstep + 16 * u;
        const ile = 10;
        for (let i = 0; i < ile; i++) {
          const kat = i * Math.PI * 2 / ile + idx * 0.3;
          const rozwart = 0.17 * (1 - 0.4 * u);
          ctx.beginPath();
          ctx.arc(e.x, e.y, rr, kat, kat + rozwart);
          ctx.stroke();
        }
      });
    }

    ctx.restore();
  });
}
