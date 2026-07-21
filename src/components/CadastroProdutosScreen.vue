<script setup lang="ts">
import { ref, computed } from 'vue'
import { cadastroProdutosStore, type CadastroProduto } from '../store'

const busca = ref('')
const modalAberto = ref(false)
const editando = ref<CadastroProduto | null>(null)
const form = ref<Omit<CadastroProduto, 'id'>>({
  codigo: '', nome: '', modalidade: 'Consignado', prazoMin: 6, prazoMax: 60,
  valorMin: '', valorMax: '', status: 'Ativo',
})
const erros = ref<Partial<Record<keyof Omit<CadastroProduto, 'id'>, string>>>({})

const produtos = computed(() =>
  cadastroProdutosStore.value.filter(p =>
    !busca.value ||
    p.nome.toLowerCase().includes(busca.value.toLowerCase()) ||
    p.codigo.toLowerCase().includes(busca.value.toLowerCase())
  )
)

function abrirNovo() {
  editando.value = null
  form.value = { codigo: '', nome: '', modalidade: 'Consignado', prazoMin: 6, prazoMax: 60, valorMin: '', valorMax: '', status: 'Ativo' }
  erros.value = {}
  modalAberto.value = true
}
function abrirEditar(p: CadastroProduto) {
  editando.value = p
  form.value = { codigo: p.codigo, nome: p.nome, modalidade: p.modalidade, prazoMin: p.prazoMin, prazoMax: p.prazoMax, valorMin: p.valorMin, valorMax: p.valorMax, status: p.status }
  erros.value = {}
  modalAberto.value = true
}
function validar() {
  erros.value = {}
  if (!form.value.codigo.trim()) erros.value.codigo = 'Código é obrigatório.'
  if (!form.value.nome.trim()) erros.value.nome = 'Nome é obrigatório.'
  if (form.value.prazoMax <= form.value.prazoMin) erros.value.prazoMax = 'Prazo máximo deve ser maior que o mínimo.'
  if (!form.value.valorMin.trim()) erros.value.valorMin = 'Valor mínimo é obrigatório.'
  if (!form.value.valorMax.trim()) erros.value.valorMax = 'Valor máximo é obrigatório.'
  return Object.keys(erros.value).length === 0
}
function salvar() {
  if (!validar()) return
  if (editando.value) {
    const idx = cadastroProdutosStore.value.findIndex(p => p.id === editando.value!.id)
    if (idx !== -1) cadastroProdutosStore.value[idx] = { ...editando.value, ...form.value }
  } else {
    cadastroProdutosStore.value.push({ id: `prod-${String(cadastroProdutosStore.value.length + 1).padStart(3, '0')}`, ...form.value })
  }
  modalAberto.value = false
}

const statusClasses: Record<string, string> = { 'Ativo': 'badge badge--teal', 'Inativo': 'badge badge--gray' }
</script>

<template>
  <main class="cp-main">
    <div class="cp-header">
      <div>
        <p class="cp-breadcrumb">Cadastro</p>
        <h1 class="cp-title">Produtos</h1>
      </div>
      <button class="cp-btn-novo" @click="abrirNovo">+ Novo Produto</button>
    </div>

    <div class="cp-toolbar">
      <input v-model="busca" type="search" class="cp-search" placeholder="Buscar por nome ou código…" aria-label="Buscar produtos" />
      <span class="cp-count">{{ produtos.length }} produto{{ produtos.length !== 1 ? 's' : '' }}</span>
    </div>

    <div class="cp-table-wrap">
      <table class="cp-table" aria-label="Produtos cadastrados">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nome</th>
            <th>Modalidade</th>
            <th>Prazo (meses)</th>
            <th>Valor Mín.</th>
            <th>Valor Máx.</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="produtos.length === 0">
            <td colspan="8" class="cp-empty">Nenhum produto encontrado.</td>
          </tr>
          <tr v-for="p in produtos" :key="p.id">
            <td class="cp-td-code">{{ p.codigo }}</td>
            <td class="cp-td-nome">{{ p.nome }}</td>
            <td>{{ p.modalidade }}</td>
            <td>{{ p.prazoMin }} – {{ p.prazoMax }}</td>
            <td>{{ p.valorMin }}</td>
            <td>{{ p.valorMax }}</td>
            <td><span :class="statusClasses[p.status]">{{ p.status }}</span></td>
            <td><button class="cp-btn-edit" @click="abrirEditar(p)" :aria-label="`Editar ${p.nome}`">Editar</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <teleport to="body">
      <div v-if="modalAberto" class="cp-overlay" role="dialog" :aria-label="editando ? 'Editar produto' : 'Novo produto'" @click.self="modalAberto = false">
        <div class="cp-modal">
          <div class="cp-modal__head">
            <h2 class="cp-modal__title">{{ editando ? 'Editar Produto' : 'Novo Produto' }}</h2>
            <button class="cp-modal__close" @click="modalAberto = false" aria-label="Fechar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="cp-modal__body">
            <div class="cp-row">
              <div class="cp-field">
                <label class="cp-label" for="cp-cod">Código</label>
                <input id="cp-cod" v-model="form.codigo" class="cp-input" :class="{ 'cp-input--err': erros.codigo }" @input="erros.codigo = ''" />
                <span v-if="erros.codigo" class="cp-err" role="alert">{{ erros.codigo }}</span>
              </div>
              <div class="cp-field" style="flex:2">
                <label class="cp-label" for="cp-nome">Nome</label>
                <input id="cp-nome" v-model="form.nome" class="cp-input" :class="{ 'cp-input--err': erros.nome }" @input="erros.nome = ''" />
                <span v-if="erros.nome" class="cp-err" role="alert">{{ erros.nome }}</span>
              </div>
            </div>
            <div class="cp-row">
              <div class="cp-field">
                <label class="cp-label" for="cp-modal">Modalidade</label>
                <select id="cp-modal" v-model="form.modalidade" class="cp-select">
                  <option>Consignado</option>
                  <option>Crédito Pessoal</option>
                  <option>FGTS</option>
                </select>
              </div>
              <div class="cp-field">
                <label class="cp-label" for="cp-status">Status</label>
                <select id="cp-status" v-model="form.status" class="cp-select">
                  <option>Ativo</option>
                  <option>Inativo</option>
                </select>
              </div>
            </div>
            <div class="cp-row">
              <div class="cp-field">
                <label class="cp-label" for="cp-pmin">Prazo Mín. (meses)</label>
                <input id="cp-pmin" v-model.number="form.prazoMin" type="number" min="1" class="cp-input" />
              </div>
              <div class="cp-field">
                <label class="cp-label" for="cp-pmax">Prazo Máx. (meses)</label>
                <input id="cp-pmax" v-model.number="form.prazoMax" type="number" min="1" class="cp-input" :class="{ 'cp-input--err': erros.prazoMax }" @input="erros.prazoMax = ''" />
                <span v-if="erros.prazoMax" class="cp-err" role="alert">{{ erros.prazoMax }}</span>
              </div>
            </div>
            <div class="cp-row">
              <div class="cp-field">
                <label class="cp-label" for="cp-vmin">Valor Mín.</label>
                <input id="cp-vmin" v-model="form.valorMin" class="cp-input" :class="{ 'cp-input--err': erros.valorMin }" placeholder="R$ 0,00" @input="erros.valorMin = ''" />
                <span v-if="erros.valorMin" class="cp-err" role="alert">{{ erros.valorMin }}</span>
              </div>
              <div class="cp-field">
                <label class="cp-label" for="cp-vmax">Valor Máx.</label>
                <input id="cp-vmax" v-model="form.valorMax" class="cp-input" :class="{ 'cp-input--err': erros.valorMax }" placeholder="R$ 0,00" @input="erros.valorMax = ''" />
                <span v-if="erros.valorMax" class="cp-err" role="alert">{{ erros.valorMax }}</span>
              </div>
            </div>
          </div>
          <div class="cp-modal__foot">
            <button class="cp-btn-cancel" @click="modalAberto = false">Cancelar</button>
            <button class="cp-btn-save" @click="salvar">Salvar</button>
          </div>
        </div>
      </div>
    </teleport>
  </main>
</template>

<style scoped>
.cp-main { padding: var(--sp-6) var(--sp-8); display: flex; flex-direction: column; gap: var(--sp-5); max-width: 1100px; }
.cp-header { display: flex; justify-content: space-between; align-items: flex-end; }
.cp-breadcrumb { font-size: var(--fs-fine); color: var(--text-muted); margin: 0 0 2px; }
.cp-title { font-family: var(--font-display); font-size: var(--fs-h2); font-weight: 700; color: var(--text-strong); margin: 0; }
.cp-btn-novo { padding: var(--sp-2_5) var(--sp-5); background: var(--admin-blue); color: #fff; border: none; border-radius: var(--radius-input); font-size: var(--fs-label); font-weight: 600; cursor: pointer; transition: background 0.15s; }
.cp-btn-novo:hover { background: var(--admin-blue-hover); }
.cp-toolbar { display: flex; align-items: center; gap: var(--sp-4); }
.cp-search { flex: 1; height: 38px; padding: 0 var(--sp-3); border: 1px solid var(--border-hairline); border-radius: var(--radius-input); font-size: var(--fs-label); background: var(--surface-page); color: var(--text-body); }
.cp-search:focus { outline: 2px solid var(--admin-blue); border-color: var(--admin-blue); }
.cp-count { font-size: var(--fs-fine); color: var(--text-muted); white-space: nowrap; }
.cp-table-wrap { overflow-x: auto; border-radius: var(--radius-card); border: 1px solid var(--border-hairline); }
.cp-table { width: 100%; border-collapse: collapse; font-size: var(--fs-label); }
.cp-table th { background: var(--surface-muted); padding: var(--sp-3) var(--sp-4); text-align: left; font-weight: 600; color: var(--text-strong); border-bottom: 1px solid var(--border-hairline); white-space: nowrap; }
.cp-table td { padding: var(--sp-3) var(--sp-4); border-bottom: 1px solid var(--border-hairline); color: var(--text-body); vertical-align: middle; }
.cp-table tr:last-child td { border-bottom: none; }
.cp-table tr:hover td { background: var(--surface-muted); }
.cp-td-code { font-family: monospace; font-size: var(--fs-fine); font-weight: 600; }
.cp-td-nome { font-weight: 500; color: var(--text-strong); }
.cp-empty { text-align: center; color: var(--text-muted); padding: var(--sp-8) !important; }
.cp-btn-edit { padding: var(--sp-1_5) var(--sp-3); background: transparent; border: 1px solid var(--border-hairline); border-radius: var(--radius-input); font-size: var(--fs-fine); font-weight: 600; color: var(--admin-blue); cursor: pointer; }
.cp-btn-edit:hover { background: var(--surface-muted); }
.cp-overlay { position: fixed; inset: 0; background: rgba(14,42,92,0.55); z-index: 200; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
.cp-modal { background: var(--surface-page); border-radius: var(--radius-card); width: 520px; max-width: calc(100vw - 32px); box-shadow: 0 20px 60px rgba(0,0,0,0.25); }
.cp-modal__head { display: flex; justify-content: space-between; align-items: center; padding: var(--sp-5) var(--sp-6); border-bottom: 1px solid var(--border-hairline); }
.cp-modal__title { font-family: var(--font-display); font-size: var(--fs-h3); font-weight: 700; color: var(--text-strong); margin: 0; }
.cp-modal__close { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: var(--sp-1); border-radius: var(--radius-input); }
.cp-modal__close:hover { background: var(--surface-muted); }
.cp-modal__body { padding: var(--sp-6); display: flex; flex-direction: column; gap: var(--sp-4); }
.cp-modal__foot { padding: var(--sp-4) var(--sp-6); border-top: 1px solid var(--border-hairline); display: flex; justify-content: flex-end; gap: var(--sp-3); }
.cp-row { display: flex; gap: var(--sp-4); }
.cp-row .cp-field { flex: 1; }
.cp-field { display: flex; flex-direction: column; gap: var(--sp-1_5); }
.cp-label { font-size: var(--fs-label); font-weight: 600; color: var(--text-strong); }
.cp-input, .cp-select { height: 38px; padding: 0 var(--sp-3); border: 1px solid var(--border-hairline); border-radius: var(--radius-input); font-size: var(--fs-label); background: var(--surface-page); color: var(--text-body); width: 100%; box-sizing: border-box; }
.cp-input:focus, .cp-select:focus { outline: 2px solid var(--admin-blue); border-color: var(--admin-blue); }
.cp-input--err { border-color: #dc3545; }
.cp-err { font-size: 12px; color: #dc3545; }
.cp-btn-cancel { padding: var(--sp-2_5) var(--sp-5); background: var(--surface-muted); color: var(--text-body); border: 1px solid var(--border-hairline); border-radius: var(--radius-input); font-size: var(--fs-label); font-weight: 600; cursor: pointer; }
.cp-btn-save { padding: var(--sp-2_5) var(--sp-5); background: var(--admin-blue); color: #fff; border: none; border-radius: var(--radius-input); font-size: var(--fs-label); font-weight: 600; cursor: pointer; transition: background 0.15s; }
.cp-btn-save:hover { background: var(--admin-blue-hover); }
.badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.badge--teal { background: #BBF3D4; color: #0A5C36; }
.badge--gray { background: #f3f4f6; color: #6b7280; }
</style>
