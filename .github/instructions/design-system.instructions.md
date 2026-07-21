---
applyTo: "**"
---

# GitHub Copilot — Instruções do Design System

Este repositório usa `shared-design-system-vue-lib` (Vue 3 + TypeScript).
**Sempre prefira os componentes `Ds*` a elementos HTML nativos.**

---

## Instalação e setup

```bash
# 1. Configurar .npmrc na raiz do projeto
# registry=https://nexus.dock.tech/repository/npm-internal/
# //nexus.dock.tech/repository/npm-internal/:_authToken=${NODE_AUTH_TOKEN}

# 2. Instalar o DS
npm install shared-design-system-vue-lib
```

```ts
// main.ts
import { createApp } from 'vue'
import 'shared-design-system-vue-lib/dist/tokens.css'
import App from './App.vue'
createApp(App).mount('#app')
```

---

## Importação

```ts
import {
  DsButton, DsInput, DsCard, DsModal, DsTable, DsDataGrid,
  DsAlert, DsBadge, DsToast, DsToastProvider, DsSelect,
  DsTextarea, DsSwitch, DsCheckbox, DsRadioGroup,
} from 'shared-design-system-vue-lib'

import {
  useToast, useModal, useConfirm, useTheme,
  useFormValidation, useI18n, useAuthorization,
} from 'shared-design-system-vue-lib'

import {
  required, email, cpf, cnpj, minLength, maxLength, minValue, maxValue,
} from 'shared-design-system-vue-lib'

import {
  formatCurrency, formatCPF, maskCPF, formatCNPJ, formatDate,
} from 'shared-design-system-vue-lib'

import { financeGlossary, getGlossaryTerm } from 'shared-design-system-vue-lib'
```

---

## Regras para o Copilot

- **SEMPRE** use `Ds*` em vez de `<button>`, `<input>`, `<table>`, `<select>`, etc.
- **SEMPRE** importe de `shared-design-system-vue-lib` — nunca de caminhos internos do pacote.
- **SEMPRE** inclua `shared-design-system-vue-lib/dist/tokens.css` no entry point da aplicação.
- **NUNCA** crie componentes de UI do zero se já existe um equivalente no DS.
- **NUNCA** use Tailwind ou CSS inline para espaçamento/cores — use os tokens via `var(--ds-*)`.
- Use `useToast()` para feedback de operações assíncronas, não `alert()`.
- Use `useConfirm()` para ações destrutivas, não `window.confirm()`.
- Para validação de formulários, use `useFormValidation` + validators do DS (`cpf()`, `cnpj()`, `email()`, etc.).
- Para formatação de CPF/CNPJ/moeda, use os formatadores do DS (`formatCPF`, `formatCNPJ`, `formatCurrency`).
- Jargões financeiros: use `DsTermTooltip` ou `getGlossaryTerm()` para exibir definições inline.