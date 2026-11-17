const wedding = {
  couple: "សិរីសួស្តី និង មាលា",
  date: "2027-01-10T16:00:00+07:00",
  venue: "ភោជនីយដ្ឋាន សុវណ្ណមង្គល, រាជធានីភ្នំពេញ",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Sovann+Mongkol+Restaurant+Phnom+Penh"
};

if ("IntersectionObserver" in window) {
  document.documentElement.classList.add("motion-ready");
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".section, .footer").forEach((section) => revealObserver.observe(section));

  const navLinks = document.querySelectorAll(".bottom-nav .nav-item");
  const sectionObserver = new IntersectionObserver((entries) => {
    const visibleSections = entries.filter((entry) => entry.isIntersecting);
    if (visibleSections.length === 0) return;
    const activeSection = visibleSections.reduce((closest, entry) => {
      const distance = Math.abs(entry.boundingClientRect.top + entry.boundingClientRect.height / 2 - window.innerHeight / 2);
      const closestDistance = Math.abs(closest.boundingClientRect.top + closest.boundingClientRect.height / 2 - window.innerHeight / 2);
      return distance < closestDistance ? entry : closest;
    });
    navLinks.forEach((link) => {
      const isActive = link.hash === `#${activeSection.target.id}`;
      link.classList.toggle("is-active", isActive);
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-42% 0px -48% 0px" });
  document.querySelectorAll("#home, #location, #photos, #wishes").forEach((section) => sectionObserver.observe(section));
}

const weddingTime = new Date(wedding.date).getTime();
const countdownFields = {
  days: document.querySelector("#days"),
  hours: document.querySelector("#hours"),
  minutes: document.querySelector("#minutes"),
  seconds: document.querySelector("#seconds")
};

function updateCountdown() {
  const remaining = weddingTime - Date.now();
  if (remaining <= 0) {
    Object.values(countdownFields).forEach((field) => { field.textContent = "0"; });
    document.querySelector(".event-date-label").textContent = "ថ្ងៃដ៏រីករាយរបស់យើងបានមកដល់ហើយ!";
    return;
  }
  const seconds = Math.floor(remaining / 1000);
  countdownFields.days.textContent = Math.floor(seconds / 86400);
  countdownFields.hours.textContent = Math.floor((seconds % 86400) / 3600);
  countdownFields.minutes.textContent = Math.floor((seconds % 3600) / 60);
  countdownFields.seconds.textContent = seconds % 60;
}

updateCountdown();
window.setInterval(updateCountdown, 1000);

const musicToggle = document.querySelector("#music-toggle");
const musicLabel = document.querySelector("#music-label");
const musicStatus = document.querySelector("#music-status");
const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
const chordProgression = [
  [146.83, 220, 293.66, 369.99],
  [123.47, 185, 246.94, 293.66],
  [98, 146.83, 196, 246.94],
  [110, 164.81, 220, 277.18]
];
const melody = [
  [587.33, 493.88, 440, 369.99],
  [493.88, 440, 369.99, 293.66],
  [392, 440, 493.88, 587.33],
  [440, 369.99, 329.63, 293.66]
];
let musicContext;
let musicGain;
let musicTimer;
let musicMeasure = 0;
let musicPlaying = false;

function playTone(frequency, start, duration, volume, waveform, sustained) {
  const oscillator = musicContext.createOscillator();
  const envelope = musicContext.createGain();
  const end = start + duration;
  const attack = sustained ? 0.75 : 0.04;

  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(frequency, start);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(volume, start + attack);
  if (sustained) {
    envelope.gain.setValueAtTime(volume, end - 0.75);
  } else {
    envelope.gain.exponentialRampToValueAtTime(volume * 0.28, start + 0.28);
  }
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);
  oscillator.connect(envelope);
  envelope.connect(musicGain);
  oscillator.start(start);
  oscillator.stop(end + 0.05);
}

function playMusicMeasure() {
  if (!musicPlaying) return;

  const start = musicContext.currentTime + 0.06;
  const progressionIndex = musicMeasure % chordProgression.length;
  chordProgression[progressionIndex].forEach((frequency) => {
    playTone(frequency, start, 4.45, 0.018, "sine", true);
  });
  melody[progressionIndex].forEach((frequency, index) => {
    playTone(frequency, start + 0.45 + index * 1.05, 1.2, 0.026, "sine", false);
  });
  musicMeasure += 1;
  musicTimer = window.setTimeout(playMusicMeasure, 4600);
}

function stopWeddingMusic() {
  musicPlaying = false;
  window.clearTimeout(musicTimer);
  musicTimer = undefined;
  if (musicGain && musicContext) {
    musicGain.gain.setTargetAtTime(0.0001, musicContext.currentTime, 0.18);
  }
  musicToggle.classList.remove("is-playing");
  musicToggle.setAttribute("aria-pressed", "false");
  musicToggle.setAttribute("aria-label", "បើកភ្លេង");
  musicLabel.textContent = "បើកភ្លេង";
  musicStatus.textContent = "បានបិទភ្លេង";
}

musicToggle.addEventListener("click", async () => {
  if (musicPlaying) {
    stopWeddingMusic();
    return;
  }
  if (!AudioContextConstructor) {
    musicStatus.textContent = "កម្មវិធីរុករកនេះមិនគាំទ្រការចាក់ភ្លេងទេ";
    return;
  }
  musicToggle.disabled = true;
  try {
    if (!musicContext) {
      musicContext = new AudioContextConstructor();
      musicGain = musicContext.createGain();
      musicGain.gain.value = 0.0001;
      musicGain.connect(musicContext.destination);
    }
    if (musicContext.state === "suspended") await musicContext.resume();
    musicPlaying = true;
    musicGain.gain.setTargetAtTime(0.42, musicContext.currentTime, 0.5);
    musicToggle.classList.add("is-playing");
    musicToggle.setAttribute("aria-pressed", "true");
    musicToggle.setAttribute("aria-label", "បិទភ្លេង");
    musicLabel.textContent = "កំពុងចាក់ភ្លេង";
    musicStatus.textContent = "កំពុងចាក់តន្ត្រីស្រទន់";
    playMusicMeasure();
    musicToggle.disabled = false;
  } catch (error) {
    stopWeddingMusic();
    musicToggle.disabled = false;
    musicStatus.textContent = "មិនអាចចាក់ភ្លេងបានទេ។ សូមសាកល្បងម្តងទៀត។";
    console.error("Could not start wedding music:", error);
  }
});

window.addEventListener("pagehide", stopWeddingMusic);

document.querySelector("#calendar-button").addEventListener("click", () => {
  const start = new Date(wedding.date);
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
  const toCalendarDate = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const escapeIcsText = (text) => text.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
  const content = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Wedding Invitation//KM",
    "BEGIN:VEVENT",
    `DTSTART:${toCalendarDate(start)}`,
    `DTEND:${toCalendarDate(end)}`,
    `SUMMARY:${escapeIcsText(`សិរីមង្គលអាពាហ៍ពិពាហ៍ ${wedding.couple}`)}`,
    `LOCATION:${escapeIcsText(wedding.venue)}`,
    `URL:${wedding.mapUrl}`,
    "END:VEVENT", "END:VCALENDAR"
  ].join("\r\n");
  const file = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const downloadUrl = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "wedding-invitation.ics";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
});

const wishForm = document.querySelector("#wish-form");
const wishList = document.querySelector("#wish-list");
const wishesKey = "wedding-invitation-wishes";

function renderWishes() {
  const wishes = JSON.parse(localStorage.getItem(wishesKey) || "[]");
  wishList.replaceChildren();
  if (wishes.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-wishes";
    emptyMessage.textContent = "មិនទាន់មានសារជូនពរទេ";
    wishList.append(emptyMessage);
    return;
  }
  wishes.slice(-20).reverse().forEach(({ name, message }) => {
    const item = document.createElement("article");
    item.className = "wish-item";
    const guest = document.createElement("strong");
    guest.textContent = name;
    const text = document.createElement("p");
    text.textContent = message;
    item.append(guest, text);
    wishList.append(item);
  });
}

wishForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(wishForm);
  const wishes = JSON.parse(localStorage.getItem(wishesKey) || "[]");
  wishes.push({
    name: String(formData.get("name")).trim(),
    message: String(formData.get("message")).trim()
  });
  localStorage.setItem(wishesKey, JSON.stringify(wishes.slice(-20)));
  wishForm.reset();
  renderWishes();
});

renderWishes();

const lightbox = document.querySelector("#lightbox");
const lightboxImage = lightbox.querySelector("img");
document.querySelectorAll(".photo-card").forEach((card) => {
  card.addEventListener("click", () => {
    const image = card.querySelector("img");
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    lightbox.showModal();
  });
});
lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});
