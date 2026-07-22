<script setup lang="ts">
import { ref, computed } from 'vue'
import { DsBadge } from 'shared-design-system-vue-lib'
import { useRouter } from 'vue-router'
import { authStore, propostaStore, propostasListStore } from '../store'

// -- Tipos ------------------------------------------------------------------
export interface Proposta {
  id: string
  nome: string
  cpf: string
  valor: string
  valorNum: number
  parcelas: number
  motivo: string
  canal?: string
  dataSolicitacao: string
  status: 'pendente' | 'em-analise' | 'aprovada' | 'recusada' | 'oferta-redefinida'
  prioridade: 'normal' | 'alta'
  tipoProduto?: 'consignado' | 'emprestimo-pessoal'
}

// -- Props / Emits ----------------------------------------------------------
const router = useRouter()

function analisar(p: { id: string; tipoProduto?: string; [key: string]: any }) {
  propostaStore.set(p as any, (p.tipoProduto ?? 'consignado') as any)
  router.push(`/proposta/${p.id}`)
}

// -- Operador ---------------------------------------------------------------
const operadorNome = computed(() => {
  const part = authStore.email.split('@')[0].split('.')[0]
  return part.charAt(0).toUpperCase() + part.slice(1)
})
const ultimoLogin = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  d.setHours(13, 14, 0)
  return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
})

// -- Período ----------------------------------------------------------------
const periodoOptions = [
  { value: 'Diário',  label: 'Diário' },
  { value: 'Semanal', label: 'Semanal' },
  { value: 'Mensal',  label: 'Mensal' },
  { value: 'Anual',   label: 'Anual' },
]
const periodoSelecionado = ref('Semanal')

// -- Nav --------------------------------------------------------------------
// (nav moved to AppLayout)

// -- KPIs -------------------------------------------------------------------
const kpis = computed(() => [
  { label: 'Propostas Mesa',      value: 767, delta: '+130%', up: true,  money: 'R$ 526.447,33', spark: [18,12,35,22,65,42,58,35,50,68], sparkColor: '#3b82f6' },
  { label: 'Concluídas',          value: 8,   delta: '-8%',   up: false, money: 'R$ 74.440,00',  spark: [25,20,18,12,8,10,14,8,5,8],    sparkColor: '#10b981' },
  { label: 'Rejeitadas',          value: 189, delta: '-21%',  up: false, money: 'R$ 141.454,47', spark: [35,55,42,65,50,60,48,38,42,32], sparkColor: '#ef4444' },
  { label: 'Canceladas',          value: 112, delta: '+6%',   up: true,  money: 'R$ 118.854,93', donut: 20 },
])

// -- Sparkline SVG path -----------------------------------------------------
function sparkPath(pts: number[], w = 110, h = 40): string {
  const mx = Math.max(...pts), mn = Math.min(...pts), rng = mx - mn || 1
  const step = w / (pts.length - 1)
  return pts.map((v, i) =>
    `${i === 0 ? 'M' : 'L'} ${+(i * step).toFixed(1)} ${+(h - 4 - ((v - mn) / rng) * (h - 8)).toFixed(1)}`
  ).join(' ')
}
function sparkAreaPath(pts: number[], w = 110, h = 40): string {
  const line = sparkPath(pts, w, h)
  const last = pts.length - 1
  const step = w / last
  return `${line} L ${+(last * step).toFixed(1)} ${h} L 0 ${h} Z`
}

// -- Donut helpers ----------------------------------------------------------
const DONUT_R = 26
const DONUT_C = +(2 * Math.PI * DONUT_R).toFixed(2)
const donutDash = (pct: number) => `${+((pct / 100) * DONUT_C).toFixed(2)} ${DONUT_C}`

// -- Bar chart --------------------------------------------------------------
const dias = ['Qua', 'Qui', 'Sex', 'Sáb', 'Dom', 'Seg', 'Ter']
const barSeries = [
  { label: 'Em Análise',   color: '#3b82f6', vals: [14,28,7,9,4,18,22] },
  { label: 'Formalização', color: '#1e3a5f', vals: [7, 14,4,2,3, 9,11] },
  { label: 'Liberada',     color: '#10b981', vals: [9, 22,9,7,4,16,18] },
  { label: 'Reprovada',    color: '#ef4444', vals: [3, 7, 3,2,1, 4, 5] },
  { label: 'Cancelada',    color: '#94a3b8', vals: [18,70,14,4,7,22,36] },
]
const SVG_W=520, SVG_H=180, ML=28, MB=24, MT=8
const CW=SVG_W-ML-8, CH=SVG_H-MB-MT
const nSeries=barSeries.length, BW=6, BG=1.5
const GW=nSeries*BW+(nSeries-1)*BG, DS=CW/dias.length, BAR_MAX=80

const barChart = computed(() => ({
  grids: [0,20,40,60,80].map(v => ({ v, y: MT+CH-(v/BAR_MAX)*CH })),
  days: dias.map((d, di) => {
    const cx = ML + di*DS + DS/2, gx = cx - GW/2
    return {
      d, lx: cx, ly: SVG_H-6,
      bars: barSeries.map((s, si) => {
        const h = Math.max((s.vals[di]/BAR_MAX)*CH, 0)
        return { x: gx+si*(BW+BG), y: MT+CH-h, w: BW, h, c: s.color }
      }),
    }
  }),
}))

// -- Donut "Tipos de Empréstimo" --------------------------------------------
const tiposEmprestimo = [
  { label: 'Consignado Privado', value: 45, color: '#1e3a5f' },
  { label: 'FGTS',              value: 28, color: '#3b82f6' },
  { label: 'Crédito Pessoal',   value: 18, color: '#00d8d8' },
  { label: 'Outros',            value:  9, color: '#94a3b8' },
]
const pieSlices = computed(() => {
  const tot = tiposEmprestimo.reduce((s, c) => s + c.value, 0)
  const CX = 90, CY = 90, R = 76
  let a = -Math.PI / 2
  return tiposEmprestimo.map(c => {
    const sa = (c.value / tot) * 2 * Math.PI
    const x1 = CX + R * Math.cos(a), y1 = CY + R * Math.sin(a)
    a += sa
    const x2 = CX + R * Math.cos(a), y2 = CY + R * Math.sin(a)
    return {
      d: `M ${CX} ${CY} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${R} ${R} 0 ${sa > Math.PI ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`,
      c: c.color, l: c.label, v: c.value,
    }
  })
})

// -- Table ------------------------------------------------------------------
const busca = ref('')
const situacaoFiltro = ref('todas')
const situacaoOptions = [
  { value: 'todas',       label: 'Todas as situações' },
  { value: 'EmAnalise',   label: 'Em Análise' },
  { value: 'Formalização', label: 'Formalização' },
]

const propostasFiltradas = computed(() => {
  const q = busca.value.toLowerCase().trim()
  return propostasListStore.value.filter(p => {
    const matchBusca = !q || p.nome.toLowerCase().includes(q)
      || (p.cpfCnpj ?? '').includes(q)
      || (p.canal  ?? '').toLowerCase().includes(q)
    const matchStatus = situacaoFiltro.value === 'todas' || p.situacao === situacaoFiltro.value
    return matchBusca && matchStatus
  })
})

const canalBgMap: Record<string, string> = {
  ASSALCE: '#3b82f6', SollServices: '#059669', BlingB2: '#1e3a5f', Euroserv: '#7c3aed', Multi7: '#d97706', Web: '#0284c7', Unimed: '#16a34a',
}
const getCanalBg = (c = '') => canalBgMap[c] ?? '#64748b'

const situacaoLabel: Record<string, string> = {
  'EmAnalise': 'Em Análise', 'Formalização': 'Formalização',
  'Liberada': 'Liberada', 'Reprovada': 'Reprovada', 'Cancelada': 'Cancelada',
}
</script>

<template>
  <main class="main">

        <!-- Welcome -->
        <div class="hero">
          <div>
            <h1 class="hero__title">Bem-vindo, <span class="hero__name">{{ operadorNome }}</span>!</h1>
            <p class="hero__sub">Seu último login foi {{ ultimoLogin }}</p>
          </div>
          <div class="hero__ctrl">
            <select v-model="periodoSelecionado" class="period-select" aria-label="Período">
              <option v-for="o in periodoOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
            <button class="btn-refresh" aria-label="Atualizar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- KPI Cards -->
        <div class="kpis" role="region" aria-label="Métricas">
          <div v-for="kpi in kpis" :key="kpi.label" class="kpi">
            <div class="kpi__info">
              <span class="kpi__label">{{ kpi.label }} <small>({{ periodoSelecionado }})</small></span>
              <span class="kpi__value">{{ kpi.value.toLocaleString('pt-BR') }}</span>
              <span class="kpi__delta" :class="kpi.up ? 'is-up' : 'is-down'">
                <svg v-if="kpi.up" width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true"><polyline points="18 15 12 9 6 15" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true"><polyline points="6 9 12 15 18 9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span class="sr-only">{{ kpi.up ? 'Alta' : 'Baixa' }}:</span>
                {{ kpi.delta }}
              </span>
              <span class="kpi__money">{{ kpi.money }}</span>
            </div>
            <!-- sparkline -->
            <div v-if="kpi.spark" class="kpi__chart" aria-hidden="true">
              <svg :viewBox="`0 0 110 40`" class="kpi-spark-svg" preserveAspectRatio="none">
                <path :d="sparkAreaPath(kpi.spark)" fill="currentColor" :style="{ color: kpi.sparkColor, opacity: 0.12 }"/>
                <path :d="sparkPath(kpi.spark)" fill="none" :stroke="kpi.sparkColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <!-- donut -->
            <div v-else-if="kpi.donut !== undefined" class="kpi__chart" aria-hidden="true">
              <svg viewBox="0 0 68 68" width="64" height="64">
                <circle cx="34" cy="34" :r="DONUT_R" fill="none" stroke="#e5e7eb" stroke-width="8"/>
                <circle cx="34" cy="34" :r="DONUT_R" fill="none" stroke="#00d8d8" stroke-width="8"
                  :stroke-dasharray="donutDash(kpi.donut)" stroke-linecap="round" transform="rotate(-90 34 34)"/>
                <text x="34" y="38" text-anchor="middle" font-size="11" font-weight="700" fill="#111827">{{ kpi.donut }}%</text>
              </svg>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="charts">

          <!-- Bar chart -->
          <div class="card chart-card">
            <h2 class="chart-title">Visão Geral Semanal</h2>
            <svg :viewBox="`0 0 ${SVG_W} ${SVG_H}`" class="bar-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              <!-- grid lines -->
              <line v-for="gl in barChart.grids" :key="gl.v"
                :x1="ML" :y1="gl.y" :x2="SVG_W-8" :y2="gl.y" stroke="#f1f5f9" stroke-width="1"/>
              <text v-for="gl in barChart.grids" :key="`l${gl.v}`"
                :x="ML-4" :y="gl.y+3.5" text-anchor="end" font-size="9" fill="#94a3b8">{{ gl.v }}</text>
              <!-- bars -->
              <g v-for="day in barChart.days" :key="day.d">
                <rect v-for="(bar, bi) in day.bars" :key="bi"
                  :x="bar.x" :y="bar.y" :width="bar.w" :height="bar.h" :fill="bar.c" rx="1"/>
                <text :x="day.lx" :y="day.ly" text-anchor="middle" font-size="10" fill="#6b7280">{{ day.d }}</text>
              </g>
            </svg>
            <!-- legend -->
            <div class="bar-legend">
              <span v-for="s in barSeries" :key="s.label" class="bar-legend__item">
                <span class="bar-legend__dot" :style="{ background: s.color }"></span>{{ s.label }}
              </span>
            </div>
          </div>

          <!-- Donut tipos -->
          <div class="card chart-card chart-card--sm">
            <h2 class="chart-title">Tipos de Empréstimo</h2>
            <div class="pie-body">
              <div class="pie-wrap">
                <svg viewBox="0 0 180 180" width="220" height="220" aria-hidden="true">
                  <path v-for="(s, i) in pieSlices" :key="i" :d="s.d" :fill="s.c" stroke="#fff" stroke-width="1.5"/>
                </svg>
              </div>
              <ul class="pie-legend">
                <li v-for="item in tiposEmprestimo" :key="item.label" class="pie-legend__item">
                  <span class="pie-legend__dot" :style="{ background: item.color }"></span>
                  <span class="pie-legend__name">{{ item.label }}</span>
                  <span class="pie-legend__pct">{{ item.value }}%</span>
                </li>
              </ul>
            </div>
          </div>

        </div>

        <!-- Table -->
        <div class="card table-card">
          <div class="table-head">
            <h2 class="chart-title" style="margin:0">Propostas em Formalização</h2>
            <div class="table-filters">
              <input
                v-model="busca"
                type="search"
                class="search-input"
                placeholder="Buscar por nome, CPF ou canal..."
                aria-label="Buscar proposta"
              />
              <select v-model="situacaoFiltro" class="filter-select" aria-label="Filtrar por situação">
                <option v-for="o in situacaoOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </div>
          </div>

          <div class="table-wrap">
            <table class="tbl" aria-label="Propostas em formalização">
              <thead>
                <tr>
                  <th class="tbl-th">Nome</th>
                  <th class="tbl-th">Tipo</th>
                  <th class="tbl-th">Canal</th>
                  <th class="tbl-th">Data</th>
                  <th class="tbl-th">Situação</th>
                  <th class="tbl-th tbl-th--r"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="propostasFiltradas.length === 0">
                  <td colspan="6" class="tbl-empty">Nenhuma proposta encontrada.</td>
                </tr>
                <tr v-for="p in propostasFiltradas" :key="p.id" class="tbl-tr">
                  <td class="tbl-td tbl-td--nome">{{ p.nome }}</td>
                  <td class="tbl-td">
                    <span class="tipo-badge" :class="p.tipoProduto === 'consignado' ? 'tipo-badge--consig' : 'tipo-badge--pessoal'">
                      {{ p.tipoProduto === 'consignado' ? 'Consignado' : 'Emp. Pessoal' }}
                    </span>
                  </td>
                  <td class="tbl-td">
                    <span class="canal-badge">{{ p.canal }}</span>
                  </td>
                  <td class="tbl-td tbl-td--date">{{ p.dataSolicitacao }}</td>
                  <td class="tbl-td">
                    <span class="ativ-badge" :class="`ativ-badge--${p.situacao.toLowerCase()}`">{{ situacaoLabel[p.situacao] ?? p.situacao }}</span>
                  </td>
                  <td class="tbl-td tbl-td--r">
                    <button class="action-btn" @click="analisar(p)" :aria-label="`Analisar proposta de ${p.nome}`">
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
        </div>

      </main>
</template>

<style scoped>
/* ── Main ──────────────────────────────────────────────────────── */
.main {
  flex: 1;
  padding: var(--sp-7) var(--sp-8) var(--sp-14);
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
  min-width: 0;
  background: var(--surface-page);
  font-family: var(--font-body);
  color: var(--text-body);
}

/* ── Hero ──────────────────────────────────────────────────────── */
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-4);
}
.hero__title {
  font-family: var(--font-display);
  font-size: var(--fs-h3);
  font-weight: 600;
  color: var(--text-heading);
  letter-spacing: var(--ls-h3);
  margin: 0 0 var(--sp-1);
}
.hero__name  { color: var(--admin-blue); }
.hero__sub   { font-size: var(--fs-fine); color: var(--text-muted); margin: 0; }
.hero__ctrl  { display: flex; align-items: center; gap: var(--sp-2); flex-shrink: 0; }

.btn-refresh {
  width: 36px; height: 36px;
  border-radius: var(--radius-full);
  background: var(--admin-blue);
  border: none;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}
.btn-refresh:hover { background: var(--admin-blue-hover); }
.btn-refresh:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: 2px; }

/* ── Selects / inputs de controle ─────────────────────────────── */
.period-select,
.filter-select {
  height: 36px;
  padding: 0 28px 0 var(--sp-3);
  border: 1.5px solid var(--border-input);
  border-radius: var(--radius-pill);
  background: var(--surface-card)
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none'%3E%3Cpolyline points='6 9 12 15 18 9' stroke='%238AA0A0' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")
    no-repeat right 10px center;
  appearance: none;
  font-size: var(--fs-caption);
  font-weight: 500;
  color: var(--text-strong);
  font-family: var(--font-body);
  cursor: pointer;
  transition: border-color 0.15s;
}
.period-select { min-width: 110px; }
.filter-select { min-width: 180px; }
.period-select:focus,
.filter-select:focus { outline: none; border-color: var(--admin-blue); box-shadow: 0 0 0 3px rgba(29,79,215,0.15); }

.search-input {
  height: 36px;
  padding: 0 var(--sp-3);
  border: 1.5px solid var(--border-input);
  border-radius: var(--radius-pill);
  background: var(--surface-card);
  font-size: var(--fs-caption);
  color: var(--text-heading);
  font-family: var(--font-body);
  min-width: 200px;
  transition: border-color 0.15s;
}
.search-input::placeholder { color: var(--text-muted); }
.search-input:focus { outline: none; border-color: var(--admin-blue); box-shadow: 0 0 0 3px rgba(29,79,215,0.15); }

/* ── KPI Cards ────────────────────────────────────────────────── */
.kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--sp-3_5);
}
.kpi {
  background: var(--surface-card);
  border-radius: var(--radius-card);
  border: 1px solid var(--border-hairline);
  box-shadow: var(--shadow-card-sm);
  padding: var(--sp-5) var(--sp-5);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2_5);
  min-height: 104px;
  min-width: 0;
  overflow: hidden;
  transition: box-shadow 0.15s;
}
.kpi:hover { box-shadow: var(--shadow-card); }
.kpi__info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: var(--sp-1); }
.kpi__label {
  font-size: var(--fs-fine);
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: var(--ls-microlabel);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.kpi__label small { color: var(--border-input); }
.kpi__value {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 600;
  color: var(--text-heading);
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.kpi__delta {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  font-size: var(--fs-caption);
  font-weight: 600;
}
.kpi__delta.is-up   { color: var(--admin-blue); }
.kpi__delta.is-down { color: var(--error-500); }
.kpi__money { font-size: var(--fs-fine); color: var(--admin-blue); font-weight: 500; }
.kpi__chart {
  flex: 0 0 auto;
  width: clamp(60px, 25%, 110px);
  display: flex;
  align-items: center;
  overflow: hidden;
}
.kpi__chart svg { width: 100%; height: auto; display: block; }

/* ── Cards (wrapper padrão) ───────────────────────────────────── */
.card {
  background: var(--surface-card);
  border-radius: var(--radius-card);
  border: 1px solid var(--border-hairline);
  box-shadow: var(--shadow-card-sm);
  padding: var(--sp-6);
}

/* ── Charts ───────────────────────────────────────────────────── */
.charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-3_5);
  align-items: stretch;
}
.chart-card--sm {
  display: flex;
  flex-direction: column;
}
.chart-title {
  font-family: var(--font-display);
  font-size: var(--fs-h5);
  font-weight: 600;
  color: var(--text-heading);
  letter-spacing: -0.01em;
  margin: 0 0 var(--sp-3_5);
}
.bar-svg { width: 100%; height: auto; max-height: 200px; display: block; }
.bar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-1) var(--sp-3);
  margin-top: var(--sp-3);
}
.bar-legend__item {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  font-size: var(--fs-fine);
  color: var(--text-body);
  white-space: nowrap;
}
.bar-legend__dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

.pie-body { display: flex; align-items: center; justify-content: center; gap: var(--sp-4); flex: 1; }
.pie-wrap { display: flex; justify-content: center; flex-shrink: 0; }
.pie-legend { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--sp-1_5); flex: 1; min-width: 0; }
.pie-legend__item { display: flex; align-items: center; gap: var(--sp-1_5); font-size: var(--fs-caption); }
.pie-legend__dot  { width: 10px; height: 10px; border-radius: var(--radius-sm); flex-shrink: 0; }
.pie-legend__name { flex: 1; color: var(--text-strong); }
.pie-legend__pct  { font-weight: 600; color: var(--text-heading); }

/* ── Table ────────────────────────────────────────────────────── */
.table-card { overflow: hidden; padding: 0; }
.table-head {
  padding: var(--sp-4) var(--sp-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-4);
  border-bottom: 1px solid var(--border-hairline);
  flex-wrap: wrap;
}
.table-filters { display: flex; align-items: center; gap: var(--sp-2_5); flex-wrap: wrap; }
.table-search  { min-width: 200px; }
.table-wrap    { overflow-x: auto; }
.tbl           { width: 100%; border-collapse: collapse; }
.tbl-th {
  font-size: var(--fs-step);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--ls-step);
  color: var(--text-muted);
  padding: var(--sp-2_5) var(--sp-6);
  text-align: left;
  border-bottom: 2px solid var(--border-hairline);
  background: var(--surface-page);
  white-space: nowrap;
}
.tbl-th--r  { text-align: right; }
.tbl-tr {
  border-bottom: 1px solid var(--border-hairline);
  transition: background 0.1s;
  cursor: pointer;
}
.tbl-tr:last-child { border-bottom: none; }
.tbl-tr:hover .tbl-td { background: var(--admin-blue-50); }
.tbl-td {
  padding: var(--sp-3_5) var(--sp-6);
  font-size: var(--fs-label);
  color: var(--text-body);
  vertical-align: middle;
}
.tbl-td--nome { font-weight: 600; color: var(--text-heading); }
.tbl-td--date { color: var(--text-muted); white-space: nowrap; }
.tbl-td--r    { text-align: right; }
.tbl-empty    { padding: var(--sp-7) var(--sp-6); text-align: center; color: var(--text-muted); font-size: var(--fs-label); }

/* ── Badges (padrão unificado) ────────────────────────────────── */
.canal-badge,
.tipo-badge,
.ativ-badge {
  display: inline-flex; align-items: center;
  height: 24px; padding: 0 10px;
  border-radius: var(--radius-pill);
  font-size: 11px; font-weight: 700;
  white-space: nowrap;
}
/* Canal */
.canal-badge { background: #f1f5f9; color: #334155; }
/* Tipo */
.tipo-badge--consig  { background: #e0f2fe; color: #0369a1; }
.tipo-badge--pessoal { background: #dbeafe; color: #1d4ed8; }
/* Situação */
.ativ-badge           { background: var(--admin-blue-100); color: var(--admin-blue); }
.ativ-badge--emanalise    { background: #dbeafe; color: #1d4ed8; }
.ativ-badge--aprovada     { background: #dcfce7; color: #15803d; }
.ativ-badge--liberada     { background: #d1fae5; color: #065f46; }
.ativ-badge--reprovada    { background: #fee2e2; color: #b91c1c; }
.ativ-badge--cancelada    { background: #f1f5f9; color: #475569; }
.ativ-badge--formalização { background: #fef9c3; color: #854d0e; }

/* ── Screen-reader only ────────────────────────────────── */
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

/* ── Botão de ação ────────────────────────────────────────────── */
.action-btn {
  width: 32px; height: 32px;
  border-radius: var(--radius-full);
  border: 1.5px solid var(--border-hairline);
  background: var(--surface-card);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.action-btn:hover { border-color: var(--admin-blue); color: var(--admin-blue); background: var(--admin-blue-50); }
.action-btn:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: 2px; }

/* ── Responsivo ───────────────────────────────────────────────── */
@media (max-width: 1100px) {
  .kpis   { grid-template-columns: repeat(2, 1fr); }
  .charts { grid-template-columns: 1fr; }
}
@media (max-width: 700px) {
  .kpis { grid-template-columns: 1fr 1fr; }
  .main { padding: var(--sp-4) var(--sp-4) var(--sp-10); }
}
</style>
