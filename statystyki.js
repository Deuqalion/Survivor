/* ============================================================
   STATYSTYKI.JS
   Przeliczanie affixów na statystyki bojowe, porównanie graczy,
   paski PŻ i statusy.
   ============================================================ */

    /* ============================================================
       STATYSTYKI GRACZA (suma affixów -> wartości bojowe)
       ============================================================ */

    function obliczStatystyki(gracz) {

      const suma = {};

      Object.values(stan[gracz].wylosowane).forEach(affixyItemu => {
        affixyItemu.forEach(affix => {
          if (!suma[affix.nazwa]) suma[affix.nazwa] = 0;
          suma[affix.nazwa] += affix.wartosc;
        });
      });

      const podstawoweObrazenia = suma["Podstawowe obrażenia"] || 0;
const wartoscAtaku = suma["Wartość ataku"] || 0;
const obrazeniaUmiejetnosci = suma["Obrażenia umiejętności"] || 0;

const staty = {
  // PŻ bazowe + dodatkowe
  pz: (
    (suma["Podstawowe PŻ"] || 0) +
    (suma["Dodatkowe PŻ"] || 0)
  ) * (
    1 + (suma["Wzmocnienie PŻ"] || 0) / 100
  ),

  // Pancerz z uwzględnieniem Wzmocnienia Pancerza
  pancerz: (
    suma["Pancerz"] || 0
  ) * (
    1 + (suma["Wzmocnienie Pancerza"] || 0) / 100
  ),

  podstawoweObrazenia: podstawoweObrazenia,
  wartoscAtaku: wartoscAtaku,
  obrazeniaUmiejetnosci: obrazeniaUmiejetnosci,

  bazoweObrazenia: podstawoweObrazenia + wartoscAtaku,

  kryt: suma["Szansa na kryta"] || 0,
  przeszywka: suma["Szansa na przeszywkę"] || 0,
  omdlenie: suma["Szansa na omdlenie"] || 0,
  otrucie: suma["Szansa na otrucie"] || 0,
  krwawienie: suma["Szansa na krwawienie"] || 0,
  blok: suma["Szansa na blok"] || 0,
  kradziezZycia: suma["Kradzież życia"] || 0,

  // NOWE AFFIXY
  wzmocnieniePz: suma["Wzmocnienie PŻ"] || 0,
  wzmocnieniePancerza: suma["Wzmocnienie Pancerza"] || 0,
  obrazeniaTrucizny: suma["Wzmocnienie trucizny"] || 0,
  obrazeniaKrwawienia: suma["Wzmocnienie krwawienia"] || 0,
  obrazeniaKrytyczne: suma["Wzmocnienie krytyczne"] || 0,

  // Prędkość ataku
predkoscAtaku: suma["Prędkość ataku"] || 0,

// Pasywki strzały
zwyklaStrzala: suma["Zwykła strzała"] || 0,
ognistaStrzala: suma["Ognista strzała"] || 0,
elektrycznaStrzala: suma["Elektryczna strzała"] || 0,
diamentowaStrzala: suma["Diamentowa strzała"] || 0
};
      stan[gracz].staty = staty;

      if (!walkaTrwa) {
        stan[gracz].hp = staty.pz;
      }

      renderujPorownanie();
aktualizujPaskiHp();

/* Hak dla innych trybów gry (np. survivor.html) — jeśli taka funkcja
   istnieje na danej stronie, dostaje znać o przeliczeniu statystyk. */
if (typeof aktualizujHudPostaci === "function") aktualizujHudPostaci(gracz);
    }

    function renderujPorownanie() {

  const kontener = document.getElementById("porownanie-staty");
  if (!kontener) return;

  const staty1 = stan[1].staty || {};
  const staty2 = stan[2].staty || {};

  const formatLiczby = wartosc =>
    Math.round(wartosc || 0).toLocaleString("pl-PL");

  const formatProcent = wartosc =>
    `${(wartosc || 0).toFixed(1)}%`;

  const wiersze = [

    {
      nazwa: "Całkowite PŻ",
      lewa: formatLiczby(staty1.pz),
      prawa: formatLiczby(staty2.pz),
      glowna: true
    },

    {
      nazwa: "Całkowite obrażenia",
      lewa: formatLiczby(staty1.bazoweObrazenia),
      prawa: formatLiczby(staty2.bazoweObrazenia),
      glowna: true
    },

    {
      nazwa: "Pancerz",
      lewa: formatLiczby(staty1.pancerz),
      prawa: formatLiczby(staty2.pancerz)
    },

    {
      nazwa: "Szansa kryt",
      lewa: formatProcent(staty1.kryt),
      prawa: formatProcent(staty2.kryt)
    },

    {
      nazwa: "Szansa przeszywka",
      lewa: formatProcent(staty1.przeszywka),
      prawa: formatProcent(staty2.przeszywka)
    },

    {
      nazwa: "Szansa omdlenie",
      lewa: formatProcent(staty1.omdlenie),
      prawa: formatProcent(staty2.omdlenie)
    },

    {
      nazwa: "Szansa otrucie",
      lewa: formatProcent(staty1.otrucie),
      prawa: formatProcent(staty2.otrucie)
    },

    {
      nazwa: "Szansa krwawienie",
      lewa: formatProcent(staty1.krwawienie),
      prawa: formatProcent(staty2.krwawienie)
    },

    {
      nazwa: "Szansa na blok",
      lewa: formatProcent(staty1.blok),
      prawa: formatProcent(staty2.blok)
    },

    {
      nazwa: "Kradzież życia",
      lewa: formatProcent(staty1.kradziezZycia),
      prawa: formatProcent(staty2.kradziezZycia)
    },


    {
      nazwa: "Obr. umiejętności",
      lewa: formatProcent(staty1.obrazeniaUmiejetnosci),
      prawa: formatProcent(staty2.obrazeniaUmiejetnosci)
    },
{
  nazwa: "Wzmocnienie PŻ",
  lewa: formatProcent(staty1.wzmocnieniePz),
  prawa: formatProcent(staty2.wzmocnieniePz)
},

{
  nazwa: "Wzmoc. Pancerza",
  lewa: formatProcent(staty1.wzmocnieniePancerza),
  prawa: formatProcent(staty2.wzmocnieniePancerza)
},

{
  nazwa: "Wzmoc. trucizny",
  lewa: formatProcent(staty1.obrazeniaTrucizny),
  prawa: formatProcent(staty2.obrazeniaTrucizny)
},

{
  nazwa: "Wzmoc. krwawienia",
  lewa: formatProcent(staty1.obrazeniaKrwawienia),
  prawa: formatProcent(staty2.obrazeniaKrwawienia)
},

{
  nazwa: "Wzmoc. krytyczne",
  lewa: formatProcent(staty1.obrazeniaKrytyczne),
  prawa: formatProcent(staty2.obrazeniaKrytyczne)
}

  ];

  kontener.innerHTML = wiersze.map(wiersz => `
    <div class="porownanie-wiersz ${wiersz.glowna ? "glowna" : ""}">

      <span class="porownanie-lewa">
        ${wiersz.lewa}
      </span>

      <span class="porownanie-nazwa">
        ${wiersz.nazwa}
      </span>

      <span class="porownanie-prawa">
        ${wiersz.prawa}
      </span>

    </div>
  `).join("");
}

    /* ============================================================
       PASKI PŻ
       ============================================================ */

    function aktualizujPaskiHp() {
      [1, 2].forEach(gracz => {
        const staty = stan[gracz].staty;
        const maxHp = staty ? staty.pz : 0;
        const hp = Math.max(0, stan[gracz].hp);
        const procent = maxHp > 0 ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : 0;

        const fill = document.getElementById(`hp-fill-${gracz}`);
        const tekst = document.getElementById(`hp-tekst-${gracz}`);
        if (!fill || !tekst) return;

        fill.style.width = `${procent}%`;
        tekst.textContent =
          `${Math.round(hp).toLocaleString("pl-PL")} / ${Math.round(maxHp).toLocaleString("pl-PL")}`;
      });
      
    }
    function aktualizujStatusy() {
  [1, 2].forEach(gracz => {
    const status = document.getElementById(`status-${gracz}`);
    if (!status) return;

    const efekty = [];

    if (stan[gracz].zatruteAtaki > 0) {
      efekty.push(
        `<span class="status-efekt">☠️ (${stan[gracz].zatruteAtaki})</span>`
      );
    }

    if (stan[gracz].krwawienieTury > 0) {
      efekty.push(
        `<span class="status-efekt">🩸 (${stan[gracz].krwawienieTury})</span>`
      );
    }

    status.innerHTML = efekty.join("");
  });
}
