/* ============================================================
   SLOT ANIMATION — Animation "pompe à essence" des jackpots
   Chaque chiffre se déroule vers le haut comme un compteur mécanique
   quand la valeur augmente, vers le bas quand elle diminue.
   ============================================================ */

(function() {
  'use strict';

  const ROLL_DURATION = 1100; // ms par chiffre
  const STAGGER = 120;        // ms de décalage entre les chiffres (de droite à gauche)

  // Formater une valeur numérique en chaîne affichable
  function fmtVal(v) {
    return Number(v).toFixed(2);
  }

  // Initialise un élément en conteneur slot
  function initSlotEl(el) {
    if (el.dataset.slotReady) return;
    buildSlot(el, el.textContent.trim());
  }

  // Construit les spans digit pour une valeur donnée
  function buildSlot(el, valueStr) {
    el.innerHTML = '';
    el.dataset.slotReady = '1';
    el.dataset.slotVal = valueStr;
    const wrap = document.createElement('span');
    wrap.className = 'jp-slot';

    for (const ch of valueStr) {
      if (/\d/.test(ch)) {
        const digit = document.createElement('span');
        digit.className = 'jp-digit';
        digit.dataset.char = ch;

        const reel = document.createElement('span');
        reel.className = 'jp-digit-reel';
        reel.innerHTML = `<span>${ch}</span>`;
        digit.appendChild(reel);
        wrap.appendChild(digit);
      } else {
        // Point décimal, espace, virgule — static
        const sep = document.createElement('span');
        sep.className = 'jp-sep';
        sep.textContent = ch;
        sep.style.cssText = 'display:inline-block;line-height:inherit;vertical-align:bottom;';
        wrap.appendChild(sep);
      }
    }

    el.appendChild(wrap);
  }

  // Anime la transition d'une valeur à une autre
  function animateSlot(el, newValueStr) {
    if (!el.dataset.slotReady) {
      buildSlot(el, newValueStr);
      el.dataset.slotReady = '1';
      el.dataset.slotVal = newValueStr;
      return;
    }

    const oldStr = el.dataset.slotVal || '';
    el.dataset.slotVal = newValueStr;

    // Si longueur différente : reconstruction + on met à jour slotVal
    // pour que la prochaine animation parte du bon état
    if (oldStr.length !== newValueStr.length) {
      buildSlot(el, newValueStr);
      el.dataset.slotVal = newValueStr;
      return;
    }

    // Trouver les chiffres à animer
    const digitEls = el.querySelectorAll('.jp-digit');
    const digitsToAnimate = [];

    for (let i = 0; i < newValueStr.length; i++) {
      const newCh = newValueStr[i];
      const oldCh = oldStr[i];
      if (/\d/.test(newCh) && /\d/.test(oldCh) && newCh !== oldCh) {
        digitsToAnimate.push({ el: digitEls[countDigitsBefore(newValueStr, i)], oldCh, newCh });
      } else if (/\d/.test(newCh)) {
        const dEl = digitEls[countDigitsBefore(newValueStr, i)];
        if (dEl) dEl.dataset.char = newCh;
      }
    }

    if (!digitsToAnimate.length) return;

    // Déterminer la direction globale (hausse = monte, baisse = descend)
    const oldNum = parseFloat(oldStr) || 0;
    const newNum = parseFloat(newValueStr) || 0;
    const goingUp = newNum >= oldNum;

    // Animer de droite à gauche (chiffre des unités en premier)
    digitsToAnimate.reverse().forEach(({ el: dEl, oldCh, newCh }, idx) => {
      if (!dEl) return;
      setTimeout(() => rollDigit(dEl, oldCh, newCh, goingUp), idx * STAGGER);
    });
  }

  // Compte combien de chiffres (pas séparateurs) apparaissent avant position i
  function countDigitsBefore(str, pos) {
    let count = 0;
    for (let i = 0; i < pos; i++) {
      if (/\d/.test(str[i])) count++;
    }
    return count;
  }

  // Animation d'un seul chiffre
  function rollDigit(digitEl, oldCh, newCh, goingUp) {
    const reel = digitEl.querySelector('.jp-digit-reel');
    if (!reel) return;

    digitEl.dataset.char = newCh;

    // Construire le reel : oldCh au-dessus, newCh en dessous (si goingUp)
    // ou newCh au-dessus, oldCh en dessous (si goingDown)
    reel.style.transition = 'none';

    if (goingUp) {
      reel.innerHTML = `<span>${oldCh}</span><span>${newCh}</span>`;
      reel.style.transform = 'translateY(0)';
    } else {
      reel.innerHTML = `<span>${newCh}</span><span>${oldCh}</span>`;
      reel.style.transform = 'translateY(-50%)';
    }

    // Forcer le reflow
    void reel.offsetHeight;

    // Lancer l'animation
    reel.style.transition = `transform ${ROLL_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    reel.style.transform = goingUp ? 'translateY(-50%)' : 'translateY(0)';

    // Nettoyer après animation
    setTimeout(() => {
      reel.innerHTML = `<span>${newCh}</span>`;
      reel.style.transition = 'none';
      reel.style.transform = 'translateY(0)';
    }, ROLL_DURATION + 150);
  }

  // Patch de updateJackpotDisplays pour intercepter les mises à jour
  function patchJackpotDisplays() {
    // Attendre que les éléments soient disponibles
    const ids = ['argentJackpotValue', 'orJackpotValue', 'diamantJackpotValue'];
    const els = ids.map(id => document.getElementById(id)).filter(Boolean);

    if (!els.length) {
      setTimeout(patchJackpotDisplays, 200);
      return;
    }

    // Initialiser chaque élément
    els.forEach(el => initSlotEl(el));

    // Observer les changements de contenu via MutationObserver
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        const target = mutation.target;
        if (!target.dataset.slotReady) return;

        // Récupérer la nouvelle valeur brute (textContent après mutation)
        const newText = target.textContent.replace(/[^\d.]/g, '');
        const newVal = parseFloat(newText);
        if (isNaN(newVal)) return;

        const newStr = newVal.toFixed(2);
        if (newStr === target.dataset.slotVal) return;

        // Remettre l'ancien contenu pour que l'animation parte du bon état
        const oldStr = target.dataset.slotVal;
        if (oldStr) buildSlot(target, oldStr);

        // Lancer l'animation vers la nouvelle valeur
        requestAnimationFrame(() => animateSlot(target, newStr));
      });
    });

    els.forEach(el => {
      observer.observe(el, { childList: true, characterData: true, subtree: true });
    });

    // Patch pour les valeurs du splash aussi
    const splashIds = ['splashJpArgent', 'splashJpOr', 'splashJpDiamant'];
    splashIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) initSlotEl(el);
    });
  }

  // Démarrer après le chargement
  if (document.readyState === 'complete') {
    patchJackpotDisplays();
  } else {
    window.addEventListener('load', patchJackpotDisplays);
  }

})();
