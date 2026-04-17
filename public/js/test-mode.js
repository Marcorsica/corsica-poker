(function initExtremeCasesPanel(global) {
  const ENABLE_EXTREME_CASES_PANEL = true;
  const TEST_CODE = '1969';
  let casesCache = [];
  let pendingCaseId = null;
  let panelBuilt = false;
  let hoverCloseTimer = null;
  let isPinnedOpen = false;
  let testUnlocked = false;

  function consumePendingExtremeCaseId() {
    const id = pendingCaseId;
    pendingCaseId = null;
    return id;
  }

  async function fetchExtremeCases() {
    if (casesCache.length) return casesCache;
    const res = await fetch('/test/extreme-cases');
    if (!res.ok) throw new Error('Impossible de charger les cas extrêmes');
    const data = await res.json();
    casesCache = Array.isArray(data.cases) ? data.cases : [];
    return casesCache;
  }

  function phaseSummary(entry) {
    const pre = entry?.phases?.pre?.tier ? `préflop ${String(entry.phases.pre.tier).toUpperCase()}` : null;
    const flopTier = entry?.phases?.flop?.tier ? `flop ${String(entry.phases.flop.tier).toUpperCase()}` : null;
    const flopOddsOnly = !flopTier && Number(entry?.phases?.flop?.rawOdds || 0) > 0
      ? `flop cote ${Number(entry.phases.flop.rawOdds).toFixed(2)}`
      : null;
    return [pre, flopTier || flopOddsOnly].filter(Boolean).join(' → ');
  }

  function targetSummary(entry) {
    const target = entry?.target;
    if (!target) return '';
    if (target.kind === 'tie') return 'Égalité';
    return target.label || `Main ${Number(target.index || 0) + 1}`;
  }

  function isGameplayScreen() {
    return !!(document.body && document.body.classList.contains('gameplay-screen'));
  }

  function syncDockVisibility(root) {
    if (!root) return;
    root.style.display = isGameplayScreen() ? 'flex' : 'none';
  }

  function createRoot() {
    const root = document.createElement('div');
    root.id = 'extremeCasesDock';
    root.style.position = 'fixed';
    root.style.right = '16px';
    root.style.top = '12px';
    root.style.transform = 'none';
    root.style.zIndex = '2100';
    root.style.display = 'none';
    root.style.flexDirection = 'column';
    root.style.alignItems = 'flex-end';
    root.style.gap = '10px';
    root.style.pointerEvents = 'none';
    root.style.width = 'auto';
    document.body.appendChild(root);
    return root;
  }

  function createToggleButton(root) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'extremeCasesToggleBtn';
    btn.textContent = '🧪 Test';
    btn.style.position = 'absolute';
    btn.style.top = '12px';
    btn.style.right = '64px';
    btn.style.height = '42px';
    btn.className = 'pill';
    btn.style.cursor = 'pointer';
    btn.style.pointerEvents = 'auto';
    btn.style.borderRadius = '999px';
    btn.style.padding = '10px 14px';
    btn.style.fontWeight = '700';
    btn.style.boxShadow = '0 10px 24px rgba(0,0,0,0.28)';
    root.appendChild(btn);
    return btn;
  }

  function setPanelOpen(panel, open) {
    if (open) {
      panel.style.display = 'block';
      requestAnimationFrame(() => {
        panel.style.opacity = '1';
        panel.style.transform = 'translateY(0) scale(1)';
        panel.style.pointerEvents = 'auto';
      });
      return;
    }

    panel.style.opacity = '0';
    panel.style.transform = 'translateY(8px) scale(0.98)';
    panel.style.pointerEvents = 'none';
    setTimeout(() => {
      if (panel.style.pointerEvents === 'none') {
        panel.style.display = 'none';
      }
    }, 170);
  }

  function scheduleClose(panel) {
    if (hoverCloseTimer) clearTimeout(hoverCloseTimer);
    hoverCloseTimer = setTimeout(() => {
      if (!isPinnedOpen) setPanelOpen(panel, false);
    }, 120);
  }

  function showLockedState(panel, intro, listWrap, lockBtn) {
    if (intro) intro.textContent = 'Clique sur Test, saisis le code à 4 chiffres, puis choisis un cas préchargé.';
    if (listWrap) listWrap.style.display = 'none';
    if (lockBtn) lockBtn.style.display = 'none';
    setPanelOpen(panel, false);
    isPinnedOpen = false;
  }

  function showUnlockedState(panel, intro, listWrap, lockBtn) {
    if (intro) intro.textContent = 'Mode test déverrouillé. Choisis un cas préchargé puis joue la manche normalement.';
    if (listWrap) listWrap.style.display = 'grid';
    if (lockBtn) lockBtn.style.display = 'inline-flex';
    setPanelOpen(panel, true);
  }

  function askTestCode() {
    const code = window.prompt('Code accès test :');
    if (code === null) return false;
    if (String(code).trim() === TEST_CODE) {
      testUnlocked = true;
      return true;
    }
    window.alert('Code incorrect');
    return false;
  }

  function createPanel(root, casesList) {
    const panel = document.createElement('div');
    panel.id = 'extremeCasesPanel';
    panel.style.width = '360px';
    panel.style.marginBottom = '0';
    panel.style.maxHeight = '55vh';
    panel.style.overflow = 'auto';
    panel.style.background = 'rgba(10, 18, 24, 0.96)';
    panel.style.border = '1px solid rgba(255,255,255,0.14)';
    panel.style.borderRadius = '16px';
    panel.style.padding = '12px';
    panel.style.boxShadow = '0 16px 40px rgba(0,0,0,0.35)';
    panel.style.backdropFilter = 'blur(6px)';
    panel.style.display = 'none';
    panel.style.opacity = '0';
    panel.style.transform = 'translateY(8px) scale(0.98)';
    panel.style.pointerEvents = 'none';
    panel.style.transition = 'opacity 160ms ease, transform 160ms ease';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.gap = '8px';
    header.style.marginBottom = '8px';

    const title = document.createElement('div');
    title.textContent = '🧪 Cas extrêmes';
    title.style.fontWeight = '700';
    title.style.fontSize = '15px';
    header.appendChild(title);

    const lockBtn = document.createElement('button');
    lockBtn.type = 'button';
    lockBtn.textContent = '🔒 Verrouiller';
    lockBtn.className = 'pill';
    lockBtn.style.display = 'none';
    lockBtn.style.cursor = 'pointer';
    header.appendChild(lockBtn);

    panel.appendChild(header);

    const intro = document.createElement('div');
    intro.textContent = 'Clique sur Test, saisis le code à 4 chiffres, puis choisis un cas préchargé.';
    intro.style.fontSize = '12px';
    intro.style.opacity = '0.9';
    intro.style.marginBottom = '10px';
    panel.appendChild(intro);

    const list = document.createElement('div');
    list.style.display = 'none';
    list.style.gap = '8px';

    casesList.forEach((entry) => {
      const card = document.createElement('div');
      card.style.border = '1px solid rgba(255,255,255,0.12)';
      card.style.borderRadius = '12px';
      card.style.padding = '10px';
      card.style.background = 'rgba(255,255,255,0.04)';

      const h = document.createElement('div');
      h.textContent = entry.title || entry.id;
      h.style.fontWeight = '700';
      h.style.fontSize = '13px';
      h.style.marginBottom = '4px';
      card.appendChild(h);

      const meta = document.createElement('div');
      meta.textContent = `${targetSummary(entry)} • ${phaseSummary(entry) || 'cas jouable'}`;
      meta.style.fontSize = '12px';
      meta.style.opacity = '0.88';
      meta.style.marginBottom = '4px';
      card.appendChild(meta);

      const desc = document.createElement('div');
      desc.textContent = entry.description || '';
      desc.style.fontSize = '12px';
      desc.style.opacity = '0.75';
      desc.style.marginBottom = '8px';
      card.appendChild(desc);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Jouer ce cas';
      btn.className = 'pill';
      btn.style.width = '100%';
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', () => {
        pendingCaseId = String(entry.id);
        if (typeof launchNewRoundWithCount === 'function') {
          launchNewRoundWithCount(Number(entry.playerCount || 10));
        }
      });
      card.appendChild(btn);

      list.appendChild(card);
    });

    panel.appendChild(list);

    lockBtn.addEventListener('click', () => {
      testUnlocked = false;
      showLockedState(panel, intro, list, lockBtn);
    });

    root.appendChild(panel);
    return { panel, intro, list, lockBtn };
  }

  async function buildInteractiveDock() {
    const list = await fetchExtremeCases();
    if (!list.length || panelBuilt) return;
    panelBuilt = true;

    const root = createRoot();
    const toggleBtn = createToggleButton(root);
    const refs = createPanel(root, list);
    const { panel, intro, list: listWrap, lockBtn } = refs;
    syncDockVisibility(root);

    const observer = new MutationObserver(() => syncDockVisibility(root));
    if (document.body) observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    const openPanel = () => {
      if (!testUnlocked) return;
      if (hoverCloseTimer) clearTimeout(hoverCloseTimer);
      setPanelOpen(panel, true);
    };

    const closePanel = () => {
      if (!testUnlocked || isPinnedOpen) return;
      scheduleClose(panel);
    };

    toggleBtn.addEventListener('mouseenter', openPanel);
    toggleBtn.addEventListener('mouseleave', closePanel);
    panel.addEventListener('mouseenter', openPanel);
    panel.addEventListener('mouseleave', closePanel);

    toggleBtn.addEventListener('click', () => {
      if (!testUnlocked) {
        const ok = askTestCode();
        if (!ok) return;
        isPinnedOpen = true;
        showUnlockedState(panel, intro, listWrap, lockBtn);
        return;
      }
      isPinnedOpen = !isPinnedOpen;
      setPanelOpen(panel, isPinnedOpen);
    });
  }

  async function init() {
    if (!ENABLE_EXTREME_CASES_PANEL) return;
    try {
      await buildInteractiveDock();
    } catch (err) {
      console.error(err);
    }
  }

  global.consumePendingExtremeCaseId = consumePendingExtremeCaseId;
  window.addEventListener('load', init);
})(window);
