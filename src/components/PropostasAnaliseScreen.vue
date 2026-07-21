<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authStore, propostaStore, propostasListStore } from '../store'

const router = useRouter()

function analisar(p: PropostaRow) {
  propostaStore.set(p, p.tipoProduto ?? 'consignado')
  router.push(`/proposta/${p.id}`)
}

export interface PropostaRow {
  id: string
  qtd: number
  nome: string
  cpfCnpj: string
  canal: string
  dataBase: string
  liberado: string
  principal: string
  parcela: string
  dataSolicitacao: string
  ultimaTransicao: string
  ccb: string
  atividade: string
  situacao: string
  tipoProduto?: 'consignado' | 'emprestimo-pessoal'
  matricula?: string
  orgao?: string
  situacaoFuncional?: string
  tempoAdmissao?: string
  scoreCredito?: string
  limiteAprovado?: string
}

/* ── Filtros ───────────────────────────────────────────────────── */
const pesquisarPor   = ref('CPF/CNPJ')
const canal          = ref('')
const tipoOferta     = ref('')
const tipoProdutoFiltro = ref<'' | 'consignado' | 'emprestimo-pessoal'>('')
const atividade      = ref('')
const analista       = ref('')
const segmento       = ref('')
const instituicao    = ref('')
const situacao       = ref('')
const dataBaseInicio = ref('')
const dataBaseFim    = ref('')
const dataSolInicio  = ref('')
const dataSolFim     = ref('')
const campoBusca     = ref('')

/* ── Nav ───────────────────────────────────────────────────────── */
const navAtivo = ref('analise')
const navItems = [
  { key: 'analise',    label: 'Analise Mesa' },
  { key: 'cadastro',   label: 'Cadastro',   dropdown: true },
  { key: 'cobranca',   label: 'Cobrança',   dropdown: true },
]

const operadorNome = computed(() => {
  const [n] = authStore.email.split('@')
  return n.charAt(0).toUpperCase() + n.slice(1)
})
const operadorInicial = computed(() => operadorNome.value.charAt(0).toUpperCase())

/* ── Dados ─ usa store compartilhado com Dashboard ──────────────── */
const todasPropostas = propostasListStore

const propostasFiltradas = computed(() => {
  const q = campoBusca.value.toLowerCase()
  return todasPropostas.value.filter(p => {
    if (q && !p.nome.toLowerCase().includes(q) && !p.cpfCnpj.includes(q) && !p.id.includes(q)) return false
    if (canal.value     && p.canal     !== canal.value)     return false
    if (situacao.value  && p.situacao  !== situacao.value)  return false
    if (atividade.value && p.atividade !== atividade.value) return false
    if (tipoProdutoFiltro.value && p.tipoProduto !== tipoProdutoFiltro.value) return false
    return true
  })
})

function limparFiltros() {
  canal.value = ''; tipoOferta.value = ''; atividade.value = ''; analista.value = ''
  segmento.value = ''; instituicao.value = ''; situacao.value = ''; campoBusca.value = ''
  dataBaseInicio.value = ''; dataBaseFim.value = ''; dataSolInicio.value = ''; dataSolFim.value = ''
  tipoProdutoFiltro.value = ''
}

// Integração com fluxo Onboarding (Teste) via localStorage
// Atualiza a entrada 'web-onboarding' com os dados reais se o usuário concluiu o fluxo
onMounted(() => {
  try {
    const raw = localStorage.getItem('mesa_proposta_pendente')
    if (!raw) return
    const d = JSON.parse(raw) as Record<string, string>
    if (!d.cpf || !d.nome) return
    // Atualiza a proposta de onboarding existente em vez de duplicar
    const idx = todasPropostas.value.findIndex(p => p.id === 'web-onboarding')
    if (idx !== -1) {
      todasPropostas.value[idx] = {
        ...todasPropostas.value[idx],
        nome:            d.nome            ?? todasPropostas.value[idx].nome,
        cpfCnpj:         d.cpf             ?? todasPropostas.value[idx].cpfCnpj,
        principal:       d.valorEmprestimo ?? todasPropostas.value[idx].principal,
        dataSolicitacao: new Date().toLocaleDateString('pt-BR'),
        ultimaTransicao: new Date().toLocaleString('pt-BR'),
      }
    }
  } catch { /* localStorage corrompido — ignorar */ }
})

const filtrosAvancados = ref(false)
const avancadosLabel = computed(() => filtrosAvancados.value ? '▲ Menos filtros' : '▼ Filtros avançados')

const situacaoClasses: Record<string, string> = {
  'EmAnalise':    'badge badge--blue',
  'Formalização': 'badge badge--indigo',
  'Liberada':     'badge badge--teal',
  'Reprovada':    'badge badge--red',
  'Cancelada':    'badge badge--gray',
}

const situacaoLabel: Record<string, string> = {
  'EmAnalise':    'Em Análise',
  'Formalização': 'Formalização',
  'Liberada':     'Liberada',
  'Reprovada':    'Reprovada',
  'Cancelada':    'Cancelada',
}

const canalColors: Record<string, string> = {
  'Unimed':   '#1D4FD7',
  'Bradesco':  '#cc0000',
  'iFood':    '#ea1d2c',
  'Sicoob':   '#007f3e',
  'Web':      '#6c757d',
}
function getCanalBg(canal: string): string {
  return canalColors[canal] ?? '#6c757d'
}

function exportarCSV() {
  const cols = ['Nome', 'Tipo', 'CPF/CNPJ', 'Canal', 'Principal', 'Solicitação', 'Atividade', 'Situação']
  const rows = propostasFiltradas.value.map(p =>
    [p.nome, p.tipoProduto, p.cpfCnpj, p.canal, p.principal, p.dataSolicitacao, p.atividade, p.situacao].join(';')
  )
  const csv = [cols.join(';'), ...rows].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = 'propostas.csv'
  a.click()
}
</script>

<template>
  <main class="pa-main">

    <!-- ── Cabeçalho ─────────────────────────────────── -->
    <div class="pa-header">
      <div>
        <h1 class="pa-title">Propostas em Análise Mesa</h1>
        <p class="pa-subtitle">Acompanhe e decida as propostas da fila de análise</p>
      </div>
      <button class="pa-export-btn" @click="exportarCSV" aria-label="Exportar CSV">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Exportar CSV
      </button>
    </div>

    <!-- ── Filtros ────────────────────────────────────── -->
    <section class="pa-filters" aria-label="Filtros">
      <!-- Linha 1: pesquisa + canal + produto + situação -->
      <div class="pa-filter-grid">
        <div class="pa-field">
          <label for="f-busca" class="pa-field__label">Pesquisar</label>
          <div class="pa-search-wrap">
            <svg class="pa-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
              <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <input
              id="f-busca"
              v-model="campoBusca"
              type="search"
              class="pa-input pa-input--search"
              placeholder="Nome, CPF/CNPJ ou código..."
              aria-label="Pesquisar proposta"
            />
          </div>
        </div>

        <div class="pa-field">
          <label for="f-canal" class="pa-field__label">Canal</label>
          <select id="f-canal" v-model="canal" class="pa-select">
            <option value="">Todos</option>
            <option>Web</option>
            <option>Unimed</option>
            <option>Bradesco</option>
            <option>iFood</option>
            <option>Sicoob</option>
          </select>
        </div>

        <div class="pa-field">
          <label for="f-produto" class="pa-field__label">Produto</label>
          <select id="f-produto" v-model="tipoProdutoFiltro" class="pa-select">
            <option value="">Todos</option>
            <option value="consignado">Consignado</option>
            <option value="emprestimo-pessoal">Empréstimo Pessoal</option>
          </select>
        </div>

        <div class="pa-field">
          <label for="f-situacao" class="pa-field__label">Situação</label>
          <select id="f-situacao" v-model="situacao" class="pa-select">
            <option value="">Todas</option>
            <option value="EmAnalise">Em Análise</option>
            <option value="Formalização">Formalização</option>
            <option value="Liberada">Liberada</option>
            <option value="Reprovada">Reprovada</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      <!-- Linha avançada (expansível) -->
      <div v-if="filtrosAvancados" class="pa-filter-grid">
        <div class="pa-field">
          <label for="f-atividade" class="pa-field__label">Atividade</label>
          <select id="f-atividade" v-model="atividade" class="pa-select">
            <option value="">Todas</option>
            <option>Triagem</option>
            <option>Análise de Crédito</option>
            <option>Análise Mesa</option>
          </select>
        </div>

        <div class="pa-field">
          <label for="f-analista" class="pa-field__label">Analista</label>
          <select id="f-analista" v-model="analista" class="pa-select">
            <option value="">Todos</option>
            <option>Ana Souza</option>
            <option>Carlos Lima</option>
          </select>
        </div>

        <div class="pa-field">
          <label for="f-data-ini" class="pa-field__label">Solicitação a partir de</label>
          <input id="f-data-ini" v-model="dataSolInicio" type="date" class="pa-input" />
        </div>

        <div class="pa-field">
          <label for="f-data-fim" class="pa-field__label">Solicitação até</label>
          <input id="f-data-fim" v-model="dataSolFim" type="date" class="pa-input" />
        </div>
      </div>

      <!-- Rodapé de filtros -->
      <div class="pa-filter-footer">
        <button class="pa-btn-toggle" @click="filtrosAvancados = !filtrosAvancados" :aria-expanded="filtrosAvancados">
          {{ avancadosLabel }}
        </button>
        <button class="pa-btn-clear" @click="limparFiltros">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Limpar filtros
        </button>
      </div>
    </section>

    <!-- ── Resultados ─────────────────────────────────── -->
    <section class="pa-results" aria-label="Resultados">
      <div class="pa-results__header">
        <h2 class="pa-results__title">Propostas</h2>
        <span class="pa-results__count">{{ propostasFiltradas.length }} resultado{{ propostasFiltradas.length !== 1 ? 's' : '' }}</span>
      </div>

      <div class="pa-table-wrap">
        <table class="pa-table" aria-label="Lista de propostas em análise">
          <thead>
            <tr>
              <th class="pa-th pa-th--nome">Nome</th>
              <th class="pa-th">Tipo</th>
              <th class="pa-th">CPF/CNPJ</th>
              <th class="pa-th">Canal</th>
              <th class="pa-th pa-th--r">Principal</th>
              <th class="pa-th">Solicitação</th>
              <th class="pa-th">Atividade</th>
              <th class="pa-th">Situação</th>
              <th class="pa-th"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="propostasFiltradas.length === 0">
              <td colspan="9" class="pa-empty">Nenhuma proposta encontrada.</td>
            </tr>
            <tr
              v-for="p in propostasFiltradas"
              :key="p.id"
              class="pa-tr"
              @click="analisar(p)"
              role="button"
              tabindex="0"
              @keydown.enter="analisar(p)"
              :aria-label="`Abrir proposta de ${p.nome}`"
            >
              <td class="pa-td pa-td--nome">
                <div class="pa-nome-wrap">
                  <div class="pa-avatar" aria-hidden="true">{{ p.nome.charAt(0) }}</div>
                  <div>
                    <div class="pa-nome-text">{{ p.nome }}</div>
                    <div class="pa-id-text">{{ p.id }}</div>
                  </div>
                </div>
              </td>
              <td class="pa-td">
                <span class="tipo-badge" :class="p.tipoProduto === 'consignado' ? 'tipo-badge--consig' : 'tipo-badge--pessoal'">
                  {{ p.tipoProduto === 'consignado' ? 'Consignado' : 'Emp. Pessoal' }}
                </span>
              </td>
              <td class="pa-td pa-td--cpf">{{ p.cpfCnpj }}</td>
              <td class="pa-td">
                <span class="canal-badge" :style="{ background: getCanalBg(p.canal) }">{{ p.canal }}</span>
              </td>
              <td class="pa-td pa-td--r pa-td--valor">{{ p.principal }}</td>
              <td class="pa-td pa-td--muted">{{ p.dataSolicitacao }}</td>
              <td class="pa-td">
                <span class="ativ-badge">{{ p.atividade }}</span>
              </td>
              <td class="pa-td">
                <span :class="situacaoClasses[p.situacao] || 'badge badge--gray'">
                  <span v-if="situacaoClasses[p.situacao]" class="badge-dot" aria-hidden="true"></span>
                  {{ situacaoLabel[p.situacao] ?? p.situacao }}
                </span>
              </td>
              <td class="pa-td pa-td--action">
                <button class="pa-action-btn" @click.stop="analisar(p)" :aria-label="`Analisar proposta de ${p.nome}`">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.75"/>
                    <line x1="17" y1="17" x2="21" y2="21" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginação -->
      <div class="pa-footer">
        <span class="pa-footer__total">{{ propostasFiltradas.length }} resultado{{ propostasFiltradas.length !== 1 ? 's' : '' }} encontrado{{ propostasFiltradas.length !== 1 ? 's' : '' }}</span>
        <div class="pa-pagination" role="navigation" aria-label="Paginação">
          <button class="pa-page-btn" disabled aria-label="Página anterior">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polyline points="15 18 9 12 15 6" stroke="currentColor" stroke-width="2.5"/></svg>
          </button>
          <span class="pa-page-info" aria-current="page">1 de 1</span>
          <button class="pa-page-btn" disabled aria-label="Próxima página">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polyline points="9 18 15 12 9 6" stroke="currentColor" stroke-width="2.5"/></svg>
          </button>
        </div>
      </div>
    </section>

  </main>
</template>

<style scoped>
/* ── Root ─────────────────────────────────────────────────────── */
.pa-main {
  flex: 1;
  padding: var(--sp-7) var(--sp-8) var(--sp-14);
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
  background: var(--surface-page);
  min-width: 0;
  font-family: var(--font-body);
  color: var(--text-body);
}

/* ── Header ───────────────────────────────────────────────────── */
.pa-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-4);
  flex-wrap: wrap;
}
.pa-title {
  font-family: var(--font-display);
  font-size: var(--fs-h3);
  font-weight: 600;
  color: var(--text-heading);
  letter-spacing: var(--ls-h3);
  margin: 0 0 var(--sp-1);
  line-height: 1.2;
}
.pa-subtitle {
  margin: 0;
  font-size: var(--fs-fine);
  color: var(--admin-muted);
}
.pa-export-btn {
  height: 40px;
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  padding: 0 var(--sp-4_5);
  border: 1.5px solid var(--admin-blue-border);
  border-radius: var(--radius-pill);
  background: var(--admin-blue-100);
  color: var(--admin-blue);
  font-size: var(--fs-caption);
  font-weight: 600;
  font-family: var(--font-body);
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}
.pa-export-btn:hover { background: var(--admin-blue-border); }
.pa-export-btn:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: 2px; }

/* ── Filter Card ──────────────────────────────────────────────── */
.pa-filters {
  background: var(--surface-card);
  border-radius: 18px;
  border: 1px solid var(--admin-border);
  box-shadow: 0 10px 30px rgba(14,42,92,.05);
  padding: var(--sp-5) var(--sp-6);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3_5);
}

.pa-filter-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: var(--sp-3);
  align-items: end;
}

.pa-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}
.pa-field__label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--admin-muted);
}

/* Search input with icon */
.pa-search-wrap {
  position: relative;
}
.pa-search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--admin-placeholder);
}
.pa-input--search {
  padding-left: 38px !important;
}

/* Inputs / Selects */
.pa-input,
.pa-select {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border: 1.5px solid var(--admin-border);
  border-radius: 12px;
  font-size: 14px;
  color: var(--text-heading);
  background: var(--surface-card);
  font-family: var(--font-body);
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}
.pa-input:focus,
.pa-select:focus {
  outline: none;
  border-color: var(--admin-blue);
  box-shadow: 0 0 0 3px rgba(29,79,215,0.14);
}
.pa-input::placeholder { color: var(--admin-placeholder); }

/* Filter footer */
.pa-filter-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2_5);
  flex-wrap: wrap;
}
.pa-btn-toggle {
  height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--admin-blue);
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-body);
  cursor: pointer;
  transition: background 0.12s;
}
.pa-btn-toggle:hover { background: var(--admin-blue-50); }
.pa-btn-toggle:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: 2px; }

.pa-btn-clear {
  height: 36px;
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  padding: 0 var(--sp-4);
  border: 1.5px solid var(--admin-border);
  border-radius: var(--radius-pill);
  background: var(--surface-card);
  color: var(--admin-text);
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-body);
  cursor: pointer;
  transition: background 0.12s;
}
.pa-btn-clear:hover { background: var(--admin-blue-50); color: var(--admin-blue); border-color: var(--admin-blue-border); }
.pa-btn-clear:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: 2px; }

/* ── Results Card ─────────────────────────────────────────────── */
.pa-results {
  background: var(--surface-card);
  border-radius: 18px;
  border: 1px solid var(--admin-border);
  box-shadow: 0 10px 30px rgba(14,42,92,.05);
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.pa-results__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--admin-border-light);
}
.pa-results__title {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--text-heading);
  margin: 0;
}
.pa-results__count {
  font-size: var(--fs-caption);
  color: var(--admin-muted);
}

/* ── Table ────────────────────────────────────────────────────── */
.pa-table-wrap { overflow-x: auto; flex: 1; }
.pa-table { width: 100%; border-collapse: collapse; }

.pa-th {
  background: var(--surface-page);
  padding: 12px 16px;
  text-align: left;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--admin-muted);
  border-bottom: 1px solid var(--admin-border-light);
  white-space: nowrap;
}
.pa-th--nome { padding-left: 24px; }
.pa-th--r { text-align: right; }

.pa-td {
  padding: 14px 16px;
  color: var(--admin-text);
  border-bottom: 1px solid var(--admin-border-light);
  font-size: 13px;
  white-space: nowrap;
  vertical-align: middle;
}
.pa-td:first-child { padding-left: 24px; }
.pa-tr { cursor: pointer; transition: background 0.1s; }
.pa-tr:hover .pa-td { background: var(--admin-blue-50); }
.pa-tr:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: -2px; }

.pa-td--nome  { font-weight: 600; color: var(--text-heading); }
.pa-td--cpf   { font-size: 13px; color: var(--admin-text); }
.pa-td--r     { text-align: right; font-weight: 600; color: var(--text-heading); }
.pa-td--valor { white-space: nowrap; }
.pa-td--muted { color: var(--admin-text); }
.pa-td--action { padding-right: 16px; }

/* Nome com avatar */
.pa-nome-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.pa-avatar {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: var(--admin-blue-100);
  color: var(--admin-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
.pa-nome-text {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pa-id-text {
  font-size: 11px;
  color: var(--admin-muted);
  font-family: 'Courier New', monospace;
  letter-spacing: 0.02em;
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 10px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.badge-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}
.badge--blue   { background: var(--admin-blue-100); color: var(--admin-blue); }
.badge--indigo { background: #ede7f6; color: #4527a0; }
.badge--teal   { background: var(--admin-blue-100); color: var(--admin-blue); }
.badge--red    { background: var(--error-50); color: var(--error-600); }
.badge--gray   { background: var(--surface-muted); color: var(--text-muted); }

.tipo-badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: var(--radius-pill);
  background: #F0F5FD;
  color: var(--admin-text-strong);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.tipo-badge--consig  { background: #F0F5FD; color: var(--admin-text-strong); }
.tipo-badge--pessoal { background: #f3e5f5; color: #6a1b9a; }

.canal-badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
}

.ativ-badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: var(--radius-pill);
  background: var(--admin-blue-100);
  color: var(--admin-blue);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

/* Action button */
.pa-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  border: 1.5px solid var(--admin-border);
  background: var(--surface-card);
  color: var(--admin-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}
.pa-action-btn:hover { background: var(--admin-blue-100); color: var(--admin-blue); border-color: var(--admin-blue-border); }
.pa-action-btn:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: 2px; }

.pa-empty {
  text-align: center;
  padding: var(--sp-14) var(--sp-4);
  color: var(--admin-muted);
  font-style: italic;
  font-size: var(--fs-label);
}

/* ── Footer / Paginação ───────────────────────────────────────── */
.pa-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: 14px 24px;
  border-top: 1px solid var(--admin-border-light);
  flex-wrap: wrap;
}
.pa-footer__total { font-size: var(--fs-caption); color: var(--admin-muted); }
.pa-pagination    { display: flex; align-items: center; gap: 6px; }
.pa-page-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1.5px solid var(--admin-border);
  background: var(--surface-card);
  color: var(--admin-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.1s;
}
.pa-page-btn:hover:not(:disabled) { background: var(--admin-blue-50); color: var(--admin-blue); }
.pa-page-btn:disabled { opacity: 0.4; cursor: default; }
.pa-page-info {
  font-size: var(--fs-caption);
  font-weight: 600;
  color: var(--admin-text-strong);
  padding: 0 var(--sp-2);
}

/* ── Responsivo ───────────────────────────────────────────────── */
@media (max-width: 1100px) {
  .pa-filter-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 700px) {
  .pa-filter-grid { grid-template-columns: 1fr; }
  .pa-main { padding: var(--sp-4) var(--sp-4) var(--sp-10); }
}
</style>
