(() => {
  "use strict";

  const WORDS = [
    ["KUCING", "Hewan"], ["HARIMAU", "Hewan"], ["KELINCI", "Hewan"], ["BURUNG", "Hewan"], ["KERBAU", "Hewan"],
    ["MANGGA", "Buah"], ["JERUK", "Buah"], ["SEMANGKA", "Buah"], ["PISANG", "Buah"], ["DURIAN", "Buah"],
    ["SEKOLAH", "Tempat"], ["PASAR", "Tempat"], ["BANDARA", "Tempat"], ["PERPUSTAKAAN", "Tempat"], ["STASIUN", "Tempat"],
    ["GITAR", "Benda"], ["PAYUNG", "Benda"], ["KURSI", "Benda"], ["JENDELA", "Benda"], ["SEPEDA", "Benda"],
    ["RENDANG", "Makanan"], ["GADO", "Makanan"], ["BAKSO", "Makanan"], ["SATE", "Makanan"], ["TEMPE", "Makanan"],
    ["GARUDA", "Indonesia"], ["BATIK", "Indonesia"], ["ANGKLUNG", "Indonesia"], ["NUSANTARA", "Indonesia"], ["MERDEKA", "Indonesia"]
  ];

  const ROUNDS = 10;
  const TIME = 30;
  const BEST_KEY = "susun-kata-best";

  const $ = (id) => document.getElementById(id);
  const el = {
    game: $("game"), round: $("round"), score: $("score"), streak: $("streak"),
    timer: document.querySelector(".timer"), timerBar: $("timerBar"),
    category: $("category"), slots: $("slots"), tiles: $("tiles"), message: $("message"),
    btnClear: $("btnClear"), btnShuffle: $("btnShuffle"), btnHint: $("btnHint"), btnSkip: $("btnSkip"),
    overlay: $("overlay"), finalScore: $("finalScore"), finalInfo: $("finalInfo"), btnRestart: $("btnRestart")
  };

  let queue, index, score, streak, correctCount, timeLeft, timerId;
  let current, tiles, answer, locked;

  const shuffleArray = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const scramble = (word) => {
    let letters = word.split("");
    if (new Set(letters).size === 1) return letters;
    do { letters = shuffleArray(letters); } while (letters.join("") === word);
    return letters;
  };

  const setMessage = (text, type = "") => {
    el.message.textContent = text;
    el.message.className = "message " + type;
  };

  const updateStats = () => {
    el.round.textContent = `${Math.min(index + 1, ROUNDS)}/${ROUNDS}`;
    el.score.textContent = score;
    el.streak.textContent = streak;
  };

  /* ---------- Rendering ---------- */
  const render = () => {
    el.slots.innerHTML = "";
    for (let i = 0; i < current.word.length; i++) {
      const s = document.createElement("div");
      const ti = answer[i];
      s.className = "slot" + (ti !== undefined ? " filled" : "");
      s.textContent = ti !== undefined ? tiles[ti].letter : "";
      el.slots.appendChild(s);
    }
    el.tiles.innerHTML = "";
    tiles.forEach((t, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tile";
      b.textContent = t.letter;
      b.disabled = t.used || locked;
      b.setAttribute("aria-label", `Huruf ${t.letter}`);
      b.addEventListener("click", () => pickTile(i));
      el.tiles.appendChild(b);
    });
  };

  /* ---------- Round flow ---------- */
  const startRound = () => {
    const [word, category] = queue[index];
    current = { word, category };
    tiles = scramble(word).map((letter) => ({ letter, used: false }));
    answer = [];
    locked = false;
    el.category.textContent = category;
    el.slots.classList.remove("pop", "shake");
    setMessage("Ketik atau ketuk huruf untuk menyusun kata.");
    setButtons(true);
    updateStats();
    render();
    startTimer();
  };

  const setButtons = (on) => {
    [el.btnClear, el.btnShuffle, el.btnHint, el.btnSkip].forEach((b) => (b.disabled = !on));
  };

  const startTimer = () => {
    clearInterval(timerId);
    timeLeft = TIME;
    drawTimer();
    timerId = setInterval(() => {
      timeLeft--;
      drawTimer();
      if (timeLeft <= 0) {
        clearInterval(timerId);
        endRound(false, "Waktu habis!");
      }
    }, 1000);
  };

  const drawTimer = () => {
    el.timerBar.style.width = (timeLeft / TIME) * 100 + "%";
    el.timer.classList.toggle("low", timeLeft <= 8);
    el.timer.setAttribute("aria-valuenow", timeLeft);
  };

  const endRound = (won, text) => {
    clearInterval(timerId);
    locked = true;
    setButtons(false);

    if (won) {
      const gain = 10 + timeLeft + Math.min(streak, 5) * 2;
      score += gain;
      streak++;
      correctCount++;
      el.slots.classList.add("pop");
      setMessage(`Benar! +${gain} poin`, "good");
    } else {
      streak = 0;
      answer = [];
      el.slots.innerHTML = "";
      current.word.split("").forEach((ch) => {
        const s = document.createElement("div");
        s.className = "slot filled";
        s.textContent = ch;
        el.slots.appendChild(s);
      });
      setMessage(`${text} Jawabannya: ${current.word}`, "bad");
    }
    updateStats();
    el.tiles.querySelectorAll(".tile").forEach((b) => (b.disabled = true));

    setTimeout(() => {
      index++;
      index >= ROUNDS ? finish() : startRound();
    }, won ? 1100 : 1900);
  };

  /* ---------- Player actions ---------- */
  const pickTile = (i) => {
    if (locked || tiles[i].used || answer.length >= current.word.length) return;
    tiles[i].used = true;
    answer.push(i);
    render();
    checkAnswer();
  };

  const removeLast = () => {
    if (locked || !answer.length) return;
    tiles[answer.pop()].used = false;
    render();
  };

  const clearAnswer = () => {
    if (locked) return;
    answer.forEach((i) => (tiles[i].used = false));
    answer = [];
    render();
  };

  const checkAnswer = () => {
    if (answer.length < current.word.length) return;
    const guess = answer.map((i) => tiles[i].letter).join("");
    if (guess === current.word) {
      endRound(true);
    } else {
      streak = 0;
      updateStats();
      setMessage("Belum tepat, coba lagi.", "bad");
      el.slots.classList.remove("shake");
      void el.slots.offsetWidth;
      el.slots.classList.add("shake");
      setTimeout(clearAnswer, 450);
    }
  };

  const useHint = () => {
    if (locked) return;
    // Pertahankan huruf awal yang sudah benar, hapus sisanya.
    let ok = 0;
    while (ok < answer.length && tiles[answer[ok]].letter === current.word[ok]) ok++;
    while (answer.length > ok) tiles[answer.pop()].used = false;
    if (ok >= current.word.length) return;

    const next = current.word[ok];
    const i = tiles.findIndex((t) => !t.used && t.letter === next);
    if (i === -1) return;
    score = Math.max(0, score - 5);
    tiles[i].used = true;
    answer.push(i);
    updateStats();
    setMessage(`Petunjuk: huruf ke-${ok + 1} adalah ${next}.`);
    render();
    checkAnswer();
  };

  const reshuffle = () => {
    if (locked) return;
    clearAnswer();
    tiles = scramble(current.word).map((letter) => ({ letter, used: false }));
    render();
  };

  /* ---------- Game flow ---------- */
  const finish = () => {
    let best = 0;
    try { best = Number(localStorage.getItem(BEST_KEY)) || 0; } catch (e) { /* abaikan */ }
    const isRecord = score > best;
    if (isRecord) {
      try { localStorage.setItem(BEST_KEY, String(score)); } catch (e) { /* abaikan */ }
      best = score;
    }
    el.finalScore.textContent = score;
    el.finalInfo.textContent =
      `${correctCount} dari ${ROUNDS} kata benar. ` +
      (isRecord ? "Rekor baru!" : `Rekor tertinggi: ${best}.`);
    el.overlay.hidden = false;
    el.btnRestart.focus();
  };

  const newGame = () => {
    queue = shuffleArray(WORDS).slice(0, ROUNDS);
    index = 0; score = 0; streak = 0; correctCount = 0;
    el.overlay.hidden = true;
    startRound();
  };

  /* ---------- Events ---------- */
  el.btnClear.addEventListener("click", clearAnswer);
  el.btnShuffle.addEventListener("click", reshuffle);
  el.btnHint.addEventListener("click", useHint);
  el.btnSkip.addEventListener("click", () => !locked && endRound(false, "Dilewati."));
  el.btnRestart.addEventListener("click", newGame);

  document.addEventListener("keydown", (e) => {
    if (locked || !el.overlay.hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Backspace") { e.preventDefault(); removeLast(); return; }
    if (e.key === "Escape") { clearAnswer(); return; }
    if (/^[a-z]$/i.test(e.key)) {
      const letter = e.key.toUpperCase();
      const i = tiles.findIndex((t) => !t.used && t.letter === letter);
      if (i !== -1) pickTile(i);
    }
  });

  newGame();
})();
