<script setup lang="ts">
import { ref, computed } from 'vue'
import { cadastroUsuariosStore, type CadastroUsuario } from '../store'

const busca = ref('')
const modalAberto = ref(false)
const editando = ref<CadastroUsuario | null>(null)

const form = ref<Omit<CadastroUsuario, 'id' | 'ultimoAcesso'>>({
  nome: '', email: '', perfil: 'Operador', status: 'Ativo',
})
const erros = ref<Partial<Record<keyof typeof form.value, string>>>({})

const usuarios = computed(() =>
  cadastroUsuariosStore.value.filter(u =>
    !busca.value ||
    u.nome.toLowerCase().includes(busca.value.toLowerCase()) ||
    u.email.toLowerCase().includes(busca.value.toLowerCase())
  )
)

function abrirNovo() {
  editando.value = null
  form.value = { nome: '', email: '', perfil: 'Operador', status: 'Ativo' }
  erros.value = {}
  modalAberto.value = true
}

function abrirEditar(u: CadastroUsuario) {
  editando.value = u
  form.value = { nome: u.nome, email: u.email, perfil: u.perfil, status: u.status }
  erros.value = {}
  modalAberto.value = true
}

function validar() {
  erros.value = {}
  if (!form.value.nome.trim()) erros.value.nome = 'Nome é obrigatório.'
  if (!form.value.email.trim()) erros.value.email = 'E-mail é obrigatório.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) erros.value.email = 'E-mail inválido.'
  return Object.keys(erros.value).length === 0
}

function salvar() {
  if (!validar()) return
  const agora = new Date().toLocaleString('pt-BR')
  if (editando.value) {
    const idx = cadastroUsuariosStore.value.findIndex(u => u.id === editando.value!.id)
    if (idx !== -1) cadastroUsuariosStore.value[idx] = { ...editando.value, ...form.value, ultimoAcesso: editando.value.ultimoAcesso }
  } else {
    const novoId = `usr-${String(cadastroUsuariosStore.value.length + 1).padStart(3, '0')}`
    cadastroUsuariosStore.value.push({ id: novoId, ...form.value, ultimoAcesso: agora })
  }
  modalAberto.value = false
}

const perfilClasses: Record<string, string> = {
  'Admin':    'badge badge--indigo',
  'Analista': 'badge badge--blue',
  'Operador': 'badge badge--gray2',
}
const statusClasses: Record<string, string> = {
  'Ativo': 'badge badge--teal',
  'Inativo': 'badge badge--gray',
}
</script>

<template>
  <main class="cu-main">
    <div class="cu-header">
      <div>
        <p class="cu-breadcrumb">Cadastro</p>
        <h1 class="cu-title">Usuários</h1>
      </div>
      <button class="cu-btn-novo" @click="abrirNovo">+ Novo Usuário</button>
    </div>

    <div class="cu-toolbar">
      <input v-model="busca" type="search" class="cu-search" placeholder="Buscar por nome ou e-mail…" aria-label="Buscar usuários" />
      <span class="cu-count">{{ usuarios.length }} registro{{ usuarios.length !== 1 ? 's' : '' }}</span>
    </div>

    <div class="cu-table-wrap">
      <table class="cu-table" aria-label="Usuários cadastrados">
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Perfil</th>
            <th>Status</th>
            <th>Último Acesso</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="usuarios.length === 0">
            <td colspan="6" class="cu-empty">Nenhum usuário encontrado.</td>
          </tr>
          <tr v-for="u in usuarios" :key="u.id">
            <td class="cu-td-nome">{{ u.nome }}</td>
            <td>{{ u.email }}</td>
            <td><span :class="perfilClasses[u.perfil]">{{ u.perfil }}</span></td>
            <td><span :class="statusClasses[u.status]">{{ u.status }}</span></td>
            <td>{{ u.ultimoAcesso }}</td>
            <td><button class="cu-btn-edit" @click="abrirEditar(u)" :aria-label="`Editar ${u.nome}`">Editar</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <teleport to="body">
      <div v-if="modalAberto" class="cu-overlay" role="dialog" :aria-label="editando ? 'Editar usuário' : 'Novo usuário'" @click.self="modalAberto = false">
        <div class="cu-modal">
          <div class="cu-modal__head">
            <h2 class="cu-modal__title">{{ editando ? 'Editar Usuário' : 'Novo Usuário' }}</h2>
            <button class="cu-modal__close" @click="modalAberto = false" aria-label="Fechar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="cu-modal__body">
            <div class="cu-field">
              <label class="cu-label" for="cu-nome">Nome completo</label>
              <input id="cu-nome" v-model="form.nome" class="cu-input" :class="{ 'cu-input--err': erros.nome }" @input="erros.nome = ''" />
              <span v-if="erros.nome" class="cu-err" role="alert">{{ erros.nome }}</span>
            </div>
            <div class="cu-field">
              <label class="cu-label" for="cu-email">E-mail</label>
              <input id="cu-email" v-model="form.email" type="email" class="cu-input" :class="{ 'cu-input--err': erros.email }" @input="erros.email = ''" placeholder="nome@dock.tech" />
              <span v-if="erros.email" class="cu-err" role="alert">{{ erros.email }}</span>
            </div>
            <div class="cu-row">
              <div class="cu-field">
                <label class="cu-label" for="cu-perfil">Perfil</label>
                <select id="cu-perfil" v-model="form.perfil" class="cu-select">
                  <option>Operador</option>
                  <option>Analista</option>
                  <option>Admin</option>
                </select>
              </div>
              <div class="cu-field">
                <label class="cu-label" for="cu-status">Status</label>
                <select id="cu-status" v-model="form.status" class="cu-select">
                  <option>Ativo</option>
                  <option>Inativo</option>
                </select>
              </div>
            </div>
          </div>
          <div class="cu-modal__foot">
            <button class="cu-btn-cancel" @click="modalAberto = false">Cancelar</button>
            <button class="cu-btn-save" @click="salvar">Salvar</button>
          </div>
        </div>
      </div>
    </teleport>
  </main>
</template>

<style scoped>
.cu-main { padding: var(--sp-6) var(--sp-8); display: flex; flex-direction: column; gap: var(--sp-5); max-width: 1000px; }
.cu-header { display: flex; justify-content: space-between; align-items: flex-end; }
.cu-breadcrumb { font-size: var(--fs-fine); color: var(--text-muted); margin: 0 0 2px; }
.cu-title { font-family: var(--font-display); font-size: var(--fs-h2); font-weight: 700; color: var(--text-strong); margin: 0; }
.cu-btn-novo { padding: var(--sp-2_5) var(--sp-5); background: var(--admin-blue); color: #fff; border: none; border-radius: var(--radius-input); font-size: var(--fs-label); font-weight: 600; cursor: pointer; transition: background 0.15s; }
.cu-btn-novo:hover { background: var(--admin-blue-hover); }
.cu-toolbar { display: flex; align-items: center; gap: var(--sp-4); }
.cu-search { flex: 1; height: 38px; padding: 0 var(--sp-3); border: 1px solid var(--border-hairline); border-radius: var(--radius-input); font-size: var(--fs-label); background: var(--surface-page); color: var(--text-body); }
.cu-search:focus { outline: 2px solid var(--admin-blue); border-color: var(--admin-blue); }
.cu-count { font-size: var(--fs-fine); color: var(--text-muted); white-space: nowrap; }
.cu-table-wrap { overflow-x: auto; border-radius: var(--radius-card); border: 1px solid var(--border-hairline); }
.cu-table { width: 100%; border-collapse: collapse; font-size: var(--fs-label); }
.cu-table th { background: var(--surface-muted); padding: var(--sp-3) var(--sp-4); text-align: left; font-weight: 600; color: var(--text-strong); border-bottom: 1px solid var(--border-hairline); white-space: nowrap; }
.cu-table td { padding: var(--sp-3) var(--sp-4); border-bottom: 1px solid var(--border-hairline); color: var(--text-body); vertical-align: middle; }
.cu-table tr:last-child td { border-bottom: none; }
.cu-table tr:hover td { background: var(--surface-muted); }
.cu-td-nome { font-weight: 500; color: var(--text-strong); }
.cu-empty { text-align: center; color: var(--text-muted); padding: var(--sp-8) !important; }
.cu-btn-edit { padding: var(--sp-1_5) var(--sp-3); background: transparent; border: 1px solid var(--border-hairline); border-radius: var(--radius-input); font-size: var(--fs-fine); font-weight: 600; color: var(--admin-blue); cursor: pointer; }
.cu-btn-edit:hover { background: var(--surface-muted); }
.cu-overlay { position: fixed; inset: 0; background: rgba(14,42,92,0.55); z-index: 200; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
.cu-modal { background: var(--surface-page); border-radius: var(--radius-card); width: 460px; max-width: calc(100vw - 32px); box-shadow: 0 20px 60px rgba(0,0,0,0.25); }
.cu-modal__head { display: flex; justify-content: space-between; align-items: center; padding: var(--sp-5) var(--sp-6); border-bottom: 1px solid var(--border-hairline); }
.cu-modal__title { font-family: var(--font-display); font-size: var(--fs-h3); font-weight: 700; color: var(--text-strong); margin: 0; }
.cu-modal__close { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: var(--sp-1); border-radius: var(--radius-input); }
.cu-modal__close:hover { background: var(--surface-muted); }
.cu-modal__body { padding: var(--sp-6); display: flex; flex-direction: column; gap: var(--sp-4); }
.cu-modal__foot { padding: var(--sp-4) var(--sp-6); border-top: 1px solid var(--border-hairline); display: flex; justify-content: flex-end; gap: var(--sp-3); }
.cu-row { display: flex; gap: var(--sp-4); }
.cu-row .cu-field { flex: 1; }
.cu-field { display: flex; flex-direction: column; gap: var(--sp-1_5); }
.cu-label { font-size: var(--fs-label); font-weight: 600; color: var(--text-strong); }
.cu-input, .cu-select { height: 38px; padding: 0 var(--sp-3); border: 1px solid var(--border-hairline); border-radius: var(--radius-input); font-size: var(--fs-label); background: var(--surface-page); color: var(--text-body); width: 100%; box-sizing: border-box; }
.cu-input:focus, .cu-select:focus { outline: 2px solid var(--admin-blue); border-color: var(--admin-blue); }
.cu-input--err { border-color: #dc3545; }
.cu-err { font-size: 12px; color: #dc3545; }
.cu-btn-cancel { padding: var(--sp-2_5) var(--sp-5); background: var(--surface-muted); color: var(--text-body); border: 1px solid var(--border-hairline); border-radius: var(--radius-input); font-size: var(--fs-label); font-weight: 600; cursor: pointer; }
.cu-btn-save { padding: var(--sp-2_5) var(--sp-5); background: var(--admin-blue); color: #fff; border: none; border-radius: var(--radius-input); font-size: var(--fs-label); font-weight: 600; cursor: pointer; transition: background 0.15s; }
.cu-btn-save:hover { background: var(--admin-blue-hover); }
.badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.badge--indigo { background: #e0e7ff; color: #4338ca; }
.badge--blue   { background: var(--admin-blue-100); color: var(--admin-blue); }
.badge--teal   { background: #BBF3D4; color: #0A5C36; }
.badge--gray   { background: #f3f4f6; color: #6b7280; }
.badge--gray2  { background: #f1f5f9; color: #475569; }
</style>
