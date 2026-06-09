"use client";

import { FormEvent, useEffect, useState } from "react";

type Step = "email" | "code";
type View = "home" | "dashboard";

type MeResponse = {
  user: {
    id: string;
    email: string;
  };
  subscription: {
    status: "inactive";
    paid_until: null;
  };
  devices: Array<unknown>;
};

function getErrorMessage(status: number, fallback: string) {
  if (status === 429) return "Код уже отправлен, попробуйте чуть позже";
  if (status >= 500) return "Ошибка сервера, попробуйте позже";
  return fallback;
}

export default function HomePage() {
  const [view, setView] = useState<View>("home");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);

  async function loadMe() {
    const response = await fetch("/api/me", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      setMe(null);
      setView("home");
      return null;
    }

    const data = (await response.json()) as MeResponse;
    setMe(data);
    setView("dashboard");
    return data;
  }

  useEffect(() => {
    void loadMe();
  }, []);

  function openAuth() {
    setStep("email");
    setCode("");
    setMessage("");
    setError("");
    setIsAuthOpen(true);
  }

  function closeAuth() {
    setIsAuthOpen(false);
    setStep("email");
    setCode("");
    setMessage("");
    setError("");
  }

  async function requestCode() {
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        setError(getErrorMessage(response.status, "Не удалось отправить код, попробуйте позже"));
        return;
      }

      setStep("code");
      setCode("");
      setMessage("Код отправлен на почту.");
    } catch {
      setError("Ошибка сервера, попробуйте позже");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyCode() {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      });

      if (!response.ok) {
        setError(response.status >= 500 ? "Ошибка сервера, попробуйте позже" : "Неверный или истекший код");
        return;
      }

      closeAuth();
      await loadMe();
    } catch {
      setError("Ошибка сервера, попробуйте позже");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step === "email") {
      await requestCode();
      return;
    }

    await verifyCode();
  }

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
    setMe(null);
    setView("home");
  }

  if (view === "dashboard" && me) {
    return (
      <main className="phone-canvas dashboard-screen" aria-label="Личный кабинет">
        <section className="dashboard-panel">
          <img className="dashboard-logo" src="/images/logo.png" alt="Эйфория" />
          <h1>личный кабинет</h1>

          <article className="profile-note">
            <p className="profile-email">{me.user.email}</p>
            <strong>доступ не оплачен</strong>
          </article>

          <section className="devices-box" aria-labelledby="devicesTitle">
            <h2 id="devicesTitle">мои устройства</h2>
            <p className="empty-devices">устройств пока нет</p>
          </section>

          <button className="text-button logout-button" type="button" onClick={logout}>
            выйти
          </button>
        </section>
      </main>
    );
  }

  return (
    <>
      <main className="phone-canvas" id="homeScreen" aria-label="Эйфория">
        <img className="logo-img doodle" src="/images/logo.png" alt="Эйфория" />
        <img className="slogan-img doodle" src="/images/slogan.png" alt="свобода тут!" />

        <button className="image-button receive-button" type="button" onClick={openAuth} aria-label="Получить">
          <img src="/images/receive.png" alt="" />
        </button>

        <img className="arrow-img doodle" src="/images/strela.png" alt="" aria-hidden="true" />
        <img className="photo-img doodle" src="/images/photo-crop.png" alt="Домик и человечки" />
      </main>

      <div className={`modal-layer${isAuthOpen ? " is-open" : ""}`} aria-hidden={!isAuthOpen}>
        <div className="modal-backdrop" onClick={closeAuth}></div>
        <form className="hand-modal" data-step={step} onSubmit={handleSubmit} noValidate>
          <button className="close-button" type="button" onClick={closeAuth} aria-label="Закрыть">
            x
          </button>

          <div className="modal-copy modal-copy-email">
            <h2>введи почту</h2>
            <p>пришлём код для входа</p>
          </div>

          <div className="modal-copy modal-copy-code">
            <h2>код с почты</h2>
            <p>мы отправили код на {email}</p>
          </div>

          <label className="mail-field">
            <img className="mail-img" src="/images/mail.png" alt="" />
            <span className="visually-hidden">почта</span>
            <input
              className="mail-input"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              spellCheck="false"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="code-field">
            <img className="code-img" src="/images/code.png" alt="" />
            <span className="visually-hidden">код с почты</span>
            <input
              className="code-input"
              type="text"
              name="code"
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </label>

          <p className="test-code">тестовый код: 123456</p>
          {message ? <p className="form-error is-success">{message}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          {!message && !error ? <p className="form-error" aria-hidden="true"></p> : null}

          <button className="text-button submit-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "секунду..." : step === "code" ? "проверить" : "получить код"}
          </button>

          <button className="text-link change-email-button" type="button" onClick={() => setStep("email")}>
            изменить почту
          </button>
        </form>
      </div>
    </>
  );
}
