const openReceive = document.querySelector("#openReceive");
const receiveModal = document.querySelector("#receiveModal");
const receiveForm = document.querySelector("#receiveForm");
const formError = document.querySelector("#formError");
const submitButton = document.querySelector(".submit-button");

function setFormStep(step) {
  receiveForm.dataset.step = step;
  submitButton.textContent = step === "code" ? "проверить" : "получить";
  formError.textContent = "";
  formError.classList.remove("is-success");
}

function openModal() {
  setFormStep("email");
  receiveModal.classList.add("is-open");
  receiveModal.setAttribute("aria-hidden", "false");
  setTimeout(() => receiveForm.elements.email?.focus(), 80);
}

function closeModal() {
  receiveModal.classList.remove("is-open");
  receiveModal.setAttribute("aria-hidden", "true");
  receiveForm.reset();
  setFormStep("email");
}

openReceive.addEventListener("click", openModal);

document.querySelectorAll("[data-close-modal]").forEach((element) => {
  element.addEventListener("click", closeModal);
});

receiveForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(receiveForm);
  const email = data.get("email").trim();
  const code = data.get("code").trim();

  if (receiveForm.dataset.step !== "code") {
    if (!email) {
      formError.classList.remove("is-success");
      formError.textContent = "введи почту";
      return;
    }

    setFormStep("code");
    setTimeout(() => receiveForm.elements.code?.focus(), 80);
    return;
  }

  if (!code) {
    formError.classList.remove("is-success");
    formError.textContent = "введи код";
    return;
  }

  formError.classList.add("is-success");
  formError.textContent = "код принят";
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && receiveModal.classList.contains("is-open")) {
    closeModal();
  }
});
