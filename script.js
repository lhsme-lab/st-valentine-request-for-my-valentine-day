(() => {
  const titleEl = document.getElementById("title");
  const subtitleEl = document.getElementById("subtitle");
  const gifEl = document.getElementById("gif");
  const fallbackEl = document.getElementById("gifFallback");
  const noBtn = document.getElementById("noBtn");
  const yesBtn = document.getElementById("yesBtn");
  const hintEl = document.getElementById("hint");
  const confettiCanvas = document.getElementById("confetti");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Assets (remplace juste les fichiers dans /assets) ----
  const GIF_PLEADING = "assets/pleading.gif";
  const GIF_ROMANTIC = "assets/romantic.gif";

  // ---- Texte du bouton "Non" qui évolue ----
  const noTexts = [
    "Non",
    "T’es sûre ?",
    "Sûre sûre ?",
    "Vraiment vraiment ?",
    ":(((",
    "Allez stp 🥺",
    "Je sors le chiot 🐶",
    "Réfléchis…",
    "Dernière chance 😭",
    "Ok… mais je boude 😤",
    "Bon… 😇"
  ];

  let noCount = 0;
  let accepted = false;

  // Scales (visuels)
  const NO_MIN_SCALE = 0.35;
  const YES_MAX_SCALE = 2.6;

  // Ces valeurs donnent un effet drôle sans exploser la mise en page
  const NO_SHRINK_PER_CLICK = 0.10; // 10% en moins par clic (approx via multiplicatif)
  const YES_GROW_PER_CLICK = 0.14;  // 14% en plus par clic (approx via multiplicatif)

  let noScale = 1;
  let yesScale = 1;

  // Anti spam tap
  let lastTap = 0;
  const TAP_COOLDOWN_MS = 140;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function setHint(text) {
    hintEl.textContent = text || "";
  }

  // Fallback si GIF ne charge pas
  gifEl.addEventListener("error", () => {
    gifEl.style.display = "none";
    fallbackEl.style.display = "flex";
  });

  function applyButtonScales() {
    noBtn.style.transform = `scale(${noScale})`;
    yesBtn.style.transform = `scale(${yesScale})`;

    // Bonus: rendre le "Oui" plus "glow" quand il grossit
    const glow = clamp((yesScale - 1) / (YES_MAX_SCALE - 1), 0, 1);
    yesBtn.style.filter = `brightness(${1 + glow * 0.18})`;
  }

  function onNoClick() {
    if (accepted) return;

    const now = Date.now();
    if (now - lastTap < TAP_COOLDOWN_MS) return;
    lastTap = now;

    noCount += 1;

    // Texte du bouton "Non"
    const idx = clamp(noCount, 0, noTexts.length - 1);
    noBtn.textContent = noTexts[idx];

    // Scales (multiplicatif => effet plus naturel)
    noScale = clamp(noScale * (1 - NO_SHRINK_PER_CLICK), NO_MIN_SCALE, 1);
    yesScale = clamp(yesScale * (1 + YES_GROW_PER_CLICK), 1, YES_MAX_SCALE);

    applyButtonScales();

    // Micro message
    if (noCount === 1) setHint("Hmm… réfléchis bien 😇");
    else if (noCount === 3) setHint("Je te regarde avec mes yeux 🥺");
    else if (noCount === 6) setHint("Le chiot est sorti… 🐶");
    else if (noCount === 9) setHint("Ok… là ça devient sérieux 😭");
    else setHint("");

    // Petit shake sur le bouton Non (si pas reduced-motion)
    if (!prefersReducedMotion) {
      noBtn.animate(
        [
          { transform: `scale(${noScale}) translateX(0px)` },
          { transform: `scale(${noScale}) translateX(-3px)` },
          { transform: `scale(${noScale}) translateX(3px)` },
          { transform: `scale(${noScale}) translateX(0px)` }
        ],
        { duration: 220, iterations: 1, easing: "ease-out" }
      );
    }

    // Haptique légère (si dispo)
    if (navigator.vibrate) {
      navigator.vibrate(18);
    }
  }

  function onYesClick() {
    if (accepted) return;
    accepted = true;

    // UI texte
    titleEl.textContent = "YEPiii !! 🎉💖";
    subtitleEl.textContent = "Je savais que t’allais dire oui 😌";

    // Swap GIF
    gifEl.style.display = "";
    fallbackEl.style.display = "none";
    gifEl.src = GIF_ROMANTIC;
    gifEl.alt = "GIF romantique";

    // Désactiver les boutons (ou masquer)
    noBtn.disabled = true;
    yesBtn.disabled = true;

    noBtn.style.opacity = "0";
    yesBtn.style.opacity = "0";

    setHint("Screenshot et envoie-moi ça 😄");

    // Confettis
    if (!prefersReducedMotion) {
      launchConfetti();
    }
  }

  // ---- Confetti (canvas simple, léger) ----
  let confettiRunning = false;

  function launchConfetti() {
    if (confettiRunning) return;
    confettiRunning = true;

    confettiCanvas.style.display = "block";
    const ctx = confettiCanvas.getContext("2d");

    function resize() {
      confettiCanvas.width = window.innerWidth * devicePixelRatio;
      confettiCanvas.height = window.innerHeight * devicePixelRatio;
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const W = () => confettiCanvas.width;
    const H = () => confettiCanvas.height;

    // Particules
    const count = 140;
    const parts = Array.from({ length: count }, () => ({
      x: Math.random() * W(),
      y: -Math.random() * H() * 0.35,
      r: (2 + Math.random() * 4) * devicePixelRatio,
      vx: (-1 + Math.random() * 2) * devicePixelRatio,
      vy: (2 + Math.random() * 5) * devicePixelRatio,
      rot: Math.random() * Math.PI,
      vrot: (-0.15 + Math.random() * 0.3)
    }));

    let start = performance.now();
    const DURATION_MS = 2600;

    function tick(t) {
      const elapsed = t - start;
      ctx.clearRect(0, 0, W(), H());

      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;

        // wrap horizontal
        if (p.x < -20) p.x = W() + 20;
        if (p.x > W() + 20) p.x = -20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);

        // Pas de couleur imposée par CSS : on garde des teintes random en JS
        // (si tu veux sans couleurs du tout, dis-moi et je change)
        const hue = (p.x / W()) * 360;
        ctx.fillStyle = `hsla(${hue}, 85%, 60%, 0.95)`;

        ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
        ctx.restore();
      }

      if (elapsed < DURATION_MS) {
        requestAnimationFrame(tick);
      } else {
        confettiCanvas.style.display = "none";
        confettiRunning = false;
        window.removeEventListener("resize", resize);
      }
    }

    requestAnimationFrame(tick);
  }

  // Init
  gifEl.src = GIF_PLEADING;
  applyButtonScales();

  noBtn.addEventListener("click", onNoClick);
  yesBtn.addEventListener("click", onYesClick);

  // Bonus: double tap sur le GIF => “Oui” (cute easter egg)
  gifEl.addEventListener("dblclick", () => {
    if (!accepted) onYesClick();
  });
})();
