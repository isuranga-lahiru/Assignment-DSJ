const toggleButton = document.querySelector("[data-theme-toggle]");
const accordion = document.querySelector("[data-accordion]");
const typingLine = document.querySelector(".typing-line");

const typingMessages = [
  "Built for students who like fewer tabs and better grades.",
  "Summaries, quizzes, and study notes in one place.",
  "Claude-ready, mobile-friendly, and refresh-proof."
];

let currentMessage = 0;
let currentChar = 0;
let typingDirection = 1;

const storedTheme = localStorage.getItem("studymate-theme");
if (storedTheme === "dark") {
  document.body.classList.add("dark");
}

toggleButton?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const theme = document.body.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem("studymate-theme", theme);
  toggleButton.textContent = theme === "dark" ? "☀️" : "🌙";
});

toggleButton.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";

accordion?.addEventListener("click", (event) => {
  const button = event.target.closest(".faq-item");
  if (!button) {
    return;
  }

  const expanded = button.getAttribute("aria-expanded") === "true";
  accordion.querySelectorAll(".faq-item").forEach((item) => item.setAttribute("aria-expanded", "false"));
  button.setAttribute("aria-expanded", String(!expanded));
});

function typeMessage() {
  if (!typingLine) {
    return;
  }

  const message = typingMessages[currentMessage];
  currentChar += typingDirection;

  if (currentChar >= message.length) {
    typingDirection = -1;
    setTimeout(typeMessage, 1200);
    typingLine.textContent = message;
    return;
  }

  if (currentChar <= 0) {
    typingDirection = 1;
    currentMessage = (currentMessage + 1) % typingMessages.length;
  }

  typingLine.textContent = message.slice(0, Math.max(0, currentChar));
  setTimeout(typeMessage, typingDirection === 1 ? 55 : 25);
}

typeMessage();
