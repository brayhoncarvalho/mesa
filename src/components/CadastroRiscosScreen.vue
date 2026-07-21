<script setup lang="ts">
import { ref } from 'vue'
import { cadastroRiscosStore, type CadastroRisco } from '../store'

const modalAberto = ref(false)
const editando = ref<CadastroRisco | null>(null)
const form = ref({ scoreMin: 0, scoreMax: 0, nivel: 'Médio' as CadastroRisco['nivel'], descricao: '' })
const erros = ref({ scoreMin: '', scoreMax: '', descricao: '' })

function abrirNovo() {
  editando.value = null
  form.value = { scoreMin: 0, scoreMax: 0, nivel: 'Médio', descricao: '' }
  erros.value = { scoreMin: '', scoreMax: '', descricao: '' }
  modalAberto.value = true
}
function abrirEditar(r: CadastroRisco) {
  editando.value = r
  form.value = { scoreMin: r.scoreMin, scoreMax: r.scoreMax, nivel: r.nivel, descricao: r.descricao }
  erros.value = { scoreMin: '', scoreMax: '', descricao: '' }
  modalAberto.value = true
}
function validar() {
  erros.value = { scoreMin: '', scoreMax: '', descricao: '' }
  if (form.value.scoreMin < 0) erros.value.scoreMin = 'Score mínimo inválido.'
  if (form.value.scoreMax <= form.value.scoreMin) erros.value.scoreMax = 'Score máximo deve ser maior que o mínimo.'
  if (!form.value.descricao.trim()) erros.value.descricao = 'Descrição é obrigatória.'
  return !erros.value.scoreMin && !erros.value.scoreMax && !erros.value.descricao
}
function salvar() {
  if (!validar()) return
  if (editando.value) {
    const idx = cadastroRiscosStore.value.findIndex(r => r.id === editando.value!.id)
    if (idx !== -1) cadastroRiscosStore.value[idx] = { ...editando.value, ...form.value }
  } else {
    cadastroRiscosStore.value.push({
      id: `risco-${String(cadastroRiscosStore.value.length + 1).padStart(3, '0')}`,
      ...form.value,
    })
  }
  modalAberto.value = false
}

const nivelClasses: Record<string, string> = {
  'Muito Alto':  'badge badge--red',
  'Alto':        'badge badge--orange',
  'Médio':       'badge badge--yellow',
  'Baixo':       'badge badge--blue',
  'Muito Baixo': 'badge badge--teal',
}
</script>

<template>
  <main class="cr-main">
    <div class="cr-header">
      <div>
        <p class="cr-breadcrumb">Cadastro</p>
        <h1 class="cr-title">Faixas de Risco</h1>
      </div>
      <button class="cr-btn-novo" @click="abrirNovo">+ Nova Faixa</button>
    </div>

    <div class="cr-table-wrap">
      <table class="cr-table" aria-label="Faixas de risco cadastradas">
        <thead>
          <tr>
            <th>Score Mín.</th>
            <th>Score Máx.</th>
            <th>Nível de Risco</th>
            <th>Descrição</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in cadastroRiscosStore" :key="r.id">
            <td class="cr-td-score">{{ r.scoreMin }}</td>
            <td class="cr-td-score">{{ r.scoreMax }}</td>
            <td><span :class="nivelClasses[r.nivel]">{{ r.nivel }}</span></td>
            <td class="cr-td-desc">{{ r.descricao }}</td>
            <td><button class="cr-btn-edit" @click="abrirEditar(r)" :aria-label="`Editar faixa ${r.nivel}`">Editar</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <teleport to="body">
      <div v-if="modalAberto" class="cr-overlay" role="dialog" :aria-label="editando ? 'Editar faixa de risco' : 'Nova faixa de risco'" @click.self="modalAberto = false">
        <div class="cr-modal">
          <div class="cr-modal__head">
            <h2 class="cr-modal__title">{{ editando ? 'Editar Faixa' : 'Nova Faixa de Risco' }}</h2>
            <button class="cr-modal__close" @click="modalAberto = false" aria-label="Fechar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="cr-modal__body">
            <div class="cr-row">
              <div class="cr-field">
                <label class="cr-label" for="cr-smin">Score Mínimo</label>
                <input id="cr-smin" v-model.number="form.scoreMin" type="number" min="0" max="1000" class="cr-input" :class="{ 'cr-input--err': erros.scoreMin }" @input="erros.scoreMin = ''" />
                <span v-if="erros.scoreMin" class="cr-err" role="alert">{{ erros.scoreMin }}</span>
              </div>
              <div class="cr-field">
                <label class="cr-label" for="cr-smax">Score Máximo</label>
                <input id="cr-smax" v-model.number="form.scoreMax" type="number" min="0" max="1000" class="cr-input" :class="{ 'cr-input--err': erros.scoreMax }" @input="erros.scoreMax = ''" />
                <span v-if="erros.scoreMax" class="cr-err" role="alert">{{ erros.scoreMax }}</span>
              </div>
            </div>
            <div class="cr-field">
              <label class="cr-label" for="cr-nivel">Nível de Risco</label>
              <select id="cr-nivel" v-model="form.nivel" class="cr-select">
                <option>Muito Alto</option>
                <option>Alto</option>
                <option>Médio</option>
                <option>Baixo</option>
                <option>Muito Baixo</option>
              </select>
            </div>
            <div class="cr-field">
              <label class="cr-label" for="cr-desc">Descrição</label>
              <input id="cr-desc" v-model="form.descricao" class="cr-input" :class="{ 'cr-input--err': erros.descricao }" @input="erros.descricao = ''" />
              <span v-if="erros.descricao" class="cr-err" role="alert">{{ erros.descricao }}</span>
            </div>
          </div>
          <div class="cr-modal__foot">
            <button class="cr-btn-cancel" @click="modalAberto = false">Cancelar</button>
            <button class="cr-btn-save" @click="salvar">Salvar</button>
          </div>
        </div>
      </div>
    </teleport>
  </main>
</template>

<style scoped>
.cr-main { padding: var(--sp-6) var(--sp-8); display: flex; flex-direction: column; gap: var(--sp-5); max-width: 900px; }
.cr-header { display: flex; justify-content: space-between; align-items: flex-end; }
.cr-breadcrumb { font-size: var(--fs-fine); color: var(--text-muted); margin: 0 0 2px; }
.cr-title { font-family: var(--font-display); font-size: var(--fs-h2); font-weight: 700; color: var(--text-strong); margin: 0; }
.cr-btn-novo { padding: var(--sp-2_5) var(--sp-5); background: var(--admin-blue); color: #fff; border: none; border-radius: var(--radius-input); font-size: var(--fs-label); font-weight: 600; cursor: pointer; transition: background 0.15s; }
.cr-btn-novo:hover { background: var(--admin-blue-hover); }
.cr-table-wrap { overflow-x: auto; border-radius: var(--radius-card); border: 1px solid var(--border-hairline); }
.cr-table { width: 100%; border-collapse: collapse; font-size: var(--fs-label); }
.cr-table th { background: var(--surface-muted); padding: var(--sp-3) var(--sp-4); text-align: left; font-weight: 600; color: var(--text-strong); border-bottom: 1px solid var(--border-hairline); white-space: nowrap; }
.cr-table td { padding: var(--sp-3) var(--sp-4); border-bottom: 1px solid var(--border-hairline); color: var(--text-body); vertical-align: middle; }
.cr-table tr:last-child td { border-bottom: none; }
.cr-table tr:hover td { background: var(--surface-muted); }
.cr-td-score { font-family: monospace; font-size: var(--fs-label); font-weight: 600; }
.cr-td-desc { color: var(--text-muted); font-size: var(--fs-fine); }
.cr-btn-edit { padding: var(--sp-1_5) var(--sp-3); background: transparent; border: 1px solid var(--border-hairline); border-radius: var(--radius-input); font-size: var(--fs-fine); font-weight: 600; color: var(--admin-blue); cursor: pointer; }
.cr-btn-edit:hover { background: var(--surface-muted); }
.cr-overlay { position: fixed; inset: 0; background: rgba(14,42,92,0.55); z-index: 200; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
.cr-modal { background: var(--surface-page); border-radius: var(--radius-card); width: 440px; max-width: calc(100vw - 32px); box-shadow: 0 20px 60px rgba(0,0,0,0.25); }
.cr-modal__head { display: flex; justify-content: space-between; align-items: center; padding: var(--sp-5) var(--sp-6); border-bottom: 1px solid var(--border-hairline); }
.cr-modal__title { font-family: var(--font-display); font-size: var(--fs-h3); font-weight: 700; color: var(--text-strong); margin: 0; }
.cr-modal__close { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: var(--sp-1); border-radius: var(--radius-input); }
.cr-modal__close:hover { background: var(--surface-muted); }
.cr-modal__body { padding: var(--sp-6); display: flex; flex-direction: column; gap: var(--sp-4); }
.cr-modal__foot { padding: var(--sp-4) var(--sp-6); border-top: 1px solid var(--border-hairline); display: flex; justify-content: flex-end; gap: var(--sp-3); }
.cr-row { display: flex; gap: var(--sp-4); }
.cr-row .cr-field { flex: 1; }
.cr-field { display: flex; flex-direction: column; gap: var(--sp-1_5); }
.cr-label { font-size: var(--fs-label); font-weight: 600; color: var(--text-strong); }
.cr-input, .cr-select { height: 38px; padding: 0 var(--sp-3); border: 1px solid var(--border-hairline); border-radius: var(--radius-input); font-size: var(--fs-label); background: var(--surface-page); color: var(--text-body); width: 100%; box-sizing: border-box; }
.cr-input:focus, .cr-select:focus { outline: 2px solid var(--admin-blue); border-color: var(--admin-blue); }
.cr-input--err { border-color: #dc3545; }
.cr-err { font-size: 12px; color: #dc3545; }
.cr-btn-cancel { padding: var(--sp-2_5) var(--sp-5); background: var(--surface-muted); color: var(--text-body); border: 1px solid var(--border-hairline); border-radius: var(--radius-input); font-size: var(--fs-label); font-weight: 600; cursor: pointer; }
.cr-btn-save { padding: var(--sp-2_5) var(--sp-5); background: var(--admin-blue); color: #fff; border: none; border-radius: var(--radius-input); font-size: var(--fs-label); font-weight: 600; cursor: pointer; transition: background 0.15s; }
.cr-btn-save:hover { background: var(--admin-blue-hover); }
.badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.badge--red    { background: var(--error-50); color: var(--error-600); }
.badge--orange { background: #ffedd5; color: #c2410c; }
.badge--yellow { background: #fef9c3; color: #854d0e; }
.badge--blue   { background: var(--admin-blue-100); color: var(--admin-blue); }
.badge--teal   { background: #BBF3D4; color: #0A5C36; }
</style>
