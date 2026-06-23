"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "@/app/actions/auth";
import { Icon } from "@/components/inventory/icon";
import styles from "./login-screen.module.css";

const initialState: LoginState = {
  error: null,
  fieldErrors: {},
};

const benefits = [
  "Inventario actualizado en tiempo real",
  "Alertas antes de quedarte sin stock",
  "Movimientos y reportes en un solo lugar",
];

export function LoginScreen() {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className={styles.loginPage}>
      <section className={styles.brandPanel} aria-label="Abarrotes Inventario">
        <div className={styles.glowOne} />
        <div className={styles.glowTwo} />

        <div className={styles.brand}>
          <span className={styles.brandMark}><Icon name="cart" /></span>
          <span>Abarrotes</span>
        </div>

        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Inventario inteligente</p>
          <h1>Tu tienda bajo control, todos los días.</h1>
          <p>
            Detecta faltantes, registra movimientos y toma decisiones con una
            vista clara de todo tu negocio.
          </p>

          <ul>
            {benefits.map((benefit) => (
              <li key={benefit}>
                <span><Icon name="check" /></span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.previewCard} aria-hidden="true">
          <div className={styles.previewHeader}>
            <div>
              <span>Resumen del día</span>
              <strong>Inventario saludable</strong>
            </div>
            <span className={styles.liveBadge}><i /> En vivo</span>
          </div>
          <div className={styles.previewStats}>
            <div>
              <span className={styles.previewIcon}><Icon name="package" /></span>
              <p>Productos</p>
              <strong>1,248</strong>
              <small>+8.4% este mes</small>
            </div>
            <div>
              <span className={`${styles.previewIcon} ${styles.warningIcon}`}><Icon name="warning" /></span>
              <p>Stock bajo</p>
              <strong>23</strong>
              <small>Requieren atención</small>
            </div>
            <div>
              <span className={`${styles.previewIcon} ${styles.moneyIcon}`}><Icon name="dollar" /></span>
              <p>Valor total</p>
              <strong>$245k</strong>
              <small>+12.6% este mes</small>
            </div>
          </div>
          <div className={styles.previewChart}>
            <div className={styles.chartLabels}><span>Movimientos</span><strong>Últimos 7 días</strong></div>
            <div className={styles.bars}>
              {[44, 62, 51, 75, 58, 86, 70].map((height, index) => (
                <span key={height} style={{ height: `${height}%` }} className={index === 5 ? styles.activeBar : ""} />
              ))}
            </div>
          </div>
        </div>

        <p className={styles.copyright}>© 2026 Abarrotes · Operación simple, negocio fuerte.</p>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.mobileBrand}>
          <span className={styles.brandMark}><Icon name="cart" /></span>
          <span>Abarrotes</span>
        </div>

        <div className={styles.formCard}>
          <div className={styles.formIcon}><Icon name="shield" /></div>
          <p className={styles.formEyebrow}>Portal administrativo</p>
          <h2>Bienvenido de nuevo</h2>
          <p className={styles.formSubtitle}>Ingresa tus datos para acceder al inventario.</p>

          <form action={formAction} noValidate>
            {state.error && (
              <div className={styles.formError} role="alert">
                <Icon name="warning" />
                <span>{state.error}</span>
              </div>
            )}

            <label className={styles.field}>
              <span>Correo electrónico</span>
              <div className={`${styles.inputShell} ${state.fieldErrors.email ? styles.inputError : ""}`}>
                <Icon name="mail" />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nombre@tienda.com"
                  defaultValue="admin@abarrotes.mx"
                  aria-invalid={Boolean(state.fieldErrors.email)}
                  aria-describedby={state.fieldErrors.email ? "email-error" : undefined}
                  required
                />
              </div>
              {state.fieldErrors.email && <small id="email-error">{state.fieldErrors.email}</small>}
            </label>

            <label className={styles.field}>
              <span>Contraseña</span>
              <div className={`${styles.inputShell} ${state.fieldErrors.password ? styles.inputError : ""}`}>
                <Icon name="lock" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  defaultValue="admin123"
                  aria-invalid={Boolean(state.fieldErrors.password)}
                  aria-describedby={state.fieldErrors.password ? "password-error" : undefined}
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  <Icon name={showPassword ? "eye-off" : "eye"} />
                </button>
              </div>
              {state.fieldErrors.password && <small id="password-error">{state.fieldErrors.password}</small>}
            </label>

            <div className={styles.formOptions}>
              <label className={styles.rememberMe}>
                <input name="remember" type="checkbox" />
                <span aria-hidden="true"><Icon name="check" /></span>
                Mantener mi sesión
              </label>
              <span>Acceso para administradores</span>
            </div>

            <button className={styles.submitButton} type="submit" disabled={isPending}>
              {isPending ? <span className={styles.spinner} /> : <Icon name="arrow-right" />}
              {isPending ? "Verificando..." : "Iniciar sesión"}
            </button>
          </form>

          <div className={styles.demoAccess}>
            <span><Icon name="shield" /></span>
            <div>
              <strong>Acceso de demostración</strong>
              <p><b>Correo:</b> admin@abarrotes.mx</p>
              <p><b>Contraseña:</b> admin123</p>
            </div>
          </div>

          <p className={styles.supportText}>
            ¿Problemas para ingresar? <span>Contacta al administrador de tu tienda.</span>
          </p>
        </div>
      </section>
    </main>
  );
}
