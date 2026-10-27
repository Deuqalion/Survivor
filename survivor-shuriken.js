/* ============================================================
   SURVIVOR-SHURIKEN.JS
   Mechaniki walki broni SHURIKEN. Ładować PO survivor-game.js
   i survivor-kostur.js (korzysta z jego ruchZPodkrokami i naAreniePoz).

   Id umiejętności (z survivor-bronie.js) -> mechanika Shurikena:
     potrojna    = Ninjutsu          ognista   = Ognisty shuriken
     elektryczna = Rykoszet          magiczna  = Bumerang
     odlamkowa   = Lotos Śmierci     wampiryczna = Shuriken Wampira (survivor-game.js)

   Zwykły atak: gwiazdka (shuriken), fizyczna, nie przebija.
   ============================================================ */

const SHURIKEN_PREDKOSC = 1000;
const SHURIKEN_PROMIEN_TRAFIENIA = 12;
const SHURIKEN_PROMIEN_RYSOWANIA = 11;
const SHURIKEN_PROMIEN_ZWYKLEGO = 14;      // zwykły atak jest nieco większy niż Lotos

/* Ninjutsu */
const NINJUTSU_EFEKTYWNOSC = 0.75;           // max poziom: 1
const NINJUTSU_KAT_ZAPASOWY_STOPNIE = 4;     // gdy brakuje osobnych celów: lekki rozrzut wokół celu głównego

/* Ognisty shuriken */
const OGNISTY_SHURIKEN_SZANSA = 25;
const OGNISTY_SHURIKEN_MNOZNIKI = [40, 55, 70, 85, 100];   // % obrażeń trafienia (jak w opisie)
const OGNISTY_SHURIKEN_PODPALENIE_BAZA = 0.05;             // jak Ogień Kostura: 5% + 1% za poziom maks. PŻ w 3s

/* Rykoszet */
const RYKOSZET_ZASIEG = PROMIEN_OGNIA * 2 * 2.5;           // 2,5x średnica obrażeń obszarowych = 550
const RYKOSZET_EFEKTYWNOSC = [0.5, 0.6, 0.7, 0.8, 0.9];     // obrażenia (i siła efektów) odbicia względem trafienia
const RYKOSZET_WZROST_OBRAZEN = 0.15;                      // max poziom: +15% za każde odbicie

/* Bumerang */
const BUMERANG_PROMIEN_ORBITY = PROMIEN_OGNIA * 1.7;
const BUMERANG_PROMIEN = 15;                               // wielkość (i hitbox) bumerangu
const BUMERANG_PROMIEN_MAX = 25;                           // po max ulepszeniu: wygląd i hitbox 25
const BUMERANG_PREDKOSC_KATOWA = 1.6;                      // rad/s
const BUMERANG_CZAS_MIEDZY_TRAFIENIAMI_MS = 800;           // ten sam bumerang nie bije tego samego wroga częściej

/* Lotos Śmierci */
const LOTOS_PREDKOSC = 800;

const SHURIKEN_TYPY_POCISKOW = ["shuriken", "lotos", "bumerang"];

let shurikenLicznikLotosu = 0;
let shurikenKatBumerangow = 0;
/* Pociski tworzone W TRAKCIE aktualizacji pocisków (odbicia) nie mogą trafiać od razu do
   pociskiGracza (filter() podmienia tablicę) — dołączamy je w następnej klatce. */
let shurikenKolejka = [];

function czyShuriken() {
  return typeof aktualnaBron !== "undefined" && aktualnaBron === "shuriken";
}

function jestPociskShurikena(p) {
  return SHURIKEN_TYPY_POCISKOW.includes(p.typ);
}

function resetujShurikena() {
  shurikenLicznikLotosu = 0;
  shurikenKatBumerangow = 0;
  shurikenKolejka = [];
}

/* ---------- pomocnicze ---------- */

function kierunekShurikena(x, y, cel) {
  const dx = cel.x - x, dy = cel.y - y;
  const d = Math.hypot(dx, dy) || 1;
  return { dx: dx / d, dy: dy / d };
}

function obrocShurikena(dx, dy, kat) {
  return { dx: dx * Math.cos(kat) - dy * Math.sin(kat), dy: dx * Math.sin(kat) + dy * Math.cos(kat) };
}

function nowyShuriken(x, y, dx, dy, opcje) {
  const o = Object.assign({
    typ: "shuriken", x, y, dx, dy,
    kat: Math.random() * Math.PI * 2,
    trafieni: new Set(),
    odbicia: 0, nrOdbicia: 0,
    przebija: false, mnoznikPrzebicia: 1, liczbaTrafien: 0,
    mnoznikSkilla: 1, sila: 1, ninjutsu: false
  }, opcje || {});
  // skuteczność "bazowa" (Ninjutsu 75%/100%): od niej liczona jest efektywność odbić Rykoszetu
  if (o.bazaSkilla === undefined) o.bazaSkilla = o.mnoznikSkilla;
  if (o.bazaSila === undefined) o.bazaSila = o.sila;
  return o;
}

/* ---------- ATAK GRACZA ---------- */

function atakShurikena(cel, staty1) {
  const k = kierunekShurikena(postac.x, postac.y, cel);

  // Rykoszet: zwykłe ataki (też z Ninjutsu) zawsze odbijają się w (1 + p) kolejnych wrogów
  const pRykoszet = poziomUmiejetnosci("elektryczna");
  const odbicia = pRykoszet >= 0 ? 1 + pRykoszet : 0;

  pociskiGracza.push(nowyShuriken(postac.x, postac.y, k.dx, k.dy, { odbicia, przebija: true }));   // główny atak przebija jak strzała

  // Ninjutsu: (1 + p) dodatkowych zwykłych ataków, 75% skuteczności (max: 100%)
  const pNinjutsu = poziomUmiejetnosci("potrojna");
  if (pNinjutsu >= 0) {
    const efektywnosc = pNinjutsu >= MAX_POZIOM_UMIEJETNOSCI ? 1 : NINJUTSU_EFEKTYWNOSC;
    const liczba = 1 + pNinjutsu;
    const inneCele = znajdzNajblizszychWrogow(liczba, new Set([cel.id]));

    for (let i = 0; i < liczba; i++) {
      let dx = k.dx, dy = k.dy;
      if (inneCele[i]) {
        const kk = kierunekShurikena(postac.x, postac.y, inneCele[i]);
        dx = kk.dx; dy = kk.dy;
      } else {
        // brak osobnego celu: leci w cel główny z lekkim rozrzutem (naprzemiennie lewo/prawo)
        const krok = Math.floor((i - inneCele.length) / 2) + 1;
        const strona = (i - inneCele.length) % 2 === 0 ? -1 : 1;
        const o = obrocShurikena(k.dx, k.dy, strona * krok * NINJUTSU_KAT_ZAPASOWY_STOPNIE * Math.PI / 180);
        dx = o.dx; dy = o.dy;
      }
      pociskiGracza.push(nowyShuriken(postac.x, postac.y, dx, dy, {
        odbicia, mnoznikSkilla: efektywnosc, sila: efektywnosc, ninjutsu: true
      }));
    }
  }

  // Lotos Śmierci: co (7 - p) atak, (12 + 3p) shurikenów w równych odstępach kąta
  const pLotos = poziomUmiejetnosci("odlamkowa");
  if (pLotos >= 0 && ++shurikenLicznikLotosu >= 7 - pLotos) {
    shurikenLicznikLotosu = 0;
    const liczba = 12 + 3 * pLotos;
    const odstep = Math.PI * 2 / liczba;
    const obrot = Math.random() * odstep;      // cała salwa obrócona losowo, kąt między shurikenami stały
    for (let i = 0; i < liczba; i++) {
      const kat = obrot + i * odstep;
      pociskiGracza.push({ typ: "lotos", x: postac.x, y: postac.y, dx: Math.cos(kat), dy: Math.sin(kat), kat: 0, trafieni: new Set() });
    }
  }
}

/* ---------- Ognisty shuriken: obrażenia obszarowe ---------- */

/* Każde trafienie ma 25% szansy na obrażenia magiczne (X% obrażeń trafienia) w pobliskich wrogach.
   Max poziom: obrażenia obszarowe podpalają. */
function procObszarowyShurikena(cel, dmg, staty1) {
  const pOgien = poziomUmiejetnosci("ognista");
  if (pOgien < 0 || !dmg) return;
  if (losujProcent() >= OGNISTY_SHURIKEN_SZANSA) return;

  const mnoznik = OGNISTY_SHURIKEN_MNOZNIKI[pOgien] / 100;
  const x = cel.x, y = cel.y;
  dodajEfektWybuchu(x, y, PROMIEN_OGNIA);

  wrogowie.slice().forEach(w => {
    if (w.id === cel.id || w.hp <= 0) return;
    if (Math.hypot(x - w.x, y - w.y) > PROMIEN_OGNIA) return;

    const dmgWybuchu = Math.round(dmg * mnoznik);
    if (dmgWybuchu <= 0) return;
    const poOdpornosci = dmgWybuchu * (w.odporny ? MNOZNIK_DMG_ODPORNEGO : 1);
    const { dmg: dmgMag, dmgTrucizny, dmgWyswietlany } = obrazeniaMagiczneZTrucizna(w, staty1, poOdpornosci);

    w.hp -= dmgMag;
    rundaStaty.obrazenia += dmgMag;
    rundaStaty.magiczne += dmgMag;
    rundaStaty.trucizna += dmgTrucizny;
    dodajDmgUmiejetnosci("ognista", dmgMag);
    wampiryzmZaklec(dmgMag);
    dodajEfektAtaku(w.x, w.y, dmgWyswietlany, { magia: true, dmgTrucizny, xZrodla: x, yZrodla: y });
    if (w.hp <= 0) { zabijWroga(w); return; }

    if (pOgien >= MAX_POZIOM_UMIEJETNOSCI) {
      if (!(w.podpalenieTury > 0)) w.ostatniTikPodpalenia = czasWirt();
      w.podpalenieTury = PODPALENIE_LICZBA_TIKOW;
      w.podpalenieProcent = OGNISTY_SHURIKEN_PODPALENIE_BAZA + pOgien / 100;
    }
  });
}

/* ---------- pętla (kolejka, bumerangi) ---------- */

function aktualizujShurikena(dtMs) {
  if (shurikenKolejka.length) {
    pociskiGracza.push(...shurikenKolejka);
    shurikenKolejka = [];
  }
  if (!czyShuriken()) return;

  const pBumerang = poziomUmiejetnosci("magiczna");
  if (pBumerang < 0) return;

  shurikenKatBumerangow += BUMERANG_PREDKOSC_KATOWA * dtMs / 1000;

  // dopilnuj, by na arenie było (2 + p) bumerangów (po zakupie / ulepszeniu dochodzą kolejne)
  const potrzeba = 2 + pBumerang;
  const istnieja = new Set(pociskiGracza.filter(p => p.typ === "bumerang").map(p => p.idx));
  for (let i = 0; i < potrzeba; i++) {
    if (istnieja.has(i)) continue;
    pociskiGracza.push({
      typ: "bumerang", idx: i, x: postac.x, y: postac.y, dx: 1, dy: 0,
      kat: 0, katPoprzedni: null, cooldowny: new Map()
    });
  }
}

/* ---------- ruch i trafienia ---------- */

function pierwszyWrogPozaLancuchem(p, dodatek) {
  for (const w of wrogowie) {
    if (w.hp <= 0 || p.trafieni.has(w.id)) continue;
    if (Math.hypot(w.x - p.x, w.y - p.y) <= promienWroga(w) + dodatek) return w;
  }
  return null;
}

function trafienieShurikenem(w, staty1, pk, mozeOdbic) {
  const pRykoszet = poziomUmiejetnosci("elektryczna");
  const wzrost = pRykoszet >= MAX_POZIOM_UMIEJETNOSCI ? RYKOSZET_WZROST_OBRAZEN * pk.nrOdbicia : 0;

  const zrodlo = pk.nrOdbicia > 0 ? "elektryczna" : (pk.ninjutsu ? "potrojna" : null);
  const x = w.x, y = w.y;

  // zwykły atak: kryty, przeszywki, trucizna, krwawienie, omdlenie, kradzież życia (Ninjutsu: w 75%/100% siły)
  const dmg = wykonajPojedynczyAtak(w, staty1, pk.x, pk.y, pk.mnoznikPrzebicia + wzrost, {
    mnoznikSkilla: pk.mnoznikSkilla,
    silaEfektow: pk.sila,
    zrodloDmg: zrodlo
  });

  procAffixuOgnistejStrzaly(w, dmg, staty1);
  procObszarowyShurikena(w, dmg, staty1);

  // Rykoszet: szuka najbliższego wroga w zasięgu (2,5x średnica obrażeń obszarowych)
  pk.trafieni.add(w.id);
  if (mozeOdbic && pk.odbicia > 0) {
    const nastepny = znajdzNajblizszegoWrogaOd({ id: w.id, x, y }, pk.trafieni);
    if (nastepny && Math.hypot(nastepny.x - x, nastepny.y - y) <= RYKOSZET_ZASIEG) {
      const k = kierunekShurikena(x, y, nastepny);
      const efektywnosc = RYKOSZET_EFEKTYWNOSC[Math.max(0, poziomUmiejetnosci("elektryczna"))];
      shurikenKolejka.push(nowyShuriken(x, y, k.dx, k.dy, {
        odbicia: pk.odbicia - 1, nrOdbicia: pk.nrOdbicia + 1,
        mnoznikSkilla: pk.bazaSkilla * efektywnosc, sila: pk.bazaSila * efektywnosc,
        bazaSkilla: pk.bazaSkilla, bazaSila: pk.bazaSila, ninjutsu: pk.ninjutsu,
        trafieni: new Set(pk.trafieni), kat: pk.kat
      }));
    }
  }
}

/* Zwraca true, jeśli pocisk ma zostać (false = usuń). */
function aktualizujPociskShurikena(p, dtMs, staty1) {
  if (!staty1) return naAreniePoz(p);

  switch (p.typ) {
    case "shuriken":
      p.kat += dtMs / 1000 * 20;
      return ruchZPodkrokami(p, SHURIKEN_PREDKOSC, dtMs, pk => {
        if (!pk.przebija) {                  // Ninjutsu i odbicia: tylko pierwszy cel
          const w = pierwszyWrogPozaLancuchem(pk, SHURIKEN_PROMIEN_TRAFIENIA);
          if (!w) return false;
          trafienieShurikenem(w, staty1, pk, true);
          return true;
        }
        // główny atak: przebija wrogów (+15% za każdego); Rykoszet odbija się tylko od pierwszego trafienia
        for (const w of wrogowie.slice()) {
          if (w.hp <= 0 || pk.trafieni.has(w.id)) continue;
          if (Math.hypot(w.x - pk.x, w.y - pk.y) > promienWroga(w) + SHURIKEN_PROMIEN_TRAFIENIA) continue;
          trafienieShurikenem(w, staty1, pk, pk.liczbaTrafien === 0);
          pk.liczbaTrafien += 1;
          pk.mnoznikPrzebicia += WZROST_DMG_NA_PRZEBICIE;
        }
        return false;
      });

    case "lotos": {
      const przebija = poziomUmiejetnosci("odlamkowa") >= MAX_POZIOM_UMIEJETNOSCI;
      p.kat += dtMs / 1000 * 14;
      return ruchZPodkrokami(p, LOTOS_PREDKOSC, dtMs, pk => {
        for (const w of wrogowie.slice()) {
          if (w.hp <= 0 || pk.trafieni.has(w.id)) continue;
          if (Math.hypot(w.x - pk.x, w.y - pk.y) > promienWroga(w) + SHURIKEN_PROMIEN_TRAFIENIA) continue;
          pk.trafieni.add(w.id);
          const dmg = wykonajAtakMagiczny(w, staty1, pk.x, pk.y, 1, { bezLinii: true, zrodlo: "odlamkowa" });
          procObszarowyShurikena(w, dmg, staty1);
          if (!przebija) return true;        // bije tylko pierwszy cel
        }
        return false;
      });
    }

    case "bumerang": {
      const pBumerang = poziomUmiejetnosci("magiczna");
      if (pBumerang < 0) return false;

      const liczba = 2 + pBumerang;
      const hitbox = pBumerang >= MAX_POZIOM_UMIEJETNOSCI ? BUMERANG_PROMIEN_MAX : BUMERANG_PROMIEN;
      const katDocelowy = shurikenKatBumerangow + p.idx * Math.PI * 2 / liczba;
      const katStart = p.katPoprzedni === null ? katDocelowy : p.katPoprzedni;
      p.katPoprzedni = katDocelowy;

      // ruch po okręgu w podkrokach (≤ 8 px), żeby szybki bumerang nie omijał wrogów
      const luk = Math.abs(katDocelowy - katStart) * BUMERANG_PROMIEN_ORBITY;
      const n = Math.max(1, Math.ceil(luk / 8));
      const teraz = czasWirt();

      for (let i = 1; i <= n; i++) {
        const kat = katStart + (katDocelowy - katStart) * i / n;
        p.x = postac.x + Math.cos(kat) * BUMERANG_PROMIEN_ORBITY;
        p.y = postac.y + Math.sin(kat) * BUMERANG_PROMIEN_ORBITY;

        for (const w of wrogowie.slice()) {
          if (w.hp <= 0) continue;
          if (Math.hypot(w.x - p.x, w.y - p.y) > hitbox + promienWroga(w)) continue;
          if (teraz - (p.cooldowny.get(w.id) ?? -1e9) < BUMERANG_CZAS_MIEDZY_TRAFIENIAMI_MS) continue;

          p.cooldowny.set(w.id, teraz);
          const dmg = wykonajAtakMagiczny(w, staty1, p.x, p.y, 1, { bezLinii: true, zrodlo: "magiczna" });
          procObszarowyShurikena(w, dmg, staty1);
        }
      }
      if (p.cooldowny.size > 300) {
        p.cooldowny.forEach((t, id) => { if (teraz - t > BUMERANG_CZAS_MIEDZY_TRAFIENIAMI_MS) p.cooldowny.delete(id); });
      }

      p.dx = -Math.sin(katDocelowy); p.dy = Math.cos(katDocelowy);   // kierunek ruchu (do rozmycia)
      p.kat += dtMs / 1000 * 12;                                       // obrót własny
      return true;
    }
  }
  return naAreniePoz(p);
}

/* ---------- rysowanie ---------- */

function sciezkaGwiazdki(x, y, r, kat, ramiona = 4, wciecie = 0.4) {
  ctx.beginPath();
  for (let i = 0; i < ramiona * 2; i++) {
    const promien = i % 2 === 0 ? r : r * wciecie;
    const a = kat + i * Math.PI / ramiona;
    const px = x + Math.cos(a) * promien;
    const py = y + Math.sin(a) * promien;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/* Zwraca true, jeśli pocisk został narysowany (rysujGre pomija wtedy strzałę). */
function rysujPociskShurikena(p) {
  switch (p.typ) {
    case "shuriken": {
      ctx.save();
      // lekki blur za gwiazdką
      ctx.lineCap = "round";
      ctx.shadowColor = "#cfd8ea";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(p.x - p.dx * 26, p.y - p.dy * 26);
      ctx.lineTo(p.x, p.y);
      ctx.lineWidth = 7;
      ctx.strokeStyle = "rgba(215, 225, 245, 0.28)";
      ctx.stroke();
      ctx.shadowBlur = 0;

      sciezkaGwiazdki(p.x, p.y, SHURIKEN_PROMIEN_ZWYKLEGO, p.kat);
      ctx.fillStyle = "#dfe4ee";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#4a5160";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = "#4a5160";
      ctx.fill();
      ctx.restore();
      return true;
    }

    case "lotos": {
      ctx.save();
      // żółty blur z tyłu
      ctx.lineCap = "round";
      ctx.shadowColor = "#ffe14d";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(p.x - p.dx * 26, p.y - p.dy * 26);
      ctx.lineTo(p.x, p.y);
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(255, 225, 70, 0.55)";
      ctx.stroke();

      // złota gwiazdka ze świecącymi błękitnymi krawędziami
      ctx.shadowColor = "#4dc3ff";
      ctx.shadowBlur = 12;
      sciezkaGwiazdki(p.x, p.y, SHURIKEN_PROMIEN_RYSOWANIA, p.kat);
      ctx.fillStyle = "#ffcf3a";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#7fd8ff";
      ctx.stroke();
      ctx.restore();
      return true;
    }

    case "bumerang": {
      const R = poziomUmiejetnosci("magiczna") >= MAX_POZIOM_UMIEJETNOSCI ? BUMERANG_PROMIEN_MAX : BUMERANG_PROMIEN;
      ctx.save();
      // lekki blur za bumerangiem: kilka coraz bledszych kopii wstecz po orbicie
      for (let i = 3; i >= 1; i--) {
        ctx.globalAlpha = 0.14 * (4 - i);
        rysujKsztaltBumerangu(p.x - p.dx * i * 6, p.y - p.dy * i * 6, R, p.kat, false);
      }
      ctx.globalAlpha = 1;
      rysujKsztaltBumerangu(p.x, p.y, R, p.kat, true);
      ctx.restore();
      return true;
    }
  }
  return false;
}

/* Sierpowaty bumerang (zmieści się w średnicy podstawowego moba): ciemny środek, błękitne krawędzie. */
function rysujKsztaltBumerangu(x, y, r, kat, swiecenie) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(kat);
  if (swiecenie) { ctx.shadowColor = "#4dc3ff"; ctx.shadowBlur = 10; }
  ctx.beginPath();
  ctx.arc(0, 0, r, -Math.PI * 0.15, Math.PI * 1.15);              // zewnętrzny łuk
  ctx.arc(r * 0.35, r * 0.1, r * 0.85, Math.PI * 1.1, -Math.PI * 0.1, true);   // wcięcie od środka
  ctx.closePath();
  ctx.fillStyle = "#12304f";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#6fd0ff";
  ctx.stroke();
  ctx.restore();
}
