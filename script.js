const words = [
  { word: "apple", article: "an" },
  { word: "elephant", article: "an" },
  { word: "orange", article: "an" },
  { word: "iguana", article: "an" },
  { word: "octopus", article: "an" },
  { word: "umbrella", article: "an" },
  { word: "ant", article: "an" },
  { word: "egg", article: "an" },
  { word: "alligator", article: "an" },
  { word: "ostrich", article: "an" },
  { word: "dog", article: "a" },
  { word: "cat", article: "a" },
  { word: "monkey", article: "a" },
  { word: "turtle", article: "a" },
  { word: "lion", article: "a" }
];

const screens = {
  start: document.querySelector("#start-screen"),
  game: document.querySelector("#game-screen"),
  final: document.querySelector("#final-screen")
};

const startButton = document.querySelector("#start-button");
const playAgainButton = document.querySelector("#play-again-button");
const answerButtons = document.querySelectorAll(".answer-pad");
const currentWord = document.querySelector("#current-word");
const scoreDisplay = document.querySelector("#score-display");
const questionDisplay = document.querySelector("#question-display");
const finalScoreDisplay = document.querySelector("#final-score-display");
const feedback = document.querySelector("#feedback");
const progressDots = document.querySelector("#progress-dots");
const gameFrog = document.querySelector("#game-frog");
const gameFrogImage = document.querySelector("#game-frog-image");
const soundToggle = document.querySelector("#sound-toggle");

let audioContext;
let musicTimer;
let musicStep = 0;
let soundMuted = false;

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ??= new AudioContextClass();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playTone(frequency, duration = 0.16, volume = 0.08, delay = 0, type = "sine") {
  if (soundMuted) return;
  const context = getAudioContext();
  if (!context) return;

  const startTime = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.03);
}

function playCorrectSound() {
  playTone(523.25, 0.14, 0.1, 0, "triangle");
  playTone(659.25, 0.18, 0.1, 0.11, "triangle");
}

function playWrongSound() {
  playTone(220, 0.14, 0.07, 0, "sine");
  playTone(174.61, 0.2, 0.07, 0.1, "sine");
}

function startMusic() {
  if (musicTimer || soundMuted || !getAudioContext()) return;
  const melody = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];
  musicTimer = window.setInterval(() => {
    playTone(melody[musicStep % melody.length], 0.32, 0.025, 0, "sine");
    musicStep += 1;
  }, 480);
}

function stopMusic() {
  window.clearInterval(musicTimer);
  musicTimer = undefined;
}

let shuffledWords = [];
let currentIndex = 0;
let score = 0;
let inputLocked = false;

function shuffle(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function showScreen(screenName) {
  Object.entries(screens).forEach(([name, screen]) => {
    screen.hidden = name !== screenName;
  });
}

function createProgressDots() {
  progressDots.replaceChildren();

  words.forEach(() => {
    const dot = document.createElement("span");
    dot.className = "progress-dot";
    progressDots.append(dot);
  });
}

function updateDisplay() {
  currentWord.textContent = shuffledWords[currentIndex].word;
  scoreDisplay.textContent = `Score: ${score} / ${words.length}`;
  questionDisplay.textContent = `${currentIndex + 1} / ${words.length}`;
  progressDots.setAttribute(
    "aria-label",
    `${currentIndex} of ${words.length} words completed`
  );

  [...progressDots.children].forEach((dot, index) => {
    dot.classList.toggle("is-complete", index < currentIndex);
  });
}

function updateFrogPosition() {
  const position = Math.min(5, Math.floor(score / 3) + 1);
  gameFrog.dataset.position = position;
  gameFrog.setAttribute("aria-label", `Frog journey position ${position} of 5`);
}

function startGame() {
  startMusic();
  shuffledWords = shuffle(words);
  currentIndex = 0;
  score = 0;
  inputLocked = false;
  feedback.textContent = "Which lily pad is correct?";
  feedback.className = "feedback";
  gameFrogImage.classList.remove("is-jumping", "jump-to-left", "jump-to-right");
  answerButtons.forEach((button) => button.classList.remove("is-correct", "is-wrong"));
  updateFrogPosition();
  createProgressDots();
  updateDisplay();
  showScreen("game");
}

function finishGame() {
  stopMusic();
  playTone(523.25, 0.2, 0.09, 0, "triangle");
  playTone(659.25, 0.2, 0.09, 0.15, "triangle");
  playTone(783.99, 0.35, 0.09, 0.3, "triangle");
  [...progressDots.children].forEach((dot) => dot.classList.add("is-complete"));
  progressDots.setAttribute("aria-label", `${words.length} of ${words.length} words completed`);
  finalScoreDisplay.textContent = `${score} / ${words.length}`;
  showScreen("final");
}

function showNextWord() {
  currentIndex += 1;

  if (currentIndex === shuffledWords.length) {
    finishGame();
    return;
  }

  inputLocked = false;
  answerButtons.forEach((button) => button.classList.remove("is-correct", "is-wrong"));
  feedback.textContent = "Which lily pad is correct?";
  feedback.className = "feedback";
  updateDisplay();
}

function handleAnswer(event) {
  if (inputLocked) return;

  const selectedButton = event.currentTarget;
  const selectedArticle = selectedButton.dataset.article;
  const correctArticle = shuffledWords[currentIndex].article;

  if (selectedArticle !== correctArticle) {
    playWrongSound();
    feedback.textContent = "Oops! Try again.";
    feedback.className = "feedback is-wrong";
    selectedButton.classList.remove("is-wrong");
    void selectedButton.offsetWidth;
    selectedButton.classList.add("is-wrong");
    return;
  }

  inputLocked = true;
  playCorrectSound();
  score += 1;
  updateFrogPosition();
  scoreDisplay.textContent = `Score: ${score} / ${words.length}`;
  feedback.textContent = "Great jump!";
  feedback.className = "feedback is-correct";
  selectedButton.classList.remove("is-wrong");
  selectedButton.classList.add("is-correct");

  gameFrogImage.classList.remove("is-jumping", "jump-to-left", "jump-to-right");
  void gameFrogImage.offsetWidth;
  gameFrogImage.classList.add(
    "is-jumping",
    selectedArticle === "a" ? "jump-to-left" : "jump-to-right"
  );

  window.setTimeout(() => {
    gameFrogImage.classList.remove("is-jumping", "jump-to-left", "jump-to-right");
    showNextWord();
  }, 700);
}

startButton.addEventListener("click", startGame);
playAgainButton.addEventListener("click", startGame);
answerButtons.forEach((button) => button.addEventListener("click", handleAnswer));
soundToggle.addEventListener("click", () => {
  soundMuted = !soundMuted;
  soundToggle.textContent = soundMuted ? "♩" : "♪";
  soundToggle.setAttribute("aria-pressed", String(soundMuted));
  soundToggle.setAttribute("aria-label", soundMuted ? "Turn sound on" : "Mute sound");

  if (soundMuted) {
    stopMusic();
  } else if (!screens.game.hidden) {
    startMusic();
  }
});

document.querySelectorAll(".frog-image").forEach((image) => {
  const showFallback = () => {
    image.hidden = true;
  };

  image.addEventListener("error", showFallback);

  if (image.complete && image.naturalWidth === 0) {
    showFallback();
  }
});
