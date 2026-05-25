const SETTINGS = {
  avatar: "dddc91df02ac31f80240bdf528c72d5f.jpg",
  background: "143257.gif",
  videoBackground: "143257.gif",
  music: "alex_g-not_anywhere.mp3",
  discordUrl: "https://discord.com/users/rosdieqq",
  steamUrl: "https://steamcommunity.com/profiles/76561199219820519/",
};

const I18N = {
  en: {
    loading: "Loading silence...",
    uploadBackground: "Background",
    identity: "Bio",
    subtitle: "What lies ahead keeps me up at night...",
    status: "",
    mood: "offline mood / writing code in silence",
    trackLabel: "best",
    trackTitle: "alex_g-not_anywhere",
    loop: "loop",
    volume: "volume",
    ambientOff: "",
    ambientOn: "",
  },
  ru: {
    loading: "Загрузка тишины...",
    uploadBackground: "Фон",
    identity: "Био",
    subtitle: "То, что ждёт впереди, не даёт мне спать…",
    status: "",
    mood: "оффлайн режим / пишу код в тишине",
    trackLabel: "Best",
    trackTitle: "заalex_g-not_anywhere",
    loop: "повтор",
    volume: "громкость",
    ambientOff: "Стоп",
    ambientOn: "",
  },
  ua: {
    loading: "Завантаження тиші...",
    uploadBackground: "Фон",
    identity: "Біо",
    subtitle: "Те, що попереду, не дає мені спати…",
    status: "",
    mood: "офлайн режим / пишу код у тиші",
    trackLabel: "best",
    trackTitle: "alex_g-not_anywhere",
    loop: "повтор",
    volume: "гучність",
    ambientOff: "",
    ambientOn: "",
  },
};

const state = {
  language: "en",
  typingTimer: null,
  ambientOn: false,
  audioContext: null,
  noiseNode: null,
  gainNode: null,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const audio = $("[data-audio]");
const playToggle = $("[data-play-toggle]");
const playIcon = $("[data-play-icon]");
const progress = $("[data-progress]");
const volume = $("[data-volume]");
const currentTime = $("[data-current-time]");
const duration = $("[data-duration]");
const loopToggle = $("[data-loop-toggle]");
const ambientToggle = $("[data-ambient-toggle]");
const backgroundLayer = $("[data-background-layer]");
const backgroundVideo = $("[data-background-video]");
const cursorGlow = $("[data-cursor-glow]");
const scene = $("[data-scene]");

function applySettings() {
  $("[data-avatar]").src = SETTINGS.avatar;
  audio.src = SETTINGS.music;
  audio.volume = Number(volume.value);
  audio.loop = true;

  const [discordLink, steamLink] = $$(".socials a");
  discordLink.href = SETTINGS.discordUrl;
  steamLink.href = SETTINGS.steamUrl;

  backgroundLayer.style.backgroundImage = `url("${SETTINGS.background}")`;
  backgroundVideo.src = SETTINGS.videoBackground;
  testBackgroundAsset();
}

function testBackgroundAsset() {
  const probe = new Image();
  probe.onload = () => backgroundLayer.classList.add("has-image");
  probe.onerror = () => backgroundLayer.classList.remove("has-image");
  probe.src = `${SETTINGS.background}?v=${Date.now()}`;
}

function setLanguage(language) {
  state.language = language;
  document.documentElement.lang = language === "ua" ? "uk" : language;

  $$("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    element.textContent = I18N[language][key];
  });

  ambientToggle.querySelector("[data-i18n]").textContent =
    I18N[language][state.ambientOn ? "ambientOn" : "ambientOff"];

  $$(".lang-btn").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === language);
  });

  runTyping();
}

function runTyping() {
  const target = $("[data-typing]");
  const text = I18N[state.language].subtitle;
  clearInterval(state.typingTimer);
  target.textContent = "";

  let index = 0;
  state.typingTimer = setInterval(() => {
    target.textContent = text.slice(0, index);
    index += 1;

    if (index > text.length) {
      clearInterval(state.typingTimer);
    }
  }, 42);
}

function formatTime(value) {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

async function togglePlayback() {
  if (audio.paused) {
    audio.muted = false;
    try {
      await audio.play();
    } catch {
      playIcon.textContent = "▶";
    }
  } else {
    audio.pause();
  }
  updatePlayState();
}

function updatePlayState() {
  playIcon.textContent = audio.paused ? "▶" : "Ⅱ";
  playToggle.setAttribute("aria-label", audio.paused ? "Play music" : "Pause music");
}

function updateProgress() {
  if (!audio.duration) return;
  progress.value = String((audio.currentTime / audio.duration) * 100);
  currentTime.textContent = formatTime(audio.currentTime);
  duration.textContent = formatTime(audio.duration);
}

function seekAudio() {
  if (!audio.duration) return;
  audio.currentTime = (Number(progress.value) / 100) * audio.duration;
}

function createAmbientSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  state.audioContext = state.audioContext || new AudioContext();
  const bufferSize = 2 * state.audioContext.sampleRate;
  const noiseBuffer = state.audioContext.createBuffer(1, bufferSize, state.audioContext.sampleRate);
  const data = noiseBuffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * 0.18;
  }

  state.noiseNode = state.audioContext.createBufferSource();
  state.noiseNode.buffer = noiseBuffer;
  state.noiseNode.loop = true;

  const filter = state.audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 520;

  state.gainNode = state.audioContext.createGain();
  state.gainNode.gain.value = 0.018;

  state.noiseNode.connect(filter);
  filter.connect(state.gainNode);
  state.gainNode.connect(state.audioContext.destination);
  state.noiseNode.start();
}

function toggleAmbient() {
  state.ambientOn = !state.ambientOn;

  if (state.ambientOn) {
    if (!state.noiseNode) createAmbientSound();
    if (state.audioContext?.state === "suspended") state.audioContext.resume();
  } else if (state.audioContext) {
    state.audioContext.suspend();
  }

  ambientToggle.classList.toggle("is-on", state.ambientOn);
  ambientToggle.querySelector("[data-i18n]").textContent = I18N[state.language][state.ambientOn ? "ambientOn" : "ambientOff"];
}

function useUploadedBackground(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  const isVideo = file.type.startsWith("video/");

  backgroundVideo.classList.toggle("is-active", isVideo);
  backgroundLayer.classList.toggle("has-image", !isVideo);

  if (isVideo) {
    backgroundVideo.src = url;
    backgroundVideo.play().catch(() => {});
  } else {
    backgroundLayer.style.backgroundImage = `url("${url}")`;
  }
}

function handlePointerMove(event) {
  document.body.classList.add("has-cursor");
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;

  const x = (event.clientX / window.innerWidth - 0.5) * 16;
  const y = (event.clientY / window.innerHeight - 0.5) * 16;
  backgroundLayer.style.transform = `scale(1.05) translate(${x}px, ${y}px)`;
  backgroundVideo.style.transform = `scale(1.05) translate(${x}px, ${y}px)`;
}

function bindEvents() {
  $$(".lang-btn").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });

  playToggle.addEventListener("click", togglePlayback);
  loopToggle.addEventListener("click", () => {
    audio.loop = !audio.loop;
    loopToggle.classList.toggle("is-active", audio.loop);
  });

  volume.addEventListener("input", () => {
    audio.volume = Number(volume.value);
  });

  progress.addEventListener("input", seekAudio);
  audio.addEventListener("timeupdate", updateProgress);
  audio.addEventListener("loadedmetadata", updateProgress);
  audio.addEventListener("play", updatePlayState);
  audio.addEventListener("pause", updatePlayState);
  ambientToggle.addEventListener("click", toggleAmbient);
  $("[data-background-upload]").addEventListener("change", useUploadedBackground);
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
}

function boot() {
  applySettings();
  bindEvents();
  setLanguage("en");

  audio.play().catch(() => {
    audio.muted = true;
  });

  setTimeout(() => {
    $("[data-loader]").classList.add("is-hidden");
  }, 900);
}

window.addEventListener("DOMContentLoaded", boot);
