const AUTH_KEY = "lokey_mock_auth";
const TEST_CODE = "123456";
const SESSION_MS = 14 * 24 * 60 * 60 * 1000;

const homeScreen = document.querySelector("#homeScreen");
const dashboardScreen = document.querySelector("#dashboardScreen");
const openReceive = document.querySelector("#openReceive");
const receiveModal = document.querySelector("#receiveModal");
const receiveForm = document.querySelector("#receiveForm");
const formError = document.querySelector("#formError");
const submitButton = document.querySelector(".submit-button");
const changeEmailButton = document.querySelector("#changeEmailButton");
const codeEmailText = document.querySelector("#codeEmailText");
const dashboardEmail = document.querySelector("#dashboardEmail");
const deviceList = document.querySelector("#deviceList");
const emptyDevices = document.querySelector("#emptyDevices");
const openDeviceModal = document.querySelector("#openDeviceModal");
const deviceModal = document.querySelector("#deviceModal");
const deviceForm = document.querySelector("#deviceForm");
const deviceError = document.querySelector("#deviceError");
const logoutButton = document.querySelector("#logoutButton");

let pendingEmail = "";
let authState = null;

function readAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY));
  } catch {
    return null;
  }
}

function writeAuth(data) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
  authState = null;
}

function getActiveAuth() {
  const data = readAuth();

  if (!data?.sessionExpiresAt) {
    return null;
  }

  if (data.sessionExpiresAt <= Date.now()) {
    clearAuth();
    return null;
  }

  return data;
}

function getNameFromEmail(email) {
  return email.split("@")[0] || "user";
}

function createAuth(email) {
  const existing = readAuth();
  const isSameUser = existing?.email?.toLowerCase() === email.toLowerCase();

  return {
    email,
    sessionExpiresAt: Date.now() + SESSION_MS,
    user: isSameUser && existing.user ? existing.user : {
      name: getNameFromEmail(email),
      plan: "Free",
      activeUntil: null,
    },
    devices: isSameUser && Array.isArray(existing.devices) ? existing.devices : [],
  };
}

function showHome() {
  homeScreen.hidden = false;
  dashboardScreen.hidden = true;
  window.scrollTo(0, 0);
}

function showDashboard(data) {
  authState = data;
  homeScreen.hidden = true;
  dashboardScreen.hidden = false;
  dashboardEmail.textContent = data.email;
  renderDevices();
  window.scrollTo(0, 0);
}

function setFormStep(step) {
  receiveForm.dataset.step = step;
  submitButton.textContent = step === "code" ? "проверить" : "получить код";
  formError.textContent = "";
  formError.classList.remove("is-success");

  if (step === "code") {
    codeEmailText.textContent = `мы отправили код на ${pendingEmail}`;
  }
}

function openModal() {
  pendingEmail = "";
  receiveForm.reset();
  setFormStep("email");
  receiveModal.classList.add("is-open");
  receiveModal.setAttribute("aria-hidden", "false");
  setTimeout(() => receiveForm.elements.email?.focus(), 80);
}

function closeModal() {
  receiveModal.classList.remove("is-open");
  receiveModal.setAttribute("aria-hidden", "true");
  receiveForm.reset();
  pendingEmail = "";
  setFormStep("email");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function renderDevices() {
  deviceList.innerHTML = "";
  const devices = authState?.devices || [];
  emptyDevices.hidden = devices.length > 0;

  devices.forEach((device) => {
    const row = document.createElement("article");
    row.className = "device-row";
    row.innerHTML = `
      <strong>${escapeHtml(device.name)}</strong>
      <span>${device.status === "active" ? "активно" : "неактивно"}</span>
    `;
    deviceList.append(row);
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (match) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return replacements[match];
  });
}

function openDeviceForm() {
  deviceForm.reset();
  deviceError.textContent = "";
  deviceModal.classList.add("is-open");
  deviceModal.setAttribute("aria-hidden", "false");
  setTimeout(() => deviceForm.elements.deviceName?.focus(), 80);
}

function closeDeviceForm() {
  deviceModal.classList.remove("is-open");
  deviceModal.setAttribute("aria-hidden", "true");
  deviceForm.reset();
  deviceError.textContent = "";
}

openReceive.addEventListener("click", openModal);
changeEmailButton.addEventListener("click", () => {
  pendingEmail = "";
  receiveForm.elements.code.value = "";
  setFormStep("email");
  setTimeout(() => receiveForm.elements.email?.focus(), 80);
});

document.querySelectorAll("[data-close-modal]").forEach((element) => {
  element.addEventListener("click", closeModal);
});

document.querySelectorAll("[data-close-device]").forEach((element) => {
  element.addEventListener("click", closeDeviceForm);
});

receiveForm.elements.code.addEventListener("input", () => {
  receiveForm.elements.code.value = receiveForm.elements.code.value.replace(/\D/g, "").slice(0, 6);
});

receiveForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(receiveForm);
  const email = data.get("email").trim();
  const code = data.get("code").trim();

  if (receiveForm.dataset.step !== "code") {
    if (!email) {
      formError.textContent = "введите почту";
      return;
    }

    if (!isValidEmail(email)) {
      formError.textContent = "почта выглядит неверно";
      return;
    }

    pendingEmail = email;
    setFormStep("code");
    setTimeout(() => receiveForm.elements.code?.focus(), 80);
    return;
  }

  if (!code) {
    formError.textContent = "введите код";
    return;
  }

  if (code !== TEST_CODE) {
    formError.textContent = "код неверный";
    return;
  }

  const nextAuth = createAuth(pendingEmail);
  writeAuth(nextAuth);
  closeModal();
  showDashboard(nextAuth);
});

openDeviceModal.addEventListener("click", openDeviceForm);

deviceForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = new FormData(deviceForm).get("deviceName").trim();

  if (!name) {
    deviceError.textContent = "введите название";
    return;
  }

  authState.devices = [
    ...(authState.devices || []),
    {
      id: Date.now(),
      name,
      status: "active",
      createdAt: Date.now(),
    },
  ];
  writeAuth(authState);
  renderDevices();
  closeDeviceForm();
});

logoutButton.addEventListener("click", () => {
  clearAuth();
  showHome();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  if (receiveModal.classList.contains("is-open")) {
    closeModal();
  }

  if (deviceModal.classList.contains("is-open")) {
    closeDeviceForm();
  }
});

const activeAuth = getActiveAuth();
if (activeAuth) {
  showDashboard(activeAuth);
} else {
  showHome();
}
