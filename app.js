const homeScreen = document.querySelector("#homeScreen");
const dashboardScreen = document.querySelector("#dashboardScreen");
const openReceive = document.querySelector("#openReceive");
const enterButton = document.querySelector("#enterButton");
const backButton = document.querySelector("#backButton");
const receiveModal = document.querySelector("#receiveModal");
const receiveForm = document.querySelector("#receiveForm");
const formError = document.querySelector("#formError");

function openModal() {
  receiveModal.classList.add("is-open");
  receiveModal.setAttribute("aria-hidden", "false");
  setTimeout(() => receiveModal.querySelector("input")?.focus(), 80);
}

function closeModal() {
  receiveModal.classList.remove("is-open");
  receiveModal.setAttribute("aria-hidden", "true");
  receiveForm.reset();
  formError.textContent = "";
}

function showDashboard() {
  closeModal();
  homeScreen.hidden = true;
  dashboardScreen.hidden = false;
  window.scrollTo(0, 0);
}

function showHome() {
  dashboardScreen.hidden = true;
  homeScreen.hidden = false;
  window.scrollTo(0, 0);
}

openReceive.addEventListener("click", openModal);
enterButton.addEventListener("click", showDashboard);
backButton.addEventListener("click", showHome);

document.querySelectorAll("[data-close-modal]").forEach((element) => {
  element.addEventListener("click", closeModal);
});

receiveForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(receiveForm);
  const email = data.get("email").trim();

  if (!email) {
    formError.textContent = "введи почту";
    return;
  }

  showDashboard();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && receiveModal.classList.contains("is-open")) {
    closeModal();
  }
});
