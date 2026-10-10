/* ============================================================
   GENERATOR.JS
   Losowanie affixów/itemów, tworzenie planszy, obsługa tooltipa.
   ============================================================ */

function losujLiczbe(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function losujProcent() {
  return Math.random() * 100;
}

function znajdzAffix(nazwa) {
  return affixy.find(affix => affix.nazwa === nazwa);
}

function maksymalnaLiczbaAffixow(item) {
  if (item.nazwa === "strzala") return 3;
  if (item.nazwa === "strzaly") return 4;
  return 5;
}

const WARTOSCI_STARTOWE_AFFIXOW = {
  "Podstawowe obrażenia": 3000,
  "Podstawowe PŻ": 15000
};

const WYMUSZONE_AFFIXY_STARTOWE = {
  5: { nazwa: "Kradzież życia", wartosc: 10 }
};

/* Ulepszona strzała zamiast "Zwykła strzała" ma pasywkę "Elektryczna strzała". */
function nazwaAffixuZUlepszenia(itemId, nazwa) {
  if (Number(itemId) === ITEM_STRZALA && nazwa === "Zwykła strzała" &&
      typeof ulepszoneItemySet !== "undefined" && ulepszoneItemySet.has(ITEM_STRZALA)) {
    return "Elektryczna strzała";
  }
  return nazwa;
}

function generujAffixy(itemId, iloscAffixow = null, wymusWartosciStartowe = false) {
  const item = itemy[itemId];
  if (!item) return { affixy: [], pierwotny: false };

  const staleAffixy = Array.isArray(item.staleAffixy)
    ? item.staleAffixy
    : (item.stalyAffix ? [item.stalyAffix] : []);

  // Itemy startowe (wymusWartosciStartowe = true) nigdy nie są pierwotne.
  const itemPierwotny = !wymusWartosciStartowe && Math.random() < SZANSA_PIERWOTNY;
  const wynik = [];

  const liczbaAffixow = iloscAffixow !== null
    ? Math.min(iloscAffixow, maksymalnaLiczbaAffixow(item))
    : maksymalnaLiczbaAffixow(item);

  for (const nazwaStalegoAffixu of staleAffixy) {
    if (wynik.length >= liczbaAffixow) break;
    const definicja = znajdzAffix(nazwaAffixuZUlepszenia(itemId, nazwaStalegoAffixu));
    if (!definicja) continue;

    let wartosc;
    if (wymusWartosciStartowe && wynik.length === 0 && WARTOSCI_STARTOWE_AFFIXOW[definicja.nazwa] !== undefined) {
      wartosc = WARTOSCI_STARTOWE_AFFIXOW[definicja.nazwa];
    } else {
      wartosc = itemPierwotny ? definicja.max : losujLiczbe(definicja.min, definicja.max);
    }

    wynik.push({
      nazwa: definicja.nazwa,
      wartosc,
      suffix: definicja.suffix || "",
      pasywka: !!definicja.pasywka,
      opis: definicja.opis || "",
      ulepszenie: !!definicja.ulepszenie
    });
  }

  const wymuszony = WYMUSZONE_AFFIXY_STARTOWE[itemId];
  if (wymusWartosciStartowe && wymuszony && wynik.length < liczbaAffixow) {
    const definicja = znajdzAffix(wymuszony.nazwa);
    if (definicja) {
      wynik.push({
        nazwa: definicja.nazwa,
        wartosc: wymuszony.wartosc,
        suffix: definicja.suffix || "",
        pasywka: !!definicja.pasywka,
        opis: definicja.opis || "",
        ulepszenie: !!definicja.ulepszenie
      });
    }
  }

  let dostepne = item.mozliweAffixy
    .map(nazwa => znajdzAffix(nazwa))
    .filter(Boolean)
    .filter(affix => !staleAffixy.includes(affix.nazwa))
    .filter(affix => !wynik.some(w => w.nazwa === affix.nazwa));

  while (wynik.length < liczbaAffixow && dostepne.length > 0) {
    const indeks = losujLiczbe(0, dostepne.length - 1);
    const wybrany = dostepne[indeks];

    wynik.push({
      nazwa: wybrany.nazwa,
      wartosc: itemPierwotny ? wybrany.max : losujLiczbe(wybrany.min, wybrany.max),
      suffix: wybrany.suffix || "",
      pasywka: !!wybrany.pasywka,
      opis: wybrany.opis || "",
      ulepszenie: !!wybrany.ulepszenie
    });

    dostepne.splice(indeks, 1);
  }

  return { affixy: wynik, pierwotny: itemPierwotny };
}

function dodajJedenNowyAffix(gracz, itemId) {
  const item = itemy[itemId];
  if (!item) return false;

  const obecne = stan[gracz].wylosowane[itemId];
  if (!obecne) return false;
  if (obecne.length >= maksymalnaLiczbaAffixow(item)) return false;

  const uzywaneNazwy = new Set(obecne.map(a => a.nazwa));
  const staleAffixy = Array.isArray(item.staleAffixy) ? item.staleAffixy : (item.stalyAffix ? [item.stalyAffix] : []);

  let wybranaDefinicja = null;
  for (const nazwaStalegoAffixu of staleAffixy) {
    const nazwaDocelowa = nazwaAffixuZUlepszenia(itemId, nazwaStalegoAffixu);
    if (!uzywaneNazwy.has(nazwaDocelowa)) {
      wybranaDefinicja = znajdzAffix(nazwaDocelowa);
      break;
    }
  }

  if (!wybranaDefinicja) {
    const dostepne = item.mozliweAffixy
      .map(nazwa => znajdzAffix(nazwa))
      .filter(Boolean)
      .filter(affix => !uzywaneNazwy.has(affix.nazwa));

    if (dostepne.length === 0) return false;
    wybranaDefinicja = dostepne[losujLiczbe(0, dostepne.length - 1)];
  }

  const pierwotny = !!stan[gracz].pierwotne[itemId];
  obecne.push({
    nazwa: wybranaDefinicja.nazwa,
    wartosc: pierwotny ? wybranaDefinicja.max : losujLiczbe(wybranaDefinicja.min, wybranaDefinicja.max),
    suffix: wybranaDefinicja.suffix || "",
    pasywka: !!wybranaDefinicja.pasywka,
    opis: wybranaDefinicja.opis || "",
    ulepszenie: !!wybranaDefinicja.ulepszenie
  });

  obliczStatystyki(gracz);
  odswiezBadgePierwotny(gracz, itemId);
  return true;
}

function losujItem(gracz, itemId, pokazPodglad = true, iloscAffixow = null, wymusWartosciStartowe = false) {
  const { affixy: wynik, pierwotny } = generujAffixy(itemId, iloscAffixow, wymusWartosciStartowe);
  if (!wynik.length) return;

  stan[gracz].wylosowane[itemId] = wynik;
  stan[gracz].pierwotne[itemId] = pierwotny;

  obliczStatystyki(gracz);
  if (pokazPodglad) pokazTooltip(gracz, itemId);
  odswiezBadgePierwotny(gracz, itemId);
}

function losujWszystkie(gracz) {
  ukryjTooltip();
  Object.keys(itemy).forEach(itemId => losujItem(gracz, itemId, false));
}

function utworzItemy(gracz) {
  const plansza = document.getElementById(`plansza-${gracz}`);
  plansza.innerHTML = "";

  Object.entries(itemy).forEach(([itemId, item]) => {
    const id = Number(itemId);
    const odblokowany = !stan[gracz].odblokowaneItemy || stan[gracz].odblokowaneItemy.has(id);

    const itemElement = document.createElement("div");
    let klasaItemu = "item" + (odblokowany ? "" : " zablokowany");
    if (typeof ulepszoneItemySet !== "undefined" && ulepszoneItemySet.has(id)) {
      klasaItemu += " ulepszony";
    }
    itemElement.className = klasaItemu;
    itemElement.id = `item-${gracz}-${itemId}`;
    itemElement.dataset.itemId = itemId;

    itemElement.style.gridColumn = item.pozycja.kolumna;
    itemElement.style.gridRow = item.pozycja.wiersz;

    const opisBlokady = (!odblokowany && typeof opisWymoguOdblokowania === "function") ? opisWymoguOdblokowania(id) : "";
    const naklejkaBlokady = odblokowany ? "" : `<div class="item-blokada">🔒<br>${opisBlokady}</div>`;
    const przyciskHtml = odblokowany ? `<button class="btn btn-item" type="button" data-gracz="${gracz}" data-item-id="${itemId}">🎲 LOSUJ</button>` : "";

    itemElement.innerHTML = `
      <img src="${item.obraz}" alt="${item.nazwa}">
      <div class="item-nazwa">${item.nazwa}</div>
      ${naklejkaBlokady}
      ${przyciskHtml}
    `;

    plansza.appendChild(itemElement);

    if (!odblokowany) return;
    if (stan[gracz].wylosowane[id]) odswiezBadgePierwotny(gracz, id);

    itemElement.addEventListener("mouseenter", () => {
      if (!stan[gracz].wylosowane[id] && !TRYB_SURVIVOR) {
        const iloscAffixow = (TRYB_SURVIVOR && typeof iloscOdblokowanychAffixowDlaItemu === "function") ? iloscOdblokowanychAffixowDlaItemu(id) : null;
        losujItem(gracz, id, false, iloscAffixow, false);
      }
      pokazTooltip(gracz, id);
    });

    itemElement.addEventListener("mousemove", event => przesunTooltip(event));
    itemElement.addEventListener("mouseleave", () => ukryjTooltip());

    const przycisk = itemElement.querySelector(".btn-item");
    przycisk.addEventListener("click", event => {
      event.stopPropagation();
      if (TRYB_SURVIVOR) {
        if (stan[gracz].zmianki <= 0) {
          if (typeof pokazBrakZmianek === "function") pokazBrakZmianek();
          return;
        }
        stan[gracz].zmianki -= 1;
        if (typeof aktualizujZmianki === "function") aktualizujZmianki();
      }

      const iloscAffixow = (TRYB_SURVIVOR && typeof iloscOdblokowanychAffixowDlaItemu === "function") ? iloscOdblokowanychAffixowDlaItemu(id) : null;
      losujItem(gracz, id, true, iloscAffixow, false);
    });
  });
}

function odswiezBadgePierwotny(gracz, itemId) {
  const kafelek = document.getElementById(`item-${gracz}-${itemId}`);
  if (kafelek) kafelek.classList.toggle("primal", !!stan[gracz].pierwotne[itemId]);
}

function pokazTooltip(gracz, itemId) {
  const item = itemy[itemId];
  const affixyItemu = stan[gracz].wylosowane[itemId] || (TRYB_SURVIVOR ? [] : null);
  if (!item || !affixyItemu) return;

  tooltipItem.src = item.obraz;
  tooltipItem.alt = item.nazwa;

  const pierwotny = stan[gracz].pierwotne[itemId];
  const tloAffixow = tooltip.querySelector(".tooltip-affix");

  tooltip.classList.toggle("tooltip-strzaly", item.nazwa === "strzaly");
  tloAffixow.style.backgroundImage = pierwotny ? 'url("affix-background2.png")' : 'url("affix-background.png")';
  tooltipItem.classList.toggle("primal", !!pierwotny);
  tloAffixow.classList.toggle("primal", !!pierwotny);

  tooltipAffixList.innerHTML = "";

  /* =========================================
     AFFIX Z ULEPSZENIA (system Arcybossów)
     Przechowywany OSOBNO od affixyItemu (stan[gracz].ulepszeniaAffixy),
     więc reroll (LOSUJ) nigdy go nie kasuje. Renderowany ZAWSZE nad
     pięcioma normalnymi slotami — nie liczy się do ich limitu i nie
     przesuwa ich w dół.
     ========================================= */

  const ulepszenieAffix = stan[gracz].ulepszeniaAffixy && stan[gracz].ulepszeniaAffixy[itemId];

  if (ulepszenieAffix) {
    const zuzyte = ulepszenieAffix.nazwa === "Wskrzeszenie" &&
      typeof wykorzystaneWskrzeszenie !== "undefined" && wykorzystaneWskrzeszenie;

    const blok = document.createElement("div");
    blok.className = `tooltip-ulepszenie-blok${zuzyte ? " zuzyte" : ""}`;
    blok.textContent = ulepszenieAffix.tekst || ulepszenieAffix.nazwa;

    tooltipAffixList.appendChild(blok);
  }

  affixyItemu.forEach(affix => {
    const definicja = znajdzAffix(affix.nazwa);
    const czyMax = definicja && affix.wartosc === definicja.max;
    const div = document.createElement("div");

    const klasaUlepszenia = affix.ulepszenie ? " affix-ulepszenie" : "";

    if (affix.pasywka) {
      div.className = `affix affix-pasywka${klasaUlepszenia}`;
      const zakres = definicja ? `${definicja.min}–${definicja.max}${definicja.suffix || ""}` : "";
      const wartoscHtml = `
        <span class="${czyMax ? "pasywka-wartosc-max" : "pasywka-wartosc"}">
          ${affix.wartosc}${affix.suffix}
        </span>
        <span class="pasywka-zakres">(${zakres})</span>
      `;
      const opis = (affix.opis || "").replace("{x}", wartoscHtml);
      div.innerHTML = `
        <div class="affix-pasywka-nazwa">${affix.nazwa}</div>
        <div class="affix-pasywka-opis">${opis}</div>
      `;
    } else {
      div.className = `affix${klasaUlepszenia}`;
      const zakres = definicja ? `${definicja.min}–${definicja.max}` : "";
      div.innerHTML = `
        <span class="affix-name">
          <span>${affix.nazwa}</span>
          <span class="affix-range">(${zakres})</span>
        </span>
        <span class="affix-value ${czyMax ? "max-value" : ""}">
          ${affix.wartosc}${affix.suffix}
        </span>
      `;
    }
    tooltipAffixList.appendChild(div);
  });

  const maxAffixow = maksymalnaLiczbaAffixow(item);
  const odblokowaneSlotyItemu = (TRYB_SURVIVOR && typeof iloscOdblokowanychAffixowDlaItemu === "function") ? iloscOdblokowanychAffixowDlaItemu(itemId) : 0;

  for (let i = affixyItemu.length; i < maxAffixow; i++) {
    const div = document.createElement("div");
    div.className = "affix affix-zablokowany";
    const pusty = affixyItemu.length === 0 && i < odblokowaneSlotyItemu;
    div.innerHTML = `<span class="affix-name-zablokowany">${pusty ? "[Użyj Zmianki, aby wylosować]" : "[Zablokowany]"}</span>`;
    tooltipAffixList.appendChild(div);
  }

  tooltip.classList.add("visible");
}

function ukryjTooltip() {
  tooltip.classList.remove("visible");
}

let skalaUi = 1;

function przesunTooltip(event) {
  if (!tooltip.classList.contains("visible")) return;
  const szerokosc = 401 * skalaUi;
  const wysokosc = tooltip.offsetHeight * skalaUi;
  const odstep = 18;

  let left = event.clientX + odstep;
  let top = event.clientY + odstep;

  if (left + szerokosc > window.innerWidth) left = event.clientX - szerokosc - odstep;
  if (top + wysokosc > window.innerHeight) top = event.clientY - wysokosc - odstep;
  if (left < 0) left = 0;
  if (top < 0) top = 0;

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}