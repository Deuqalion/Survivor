/* ============================================================
   SURVIVOR-SCIEZKI.JS
   Omijanie innych wrogów (A*). Ładować po survivor-game.js.

   Problem: wróg, który idzie prosto do gracza, a po drodze ma innego wroga
   blokującego go (większego lub równego — patrz `blokuje` w survivor-game.js),
   zatrzymywał się za nim (np. za strzelającym trójkątem w zasięgu 350).

   Rozwiązanie: gdy prosta trasa jest zablokowana, wróg liczy ścieżkę A* po siatce
   (komórka 20 px), w której przeszkodami są okręgi blokujących wrogów. Odległość
   przeszkody = minDystansWrogow(), czyli nadal dopuszczalne jest nakładanie się
   wrogów do 40% (MAX_NALOZENIE_WROGOW) — wróg nie omija "z zapasem", tylko tak,
   jak pozwala mu system rozsuwania.

   Ścieżka jest cache'owana per wróg i przeliczana co ok. 350 ms (z rozrzutem po id),
   a liczba wyszukiwań w jednej klatce jest ograniczona.
   ============================================================ */

const PF_KOMORKA = 20;
const PF_ODSWIEZANIE_MS = 350;
const PF_DLUGOSC_SPRAWDZANIA = 240;   // jak daleko przed sobą wróg sprawdza, czy ktoś zasłania drogę
const PF_MAX_WEZLOW = 1200;           // limit rozwinięć A* (zabezpieczenie wydajności)
const PF_MAX_KOMOREK = 9000;
const PF_MAX_WYSZUKIWAN_NA_KLATKE = 6;
const PF_PROMIEN_OSIAGNIECIA_PUNKTU = 8;

let pfOstatniCzas = -1;
let pfWyszukanWKlatce = 0;

/* Trasa zablokowana, jeśli któryś wróg (nie lżejszy od nas) leży na odcinku i jego okrąg
   kolizji (z dopuszczalnym nałożeniem) przecina prostą do gracza. */
function pfTrasaZablokowana(wrog, kx, ky, dlugosc) {
  const ri = promienKolizjiWroga(wrog);
  for (const j of wrogowie) {
    if (j === wrog || j.hp <= 0) continue;
    const rj = promienKolizjiWroga(j);
    if (rj * rj < ri * ri) continue;                       // lżejszych wróg po prostu przepycha
    const vx = j.x - wrog.x, vy = j.y - wrog.y;
    const t = vx * kx + vy * ky;
    if (t < 0 || t > dlugosc + rj) continue;
    const bok = Math.abs(vx * ky - vy * kx);
    if (bok < minDystansWrogow(ri, rj) - 2) return true;
  }
  return false;
}

/* Kopiec binarny (min) na indeksach komórek z priorytetem f. */
function pfKopiec() {
  const idx = [], f = [];
  return {
    get rozmiar() { return idx.length; },
    dodaj(i, p) {
      let k = idx.length;
      idx.push(i); f.push(p);
      while (k > 0) {
        const r = (k - 1) >> 1;
        if (f[r] <= f[k]) break;
        [idx[r], idx[k]] = [idx[k], idx[r]];
        [f[r], f[k]] = [f[k], f[r]];
        k = r;
      }
    },
    zdejmij() {
      const wynik = idx[0];
      const ostIdx = idx.pop(), ostF = f.pop();
      if (idx.length) {
        idx[0] = ostIdx; f[0] = ostF;
        let k = 0;
        for (;;) {
          const l = 2 * k + 1, r = l + 1;
          let m = k;
          if (l < idx.length && f[l] < f[m]) m = l;
          if (r < idx.length && f[r] < f[m]) m = r;
          if (m === k) break;
          [idx[m], idx[k]] = [idx[k], idx[m]];
          [f[m], f[k]] = [f[k], f[m]];
          k = m;
        }
      }
      return wynik;
    }
  };
}

/* A* od wroga do dowolnej komórki w zasięgu `zasieg` od gracza. Zwraca listę punktów świata lub null. */
function pfSzukaj(wrog, zasieg) {
  const C = PF_KOMORKA;
  const px = postac.x, py = postac.y;
  const margines = 90;
  const minX = Math.min(wrog.x, px) - margines, maxX = Math.max(wrog.x, px) + margines;
  const minY = Math.min(wrog.y, py) - margines, maxY = Math.max(wrog.y, py) + margines;
  const W = Math.ceil((maxX - minX) / C) + 1;
  const H = Math.ceil((maxY - minY) / C) + 1;
  if (W * H > PF_MAX_KOMOREK) return null;

  const ri = promienKolizjiWroga(wrog);
  const zablokowane = new Uint8Array(W * H);

  for (const j of wrogowie) {
    if (j === wrog || j.hp <= 0) continue;
    const rj = promienKolizjiWroga(j);
    if (rj * rj < ri * ri) continue;
    if (j.x < minX - 60 || j.x > maxX + 60 || j.y < minY - 60 || j.y > maxY + 60) continue;

    const r = minDystansWrogow(ri, rj) - 2;                 // dopuszczalne nałożenie 40% zostaje
    const cx0 = Math.max(0, Math.floor((j.x - r - minX) / C));
    const cx1 = Math.min(W - 1, Math.floor((j.x + r - minX) / C));
    const cy0 = Math.max(0, Math.floor((j.y - r - minY) / C));
    const cy1 = Math.min(H - 1, Math.floor((j.y + r - minY) / C));
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const sx = minX + (cx + 0.5) * C, sy = minY + (cy + 0.5) * C;
        if (Math.hypot(sx - j.x, sy - j.y) < r) zablokowane[cy * W + cx] = 1;
      }
    }
  }

  const komX = i => minX + ((i % W) + 0.5) * C;
  const komY = i => minY + (Math.floor(i / W) + 0.5) * C;

  const start = Math.min(H - 1, Math.max(0, Math.floor((wrog.y - minY) / C))) * W +
                Math.min(W - 1, Math.max(0, Math.floor((wrog.x - minX) / C)));
  zablokowane[start] = 0;                                   // stoimy tu, więc jest wolna

  const celZasieg = Math.max(zasieg * 0.9, 30);
  const h = i => Math.max(0, Math.hypot(komX(i) - px, komY(i) - py) - celZasieg);

  const g = new Float32Array(W * H).fill(Infinity);
  const rodzic = new Int32Array(W * H).fill(-1);
  const zamkniete = new Uint8Array(W * H);
  const kopiec = pfKopiec();
  g[start] = 0;
  kopiec.dodaj(start, h(start));

  let rozwiniecia = 0;
  let koniec = -1;
  const SASIEDZI = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.4142], [1, -1, 1.4142], [-1, 1, 1.4142], [-1, -1, 1.4142]];

  while (kopiec.rozmiar && rozwiniecia < PF_MAX_WEZLOW) {
    const cur = kopiec.zdejmij();
    if (zamkniete[cur]) continue;
    zamkniete[cur] = 1;
    rozwiniecia++;

    if (Math.hypot(komX(cur) - px, komY(cur) - py) <= celZasieg) { koniec = cur; break; }

    const cx = cur % W, cy = Math.floor(cur / W);
    for (const [dx, dy, koszt] of SASIEDZI) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const ni = ny * W + nx;
      if (zamkniete[ni] || zablokowane[ni]) continue;
      if (dx !== 0 && dy !== 0 && (zablokowane[cy * W + nx] || zablokowane[ny * W + cx])) continue;   // bez ścinania rogów
      const ng = g[cur] + koszt * C;
      if (ng < g[ni]) {
        g[ni] = ng;
        rodzic[ni] = cur;
        kopiec.dodaj(ni, ng + h(ni));
      }
    }
  }
  if (koniec < 0) return null;

  const sciezka = [];
  for (let i = koniec; i !== -1 && i !== start; i = rodzic[i]) sciezka.push(i);
  sciezka.reverse();
  if (!sciezka.length) return null;

  // wygładzenie: pomijamy punkty pośrednie, jeśli z poprzedniego punktu widać dalszy po wolnych komórkach
  const widac = (ax, ay, bx, by) => {
    const d = Math.hypot(bx - ax, by - ay);
    const n = Math.max(1, Math.ceil(d / (C / 2)));
    for (let s = 1; s <= n; s++) {
      const x = ax + (bx - ax) * s / n, y = ay + (by - ay) * s / n;
      const cx = Math.floor((x - minX) / C), cy = Math.floor((y - minY) / C);
      if (cx < 0 || cy < 0 || cx >= W || cy >= H || zablokowane[cy * W + cx]) return false;
    }
    return true;
  };
  const wynik = [];
  let ax = wrog.x, ay = wrog.y, i = 0;
  while (i < sciezka.length) {
    let dalej = i;
    for (let k = sciezka.length - 1; k > i; k--) {
      if (widac(ax, ay, komX(sciezka[k]), komY(sciezka[k]))) { dalej = k; break; }
    }
    ax = komX(sciezka[dalej]); ay = komY(sciezka[dalej]);
    wynik.push({ x: ax, y: ay });
    i = dalej + 1;
  }
  return wynik;
}

/* Wywoływane z aktualizujWroga zamiast ruchu prosto na gracza.
   (kx, ky) = jednostkowy kierunek prosto do gracza; zwraca kierunek ruchu {x, y}. */
function kierunekZOmijaniem(wrog, kx, ky, dystans, zasieg, teraz) {
  if (teraz !== pfOstatniCzas) { pfOstatniCzas = teraz; pfWyszukanWKlatce = 0; }

  if (teraz >= (wrog.pfNastepny || 0)) {
    if (pfWyszukanWKlatce >= PF_MAX_WYSZUKIWAN_NA_KLATKE) {
      wrog.pfNastepny = teraz + 30;                         // limit na klatkę: spróbuj za chwilę
    } else {
      wrog.pfNastepny = teraz + PF_ODSWIEZANIE_MS + (wrog.id % 8) * 25;
      const dlugosc = Math.min(PF_DLUGOSC_SPRAWDZANIA, dystans);
      if (pfTrasaZablokowana(wrog, kx, ky, dlugosc)) {
        pfWyszukanWKlatce++;
        wrog.pfSciezka = pfSzukaj(wrog, zasieg);
      } else {
        wrog.pfSciezka = null;
      }
    }
  }

  const sciezka = wrog.pfSciezka;
  if (sciezka && sciezka.length) {
    while (sciezka.length && Math.hypot(sciezka[0].x - wrog.x, sciezka[0].y - wrog.y) < PF_PROMIEN_OSIAGNIECIA_PUNKTU) sciezka.shift();
    if (sciezka.length) {
      const dx = sciezka[0].x - wrog.x, dy = sciezka[0].y - wrog.y;
      const d = Math.hypot(dx, dy) || 1;
      return { x: dx / d, y: dy / d };
    }
    wrog.pfSciezka = null;
  }
  return { x: kx, y: ky };
}
