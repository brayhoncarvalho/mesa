<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { propostasListStore, cadastroClientesStore } from '../store'

const router = useRouter()

const campoBusca  = ref('')
const tipoBusca   = ref('Todos')
const buscaFeita  = ref(false)

interface ResultadoBusca {
  tipo: 'Proposta' | 'Cliente'
  id: string
  nome: string
  cpfCnpj: string
  status: string
  extra: string
}

const resultados = computed<ResultadoBusca[]>(() => {
  if (!buscaFeita.value || !campoBusca.value.trim()) return []
  const q = campoBusca.value.toLowerCase()

  const propostas: ResultadoBusca[] = tipoBusca.value === 'Cliente' ? [] :
    propostasListStore.value
      .filter(p =>
        p.nome.toLowerCase().includes(q) ||
        p.cpfCnpj.includes(q) ||
        p.id.toLowerCase().includes(q)
      )
      .map(p => ({
        tipo: 'Proposta',
        id: p.id,
        nome: p.nome,
        cpfCnpj: p.cpfCnpj,
        status: p.situacao,
        extra: `${p.atividade} • ${p.canal}`,
      }))

  const clientes: ResultadoBusca[] = tipoBusca.value === 'Proposta' ? [] :
    cadastroClientesStore.value
      .filter(c =>
        c.nome.toLowerCase().includes(q) ||
        c.cpfCnpj.includes(q) ||
        c.id.toLowerCase().includes(q)
      )
      .map(c => ({
        tipo: 'Cliente',
        id: c.id,
        nome: c.nome,
        cpfCnpj: c.cpfCnpj,
        status: c.status,
        extra: `Canal: ${c.canal} • Limite: ${c.limiteAprovado}`,
      }))

  return [...propostas, ...clientes]
})

function pesquisar() {
  buscaFeita.value = true
}

function verDetalhe(r: ResultadoBusca) {
  if (r.tipo === 'Proposta') router.push(`/proposta/${r.id}`)
  else router.push(`/cadastro/clientes`)
}

const statusBadge: Record<string, string> = {
  'EmAnalise': 'badge badge--blue',
  'Formalização': 'badge badge--indigo',
  'Liberada': 'badge badge--teal',
  'Aprovada': 'badge badge--teal',
  'Reprovada': 'badge badge--red',
  'Cancelada': 'badge badge--gray',
  'Ativo': 'badge badge--teal',
  'Inativo': 'badge badge--gray',
}
</script>

<template>
  <main class="ps-main">
    <h1 class="ps-title">Pesquisa</h1>

    <!-- Barra de busca -->
    <section class="ps-search-bar" role="search">
      <div class="ps-search-row">
        <select v-model="tipoBusca" class="ps-select" aria-label="Tipo de resultado">
          <option>Todos</option>
          <option>Proposta</option>
          <option>Cliente</option>
        </select>
        <input
          v-model="campoBusca"
          type="search"
          class="ps-input"
          placeholder="Buscar por nome, CPF/CNPJ ou código…"
          aria-label="Busca"
          @keydown.enter="pesquisar"
        />
        <button class="ps-btn-buscar" @click="pesquisar">Pesquisar</button>
      </div>
    </section>

    <!-- Resultados -->
    <section class="ps-results">
      <!-- Estado inicial -->
      <div v-if="!buscaFeita" class="ps-empty ps-empty--hint">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><line x1="17" y1="17" x2="21" y2="21"/>
        </svg>
        <p>Digite um nome, CPF/CNPJ ou código e clique em <strong>Pesquisar</strong>.</p>
      </div>

      <!-- Sem resultados -->
      <div v-else-if="resultados.length === 0" class="ps-empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><line x1="17" y1="17" x2="21" y2="21"/>
        </svg>
        <p>Nenhum resultado encontrado para <strong>{{ campoBusca }}</strong>.</p>
      </div>

      <!-- Tabela de resultados -->
      <template v-else>
        <p class="ps-count">{{ resultados.length }} resultado{{ resultados.length !== 1 ? 's' : '' }} encontrado{{ resultados.length !== 1 ? 's' : '' }}</p>
        <div class="ps-table-wrap">
          <table class="ps-table" aria-label="Resultados da pesquisa">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nome</th>
                <th>CPF / CNPJ</th>
                <th>Status</th>
                <th>Informações</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in resultados" :key="r.id">
                <td>
                  <span :class="r.tipo === 'Proposta' ? 'badge badge--blue' : 'badge badge--indigo'">
                    {{ r.tipo }}
                  </span>
                </td>
                <td class="ps-td-nome">{{ r.nome }}</td>
                <td class="ps-td-mono">{{ r.cpfCnpj }}</td>
                <td><span :class="statusBadge[r.status] ?? 'badge badge--gray'">{{ r.status }}</span></td>
                <td class="ps-td-extra">{{ r.extra }}</td>
                <td>
                  <button class="ps-btn-ver" @click="verDetalhe(r)" :aria-label="`Ver detalhes de ${r.nome}`">Ver</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>
  </main>
</template>

<style scoped>
.ps-main {
  padding: var(--sp-6) var(--sp-8);
  display: flex;
  flex-direction: column;
  gap: var(--sp-6);
  max-width: 1100px;
}
.ps-title {
  font-family: var(--font-display);
  font-size: var(--fs-h2);
  font-weight: 700;
  color: var(--text-strong);
  margin: 0;
}

/* Search bar */
.ps-search-bar {
  background: var(--surface-card);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-card);
  padding: var(--sp-5) var(--sp-6);
}
.ps-search-row {
  display: flex;
  gap: var(--sp-3);
  align-items: center;
}
.ps-select {
  height: 40px;
  padding: 0 var(--sp-3);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-input);
  font-size: var(--fs-label);
  background: var(--surface-page);
  color: var(--text-body);
  cursor: pointer;
  flex-shrink: 0;
}
.ps-select:focus { outline: 2px solid var(--admin-blue); outline-offset: 1px; }
.ps-input {
  flex: 1;
  height: 40px;
  padding: 0 var(--sp-3);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-input);
  font-size: var(--fs-label);
  background: var(--surface-page);
  color: var(--text-body);
}
.ps-input:focus { outline: 2px solid var(--admin-blue); outline-offset: 1px; border-color: var(--admin-blue); }
.ps-btn-buscar {
  height: 40px;
  padding: 0 var(--sp-5);
  background: var(--admin-blue);
  color: #fff;
  border: none;
  border-radius: var(--radius-input);
  font-size: var(--fs-label);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}
.ps-btn-buscar:hover { background: var(--brand-900, #042e30); }
.ps-btn-buscar:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: 2px; }

/* Results */
.ps-count {
  font-size: var(--fs-label);
  color: var(--text-muted);
  margin: 0;
}
.ps-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-4);
  padding: var(--sp-12) 0;
  color: var(--text-muted);
  text-align: center;
}
.ps-empty--hint svg { opacity: 0.3; }
.ps-empty svg { opacity: 0.25; }
.ps-empty p { margin: 0; font-size: var(--fs-body); }

.ps-table-wrap { overflow-x: auto; border-radius: var(--radius-card); border: 1px solid var(--border-hairline); }
.ps-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-label);
}
.ps-table th {
  background: var(--surface-muted);
  padding: var(--sp-3) var(--sp-4);
  text-align: left;
  font-weight: 600;
  color: var(--text-strong);
  border-bottom: 1px solid var(--border-hairline);
  white-space: nowrap;
}
.ps-table td {
  padding: var(--sp-3) var(--sp-4);
  border-bottom: 1px solid var(--border-hairline);
  color: var(--text-body);
  vertical-align: middle;
}
.ps-table tr:last-child td { border-bottom: none; }
.ps-table tr:hover td { background: var(--surface-muted); }
.ps-td-nome { font-weight: 500; color: var(--text-strong); }
.ps-td-mono { font-family: monospace; font-size: var(--fs-fine); }
.ps-td-extra { color: var(--text-muted); font-size: var(--fs-fine); }

.ps-btn-ver {
  padding: var(--sp-1_5) var(--sp-3);
  background: transparent;
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-input);
  font-size: var(--fs-fine);
  font-weight: 600;
  color: var(--admin-blue);
  cursor: pointer;
  transition: background 0.12s;
}
.ps-btn-ver:hover { background: var(--surface-muted); }
.ps-btn-ver:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: 2px; }

/* Badge (local) */
.badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; white-space: nowrap; }
.badge--blue   { background: #dbeafe; color: #1d4ed8; }
.badge--teal   { background: #ccfbf1; color: #0f766e; }
.badge--indigo { background: #e0e7ff; color: #4338ca; }
.badge--red    { background: #fee2e2; color: #b91c1c; }
.badge--gray   { background: #f3f4f6; color: #6b7280; }
</style>
