/* ============================================================
   SURVIVOR-PISTOLET.JS
   Mechaniki walki broni PISTOLET. Ładować PO survivor-game.js
   i survivor-kostur.js (korzysta z jego ruchZPodkrokami, pierwszyWrogWZasiegu, naAreniePoz).

   Id umiejętności (z survivor-bronie.js) -> mechanika Pistoletu:
     elektryczna = Snajperka   potrojna = Shotgun   odlamkowa = Minigun
     magiczna    = Granaty     ognista  = Miny      wampiryczna = Wampiryczny pistolet

   Zwykły atak: mały pocisk fizyczny, nie przebija.
   Umiejętności zadają obrażenia magiczne:
     (Podstawowe obrażenia + zabici) * mnożnik * (1 + Obrażenia umiejętności %)
   ============================================================ */

/* Zwykły atak */
const PISTOLET_PREDKOSC_POCISKU = 1100;
const PISTOLET_PROMIEN_TRAFIENIA = 10;

/* Snajperka */
const SNAJPERKA_CO_ILE_SEKUND = 12;
const SNAJPERKA_CZAS_CELOWANIA_MS = 1000;
const SNAJPERKA_PREDKOSC = 1600;

/* Shotgun */
const SHOTGUN_CO_ILE_ATAKOW = 2;
const SHOTGUN_KAT_STOPNIE = 5;           // kolejne pary śrutów: ±5°, ±10°, ±15° ...
const SHOTGUN_PREDKOSC = 900;

/* Minigun */
const MINIGUN_POCISKI_NA_ATAK = [3, 6, 9, 13, 16];   // pocisków miniguna w czasie jednego ataku gracza (1 atak/s -> 3...16 strzałów/s)
const MINIGUN_ROZRZUT_STOPNIE = 0.5;
const MINIGUN_PREDKOSC = 1000;
const MINIGUN_SZANSA_RYKOSZETU = 25;
const MINIGUN_MNOZNIK = 1 / 7;                 // obrażenia magiczne jednego pocisku (jak w opisie umiejętności)

/* Granaty */
const GRANAT_PREDKOSC = PISTOLET_PREDKOSC_POCISKU;   // tak szybko jak zwykły atak
const PROMIEN_WYBUCHU_GRANATU = PROMIEN_OGNIA * 1.6;
const KOLOR_WYBUCHU_GRANATU = "255, 170, 40";
const GRANAT_PODPALENIE_BAZA = 0.05;     // jak Ogień Kostura: 5% + 1% za poziom maks. PŻ w 3s

/* Miny */
const MINY_CZAS_BAZA_S = 8;                // co (8 - poziom) sekund
const MINA_PROMIEN = 10;                 // szerokość zwykłego moba (promień 10)
const MINA_MARGINES = 68;                // nie bliżej ściany niż szerokość BOSSa (2 * 34)
const KOLOR_WYBUCHU_MINY = "90, 220, 90";
const MINY_KRYT_MNOZNIK = 1.5;           // max poziom: szansa = Szansa na kryta, +50% obrażeń

const PISTOLET_TYPY_POCISKOW = ["pistolet", "snajperka", "celownik", "srut", "minigun", "granat", "mina"];

let pistoletSnajperkaMs = 0;
let pistoletMinyMs = 0;
let pistoletLicznikShotguna = 0;
let pistoletLicznikGranatu = 0;
let pistoletMinigunMs = 0;
/* Pociski tworzone W TRAKCIE aktualizacji pocisków (strzał Snajperki po celowaniu, odbicie)
   nie mogą trafiać od razu do pociskiGracza — aktualizujPociskiGracza podmienia tę tablicę
   wynikiem filter(), więc takie pociski by przepadły. Trafiają tu i są dołączane w następnej klatce. */
let pistoletKolejkaPociskow = [];

function czyPistolet() {
  return typeof aktualnaBron !== "undefined" && aktualnaBron === "pistolet";
}

function jestPociskPistoletu(p) {
  return PISTOLET_TYPY_POCISKOW.includes(p.typ);
}

function resetujPistoletu() {
  pistoletSnajperkaMs = SNAJPERKA_CO_ILE_SEKUND * 1000;
  pistoletMinyMs = MINY_CZAS_BAZA_S * 1000;
  pistoletLicznikShotguna = 0;
  pistoletLicznikGranatu = 0;
  pistoletMinigunMs = 0;
  pistoletKolejkaPociskow = [];
}

/* Miny (max poziom): wszystkie umiejętności mają szansę = Szansa na kryta na +50% obrażeń.
   Wywoływane z wykonajAtakMagiczny (survivor-game.js); zwraca null, gdy bonus nieaktywny. */
function bonusKrytuMagii(staty1) {
  if (!czyPistolet()) return null;
  if (poziomUmiejetnosci("ognista") < MAX_POZIOM_UMIEJETNOSCI) return null;
  return { szansa: staty1.kryt || 0, mnoznik: MINY_KRYT_MNOZNIK };
}

/* ---------- pomocnicze ---------- */

function wrogONajwiekszymMaxHp(wykluczone) {
  let najlepszy = null;
  wrogowie.forEach(w => {
    if (w.hp <= 0 || (wykluczone && wykluczone.has(w.id))) return;
    if (!najlepszy || w.maxHp > najlepszy.maxHp) najlepszy = w;
  });
  return najlepszy;
}

function kierunekDo(x, y, cel) {
  const dx = cel.x - x, dy = cel.y - y;
  const d = Math.hypot(dx, dy) || 1;
  return { dx: dx / d, dy: dy / d };
}

function obrocWektor(dx, dy, kat) {
  return { dx: dx * Math.cos(kat) - dy * Math.sin(kat), dy: dx * Math.sin(kat) + dy * Math.cos(kat) };
}

/* ---------- ATAK GRACZA ---------- */

function atakPistoletu(cel, staty1) {
  const k = kierunekDo(postac.x, postac.y, cel);

  // zwykły atak
  pociskiGracza.push({ typ: "pistolet", x: postac.x, y: postac.y, dx: k.dx, dy: k.dy, trafieni: new Set(), mnoznikPrzebicia: 1 });   // przebija jak strzała

  // Shotgun: co drugi atak salwa ±5°, ±10°, ... (2 + 2p śrutów)
  const pShotgun = poziomUmiejetnosci("potrojna");
  if (pShotgun >= 0 && ++pistoletLicznikShotguna >= SHOTGUN_CO_ILE_ATAKOW) {
    pistoletLicznikShotguna = 0;
    const liczba = 2 + 2 * pShotgun;
    const pary = liczba / 2;
    for (let i = 1; i <= pary; i++) {
      [-1, 1].forEach(strona => {
        const o = obrocWektor(k.dx, k.dy, strona * i * SHOTGUN_KAT_STOPNIE * Math.PI / 180);
        pociskiGracza.push({ typ: "srut", x: postac.x, y: postac.y, dx: o.dx, dy: o.dy, trafieni: new Set() });
      });
    }
  }

  // Granaty: co (7 - p) atak
  const pGranaty = poziomUmiejetnosci("magiczna");
  if (pGranaty >= 0 && ++pistoletLicznikGranatu >= 7 - pGranaty) {
    pistoletLicznikGranatu = 0;
    pociskiGracza.push({ typ: "granat", x: postac.x, y: postac.y, dx: k.dx, dy: k.dy });
  }
}

/* Minigun: osobny strumień pocisków, częstotliwość = tempo ataku * (1 + X%). */
function aktualizujPistoletu(dtMs) {
  if (pistoletKolejkaPociskow.length) {
    pociskiGracza.push(...pistoletKolejkaPociskow);
    pistoletKolejkaPociskow = [];
  }
  if (!czyPistolet() || !stan[1].staty) return;

  // Snajperka: co 12 s (skracane Szybkością zaklęcia) — celownik na wroga z największym maks. PŻ
  const pSnajperka = poziomUmiejetnosci("elektryczna");
  if (pSnajperka < 0) pistoletSnajperkaMs = czasUmiejetnosciMs(SNAJPERKA_CO_ILE_SEKUND);
  else {
    pistoletSnajperkaMs -= dtMs;
    if (pistoletSnajperkaMs <= 0) {
      const cel = wrogONajwiekszymMaxHp();
      if (cel) {                                           // bez wrogów czeka na pierwszego
        pociskiGracza.push({ typ: "celownik", cel, zycie: SNAJPERKA_CZAS_CELOWANIA_MS, x: postac.x, y: postac.y });
        pistoletSnajperkaMs = czasUmiejetnosciMs(SNAJPERKA_CO_ILE_SEKUND);
      }
    }
  }

  // Miny: co (8 - p) s, maks. (3 + p) naraz
  const pMiny = poziomUmiejetnosci("ognista");
  if (pMiny < 0) pistoletMinyMs = czasUmiejetnosciMs(MINY_CZAS_BAZA_S);
  else {
    pistoletMinyMs -= dtMs;
    if (pistoletMinyMs <= 0) {
      const ileMin = pociskiGracza.filter(p => p.typ === "mina").length;
      if (ileMin < 3 + pMiny) {                            // przy limicie czeka, aż któraś mina wybuchnie
        rozstawMine();
        pistoletMinyMs = czasUmiejetnosciMs(MINY_CZAS_BAZA_S - pMiny);
      }
    }
  }

  // Minigun
  const pMini = poziomUmiejetnosci("odlamkowa");
  if (pMini < 0) return;

  pistoletMinigunMs -= dtMs;
  if (pistoletMinigunMs > 0) return;

  if (!znajdzNajblizszegoWroga()) { pistoletMinigunMs = 0; return; }   // czeka na wroga

  // Odstęp między pociskami = czas ataku / liczba pocisków na atak (rośnie razem z Prędkością ataku)
  const interwal = pobierzCzasAtakuGracza() / MINIGUN_POCISKI_NA_ATAK[pMini];

  let wystrzelone = 0;
  while (pistoletMinigunMs <= 0 && wystrzelone < 5) {   // nadrabia klatki dłuższe niż odstęp (np. x2)
    const cel = znajdzNajblizszegoWroga();
    if (!cel) break;
    pistoletMinigunMs += interwal;
    wystrzelone += 1;

    const k = kierunekDo(postac.x, postac.y, cel);
    const rozrzut = (Math.random() * 2 - 1) * MINIGUN_ROZRZUT_STOPNIE * Math.PI / 180;
    const o = obrocWektor(k.dx, k.dy, rozrzut);
    pociskiGracza.push({ typ: "minigun", x: postac.x, y: postac.y, dx: o.dx, dy: o.dy });
  }
  if (pistoletMinigunMs < -interwal) pistoletMinigunMs = 0;
}

/* ---------- MINY ---------- */

function rozstawMine() {
  const x = MINA_MARGINES + Math.random() * Math.max(1, canvas.width - 2 * MINA_MARGINES);
  const y = MINA_MARGINES + Math.random() * Math.max(1, canvas.height - 2 * MINA_MARGINES);
  pociskiGracza.push({ typ: "mina", x, y, t: Math.random() * 6 });
}

function wybuchMiny(mina, staty1) {
  const mnoznik = 1 + Math.max(0, poziomUmiejetnosci("ognista"));   // x1/x2/x3/x4/x5 wg poziomu
  dodajEfektWybuchu(mina.x, mina.y, PROMIEN_OGNIA, KOLOR_WYBUCHU_MINY);
  wrogowie.slice().forEach(w => {
    if (w.hp <= 0 || Math.hypot(mina.x - w.x, mina.y - w.y) > PROMIEN_OGNIA) return;
    wykonajAtakMagiczny(w, staty1, mina.x, mina.y, mnoznik, { bezLinii: true, zrodlo: "ognista" });
  });
}

/* ---------- SNAJPERKA ---------- */

function wystrzelSnajperke(xStart, yStart, cel, odbity, wykluczone) {
  pistoletKolejkaPociskow.push({ typ: "snajperka", x: xStart, y: yStart, cel, odbity, wykluczone, dx: 1, dy: 0 });
}

/* ---------- GRANAT ---------- */

function wybuchGranatu(x, y, staty1) {
  const maks = poziomUmiejetnosci("magiczna") >= MAX_POZIOM_UMIEJETNOSCI;
  const pGranaty = poziomUmiejetnosci("magiczna");
  dodajEfektWybuchu(x, y, PROMIEN_WYBUCHU_GRANATU, KOLOR_WYBUCHU_GRANATU);

  wrogowie.slice().forEach(w => {
    if (w.hp <= 0 || Math.hypot(x - w.x, y - w.y) > PROMIEN_WYBUCHU_GRANATU) return;
    wykonajAtakMagiczny(w, staty1, x, y, 1, { bezLinii: true, zrodlo: "magiczna" });

    // max poziom: wybuch podpala (efekt jak Ogień Kostura)
    if (maks && w.hp > 0) {
      if (!(w.podpalenieTury > 0)) w.ostatniTikPodpalenia = czasWirt();
      w.podpalenieTury = PODPALENIE_LICZBA_TIKOW;
      w.podpalenieProcent = GRANAT_PODPALENIE_BAZA + pGranaty / 100;
    }
  });
}

/* ---------- ruch i trafienia ---------- */

/* Zwraca true, jeśli pocisk ma zostać (false = usuń). */
function aktualizujPociskPistoletu(p, dtMs, staty1) {
  if (!staty1) return naAreniePoz(p);

  switch (p.typ) {
    case "pistolet":
      return ruchZPodkrokami(p, PISTOLET_PREDKOSC_POCISKU, dtMs, pk => {
        for (const w of wrogowie.slice()) {
          if (w.hp <= 0 || pk.trafieni.has(w.id)) continue;
          if (Math.hypot(w.x - pk.x, w.y - pk.y) > promienWroga(w) + PISTOLET_PROMIEN_TRAFIENIA) continue;
          pk.trafieni.add(w.id);
          const dmg = wykonajPojedynczyAtak(w, staty1, pk.x, pk.y, pk.mnoznikPrzebicia);
          procAffixuOgnistejStrzaly(w, dmg, staty1);
          pk.mnoznikPrzebicia += WZROST_DMG_NA_PRZEBICIE;   // przebija: +15% obrażeń za każdego wroga
        }
        return false;
      });

    case "srut": {
      const pShotgun = poziomUmiejetnosci("potrojna");
      const przebija = pShotgun >= MAX_POZIOM_UMIEJETNOSCI;
      return ruchZPodkrokami(p, SHOTGUN_PREDKOSC, dtMs, pk => {
        for (const w of wrogowie.slice()) {
          if (w.hp <= 0 || pk.trafieni.has(w.id)) continue;
          if (Math.hypot(w.x - pk.x, w.y - pk.y) > promienWroga(w) + PISTOLET_PROMIEN_TRAFIENIA) continue;
          pk.trafieni.add(w.id);
          wykonajPojedynczyAtak(w, staty1, pk.x, pk.y, 1, { bezEfektow: true, zrodloDmg: "potrojna" });   // fizyczne, z obrażeń całkowitych
          if (!przebija) return true;       // pierwszy napotkany cel
        }
        return false;
      });
    }

    case "minigun": {
      const rykoszet = poziomUmiejetnosci("odlamkowa") >= MAX_POZIOM_UMIEJETNOSCI;
      return ruchZPodkrokami(p, MINIGUN_PREDKOSC, dtMs, pk => {
        // pocisk po rykoszecie nie trafia ponownie wroga, od którego się odbił
        let w = null;
        for (const kandydat of wrogowie) {
          if (kandydat.hp <= 0 || kandydat.id === pk.pomin) continue;
          if (Math.hypot(kandydat.x - pk.x, kandydat.y - pk.y) <= promienWroga(kandydat) + 6) { w = kandydat; break; }
        }
        if (!w) return false;
        const x = w.x, y = w.y;
        wykonajAtakMagiczny(w, staty1, pk.x, pk.y, MINIGUN_MNOZNIK, { bezLinii: true, zrodlo: "odlamkowa" });

        // max poziom: 25% szansy na rykoszet — ten sam pocisk leci dalej w 1 dodatkowego wroga
        if (rykoszet && !pk.odbity && losujProcent() < MINIGUN_SZANSA_RYKOSZETU) {
          const drugi = znajdzNajblizszegoWrogaOd({ id: w.id, x, y }, new Set());
          if (drugi) {
            const k = kierunekDo(x, y, drugi);
            pistoletKolejkaPociskow.push({ typ: "minigun", x, y, dx: k.dx, dy: k.dy, odbity: true, pomin: w.id });
          }
        }
        return true;
      });
    }

    case "celownik": {
      p.zycie -= dtMs;
      p.x = postac.x; p.y = postac.y;
      if (p.cel.hp <= 0) {                                  // cel zginął: przejmij następnego
        const nowy = wrogONajwiekszymMaxHp();
        if (!nowy) return false;
        p.cel = nowy;
      }
      if (p.zycie <= 0) {
        wystrzelSnajperke(postac.x, postac.y, p.cel, false, new Set([p.cel.id]));
        return false;
      }
      return true;
    }

    case "snajperka": {
      const pSnajperka = poziomUmiejetnosci("elektryczna");
      const dystans = SNAJPERKA_PREDKOSC * dtMs / 1000;
      const n = Math.max(1, Math.ceil(dystans / 10));
      const krok = dystans / n;

      for (let i = 0; i < n; i++) {
        if (p.cel.hp <= 0) {                                // cel zginął w locie: szukaj kolejnego
          const nowy = wrogONajwiekszymMaxHp(p.odbity ? p.wykluczone : null);
          if (!nowy) return false;
          p.cel = nowy;
        }
        const k = kierunekDo(p.x, p.y, p.cel);
        p.dx = k.dx; p.dy = k.dy;
        const d = Math.hypot(p.cel.x - p.x, p.cel.y - p.y);

        if (d <= promienWroga(p.cel) + 8) {
          const cel = p.cel;
          const xT = cel.x, yT = cel.y;
          wykonajAtakMagiczny(cel, staty1, p.x, p.y, 3 + pSnajperka, { bezLinii: true, zrodlo: "elektryczna" });

          // max poziom: odbicie w drugi cel o największym maks. PŻ
          if (pSnajperka >= MAX_POZIOM_UMIEJETNOSCI && !p.odbity) {
            const wyklucz = new Set([cel.id]);
            const drugi = wrogONajwiekszymMaxHp(wyklucz);
            if (drugi) wystrzelSnajperke(xT, yT, drugi, true, wyklucz);
          }
          return false;
        }
        const przesun = Math.min(krok, d);
        p.x += p.dx * przesun;
        p.y += p.dy * przesun;
      }
      return true;
    }

    case "granat":
      return ruchZPodkrokami(p, GRANAT_PREDKOSC, dtMs, pk => {
        const w = pierwszyWrogWZasiegu(pk, 14);
        if (!w) return false;
        wybuchGranatu(w.x, w.y, staty1);
        return true;
      });

    case "mina": {
      p.t += dtMs / 1000;
      for (const w of wrogowie) {
        if (w.hp <= 0) continue;
        if (Math.hypot(w.x - p.x, w.y - p.y) <= promienWroga(w) + MINA_PROMIEN) {
          wybuchMiny(p, staty1);
          return false;                                     // mina znika po wybuchu
        }
      }
      return true;                                          // czeka, dopóki wróg nie nadepnie
    }
  }
  return naAreniePoz(p);
}

/* ---------- rysowanie ---------- */

/* Zwraca true, jeśli pocisk został narysowany (rysujGre pomija wtedy strzałę). */
function rysujPociskPistoletu(p) {
  switch (p.typ) {
    case "pistolet": {
      ctx.save();
      ctx.lineCap = "round";
      ctx.shadowColor = "#ffe9a8";
      ctx.shadowBlur = 12;
      // rozmyta smuga za pociskiem
      ctx.beginPath();
      ctx.moveTo(p.x - p.dx * 28, p.y - p.dy * 28);
      ctx.lineTo(p.x, p.y);
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(255, 235, 170, 0.3)";
      ctx.stroke();
      // sam pocisk
      ctx.beginPath();
      ctx.moveTo(p.x - p.dx * 15, p.y - p.dy * 15);
      ctx.lineTo(p.x, p.y);
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = "#fff3cf";
      ctx.stroke();
      ctx.restore();
      return true;
    }

    case "srut": {
      ctx.save();
      ctx.lineCap = "round";
      ctx.shadowColor = "#ff8a1f";
      ctx.shadowBlur = 16;
      // blur za śrutem
      ctx.beginPath();
      ctx.moveTo(p.x - p.dx * 20, p.y - p.dy * 20);
      ctx.lineTo(p.x, p.y);
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(255, 150, 40, 0.35)";
      ctx.stroke();
      // pocisk z lekką poświatą
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.8, 0, Math.PI * 2);
      ctx.fillStyle = "#ffb04d";
      ctx.fill();
      ctx.restore();
      return true;
    }

    case "minigun": {
      ctx.save();
      ctx.lineCap = "round";
      ctx.shadowColor = "#ffe600";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(p.x - p.dx * 8, p.y - p.dy * 8);
      ctx.lineTo(p.x, p.y);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffe84d";
      ctx.stroke();
      ctx.restore();
      return true;
    }

    case "celownik": {
      const puls = 0.55 + 0.35 * Math.sin(p.zycie / 60);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(postac.x, postac.y);
      ctx.lineTo(p.cel.x, p.cel.y);
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(255, 40, 40, ${puls})`;
      ctx.stroke();
      ctx.restore();
      return true;
    }

    case "snajperka": {
      // wąski ogon, szeroki przód pocisku (zaokrąglony nos)
      const kat = Math.atan2(p.dy, p.dx);
      const px = -p.dy, py = p.dx;
      const dlugosc = 48, szerPrzod = 10.5, szerOgon = 1.8;
      const tx = p.x - p.dx * dlugosc, ty = p.y - p.dy * dlugosc;
      ctx.save();
      ctx.shadowColor = "#ff2a2a";
      ctx.shadowBlur = 16;
      const g = ctx.createLinearGradient(tx, ty, p.x, p.y);
      g.addColorStop(0, "rgba(255, 60, 60, 0.05)");
      g.addColorStop(1, "rgba(255, 55, 55, 0.95)");
      ctx.beginPath();
      ctx.moveTo(tx + px * szerOgon, ty + py * szerOgon);
      ctx.lineTo(p.x + px * szerPrzod, p.y + py * szerPrzod);
      ctx.arc(p.x, p.y, szerPrzod, kat + Math.PI / 2, kat - Math.PI / 2, true);
      ctx.lineTo(tx - px * szerOgon, ty - py * szerOgon);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(p.x - p.dx * 18, p.y - p.dy * 18);
      ctx.lineTo(p.x + p.dx * 4, p.y + p.dy * 4);
      ctx.lineWidth = 4.5;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#ffd6d6";
      ctx.stroke();
      ctx.restore();
      return true;
    }

    case "granat": {
      // owal podzielony na 3 pasy: żółty - zielony - czerwony, z poświatą
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.atan2(p.dy, p.dx));
      const a = 13, b = 7;                                  // półosie owalu
      ctx.shadowColor = "#ffcc33";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.ellipse(0, 0, a, b, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#44aa44";
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.clip();
      ctx.fillStyle = "#ffd43b"; ctx.fillRect(-a, -b, a * 2 / 3, b * 2);
      ctx.fillStyle = "#4cc84c"; ctx.fillRect(-a + a * 2 / 3, -b, a * 2 / 3, b * 2);
      ctx.fillStyle = "#e8352e"; ctx.fillRect(-a + a * 4 / 3, -b, a * 2 / 3, b * 2);
      ctx.restore();
      return true;
    }

    case "mina": {
      const puls = 0.5 + 0.5 * Math.sin(p.t * 3);
      ctx.save();
      ctx.shadowColor = `rgba(90, 255, 110, ${0.5 + 0.3 * puls})`;
      ctx.shadowBlur = 14 + 6 * puls;
      ctx.beginPath();
      ctx.arc(p.x, p.y, MINA_PROMIEN, 0, Math.PI * 2);
      ctx.fillStyle = "#14461c";                            // ciemniejszy środek
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#6bea7a";                          // jaśniejsza obwódka
      ctx.stroke();
      ctx.restore();
      return true;
    }
  }
  return false;
}
