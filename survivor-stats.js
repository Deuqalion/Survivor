/* ============================================================
   SURVIVOR-STATS.JS
   Panel podsumowania WSZYSTKICH statystyk affixów gracza,
   wyświetlany pod ekwipunkiem w trybie Survivor.
   ============================================================ */

function renderujStatyGracza() {

  const kontener = document.getElementById("staty-gracza");
  if (!kontener) return;

  const s = stan[1].staty || {};

  const fmtL = wartosc => Math.round(wartosc || 0).toLocaleString("pl-PL");
  const fmtP = wartosc => `${(wartosc || 0).toFixed(1)}%`;

  const wiersze = [
    { nazwa: "Całkowite PŻ", wartosc: fmtL(s.pz), glowna: true },
    { nazwa: "Całkowite obrażenia", wartosc: fmtL((s.bazoweObrazenia || 0) + (typeof bonusObrazenZZabojstw === "function" ? bonusObrazenZZabojstw() : 0)), glowna: true },
    { nazwa: "Obrażenia umiejętności", wartosc: fmtP(s.obrazeniaUmiejetnosci) },
    { nazwa: "Pancerz", wartosc: fmtL(s.pancerz) },
    { nazwa: "Szansa kryt", wartosc: fmtP(s.kryt) },
    { nazwa: "Szansa przeszywka", wartosc: fmtP(s.przeszywka) },
    { nazwa: "Szansa omdlenie", wartosc: fmtP(s.omdlenie) },
    { nazwa: "Szansa otrucie", wartosc: fmtP(s.otrucie) },
    { nazwa: "Szansa krwawienie", wartosc: fmtP(s.krwawienie) },
    { nazwa: "Szansa na blok", wartosc: fmtP(s.blok) },
    { nazwa: "Kradzież życia", wartosc: fmtP(s.kradziezZycia) },
    { nazwa: "Wzmoc. PŻ", wartosc: fmtP(s.wzmocnieniePz) },
    { nazwa: "Wzmoc. Pancerza", wartosc: fmtP(s.wzmocnieniePancerza) },
    { nazwa: "Wzmoc. trucizny", wartosc: fmtP(s.obrazeniaTrucizny) },
    { nazwa: "Wzmoc. krwawienia", wartosc: fmtP(s.obrazeniaKrwawienia) },
    { nazwa: "Wzmoc. krytyczne", wartosc: fmtP(s.obrazeniaKrytyczne) }
  ];

  kontener.innerHTML =
    wiersze.map(w => `
      <div class="staty-wiersz ${w.glowna ? "glowna" : ""}">
        <span class="staty-nazwa">${w.nazwa}</span>
        <span class="staty-wartosc">${w.wartosc}</span>
      </div>
    `).join("");
}