"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useClientStore } from "@/store/clientStore";

export default function LoginForm() {
  const router = useRouter();
  const { setUser } = useClientStore();

  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [pinError, setPinError] = useState("");

  // Validar email en tiempo real
  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError("Email es requerido");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError("Email inválido");
      return false;
    }
    setEmailError("");
    return true;
  };

  // Validar PIN en tiempo real
  const validatePin = (value: string) => {
    if (!value) {
      setPinError("PIN es requerido");
      return false;
    }
    if (value.length < 4) {
      setPinError("PIN debe tener al menos 4 caracteres");
      return false;
    }
    setPinError("");
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value) {
      validateEmail(value);
    } else {
      setEmailError("");
    }
    setError("");
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPin(value);
    if (value) {
      validatePin(value);
    } else {
      setPinError("");
    }
    setError("");
  };

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    // Validar antes de enviar
    const emailValid = validateEmail(email);
    const pinValid = validatePin(pin);

    if (!emailValid || !pinValid) {
      return;
    }

    setError("");
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), pin }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Credenciales incorrectas");
        setLoading(false);
        return;
      }

      // ── Login es PURO: solo usuario, sin progreso ────────────────
      // El progreso se carga después en /dashboard vía sync
      setSuccess(true);
      setUser(data.user);

      // Pequeño delay para mostrar el estado de éxito antes de redirigir
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 600);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen flex justify-center items-center overflow-y-hidden bg-primary">
      <div className="container-full flex flex-col gap-6 3xl:gap-8 justify-center items-center py-10">
        {process.env.NODE_ENV === "development" && (
          <p className="text-center text-xs text-gray-400 mt-4 hidden">
            Demo: cualquier email + PIN <code className="font-mono">1234</code>
          </p>
        )}

        <a href="#" className="transition-transform hover:scale-105">
          <Image
            src="/logo.svg"
            alt="Logo Treehubly"
            width={168}
            height={30}
            style={{ width: "auto", height: "auto" }}
          />
        </a>

        <div className="w-full md:w-auto bg-[#f7f7f7] flex flex-col justify-center items-center gap-8 3xl:gap-10 rounded-2xl lg:rounded-3xl px-4 py-10 lg:p-8 shadow-sm">
          <div className="flex flex-col justify-center items-start gap-6 3xl:gap-8 w-full">
            <div className="flex flex-col justify-center items-start gap-4">
              <h1 className="text-[24px] md:text-[32px] text-primary font-bold leading-[140%] md:leading-[130%]">
                Login
              </h1>
              <p className="text-[12px] md:text-[14px] font-normal leading-[150%] text-primary">
                Enter your credentials to access your dashboard.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col justify-center items-start gap-5 3xl:gap-6 w-full"
            >
              {/* Error general */}
              {error && (
                <div className="w-full rounded-lg bg-red-50 border border-red-200 px-4 py-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <svg
                    className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              )}

              {/* Success state */}
              {success && (
                <div className="w-full rounded-lg bg-green-50 border border-green-200 px-4 py-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <svg
                    className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm font-medium text-green-800">
                    Credentials verified! Redirecting...
                  </p>
                </div>
              )}

              {/* Email */}
              <div className="flex flex-col justify-center items-start gap-2 w-full">
                <label className="text-[12px] md:text-[14px] font-bold leading-[150%] text-primary">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="name@company.com"
                  disabled={loading}
                  autoComplete="email"
                  className={`w-full p-4 rounded-lg outline-none transition-all duration-300 text-[12px] md:text-[14px] font-normal leading-[150%] text-primary placeholder:text-[#707070] ${
                    emailError
                      ? "border-2 border-red-500 bg-red-50 focus:border-red-600"
                      : "border border-[#D9D9D9] focus:border-secondary focus:ring-1 focus:ring-secondary/20"
                  } ${loading ? "bg-gray-100 cursor-not-allowed" : ""}`}
                />
                {emailError && (
                  <p className="text-xs text-red-600 font-medium mt-1">
                    {emailError}
                  </p>
                )}
              </div>

              {/* PIN */}
              <div className="flex flex-col justify-center items-start gap-2 w-full">
                <div className="w-full flex justify-between items-center">
                  <label className="text-[12px] md:text-[14px] font-bold leading-[150%] text-primary">
                    PIN
                  </label>
                  <a
                    href="#"
                    className="text-secondary text-[12px] md:text-[14px] font-normal leading-[150%] hover:underline transition-colors"
                  >
                    Forgot pin?
                  </a>
                </div>
                <input
                  type="password"
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="••••"
                  disabled={loading}
                  maxLength={8}
                  autoComplete="current-password"
                  className={`w-full p-4 rounded-lg outline-none transition-all duration-300 text-[12px] md:text-[14px] font-normal leading-[150%] text-primary placeholder:text-[#707070] ${
                    pinError
                      ? "border-2 border-red-500 bg-red-50 focus:border-red-600"
                      : "border border-[#D9D9D9] focus:border-secondary focus:ring-1 focus:ring-secondary/20"
                  } ${loading ? "bg-gray-100 cursor-not-allowed" : ""}`}
                />
                {pinError && (
                  <p className="text-xs text-red-600 font-medium mt-1">
                    {pinError}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || success}
                className={` w-full py-3 rounded-lg font-bold text-[14px] leading-[150%] transition-all duration-300 flex items-center justify-center gap-2 ${
                  success
                    ? "bg-green-500 text-white cursor-default"
                    : loading
                      ? "bg-secondary/80 text-primary cursor-wait"
                      : "bg-secondary text-primary hover:bg-secondary/95 hover:shadow-md hover:translate-y-[-2px] active:translate-y-0 cursor-pointer"
                } disabled:opacity-100 disabled:cursor-not-allowed transition-all`}
              >
                {loading ? (
                  <>
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Verifying...</span>
                  </>
                ) : success ? (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Success!</span>
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          </div>

          <div className="w-full h-[1px] bg-[#E8E8E8]"></div>

          <p className="text-[12px] md:text-[14px] font-medium leading-[150%] text-primary">
            Don't have an account?{" "}
            <a
              href="#"
              className="text-secondary font-bold hover:underline transition-colors"
            >
              Contact Support
            </a>
          </p>
        </div>

        <p className="text-[12px] text-white font-medium leading-[150%] text-center pt-10 md:pt-0">
          © 2026 TreeHubly Inc. All rights reserved. • Privacy Policy • Terms of
          Service
        </p>
      </div>
    </div>
  );
}
