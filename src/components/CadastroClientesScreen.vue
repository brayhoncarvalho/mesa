<script setup lang="ts">
import { ref, computed } from 'vue'
import { cadastroClientesStore, type CadastroCliente } from '../store'

const busca = ref('')
const modalAberto = ref(false)
const editando = ref<CadastroCliente | null>(null)

const form = ref<Omit<CadastroCliente, 'id' | 'ultimaAtualizacao'>>({
  nome: '', cpfCnpj: '', canal: 'Web', status: 'Ativo', limiteAprovado: '',
})
const erros = ref<Partial<Record<keyof typeof form.value, string>>>({})

const clientes = computed(() =>
  cadastroClientesStore.value.filter(c =>
    !busca.value ||
    c.nome.toLowerCase().includes(busca.value.toLowerCase()) ||
    c.cpfCnpj.includes(busca.value)
  )
)

function abrirNovo() {
  editando.value = null
  form.value = { nome: '', cpfCnpj: '', canal: 'Web', status: 'Ativo', limiteAprovado: '' }
  erros.value = {}
  modalAberto.value = true
}

function abrirEditar(c: CadastroCliente) {
  editando.value = c
  form.value = { nome: c.nome, cpfCnpj: c.cpfCnpj, canal: c.canal, status: c.status, limiteAprovado: c.limiteAprovado }
  erros.value = {}
  modalAberto.value = true
}

function validar() {
  erros.value = {}
  if (!form.value.nome.trim()) erros.value.nome = 'Nome é obrigatório.'
  if (!form.value.cpfCnpj.trim()) erros.value.cpfCnpj = 'CPF/CNPJ é obrigatório.'
  if (!form.value.limiteAprovado.trim()) erros.value.limiteAprovado = 'Limite é obrigatório.'
  return Object.keys(erros.value).length === 0
}

function salvar() {
  if (!validar()) return
  const hoje = new Date().toLocaleDateString('pt-BR')
  if (editando.value) {
    const idx = cadastroClientesStore.value.findIndex(c => c.id === editando.value!.id)
    if (idx !== -1) cadastroClientesStore.value[idx] = { ...editando.value, ...form.value, ultimaAtualizacao: hoje }
  } else {
    const novoId = `cli-${String(cadastroClientesStore.value.length + 1).padStart(3, '0')}`
    cadastroClientesStore.value.push({ id: novoId, ...form.value, ultimaAtualizacao: hoje })
  }
  modalAberto.value = false
}

const statusClasses: Record<string, string> = {
  'Ativo': 'badge badge--teal',
  'Inativo': 'badge badge--gray',
}
</script>

<template>
  <main class="cc-main">
    <div class="cc-header">
      <div>
        <p class="cc-breadcrumb">Cadastro</p>
        <h1 class="cc-title">Clientes</h1>
      </div>
      <button class="cc-btn-novo" @click="abrirNovo">+ Novo Cliente</button>
    </div>

    <!-- Barra de busca -->
    <div class="cc-toolbar">
      <input
        v-model="busca"
        type="search"
        class="cc-search"
        placeholder="Buscar por nome ou CPF/CNPJ…"
        aria-label="Buscar clientes"
      />
      <span class="cc-count">{{ clientes.length }} registro{{ clientes.length !== 1 ? 's' : '' }}</span>
    </div>

    <!-- Tabela -->
    <div class="cc-table-wrap">
      <table class="cc-table" aria-label="Clientes cadastrados">
        <thead>
          <tr>
            <th>Nome</th>
            <th>CPF / CNPJ</th>
            <th>Canal</th>
            <th>Limite Aprovado</th>
            <th>Status</th>
            <th>Última Atualização</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="clientes.length === 0">
            <td colspan="7" class="cc-empty">Nenhum cliente encontrado.</td>
          </tr>
          <tr v-for="c in clientes" :key="c.id">
            <td class="cc-td-nome">{{ c.nome }}</td>
            <td class="cc-td-mono">{{ c.cpfCnpj }}</td>
            <td>{{ c.canal }}</td>
            <td class="cc-td-valor">{{ c.limiteAprovado }}</td>
            <td><span :class="statusClasses[c.status]">{{ c.status }}</span></td>
            <td>{{ c.ultimaAtualizacao }}</td>
            <td>
              <button class="cc-btn-edit" @click="abrirEditar(c)" :aria-label="`Editar ${c.nome}`">Editar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de edição / criação -->
    <teleport to="body">
      <div v-if="modalAberto" class="cc-overlay" role="dialog" :aria-label="editando ? 'Editar cliente' : 'Novo cliente'" @click.self="modalAberto = false">
        <div class="cc-modal">
          <div class="cc-modal__head">
            <h2 class="cc-modal__title">{{ editando ? 'Editar Cliente' : 'Novo Cliente' }}</h2>
            <button class="cc-modal__close" @click="modalAberto = false" aria-label="Fechar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="cc-modal__body">
            <div class="cc-field">
              <label class="cc-label" for="cc-nome">Nome completo</label>
              <input id="cc-nome" v-model="form.nome" class="cc-input" :class="{ 'cc-input--err': erros.nome }" @blur="() => { if (!form.nome.trim()) erros.nome = 'Obrigatório' }" @input="erros.nome = ''" />
              <span v-if="erros.nome" class="cc-err" role="alert">{{ erros.nome }}</span>
            </div>
            <div class="cc-field">
              <label class="cc-label" for="cc-cpfcnpj">CPF / CNPJ</label>
              <input id="cc-cpfcnpj" v-model="form.cpfCnpj" class="cc-input" :class="{ 'cc-input--err': erros.cpfCnpj }" placeholder="000.000.000-00" @input="erros.cpfCnpj = ''" />
              <span v-if="erros.cpfCnpj" class="cc-err" role="alert">{{ erros.cpfCnpj }}</span>
            </div>
            <div class="cc-row">
              <div class="cc-field">
                <label class="cc-label" for="cc-canal">Canal</label>
                <select id="cc-canal" v-model="form.canal" class="cc-select">
                  <option>Web</option>
                  <option>Unimed</option>
                  <option>Bradesco</option>
                  <option>iFood</option>
                  <option>Sicoob</option>
                </select>
              </div>
              <div class="cc-field">
                <label class="cc-label" for="cc-status">Status</label>
                <select id="cc-status" v-model="form.status" class="cc-select">
                  <option>Ativo</option>
                  <option>Inativo</option>
                </select>
              </div>
            </div>
            <div class="cc-field">
              <label class="cc-label" for="cc-limite">Limite Aprovado</label>
              <input id="cc-limite" v-model="form.limiteAprovado" class="cc-input" :class="{ 'cc-input--err': erros.limiteAprovado }" placeholder="R$ 0,00" @input="erros.limiteAprovado = ''" />
              <span v-if="erros.limiteAprovado" class="cc-err" role="alert">{{ erros.limiteAprovado }}</span>
            </div>
          </div>
          <div class="cc-modal__foot">
            <button class="cc-btn-cancel" @click="modalAberto = false">Cancelar</button>
            <button class="cc-btn-save" @click="salvar">Salvar</button>
          </div>
        </div>
      </div>
    </teleport>
  </main>
</template>

<style scoped>
.cc-main { padding: var(--sp-6) var(--sp-8); display: flex; flex-direction: column; gap: var(--sp-5); max-width: 1100px; }
.cc-header { display: flex; justify-content: space-between; align-items: flex-end; }
.cc-breadcrumb { font-size: var(--fs-fine); color: var(--text-muted); margin: 0 0 2px; }
.cc-title { font-family: var(--font-display); font-size: var(--fs-h2); font-weight: 700; color: var(--text-strong); margin: 0; }
.cc-btn-novo { padding: var(--sp-2_5) var(--sp-5); background: var(--admin-blue); color: #fff; border: none; border-radius: var(--radius-input); font-size: var(--fs-label); font-weight: 600; cursor: pointer; transition: background 0.15s; }
.cc-btn-novo:hover { background: var(--admin-blue-hover); }
.cc-btn-novo:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: 2px; }

.cc-toolbar { display: flex; align-items: center; gap: var(--sp-4); }
.cc-search { flex: 1; height: 38px; padding: 0 var(--sp-3); border: 1px solid var(--border-hairline); border-radius: var(--radius-input); font-size: var(--fs-label); background: var(--surface-page); color: var(--text-body); }
.cc-search:focus { outline: 2px solid var(--admin-blue); outline-offset: 1px; border-color: var(--admin-blue); }
.cc-count { font-size: var(--fs-fine); color: var(--text-muted); white-space: nowrap; }

.cc-table-wrap { overflow-x: auto; border-radius: var(--radius-card); border: 1px solid var(--border-hairline); }
.cc-table { width: 100%; border-collapse: collapse; font-size: var(--fs-label); }
.cc-table th { background: var(--surface-muted); padding: var(--sp-3) var(--sp-4); text-align: left; font-weight: 600; color: var(--text-strong); border-bottom: 1px solid var(--border-hairline); white-space: nowrap; }
.cc-table td { padding: var(--sp-3) var(--sp-4); border-bottom: 1px solid var(--border-hairline); color: var(--text-body); vertical-align: middle; }
.cc-table tr:last-child td { border-bottom: none; }
.cc-table tr:hover td { background: var(--surface-muted); }
.cc-td-nome { font-weight: 500; color: var(--text-strong); }
.cc-td-mono { font-family: monospace; font-size: var(--fs-fine); }
.cc-td-valor { font-weight: 500; }
.cc-empty { text-align: center; color: var(--text-muted); padding: var(--sp-8) !important; }
.cc-btn-edit { padding: var(--sp-1_5) var(--sp-3); background: transparent; border: 1px solid var(--border-hairline); border-radius: var(--radius-input); font-size: var(--fs-fine); font-weight: 600; color: var(--admin-blue); cursor: pointer; transition: background 0.12s; }
.cc-btn-edit:hover { background: var(--surface-muted); }
.cc-btn-edit:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: 2px; }

/* Modal */
.cc-overlay { position: fixed; inset: 0; background: rgba(14,42,92,0.55); z-index: 200; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
.cc-modal { background: var(--surface-page); border-radius: var(--radius-card); width: 480px; max-width: calc(100vw - 32px); box-shadow: 0 20px 60px rgba(0,0,0,0.25); display: flex; flex-direction: column; }
.cc-modal__head { display: flex; justify-content: space-between; align-items: center; padding: var(--sp-5) var(--sp-6); border-bottom: 1px solid var(--border-hairline); }
.cc-modal__title { font-family: var(--font-display); font-size: var(--fs-h3); font-weight: 700; color: var(--text-strong); margin: 0; }
.cc-modal__close { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: var(--sp-1); border-radius: var(--radius-input); }
.cc-modal__close:hover { background: var(--surface-muted); }
.cc-modal__close:focus-visible { outline: 2px solid var(--admin-blue); }
.cc-modal__body { padding: var(--sp-6); display: flex; flex-direction: column; gap: var(--sp-4); }
.cc-modal__foot { padding: var(--sp-4) var(--sp-6); border-top: 1px solid var(--border-hairline); display: flex; justify-content: flex-end; gap: var(--sp-3); }
.cc-field { display: flex; flex-direction: column; gap: var(--sp-1_5); }
.cc-row { display: flex; gap: var(--sp-4); }
.cc-row .cc-field { flex: 1; }
.cc-label { font-size: var(--fs-label); font-weight: 600; color: var(--text-strong); }
.cc-input, .cc-select { height: 38px; padding: 0 var(--sp-3); border: 1px solid var(--border-hairline); border-radius: var(--radius-input); font-size: var(--fs-label); background: var(--surface-page); color: var(--text-body); width: 100%; box-sizing: border-box; }
.cc-input:focus, .cc-select:focus { outline: 2px solid var(--admin-blue); outline-offset: 1px; border-color: var(--admin-blue); }
.cc-input--err { border-color: #dc3545; }
.cc-err { font-size: 12px; color: #dc3545; }
.cc-btn-cancel { padding: var(--sp-2_5) var(--sp-5); background: var(--surface-muted); color: var(--text-body); border: 1px solid var(--border-hairline); border-radius: var(--radius-input); font-size: var(--fs-label); font-weight: 600; cursor: pointer; }
.cc-btn-cancel:hover { background: var(--border-hairline); }
.cc-btn-save { padding: var(--sp-2_5) var(--sp-5); background: var(--admin-blue); color: #fff; border: none; border-radius: var(--radius-input); font-size: var(--fs-label); font-weight: 600; cursor: pointer; transition: background 0.15s; }
.cc-btn-save:hover { background: var(--admin-blue-hover); }
.cc-btn-save:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: 2px; }

.badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.badge--teal { background: #BBF3D4; color: #0A5C36; }
.badge--gray { background: #f3f4f6; color: #6b7280; }
</style>
