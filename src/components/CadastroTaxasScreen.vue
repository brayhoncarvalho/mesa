<script setup lang="ts">
import { ref, computed } from 'vue'
import { cadastroTaxasStore, cadastroProdutosStore, type CadastroTaxa } from '../store'

const filtroProduto = ref('')
const modalAberto = ref(false)
const editando = ref<CadastroTaxa | null>(null)
const form = ref<Omit<CadastroTaxa, 'id'>>({
  produto: '', prazo: 12, taxaMensal: '', taxaAnual: '', cet: '',
  vigenciaInicio: '', vigenciaFim: '',
})
const erros = ref<Partial<Record<keyof Omit<CadastroTaxa, 'id'>, string>>>({})

const taxas = computed(() =>
  cadastroTaxasStore.value.filter(t =>
    !filtroProduto.value || t.produto === filtroProduto.value
  )
)
const produtos = computed(() => cadastroProdutosStore.value.map(p => p.nome))

function abrirNovo() {
  editando.value = null
  form.value = { produto: produtos.value[0] ?? '', prazo: 12, taxaMensal: '', taxaAnual: '', cet: '', vigenciaInicio: '', vigenciaFim: '' }
  erros.value = {}
  modalAberto.value = true
}
function abrirEditar(t: CadastroTaxa) {
  editando.value = t
  form.value = { produto: t.produto, prazo: t.prazo, taxaMensal: t.taxaMensal, taxaAnual: t.taxaAnual, cet: t.cet, vigenciaInicio: t.vigenciaInicio, vigenciaFim: t.vigenciaFim }
  erros.value = {}
  modalAberto.value = true
}
function validar() {
  erros.value = {}
  if (!form.value.produto) erros.value.produto = 'Selecione um produto.'
  if (!form.value.taxaMensal.trim()) erros.value.taxaMensal = 'Obrigatório.'
  if (!form.value.taxaAnual.trim()) erros.value.taxaAnual = 'Obrigatório.'
  if (!form.value.cet.trim()) erros.value.cet = 'Obrigatório.'
  if (!form.value.vigenciaInicio.trim()) erros.value.vigenciaInicio = 'Obrigatório.'
  if (!form.value.vigenciaFim.trim()) erros.value.vigenciaFim = 'Obrigatório.'
  return Object.keys(erros.value).length === 0
}
function salvar() {
  if (!validar()) return
  if (editando.value) {
    const idx = cadastroTaxasStore.value.findIndex(t => t.id === editando.value!.id)
    if (idx !== -1) cadastroTaxasStore.value[idx] = { ...editando.value, ...form.value }
  } else {
    cadastroTaxasStore.value.push({ id: `taxa-${String(cadastroTaxasStore.value.length + 1).padStart(3, '0')}`, ...form.value })
  }
  modalAberto.value = false
}
</script>

<template>
  <main class="ct-main">
    <div class="ct-header">
      <div>
        <p class="ct-breadcrumb">Cadastro</p>
        <h1 class="ct-title">Taxas</h1>
      </div>
      <button class="ct-btn-novo" @click="abrirNovo">+ Nova Taxa</button>
    </div>

    <div class="ct-toolbar">
      <select v-model="filtroProduto" class="ct-select" aria-label="Filtrar por produto">
        <option value="">Todos os produtos</option>
        <option v-for="p in produtos" :key="p" :value="p">{{ p }}</option>
      </select>
      <span class="ct-count">{{ taxas.length }} registro{{ taxas.length !== 1 ? 's' : '' }}</span>
    </div>

    <div class="ct-table-wrap">
      <table class="ct-table" aria-label="Taxas cadastradas">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Prazo (meses)</th>
            <th>Taxa a.m.</th>
            <th>Taxa a.a.</th>
            <th>CET</th>
            <th>Vigência Início</th>
            <th>Vigência Fim</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="taxas.length === 0">
            <td colspan="8" class="ct-empty">Nenhuma taxa encontrada.</td>
          </tr>
          <tr v-for="t in taxas" :key="t.id">
            <td class="ct-td-produto">{{ t.produto }}</td>
            <td class="ct-td-num">{{ t.prazo }}</td>
            <td class="ct-td-taxa">{{ t.taxaMensal }}</td>
            <td class="ct-td-taxa">{{ t.taxaAnual }}</td>
            <td class="ct-td-taxa">{{ t.cet }}</td>
            <td>{{ t.vigenciaInicio }}</td>
            <td>{{ t.vigenciaFim }}</td>
            <td><button class="ct-btn-edit" @click="abrirEditar(t)" :aria-label="`Editar taxa ${t.produto} ${t.prazo}m`">Editar</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <teleport to="body">
      <div v-if="modalAberto" class="ct-overlay" role="dialog" :aria-label="editando ? 'Editar taxa' : 'Nova taxa'" @click.self="modalAberto = false">
        <div class="ct-modal">
          <div class="ct-modal__head">
            <h2 class="ct-modal__title">{{ editando ? 'Editar Taxa' : 'Nova Taxa' }}</h2>
            <button class="ct-modal__close" @click="modalAberto = false" aria-label="Fechar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="ct-modal__body">
            <div class="ct-row">
              <div class="ct-field" style="flex:2">
                <label class="ct-label" for="ct-prod">Produto</label>
                <select id="ct-prod" v-model="form.produto" class="ct-select-input" :class="{ 'ct-input--err': erros.produto }">
                  <option value="" disabled>Selecione…</option>
                  <option v-for="p in produtos" :key="p" :value="p">{{ p }}</option>
                </select>
                <span v-if="erros.produto" class="ct-err" role="alert">{{ erros.produto }}</span>
              </div>
              <div class="ct-field">
                <label class="ct-label" for="ct-prazo">Prazo (meses)</label>
                <input id="ct-prazo" v-model.number="form.prazo" type="number" min="1" class="ct-input" />
              </div>
            </div>
            <div class="ct-row">
              <div class="ct-field">
                <label class="ct-label" for="ct-tm">Taxa a.m. (%)</label>
                <input id="ct-tm" v-model="form.taxaMensal" class="ct-input" :class="{ 'ct-input--err': erros.taxaMensal }" placeholder="0,00%" @input="erros.taxaMensal = ''" />
                <span v-if="erros.taxaMensal" class="ct-err" role="alert">{{ erros.taxaMensal }}</span>
              </div>
              <div class="ct-field">
                <label class="ct-label" for="ct-ta">Taxa a.a. (%)</label>
                <input id="ct-ta" v-model="form.taxaAnual" class="ct-input" :class="{ 'ct-input--err': erros.taxaAnual }" placeholder="0,00%" @input="erros.taxaAnual = ''" />
                <span v-if="erros.taxaAnual" class="ct-err" role="alert">{{ erros.taxaAnual }}</span>
              </div>
              <div class="ct-field">
                <label class="ct-label" for="ct-cet">CET (%)</label>
                <input id="ct-cet" v-model="form.cet" class="ct-input" :class="{ 'ct-input--err': erros.cet }" placeholder="0,00%" @input="erros.cet = ''" />
                <span v-if="erros.cet" class="ct-err" role="alert">{{ erros.cet }}</span>
              </div>
            </div>
            <div class="ct-row">
              <div class="ct-field">
                <label class="ct-label" for="ct-vi">Vigência Início</label>
                <input id="ct-vi" v-model="form.vigenciaInicio" class="ct-input" :class="{ 'ct-input--err': erros.vigenciaInicio }" placeholder="DD/MM/AAAA" @input="erros.vigenciaInicio = ''" />
                <span v-if="erros.vigenciaInicio" class="ct-err" role="alert">{{ erros.vigenciaInicio }}</span>
              </div>
              <div class="ct-field">
                <label class="ct-label" for="ct-vf">Vigência Fim</label>
                <input id="ct-vf" v-model="form.vigenciaFim" class="ct-input" :class="{ 'ct-input--err': erros.vigenciaFim }" placeholder="DD/MM/AAAA" @input="erros.vigenciaFim = ''" />
                <span v-if="erros.vigenciaFim" class="ct-err" role="alert">{{ erros.vigenciaFim }}</span>
              </div>
            </div>
          </div>
          <div class="ct-modal__foot">
            <button class="ct-btn-cancel" @click="modalAberto = false">Cancelar</button>
            <button class="ct-btn-save" @click="salvar">Salvar</button>
          </div>
        </div>
      </div>
    </teleport>
  </main>
</template>

<style scoped>
.ct-main { padding: var(--sp-6) var(--sp-8); display: flex; flex-direction: column; gap: var(--sp-5); max-width: 1100px; }
.ct-header { display: flex; justify-content: space-between; align-items: flex-end; }
.ct-breadcrumb { font-size: var(--fs-fine); color: var(--text-muted); margin: 0 0 2px; }
.ct-title { font-family: var(--font-display); font-size: var(--fs-h2); font-weight: 700; color: var(--text-strong); margin: 0; }
.ct-btn-novo { padding: var(--sp-2_5) var(--sp-5); background: var(--admin-blue); color: #fff; border: none; border-radius: var(--radius-input); font-size: var(--fs-label); font-weight: 600; cursor: pointer; transition: background 0.15s; }
.ct-btn-novo:hover { background: var(--admin-blue-hover); }
.ct-toolbar { display: flex; align-items: center; gap: var(--sp-4); }
.ct-select { height: 38px; padding: 0 var(--sp-3); border: 1px solid var(--border-hairline); border-radius: var(--radius-input); font-size: var(--fs-label); background: var(--surface-page); color: var(--text-body); cursor: pointer; }
.ct-select:focus { outline: 2px solid var(--admin-blue); border-color: var(--admin-blue); }
.ct-count { font-size: var(--fs-fine); color: var(--text-muted); white-space: nowrap; }
.ct-table-wrap { overflow-x: auto; border-radius: var(--radius-card); border: 1px solid var(--border-hairline); }
.ct-table { width: 100%; border-collapse: collapse; font-size: var(--fs-label); }
.ct-table th { background: var(--surface-muted); padding: var(--sp-3) var(--sp-4); text-align: left; font-weight: 600; color: var(--text-strong); border-bottom: 1px solid var(--border-hairline); white-space: nowrap; }
.ct-table td { padding: var(--sp-3) var(--sp-4); border-bottom: 1px solid var(--border-hairline); color: var(--text-body); vertical-align: middle; }
.ct-table tr:last-child td { border-bottom: none; }
.ct-table tr:hover td { background: var(--surface-muted); }
.ct-td-produto { font-weight: 500; color: var(--text-strong); }
.ct-td-num { font-family: monospace; text-align: right; }
.ct-td-taxa { font-family: monospace; font-weight: 600; }
.ct-empty { text-align: center; color: var(--text-muted); padding: var(--sp-8) !important; }
.ct-btn-edit { padding: var(--sp-1_5) var(--sp-3); background: transparent; border: 1px solid var(--border-hairline); border-radius: var(--radius-input); font-size: var(--fs-fine); font-weight: 600; color: var(--admin-blue); cursor: pointer; }
.ct-btn-edit:hover { background: var(--surface-muted); }
.ct-overlay { position: fixed; inset: 0; background: rgba(14,42,92,0.55); z-index: 200; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
.ct-modal { background: var(--surface-page); border-radius: var(--radius-card); width: 540px; max-width: calc(100vw - 32px); box-shadow: 0 20px 60px rgba(0,0,0,0.25); }
.ct-modal__head { display: flex; justify-content: space-between; align-items: center; padding: var(--sp-5) var(--sp-6); border-bottom: 1px solid var(--border-hairline); }
.ct-modal__title { font-family: var(--font-display); font-size: var(--fs-h3); font-weight: 700; color: var(--text-strong); margin: 0; }
.ct-modal__close { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: var(--sp-1); border-radius: var(--radius-input); }
.ct-modal__close:hover { background: var(--surface-muted); }
.ct-modal__body { padding: var(--sp-6); display: flex; flex-direction: column; gap: var(--sp-4); }
.ct-modal__foot { padding: var(--sp-4) var(--sp-6); border-top: 1px solid var(--border-hairline); display: flex; justify-content: flex-end; gap: var(--sp-3); }
.ct-row { display: flex; gap: var(--sp-4); }
.ct-row .ct-field { flex: 1; }
.ct-field { display: flex; flex-direction: column; gap: var(--sp-1_5); }
.ct-label { font-size: var(--fs-label); font-weight: 600; color: var(--text-strong); }
.ct-input, .ct-select-input { height: 38px; padding: 0 var(--sp-3); border: 1px solid var(--border-hairline); border-radius: var(--radius-input); font-size: var(--fs-label); background: var(--surface-page); color: var(--text-body); width: 100%; box-sizing: border-box; }
.ct-input:focus, .ct-select-input:focus { outline: 2px solid var(--admin-blue); border-color: var(--admin-blue); }
.ct-input--err { border-color: #dc3545; }
.ct-err { font-size: 12px; color: #dc3545; }
.ct-btn-cancel { padding: var(--sp-2_5) var(--sp-5); background: var(--surface-muted); color: var(--text-body); border: 1px solid var(--border-hairline); border-radius: var(--radius-input); font-size: var(--fs-label); font-weight: 600; cursor: pointer; }
.ct-btn-save { padding: var(--sp-2_5) var(--sp-5); background: var(--admin-blue); color: #fff; border: none; border-radius: var(--radius-input); font-size: var(--fs-label); font-weight: 600; cursor: pointer; transition: background 0.15s; }
.ct-btn-save:hover { background: var(--admin-blue-hover); }
</style>
