<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authStore } from '../store'

const router = useRouter()

// -- Mock de credenciais -------------------------------------------------
const IS_MOCK = true
const MOCK_EMAIL = 'operador@dock.tech'
const MOCK_SENHA = '1234'

const email = ref(IS_MOCK ? MOCK_EMAIL : '')
const senha = ref(IS_MOCK ? MOCK_SENHA : '')
const showSenha = ref(false)
const isLoading = ref(false)
const submitted = ref(false)

const touched = reactive({ email: false, senha: false })

// -- Validação inline ----------------------------------------------
const emailError = computed(() => {
  if (!submitted.value && !touched.email) return ''
  if (!email.value.trim()) return 'E-mail obrigatório.'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value.trim())) return 'E-mail inválido.'
  return ''
})

const senhaError = computed(() => {
  if (!submitted.value && !touched.senha) return ''
  if (!senha.value.trim()) return 'Senha obrigatória.'
  if (senha.value.trim().length < 4) return 'Senha deve ter ao menos 4 caracteres.'
  return ''
})

const isFormValid = computed(() => !emailError.value && !senhaError.value && email.value && senha.value)

// -- Submit --------------------------------------------------------
async function handleLogin() {
  submitted.value = true
  touched.email = true
  touched.senha = true

  if (!isFormValid.value) return

  isLoading.value = true
  // Mock: sem delay real de API
  await new Promise(resolve => setTimeout(resolve, IS_MOCK ? 400 : 1200))
  isLoading.value = false

  authStore.login(email.value.trim())
  router.push('/dashboard')
}
</script>

<template>
  <div class="login-page">

    <!-- Background decorativo -->
    <div class="login-bg" aria-hidden="true">
      <div class="login-bg__orb login-bg__orb--1"></div>
      <div class="login-bg__orb login-bg__orb--2"></div>
    </div>

    <main class="login-main">

      <!-- Card de login -->
      <div class="login-card" role="main">

        <!-- Logo -->
        <div class="login-card__logo-wrap">
          <img
            src="/assets/dock-logo-color.png"
            alt="Dock"
            class="login-card__logo"
          />
          <span class="login-card__badge">Mesa de Aprovação</span>
        </div>

        <!-- Cabeçalho -->
        <div class="login-card__header">
          <h1 class="login-card__title">Bem-vindo de volta</h1>
          <p class="login-card__subtitle">Acesse sua conta para gerenciar e aprovar propostas de crédito.</p>
        </div>

        <!-- Formulário -->
        <form class="login-form" novalidate @submit.prevent="handleLogin">

          <!-- E-mail -->
          <div class="login-field" :class="{ 'is-error': !!emailError }">
            <label class="login-field__label" for="login-email">E-mail</label>
            <div class="login-field__wrap">
              <svg class="login-field__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" stroke-width="1.75"/>
                <path d="M2 7l10 7 10-7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
              </svg>
              <input
                id="login-email"
                v-model="email"
                type="email"
                inputmode="email"
                autocomplete="email"
                placeholder="seu@email.com"
                class="login-field__input"
                :aria-invalid="!!emailError || undefined"
                :aria-describedby="emailError ? 'login-email-err' : undefined"
                @blur="touched.email = true"
              />
            </div>
            <p v-if="emailError" id="login-email-err" class="login-field__error" role="alert">
              {{ emailError }}
            </p>
          </div>

          <!-- Senha -->
          <div class="login-field" :class="{ 'is-error': !!senhaError }">
            <label class="login-field__label" for="login-senha">Senha</label>
            <div class="login-field__wrap">
              <svg class="login-field__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.75"/>
                <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
              </svg>
              <input
                id="login-senha"
                v-model="senha"
                :type="showSenha ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                class="login-field__input login-field__input--senha"
                :aria-invalid="!!senhaError || undefined"
                :aria-describedby="senhaError ? 'login-senha-err' : undefined"
                @blur="touched.senha = true"
              />
              <button
                type="button"
                class="login-field__toggle"
                :aria-label="showSenha ? 'Ocultar senha' : 'Mostrar senha'"
                @click="showSenha = !showSenha"
              >
                <!-- Olho aberto -->
                <svg v-if="!showSenha" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.75"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.75"/>
                </svg>
                <!-- Olho fechado -->
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <p v-if="senhaError" id="login-senha-err" class="login-field__error" role="alert">
              {{ senhaError }}
            </p>
          </div>

          <!-- Esqueci senha -->
          <div class="login-forgot">
            <button type="button" class="login-forgot__btn">Esqueci minha senha</button>
          </div>

          <!-- Botão entrar -->
          <button
            type="submit"
            class="login-btn"
            :class="{ 'is-loading': isLoading }"
            :aria-busy="isLoading"
            :disabled="isLoading"
          >
            <span v-if="!isLoading">Entrar na Mesa</span>
            <span v-else class="login-btn__spinner" aria-hidden="true"></span>
          </button>

        </form>

        <!-- Badge de mock (dev only) -->
        <div v-if="IS_MOCK" class="login-mock-badge" role="status" aria-label="Ambiente de demonstração">
          <span class="login-mock-badge__dot" aria-hidden="true"></span>
          Persona — <strong>{{ MOCK_EMAIL }}</strong> / <strong>{{ MOCK_SENHA }}</strong>
        </div>

      </div>
    </main>

  </div>
</template>

<style scoped>

/* -- Página ------------------------------------------------------- */
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--sp-6) var(--sp-4) 80px;
  position: relative;
  overflow: hidden;
  background: var(--surface-page);
}

/* -- Background com orbs decorativos ------------------------------ */
.login-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.login-bg__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.14;
}
.login-bg__orb--1 {
  width: 500px; height: 500px;
  background: var(--admin-blue);
  top: -160px; right: -80px;
}
.login-bg__orb--2 {
  width: 380px; height: 380px;
  background: var(--admin-blue);
  bottom: -80px; left: -60px;
}

/* -- Main ---------------------------------------------------------- */
.login-main {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* -- Card ---------------------------------------------------------- */
.login-card {
  width: 100%;
  background: var(--surface-card);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card-lg);
  padding: var(--sp-9) var(--sp-8) var(--sp-8);
}

/* -- Logo ---------------------------------------------------------- */
.login-card__logo-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sp-7);
}
.login-card__logo {
  height: 24px; width: auto;
}
.login-card__badge {
  display: inline-flex;
  align-items: center;
  height: var(--h-badge);
  padding: 0 var(--sp-3);
  background: var(--admin-blue-100);
  color: var(--admin-blue);
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-size: var(--fs-fine);
  font-weight: 700;
  letter-spacing: var(--ls-microlabel);
  text-transform: uppercase;
}

/* -- Cabeçalho ----------------------------------------------------- */
.login-card__header {
  margin-bottom: var(--sp-7);
}
.login-card__title {
  font-family: var(--font-display);
  font-size: var(--fs-h1-flow);
  font-weight: 600;
  color: var(--text-heading);
  line-height: 1.15;
  letter-spacing: var(--ls-h1-flow);
  margin-bottom: var(--sp-1_5);
}
.login-card__subtitle {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--text-body);
  line-height: var(--lh-body);
}

/* -- Formulário ---------------------------------------------------- */
.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

/* -- Campo --------------------------------------------------------- */
.login-field {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1_5);
}
.login-field__label {
  font-family: var(--font-body);
  font-size: var(--fs-label);
  font-weight: 600;
  color: var(--text-heading);
}
.login-field__wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.login-field__icon {
  position: absolute;
  left: var(--sp-3_5);
  color: var(--text-muted);
  pointer-events: none;
  flex-shrink: 0;
}
.login-field__input {
  width: 100%;
  min-width: 0;
  height: var(--h-input);
  padding: 0 var(--sp-3_5) 0 var(--sp-10);
  border: 1.5px solid var(--border-input);
  border-radius: var(--radius-input);
  background: var(--surface-card);
  font-family: var(--font-body);
  font-size: var(--fs-ui);
  color: var(--text-heading);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.login-field__input::placeholder { color: var(--text-body); }
.login-field__input:focus {
  border-color: var(--admin-blue);
  box-shadow: 0 0 0 3px rgba(0, 216, 216, 0.18);
}
.login-field.is-error .login-field__input {
  border-color: var(--error-500);
}
.login-field__input--senha {
  padding-right: var(--sp-11, 44px);
}
.login-field__toggle {
  position: absolute;
  right: var(--sp-3_5);
  background: none;
  border: none;
  padding: var(--sp-1);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
}
.login-field__toggle:hover { color: var(--admin-blue); }
.login-field__error {
  font-family: var(--font-body);
  font-size: var(--fs-caption);
  color: var(--error-600);
}

/* -- Esqueci senha ------------------------------------------------- */
.login-forgot {
  display: flex;
  justify-content: flex-end;
  margin-top: calc(var(--sp-1) * -1);
}
.login-forgot__btn {
  background: none;
  border: none;
  font-family: var(--font-body);
  font-size: var(--fs-label);
  color: var(--admin-blue);
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.15s;
}
.login-forgot__btn:hover { color: var(--admin-blue); }

/* -- Botão Entrar -------------------------------------------------- */
.login-btn {
  width: 100%;
  height: var(--h-btn-lg);
  margin-top: var(--sp-1);
  background: var(--admin-blue);
  color: #ffffff;
  border: none;
  border-radius: var(--radius-pill);
  font-family: var(--font-display);
  font-size: var(--fs-h5);
  font-weight: 600;
  transition: background 0.15s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-btn:hover:not(:disabled) { background: var(--admin-blue-hover); }
.login-btn:active:not(:disabled) { transform: scale(0.99); }
.login-btn:disabled { opacity: 0.7; cursor: not-allowed; }

/* Spinner */
.login-btn__spinner {
  width: 20px; height: 20px;
  border: 2.5px solid rgba(255,255,255,0.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* -- Rodapé do card ------------------------------------------------ */
.login-card__footer {
  margin-top: var(--sp-6);
  padding-top: var(--sp-5);
  border-top: 1px solid var(--border-hairline);
  font-family: var(--font-body);
  font-size: var(--fs-fine);
  color: var(--text-muted);
  text-align: center;
  line-height: 1.6;
}

/* -- Footer da página ---------------------------------------------- */
.login-page__footer {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-4);
  background: rgba(250,252,252,0.9);
  backdrop-filter: blur(8px);
  font-family: var(--font-body);
  font-size: var(--fs-fine);
  color: var(--text-muted);
  border-top: 1px solid var(--border-hairline);
}
.login-page__footer-dot { opacity: 0.5; }

/* -- Badge de mock ------------------------------------------------- */
.login-mock-badge {
  margin-top: var(--sp-3);
  padding: var(--sp-2_5) var(--sp-3_5);
  background: #fffbeb;
  border: 1px dashed #f59e0b;
  border-radius: var(--radius-note);
  font-family: var(--font-body);
  font-size: var(--fs-caption);
  color: #a85e00;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  line-height: 1.4;
}
.login-mock-badge__dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #f59e0b;
  flex-shrink: 0;
  animation: pulse-dot 1.5s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* -- Responsivo ---------------------------------------------------- */
@media (max-width: 480px) {
  .login-card {
    border-radius: var(--radius-card);
    padding: var(--sp-7) var(--sp-5) var(--sp-6);
  }
  .login-card__title { font-size: 28px; }
}
</style>
