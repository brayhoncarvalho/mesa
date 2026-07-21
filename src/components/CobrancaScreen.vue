<script setup lang="ts">
import { ref, computed } from 'vue'
import { cobrancaParcelasStore, cobrancaArquivosStore } from '../store'

const abaAtiva = ref<'contratos' | 'arquivos'>('contratos')

// -- Agrupamento por contrato -----------------------------------------
function parseValor(v: string) {
  return parseFloat(v.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0
}
function formatR(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

const contratos = computed(() => {
  const map = new Map<string, {
    propostaId: string; clienteNome: string; totalParcelas: number
    pagas: number; emAtraso: number; pendentes: number
    valorEmAtraso: number; proximoVencimento: string | null
  }>()

  for (const p of cobrancaParcelasStore.value) {
    if (!map.has(p.propostaId)) {
      map.set(p.propostaId, {
        propostaId: p.propostaId,
        clienteNome: p.clienteNome,
        totalParcelas: p.totalParcelas,
        pagas: 0, emAtraso: 0, pendentes: 0,
        valorEmAtraso: 0,
        proximoVencimento: null,
      })
    }
    const c = map.get(p.propostaId)!
    if (p.status === 'Pago')      c.pagas++
    if (p.status === 'Em Atraso') { c.emAtraso++; c.valorEmAtraso += parseValor(p.valor) }
    if (p.status === 'Pendente')  c.pendentes++
    if ((p.status === 'Em Atraso' || p.status === 'Pendente') && !c.proximoVencimento) {
      c.proximoVencimento = p.vencimento
    }
  }

  return [...map.values()].map(c => ({
    ...c,
    statusContrato: c.emAtraso > 0 ? 'Em Atraso' : c.pendentes > 0 ? 'Em Dia' : 'Quitado',
  }))
})

// -- Filtros ----------------------------------------------------------
const filtroBusca  = ref('')
const filtroStatus = ref('Em Atraso')

const contratosFiltrados = computed(() =>
  contratos.value.filter(c => {
    const busca = filtroBusca.value.toLowerCase()
    if (busca && !c.clienteNome.toLowerCase().includes(busca) && !c.propostaId.toLowerCase().includes(busca)) return false
    if (filtroStatus.value && filtroStatus.value !== 'Todos') {
      if (c.statusContrato !== filtroStatus.value) return false
    }
    return true
  })
)

// -- KPIs (por contrato) -----------------------------------------------
const kpiAtraso      = computed(() => contratos.value.filter(c => c.statusContrato === 'Em Atraso'))
const kpiEmDia       = computed(() => contratos.value.filter(c => c.statusContrato === 'Em Dia'))
const kpiQuitado     = computed(() => contratos.value.filter(c => c.statusContrato === 'Quitado'))
const kpiValorAtraso = computed(() => kpiAtraso.value.reduce((a, c) => a + c.valorEmAtraso, 0))

function limparFiltros() { filtroBusca.value = ''; filtroStatus.value = 'Todos' }

const statusContratoClass: Record<string, string> = {
  'Em Atraso': 'badge badge--red',
  'Em Dia':    'badge badge--blue',
  'Quitado':   'badge badge--teal',
}

// -- Arquivos ----------------------------------------------------------
const filtroBanco     = ref('')
const filtroStatusArq = ref('')

const arquivos = computed(() =>
  cobrancaArquivosStore.value.filter(a => {
    if (filtroBanco.value && a.banco !== filtroBanco.value) return false
    if (filtroStatusArq.value && a.status !== filtroStatusArq.value) return false
    return true
  })
)

const statusArqClass: Record<string, string> = {
  'Processado': 'badge badge--teal',
  'Aguardando': 'badge badge--blue',
  'Erro':       'badge badge--red',
}

function downloadArquivo(nome: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['REMESSA MOCK\n'], { type: 'text/plain' }))
  a.download = nome
  a.click()
}
</script>

<template>
  <main class="cb-main">
    <!-- Cabeçalho -->
    <div class="cb-header">
      <div>
        <p class="cb-breadcrumb">Mesa</p>
        <h1 class="cb-title">Cobrança</h1>
      </div>
    </div>

    <!-- Abas -->
    <nav class="cb-tabs" role="tablist" aria-label="Seções de cobrança">
      <button role="tab" class="cb-tab" :class="{ 'cb-tab--active': abaAtiva === 'contratos' }"
        :aria-selected="abaAtiva === 'contratos'" @click="abaAtiva = 'contratos'">
        Contratos
      </button>
      <button role="tab" class="cb-tab" :class="{ 'cb-tab--active': abaAtiva === 'arquivos' }"
        :aria-selected="abaAtiva === 'arquivos'" @click="abaAtiva = 'arquivos'">
        Arquivos de Baixa
      </button>
    </nav>

    <!-- ABA: Contratos -->
    <template v-if="abaAtiva === 'contratos'">

      <!-- KPIs -->
      <div class="cb-kpi-row" role="region" aria-label="Resumo de cobrança">
        <div class="cb-kpi cb-kpi--red">
          <div class="cb-kpi__icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <p class="cb-kpi__label">Em Atraso</p>
            <p class="cb-kpi__value">{{ kpiAtraso.length }} contrato{{ kpiAtraso.length !== 1 ? 's' : '' }}</p>
            <p class="cb-kpi__sub">{{ formatR(kpiValorAtraso) }} em aberto</p>
          </div>
        </div>
        <div class="cb-kpi cb-kpi--blue">
          <div class="cb-kpi__icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <p class="cb-kpi__label">Em Dia</p>
            <p class="cb-kpi__value">{{ kpiEmDia.length }} contrato{{ kpiEmDia.length !== 1 ? 's' : '' }}</p>
            <p class="cb-kpi__sub">Sem parcelas atrasadas</p>
          </div>
        </div>
        <div class="cb-kpi cb-kpi--green">
          <div class="cb-kpi__icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <p class="cb-kpi__label">Quitados</p>
            <p class="cb-kpi__value">{{ kpiQuitado.length }} contrato{{ kpiQuitado.length !== 1 ? 's' : '' }}</p>
            <p class="cb-kpi__sub">Todas as parcelas pagas</p>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="cb-filter-card" role="search">
        <div class="cb-filter-row">
          <div class="cb-filter-field cb-filter-field--grow">
            <label for="cb-busca" class="cb-filter-label">Buscar</label>
            <input
              id="cb-busca"
              v-model="filtroBusca"
              type="search"
              class="cb-input"
              placeholder="Cliente ou ID do contrato…"
              aria-label="Buscar por cliente ou contrato"
            />
          </div>
          <div class="cb-filter-field">
            <label for="cb-status" class="cb-filter-label">Situação</label>
            <select id="cb-status" v-model="filtroStatus" class="cb-select" aria-label="Filtrar por situação">
              <option value="Todos">Todos os contratos</option>
              <option>Em Atraso</option>
              <option>Em Dia</option>
              <option>Quitado</option>
            </select>
          </div>
          <button
            v-if="filtroBusca || filtroStatus === 'Todos'"
            class="cb-btn-clear"
            @click="limparFiltros"
            aria-label="Limpar filtros"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Limpar
          </button>
        </div>
      </div>

      <!-- Tabela de contratos -->
      <div class="cb-table-card">
        <div class="cb-table-head">
          <h2 class="cb-table-title">Contratos</h2>
          <span class="cb-count">
            {{ contratosFiltrados.length === contratos.length
              ? `${contratosFiltrados.length} contrato${contratosFiltrados.length !== 1 ? 's' : ''}`
              : `${contratosFiltrados.length} de ${contratos.length}` }}
          </span>
        </div>

        <div class="cb-table-wrap">
          <table class="cb-table" aria-label="Contratos de cobrança">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contrato</th>
                <th>Parcelas</th>
                <th>Em Atraso</th>
                <th>Valor em Atraso</th>
                <th>Próx. Vencimento</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="contratosFiltrados.length === 0">
                <td colspan="7" class="cb-empty">Nenhum contrato encontrado para os filtros selecionados.</td>
              </tr>
              <tr v-for="c in contratosFiltrados" :key="c.propostaId">
                <td class="cb-td-nome">{{ c.clienteNome }}</td>
                <td class="cb-td-mono">{{ c.propostaId }}</td>
                <td class="cb-td-num">{{ c.pagas }}/{{ c.totalParcelas }}</td>
                <td class="cb-td-atraso">
                  <span v-if="c.emAtraso > 0" class="cb-atraso-count">{{ c.emAtraso }}</span>
                  <span v-else class="cb-atraso-none">—</span>
                </td>
                <td class="cb-td-valor">
                  <span v-if="c.valorEmAtraso > 0">{{ formatR(c.valorEmAtraso) }}</span>
                  <span v-else class="cb-atraso-none">—</span>
                </td>
                <td>{{ c.proximoVencimento ?? '—' }}</td>
                <td><span :class="statusContratoClass[c.statusContrato]">{{ c.statusContrato }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ABA: Arquivos de Baixa -->
    <template v-if="abaAtiva === 'arquivos'">
      <div class="cb-filter-card">
        <div class="cb-filter-row">
          <div class="cb-filter-field">
            <label for="cb-banco" class="cb-filter-label">Banco</label>
            <select id="cb-banco" v-model="filtroBanco" class="cb-select">
              <option value="">Todos os bancos</option>
              <option>Unimed</option>
              <option>Bradesco</option>
            </select>
          </div>
          <div class="cb-filter-field">
            <label for="cb-status-arq" class="cb-filter-label">Status</label>
            <select id="cb-status-arq" v-model="filtroStatusArq" class="cb-select">
              <option value="">Todos</option>
              <option>Processado</option>
              <option>Aguardando</option>
              <option>Erro</option>
            </select>
          </div>
        </div>
      </div>

      <div class="cb-table-card">
        <div class="cb-table-head">
          <h2 class="cb-table-title">Arquivos de Baixa</h2>
          <span class="cb-count">{{ arquivos.length }} arquivo{{ arquivos.length !== 1 ? 's' : '' }}</span>
        </div>
        <div class="cb-table-wrap">
          <table class="cb-table" aria-label="Arquivos de baixa">
            <thead>
              <tr>
                <th>Nome do Arquivo</th>
                <th>Data Geração</th>
                <th>Banco</th>
                <th>Nº Registros</th>
                <th>Status</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="arquivos.length === 0">
                <td colspan="6" class="cb-empty">Nenhum arquivo encontrado.</td>
              </tr>
              <tr v-for="a in arquivos" :key="a.id">
                <td class="cb-td-arquivo">{{ a.nome }}</td>
                <td>{{ a.dataGeracao }}</td>
                <td>{{ a.banco }}</td>
                <td class="cb-td-num">{{ a.numRegistros.toLocaleString('pt-BR') }}</td>
                <td><span :class="statusArqClass[a.status]">{{ a.status }}</span></td>
                <td>
                  <button class="cb-btn-dl" :disabled="a.status === 'Erro'" @click="downloadArquivo(a.nome)"
                    :aria-label="`Baixar ${a.nome}`">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Baixar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </main>
</template>

<style scoped>
.cb-main { padding: var(--sp-6) var(--sp-8); display: flex; flex-direction: column; gap: var(--sp-5); max-width: 1200px; }
.cb-breadcrumb { font-size: var(--fs-fine); color: var(--text-muted); margin: 0 0 2px; }
.cb-header { display: flex; justify-content: space-between; align-items: flex-end; }
.cb-title { font-family: var(--font-display); font-size: var(--fs-h2); font-weight: 700; color: var(--text-strong); margin: 0; }

/* Tabs */
.cb-tabs { display: flex; gap: 0; border-bottom: 2px solid var(--admin-border); }
.cb-tab { padding: var(--sp-3) var(--sp-5); background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; font-size: var(--fs-label); font-weight: 600; color: var(--admin-muted); cursor: pointer; transition: color 0.15s, border-color 0.15s; font-family: var(--font-body); }
.cb-tab:hover { color: var(--text-strong); }
.cb-tab--active { color: var(--admin-blue); border-bottom-color: var(--admin-blue); }
.cb-tab:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: 2px; border-radius: 4px; }

/* KPI cards */
.cb-kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--sp-4); }
.cb-kpi {
  display: flex; align-items: flex-start; gap: var(--sp-3);
  padding: var(--sp-4) var(--sp-5);
  background: var(--surface-card);
  border: 1px solid var(--admin-border);
  border-radius: var(--radius-card);
  border-left-width: 4px;
}
.cb-kpi--red   { border-left-color: var(--error-600); }
.cb-kpi--green { border-left-color: #0A5C36; }
.cb-kpi--blue  { border-left-color: var(--admin-blue); }
.cb-kpi__icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
.cb-kpi--red   .cb-kpi__icon { background: var(--error-50);       color: var(--error-600); }
.cb-kpi--green .cb-kpi__icon { background: #BBF3D4;               color: #0A5C36; }
.cb-kpi--blue  .cb-kpi__icon { background: var(--admin-blue-100); color: var(--admin-blue); }
.cb-kpi__label { font-size: var(--fs-fine); font-weight: 600; color: var(--admin-muted); margin: 0 0 2px; text-transform: uppercase; letter-spacing: .04em; }
.cb-kpi__value { font-size: 20px; font-weight: 700; color: var(--text-strong); margin: 0 0 2px; font-family: var(--font-display); }
.cb-kpi__sub   { font-size: var(--fs-fine); color: var(--admin-text); margin: 0; }

/* Filter card */
.cb-filter-card { background: var(--surface-card); border: 1px solid var(--admin-border); border-radius: var(--radius-card); padding: var(--sp-4) var(--sp-5); }
.cb-filter-row { display: flex; align-items: flex-end; gap: var(--sp-3); flex-wrap: wrap; }
.cb-filter-field { display: flex; flex-direction: column; gap: var(--sp-1); }
.cb-filter-field--grow { flex: 1; min-width: 240px; }
.cb-filter-label { font-size: 11px; font-weight: 600; color: var(--admin-muted); text-transform: uppercase; letter-spacing: .04em; }
.cb-input, .cb-select {
  height: 38px; padding: 0 var(--sp-3);
  border: 1px solid var(--admin-border);
  border-radius: var(--radius-input);
  font-size: var(--fs-label);
  background: var(--surface-page);
  color: var(--text-body);
  width: 100%; box-sizing: border-box;
}
.cb-input:focus, .cb-select:focus { outline: 2px solid var(--admin-blue); outline-offset: 1px; border-color: var(--admin-blue); }
.cb-btn-clear {
  display: inline-flex; align-items: center; gap: 6px;
  height: 38px; padding: 0 var(--sp-3); align-self: flex-end;
  background: transparent; border: 1px solid var(--admin-border);
  border-radius: var(--radius-input); font-size: var(--fs-fine);
  font-weight: 600; color: var(--admin-muted); cursor: pointer;
  transition: background .12s, color .12s; white-space: nowrap;
}
.cb-btn-clear:hover { background: var(--admin-blue-50); color: var(--admin-blue); border-color: var(--admin-blue-border); }

/* Table card */
.cb-table-card { background: var(--surface-card); border: 1px solid var(--admin-border); border-radius: var(--radius-card); overflow: hidden; }
.cb-table-head { display: flex; justify-content: space-between; align-items: center; padding: var(--sp-4) var(--sp-5); border-bottom: 1px solid var(--admin-border-light); }
.cb-table-title { font-family: var(--font-display); font-size: var(--fs-h3); font-weight: 700; color: var(--text-strong); margin: 0; }
.cb-count { font-size: var(--fs-fine); color: var(--admin-muted); white-space: nowrap; background: var(--admin-blue-50); padding: 3px 10px; border-radius: 999px; font-weight: 600; }
.cb-table-wrap { overflow-x: auto; }
.cb-table { width: 100%; border-collapse: collapse; font-size: var(--fs-label); }
.cb-table th { background: var(--admin-blue-50); padding: var(--sp-3) var(--sp-4); text-align: left; font-weight: 600; font-size: 11px; color: var(--admin-text-strong); border-bottom: 1px solid var(--admin-border); white-space: nowrap; text-transform: uppercase; letter-spacing: .03em; }
.cb-table td { padding: var(--sp-3) var(--sp-4); border-bottom: 1px solid var(--admin-border-light); color: var(--text-body); vertical-align: middle; }
.cb-table tr:last-child td { border-bottom: none; }
.cb-table tbody tr:hover td { background: var(--admin-blue-50); }
.cb-td-mono    { font-family: monospace; font-size: 12px; color: var(--admin-muted); }
.cb-td-nome    { font-weight: 500; color: var(--text-strong); }
.cb-td-num     { font-family: monospace; text-align: center; }
.cb-td-valor   { font-weight: 600; color: var(--text-strong); }
.cb-td-atraso  { text-align: center; }
.cb-td-arquivo { font-family: monospace; font-size: var(--fs-fine); max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cb-atraso-count { display: inline-flex; align-items: center; justify-content: center; min-width: 24px; height: 24px; padding: 0 6px; background: var(--error-50); color: var(--error-600); border-radius: 999px; font-size: 12px; font-weight: 700; }
.cb-atraso-none  { color: var(--admin-muted); }
.cb-empty { text-align: center; color: var(--admin-muted); padding: var(--sp-10) !important; font-size: var(--fs-label); }

/* Download button */
.cb-btn-dl {
  display: inline-flex; align-items: center; gap: var(--sp-1_5);
  padding: var(--sp-1_5) var(--sp-3); background: transparent;
  border: 1px solid var(--admin-border); border-radius: var(--radius-input);
  font-size: var(--fs-fine); font-weight: 600; color: var(--admin-blue);
  cursor: pointer; transition: background 0.12s;
}
.cb-btn-dl:hover:not(:disabled) { background: var(--admin-blue-50); }
.cb-btn-dl:disabled { opacity: 0.4; cursor: not-allowed; }
.cb-btn-dl:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: 2px; }

/* Badges */
.badge { display: inline-flex; align-items: center; height: 22px; padding: 0 8px; border-radius: 999px; font-size: 11px; font-weight: 700; white-space: nowrap; }
.badge--teal { background: #BBF3D4; color: #0A5C36; }
.badge--red  { background: var(--error-50); color: var(--error-600); }
.badge--blue { background: var(--admin-blue-100); color: var(--admin-blue); }
.badge--gray { background: var(--admin-blue-50); color: var(--admin-muted); }
</style>
