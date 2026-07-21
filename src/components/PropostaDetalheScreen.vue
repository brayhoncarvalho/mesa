<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authStore, propostaStore, propostasListStore } from '../store'
import type { Proposta } from './DashboardScreen.vue'

const router = useRouter()
const route  = useRoute()

// Recebe proposta do store; se vier diretamente pela URL, tenta recuperar do propostasListStore
let proposta = propostaStore.current as (Proposta & Record<string, any>)
if (!proposta) {
  const id = route.params.id as string
  const found = propostasListStore.value.find(p => p.id === id)
  if (found) {
    propostaStore.set(found as any, found.tipoProduto ?? 'consignado')
    proposta = found as any
  } else {
    router.replace('/propostas')
  }
}

// Tipo de produto (vem do store, alimentado pela lista de propostas)
const isConsignado = computed(() => propostaStore.tipoProduto === 'consignado')

function voltar() {
  router.push('/propostas')
}

const cpfExibido       = computed(() => proposta?.cpfCnpj ?? proposta?.cpf ?? '-')
const canalExibido     = computed(() => proposta?.canal ?? '-')
// situacaoLocal permite atualizar após decisão sem recarregar
const situacaoLocal    = ref<string>(proposta?.situacao ?? proposta?.status ?? 'EmAnalise')
const situacaoExibida  = computed(() => situacaoLocal.value)

// ── Stepper reativo ──────────────────────────────────────────────
const atividadeExibida = ref<string>(proposta?.atividade ?? 'Triagem')

const stepsConsignado   = ['Triagem', 'Análise Documentos', 'Análise Mesa']
const stepsEmpPessoal   = ['Triagem', 'Análise de Crédito', 'Análise Mesa']

const steps = computed(() => isConsignado.value ? stepsConsignado : stepsEmpPessoal)

const stepAtual = computed(() => {
  const idx = steps.value.indexOf(atividadeExibida.value)
  return idx === -1 ? 0 : idx
})

function stepStatus(idx: number): 'done' | 'active' | 'pending' {
  if (idx < stepAtual.value)  return 'done'
  if (idx === stepAtual.value) return 'active'
  return 'pending'
}

function avancarAtividade() {
  const proximo = stepAtual.value + 1
  if (proximo < steps.value.length) {
    atividadeExibida.value = steps.value[proximo]
  }
}

// ── Dados mock ────────────────────────────────────────────────────
const isOnboarding = proposta?.id === 'web-onboarding'
const hoje = new Date().toLocaleDateString('pt-BR')

const dadosGerais = reactive({
  nomeCompleto:        proposta?.nome ?? '',
  email:               isOnboarding ? 'brayhon@gmail.com' : 'franciele.santos@dock.com.br',
  cpf:                 cpfExibido.value,
  dataNascimento:      '29/05/2000',
  rendaBruta:          isOnboarding ? 'R$ 8.500,00' : 'R$ 6.000,00',
})

// Date picker — Data de nascimento
const dataNascPicker = ref<HTMLInputElement | null>(null)
const dataNascISO = computed(() => {
  const p = dadosGerais.dataNascimento.split('/')
  return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : ''
})
function onDateNascChange(e: Event) {
  const v = (e.target as HTMLInputElement).value
  if (!v) return
  const [y, m, d] = v.split('-')
  dadosGerais.dataNascimento = `${d}/${m}/${y}`
}

const dadosComplementares = reactive({
  estadoCivil:      'Solteiro(a)',
  grauInstrucao:    isOnboarding ? 'Ensino Superior Completo' : 'Ensino Superior Completo',
  profissao:        isOnboarding ? 'Analista de Sistemas' : 'Analista Financeiro',
  nomeMae:          'Maria dos Santos de Jesus',
  qtdDependentes:   '0',
  nacionalidade:    'Brasileira',
  naturalidade:     isOnboarding ? 'Poções - BA' : 'São Paulo - SP',
})

// Selects Dados Complementares
const estadoCivil   = ref('Solteiro(a)')
const grauInstrucao = ref('Ensino Superior Completo')

// Dados exclusivos consignado (strip)
const dadosConsignado = {
  matricula:         proposta?.matricula         ?? '1234567',
  orgao:             proposta?.orgao             ?? 'Unimed',
  situacaoFuncional: proposta?.situacaoFuncional ?? 'Ativo',
  tempoAdmissao:     proposta?.tempoAdmissao     ?? '3 anos e 9 meses',
}

// Dados exclusivos emp. pessoal (strip)
const dadosEmpPessoal = reactive({
  scoreCredito:   proposta?.scoreCredito   ?? '-',
  limiteAprovado: proposta?.limiteAprovado ?? '-',
})

const enderecos = isOnboarding ? [
  {
    logradouro: 'RUA DAS PALMEIRAS, 452',
    bairro:     'PLANO DIRETOR NORTE',
    complemento:'',
    cidadeUf:   'Palmas - TO',
    cep:        '77001000',
    tipo:       'residencial',
    rotulo:     'Endereço atual',
  },
] : [
  {
    logradouro: 'RUA ITAPAIUNA, 2434',
    bairro:     'JARDIM MORUMBI',
    complemento:'ANDAR 1 SALA 08',
    cidadeUf:   '7107 - SP',
    cep:        '06707001',
    tipo:       'comercial',
    rotulo:     '14/01/1999 · 19 M.',
  },
  {
    logradouro: 'Rua Santo Antônio, 123',
    bairro:     'Barreiros',
    complemento:'ANDAR 1 5A',
    cidadeUf:   'São José - SC',
    cep:        '88817351',
    tipo:       'residencial',
    rotulo:     '04/02/2002 · 44 P13.',
  },
]

const enderecosBureau = [
  { orgao: 'BVS', endereco: null },
  { orgao: 'SPC', endereco: null },
]

const telefones = isOnboarding ? [
  { uf: 'TO', numero: '(63) 95448-9531', tipo: 'celular', principal: true },
] : [
  { uf: 'GO', numero: '(62) 98489-7966', tipo: 'celular' },
  { uf: 'PR', numero: '(45) 99136-5544', tipo: 'celular' },
  { uf: 'SP', numero: '(11) 85448-9531', tipo: 'celular', principal: true },
  { uf: 'PR', numero: '(45) 99999-9992', tipo: 'celular' },
  { uf: 'SC', numero: '(48) 9998-873',   tipo: 'comercial' },
  { uf: 'SC', numero: '(48) 9988-1457',  tipo: 'celular' },
]

const canalContato  = ref('WhatsApp')
const horarioContato = ref('')

const bancos = [
  '',
  '001 - BANCO DO BRASIL S.A.',
  '033 - BANCO SANTANDER S.A.',
  '104 - CAIXA ECONÔMICA FEDERAL',
  '237 - BANCO BRADESCO S.A.',
  '341 - ITAÚ UNIBANCO S.A.',
  '655 - BANCO VOTORANTIM S.A.',
  '756 - BANCO COOPERATIVO DO BRASIL S.A.',
]

const dadosBancarios = ref({
  banco:          isOnboarding ? '341 - ITAÚ UNIBANCO S.A.' : '',
  agencia:        isOnboarding ? '0001' : 'IIII',
  numero:         isOnboarding ? '12345' : 'IIIIIIIII',
  digito:         isOnboarding ? '6' : 'I',
  tipoConta:      'CC',
  debitoAuto:     'Não',
  origem:         'Cliente',
})

const dadosBancariosDock = ref({
  banco:          '655 - BANCO VOTORANTIM S.A.',
  agencia:        'IIII',
  numero:         '57729209',
  digito:         '6',
  tipoConta:      'C',
})

// Mapeamento código banco → nome completo (subconjunto dos bancos disponíveis no select)
const bancoCodigos: Record<string, string> = {
  '001': '001 - BANCO DO BRASIL S.A.',
  '033': '033 - BANCO SANTANDER S.A.',
  '104': '104 - CAIXA ECONÔMICA FEDERAL',
  '237': '237 - BANCO BRADESCO S.A.',
  '341': '341 - ITAÚ UNIBANCO S.A.',
  '655': '655 - BANCO VOTORANTIM S.A.',
  '756': '756 - BANCO COOPERATIVO DO BRASIL S.A.',
}

const estadoCivilMap: Record<string, string> = {
  'solteiro': 'Solteiro(a)', 'casado': 'Casado(a)', 'divorciado': 'Divorciado(a)',
  'viuvo': 'Viúvo(a)', 'uniao-estavel': 'União Estável',
}
const escolaridadeMap: Record<string, string> = {
  'fundamental': 'Ensino Fundamental', 'medio': 'Ensino Médio',
  'superior-incompleto': 'Ensino Superior Incompleto',
  'superior-completo': 'Ensino Superior Completo',
  'pos-graduacao': 'Pós-graduação',
}
const tipoContaMap: Record<string, string> = {
  'corrente': 'CC', 'poupanca': 'CP', 'pagamento': 'PG',
}

// ── Hidratação: sobrescreve com dados reais do localStorage (via proxy mesma origem) ──
onMounted(() => {
  if (!isOnboarding) return
  try {
    const raw1 = localStorage.getItem('mesa_proposta_pendente')
    if (raw1) {
      const d = JSON.parse(raw1) as Record<string, string>
      if (d.rendaBruta)      dadosGerais.rendaBruta      = d.rendaBruta
      if (d.dataNascimento)  dadosGerais.dataNascimento  = d.dataNascimento
      if (d.email)           dadosGerais.email           = d.email
      if (d.valorEmprestimo) dadosEmpPessoal.limiteAprovado = d.valorEmprestimo
    }
    const raw2 = localStorage.getItem('mesa_dados_pessoais')
    if (raw2) {
      const d = JSON.parse(raw2) as Record<string, string>
      if (d.profissao)    dadosComplementares.profissao  = d.profissao
      if (d.estadoCivil)  estadoCivil.value   = estadoCivilMap[d.estadoCivil]  ?? estadoCivil.value
      if (d.escolaridade) grauInstrucao.value = escolaridadeMap[d.escolaridade] ?? grauInstrucao.value
      if (d.banco)        dadosBancarios.value.banco    = bancoCodigos[d.banco] ?? d.banco
      if (d.agencia)      dadosBancarios.value.agencia  = d.agencia
      if (d.conta) {
        const partes = d.conta.split('-')
        dadosBancarios.value.numero = partes[0]?.trim() ?? d.conta
        dadosBancarios.value.digito = partes[1]?.trim() ?? ''
      }
      if (d.tipoConta) dadosBancarios.value.tipoConta = tipoContaMap[d.tipoConta] ?? 'CC'
    }
    const raw3 = localStorage.getItem('mesa_endereco')
    if (raw3) {
      const d = JSON.parse(raw3) as Record<string, string>
      if (enderecos[0]) {
        if (d.logradouro) enderecos[0].logradouro = `${d.logradouro}, ${d.numero ?? ''}`.toUpperCase()
        if (d.bairro)     enderecos[0].bairro      = d.bairro.toUpperCase()
        if (d.complemento) enderecos[0].complemento = d.complemento.toUpperCase()
        if (d.cidade && d.estado) enderecos[0].cidadeUf = `${d.cidade} - ${d.estado}`
        if (d.cep)        enderecos[0].cep         = d.cep.replace('-', '')
      }
      if (telefones[0] && d.celular) telefones[0].numero = d.celular
    }
  } catch { /* localStorage corrompido — ignorar */ }
})

const representantesAberto = ref(false)

// Documentos consignado
const gruposDocumentos = [
  {
    nome: proposta?.nome ? `${proposta.nome.toUpperCase()} (proposta)` : 'CLIENTE (proposta)',
    docs: [
      { count: 0, tipo: 'CCB' },
      { count: 0, tipo: 'COMPROVANTE DE MARGEM' },
    ],
  },
  {
    nome: proposta?.nome ? `${proposta.nome.toUpperCase()} (cliente)` : 'CLIENTE',
    docs: [
      { count: 2, tipo: 'CONTRACHEQUE' },
      { count: 1, tipo: 'DOCUMENTO DE IDENTIDADE' },
    ],
  },
]

// Documentos empréstimo pessoal
const gruposDocumentosEmpPessoal = [
  { count: 1, tipo: 'DOCUMENTO DE IDENTIDADE (RG/CNH)' },
  { count: 1, tipo: 'SELFIE COM DOCUMENTO' },
]

const dadosFinanceiros = isOnboarding ? {
  codigoProposta: 'web-onboarding',
  codigoLMS:      '',
  status:         'Em Análise',
  motivo:         'SOLICITAÇÃO DIGITAL',
  iofValorTotal:  '0.03850',
  canal:              'Web',
  dataBase:           hoje,
  data1aVisto:        hoje,
  dtUltVisto:         hoje,
  valorPretendido:    'R$ 3.500,00',
  valorSolicitado:    'R$ 3.500,00',
  valorPrincipal:     'R$ 3.500,00',
  valorBruto:         'R$ 4.284,00',
  txNomAa:            '0.3490',
  txNomAm:            '0.0253',
  txCetAa:            '0.4215',
  txCetAm:            '0.0298',
  segmento:           'PF',
  qtdeParcelas:       '24',
  valorParcela:       'R$ 178,50',
  dataBaseParcela:    hoje,
  data1aVistoParcela: hoje,
  valorBalanco:       'R$ 0,00',
  dataBalanco:        '-',
  inicioBalanco:      '-',
  fimBalanco:         '-',
} : {
  codigoProposta: '0e6d8e0d',
  codigoLMS:      '',
  status:         'Em Análise',
  motivo:         'OPORTUNIDADE',
  iofValorTotal:  '0.46738',
  canal:              'Unimed',
  dataBase:           '13/06/2024',
  data1aVisto:        '13/06/2024',
  dtUltVisto:         '13/03/2026',
  valorPretendido:    '300.000,00',
  valorSolicitado:    '200.000,00',
  valorPrincipal:     '303.487,18',
  valorBruto:         '378.324,48',
  txNomAa:            '0.2511',
  txNomAm:            '0.0350',
  txCetAa:            '0.5645',
  txCetAm:            '0.0369',
  segmento:           'PF',
  qtdeParcelas:       '12',
  valorParcela:       '31.527,04',
  dataBaseParcela:    '13/06/2024',
  data1aVistoParcela: '13/06/2024',
  valorBalanco:       '100.000,00',
  dataBalanco:        '10/05/2024',
  inicioBalanco:      '01/02/2003',
  fimBalanco:         '13/02/2003',
}

// ── Topbar nav ───────────────────────────────────────────────────
const navAtivo = ref('analise')
const navItems = [
  { key: 'analise',     label: 'Analise Mesa' },
  { key: 'cadastro',    label: 'Cadastro',    dropdown: true },
  { key: 'cobranca',    label: 'Cobrança',    dropdown: true },
]

// ── Abas de ícone ────────────────────────────────────────────────
const abaIcone = ref(0)
const abaIcones = [
  { label: 'Dados do Cliente' },
  { label: 'Contato' },
  { label: 'Dados Bancários' },
  { label: 'Financeiro' },
  { label: 'Documentos' },
  { label: 'Histórico' },
]

// ── Accordion ────────────────────────────────────────────────────
const regraAberta    = ref(false)
const historicoAberto = ref(true)

const historicoMesa = [
  { dataHora: '21/07/2026 08:14', observacao: 'Proposta recebida via canal Web e aprovada na triagem automática.', atividade: 'Triagem',           acao: 'Aprovado',      email: 'sistema@dock.com.br',            destaque: false },
  { dataHora: '21/07/2026 08:15', observacao: 'Documentos de identidade e selfie validados com sucesso.',         atividade: 'Análise de Documentos', acao: 'Aprovado',  email: 'sistema@dock.com.br',            destaque: false },
  { dataHora: '21/07/2026 08:17', observacao: 'Proposta aguardando revisão do analista de crédito.',              atividade: 'Análise Mesa',    acao: 'Em andamento',   email: 'brayhon.carvalho@dock.com.br',   destaque: true  },
]

// ── Modal de decisão ─────────────────────────────────────────────
const modalAberto = ref<'aprovar' | 'reprovar' | 'observacao' | 'cancelar' | 'desfazer' | null>(null)
const motivoTexto = ref('')
const motivoError = ref('')
const processando  = ref(false)

const toastMsg = ref('')
function mostrarToast(msg: string, duration = 3200) {
  toastMsg.value = msg
  setTimeout(() => { toastMsg.value = '' }, duration)
}

function formatPct(val: string | number) {
  const n = parseFloat(String(val))
  return isNaN(n) ? '-' : (n * 100).toFixed(2).replace('.', ',') + '%'
}

const situacaoLabelMap: Record<string, string> = {
  EmAnalise: 'Em Análise', Aprovada: 'Aprovada', Reprovada: 'Reprovada',
  Formalização: 'Formalização', Cancelada: 'Cancelada', Liberada: 'Liberada',
}
const situacaoLabel = computed(() => situacaoLabelMap[situacaoLocal.value] ?? situacaoLocal.value)

const situacaoBgMap: Record<string, string> = {
  EmAnalise: 'rgba(255,255,255,.14)', Aprovada: '#BBF3D4', Reprovada: '#F8D2CC',
  Formalização: 'rgba(255,255,255,.14)', Cancelada: 'rgba(255,255,255,.09)',
}
const situacaoFgMap: Record<string, string> = {
  EmAnalise: '#fff', Aprovada: '#0A5C36', Reprovada: '#7E2418',
  Formalização: '#fff', Cancelada: 'rgba(255,255,255,.7)',
}

const motivosRecusa = [
  'Score de crédito insuficiente',
  'Renda incompatível com o valor solicitado',
  'Documentação incompleta ou inválida',
  'Dados inconsistentes',
  'Política interna de crédito',
  'Outro',
]

function abrirModal(tipo: 'aprovar' | 'reprovar' | 'observacao' | 'cancelar' | 'desfazer') {
  motivoTexto.value = ''
  motivoError.value = ''
  modalAberto.value = tipo
}
function fecharModal() { modalAberto.value = null }

async function confirmarDecisao() {
  if (modalAberto.value === 'reprovar' && !motivoTexto.value) {
    motivoError.value = 'Selecione um motivo.'
    return
  }
  if ((modalAberto.value === 'cancelar' || modalAberto.value === 'desfazer') && !motivoTexto.value) {
    motivoError.value = 'Informe o motivo.'
    return
  }

  const acao = modalAberto.value
  processando.value = true
  await new Promise(r => setTimeout(r, 800))
  processando.value = false
  fecharModal()

  function atualizarSituacao(novaSituacao: string) {
    situacaoLocal.value = novaSituacao
    const idx = propostasListStore.value.findIndex(p => p.id === proposta?.id)
    if (idx !== -1) propostasListStore.value[idx].situacao = novaSituacao
  }

  if (acao === 'aprovar') {
    atualizarSituacao('Aprovada')
    mostrarToast('Proposta aprovada com sucesso')
    await new Promise(r => setTimeout(r, 1000))
    router.push('/propostas')
  } else if (acao === 'reprovar') {
    atualizarSituacao('Reprovada')
    mostrarToast('Proposta reprovada')
  } else if (acao === 'cancelar') {
    atualizarSituacao('Cancelada')
    mostrarToast('Proposta cancelada')
  } else {
    mostrarToast('Observação registrada')
  }
}
</script>

<template>
  <main class="pd-main">
    <div class="pd-content">

      <!-- ── Breadcrumb ─────────────────────────────── -->
      <div class="pd-breadcrumb">
        <button class="pd-back-btn" @click="voltar()" aria-label="Voltar à lista">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <span class="pd-breadcrumb__text">
          Análise Mesa&nbsp;&nbsp;/&nbsp;&nbsp;
          <span class="pd-breadcrumb__cur">Proposta {{ proposta?.id }}</span>
        </span>
      </div>

      <!-- ── Hero ─────────────────────────────────── -->
      <section class="pd-hero" aria-label="Resumo da proposta">
        <!-- Identidade + badges -->
        <div class="pd-hero__top">
          <div class="pd-hero__identity">
            <div class="pd-hero__avatar" aria-hidden="true">{{ proposta?.nome?.charAt(0)?.toUpperCase() }}</div>
            <div>
              <h1 class="pd-hero__name">{{ proposta?.nome }}</h1>
              <div class="pd-hero__meta">
                <span>CPF {{ cpfExibido }}</span>
                <span class="pd-hero__sep" aria-hidden="true"></span>
                <span>ID {{ proposta?.id }}</span>
              </div>
            </div>
          </div>
          <div class="pd-hero__badges">
            <span class="pd-hero__badge">Canal {{ canalExibido }}</span>
            <span class="pd-hero__badge">{{ isConsignado ? 'Consignado' : 'Empréstimo Pessoal' }}</span>
            <span class="pd-hero__badge pd-hero__badge--status"
              :style="{ background: situacaoBgMap[situacaoLocal] ?? 'rgba(255,255,255,.14)', color: situacaoFgMap[situacaoLocal] ?? '#fff' }">
              <span class="pd-hero__badge-dot" aria-hidden="true"></span>
              {{ situacaoLabel }}
            </span>
          </div>
        </div>

        <!-- Valores chave -->
        <div class="pd-hero__values">
          <div class="pd-hero__val-card">
            <p class="pd-hero__val-label">Valor solicitado</p>
            <p class="pd-hero__val-num">{{ dadosFinanceiros.valorSolicitado }}</p>
          </div>
          <div class="pd-hero__val-card">
            <p class="pd-hero__val-label">Parcela</p>
            <p class="pd-hero__val-num">{{ dadosFinanceiros.qtdeParcelas }}× {{ dadosFinanceiros.valorParcela }}</p>
          </div>
          <div class="pd-hero__val-card">
            <p class="pd-hero__val-label">Taxa a.m.</p>
            <p class="pd-hero__val-num">{{ formatPct(dadosFinanceiros.txNomAm) }}</p>
          </div>
          <div class="pd-hero__val-card">
            <p class="pd-hero__val-label">Renda mensal</p>
            <p class="pd-hero__val-num">{{ dadosGerais.rendaBruta }}</p>
          </div>
        </div>

      </section>

      <!-- ── Tabs ─────────────────────────────────── -->
      <div class="pd-tabs" role="tablist" aria-label="Seções da proposta">
        <button
          v-for="(tab, i) in abaIcones"
          :key="i"
          role="tab"
          :aria-selected="abaIcone === i"
          class="pd-tab"
          :class="{ 'pd-tab--active': abaIcone === i }"
          @click="abaIcone = i"
        >{{ tab.label }}</button>
      </div>

      <!-- ══ Tab 0: Dados do Cliente ══ -->
      <section v-if="abaIcone === 0" class="pd-panel" aria-label="Dados do Cliente">
        <div class="pd-card">
          <div class="pd-card__head">
            <h2 class="pd-card__title">Dados Gerais</h2>
            <span class="pd-badge-info">Enviado pelo cliente · {{ canalExibido }}</span>
          </div>
          <div class="pd-grid">
            <div class="pd-field"><span class="pd-field__lbl">Nome completo</span><span class="pd-field__val">{{ dadosGerais.nomeCompleto }}</span></div>
            <div class="pd-field"><span class="pd-field__lbl">E-mail</span><span class="pd-field__val">{{ dadosGerais.email }}</span></div>
            <div class="pd-field"><span class="pd-field__lbl">CPF</span><span class="pd-field__val">{{ dadosGerais.cpf }}</span></div>
            <div class="pd-field"><span class="pd-field__lbl">Data de nascimento</span><span class="pd-field__val">{{ dadosGerais.dataNascimento }}</span></div>
            <div class="pd-field"><span class="pd-field__lbl">Renda bruta mensal</span><span class="pd-field__val">{{ dadosGerais.rendaBruta }}</span></div>
            <template v-if="isConsignado">
              <div class="pd-field"><span class="pd-field__lbl">Matrícula</span><span class="pd-field__val">{{ dadosConsignado.matricula }}</span></div>
              <div class="pd-field"><span class="pd-field__lbl">Órgão</span><span class="pd-field__val">{{ dadosConsignado.orgao }}</span></div>
              <div class="pd-field"><span class="pd-field__lbl">Situação funcional</span><span class="pd-field__val">{{ dadosConsignado.situacaoFuncional }}</span></div>
              <div class="pd-field"><span class="pd-field__lbl">Tempo de admissão</span><span class="pd-field__val">{{ dadosConsignado.tempoAdmissao }}</span></div>
            </template>
          </div>
          <div class="pd-card__subsec">
            <h2 class="pd-card__title">Dados Complementares</h2>
          </div>
          <div class="pd-grid">
            <div class="pd-field"><span class="pd-field__lbl">Estado civil</span><span class="pd-field__val">{{ estadoCivil }}</span></div>
            <div class="pd-field"><span class="pd-field__lbl">Grau de instrução</span><span class="pd-field__val">{{ grauInstrucao }}</span></div>
            <div class="pd-field"><span class="pd-field__lbl">Profissão / Ocupação</span><span class="pd-field__val">{{ dadosComplementares.profissao }}</span></div>
            <div class="pd-field"><span class="pd-field__lbl">Nome da mãe</span><span class="pd-field__val">{{ dadosComplementares.nomeMae }}</span></div>
            <div class="pd-field"><span class="pd-field__lbl">Dependentes</span><span class="pd-field__val">{{ dadosComplementares.qtdDependentes }}</span></div>
            <div class="pd-field"><span class="pd-field__lbl">Nacionalidade</span><span class="pd-field__val">{{ dadosComplementares.nacionalidade }}</span></div>
            <div class="pd-field"><span class="pd-field__lbl">Naturalidade</span><span class="pd-field__val">{{ dadosComplementares.naturalidade }}</span></div>
          </div>
        </div>
      </section>

      <!-- ══ Tab 1: Contato ══ -->
      <section v-if="abaIcone === 1" class="pd-panel pd-panel--2col" aria-label="Dados de contato">
        <!-- Endereço -->
        <div class="pd-card" v-if="enderecos[0]">
          <div class="pd-card__head pd-card__head--icon">
            <div class="pd-icon-wrap" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></svg>
            </div>
            <div>
              <h2 class="pd-card__title">Endereço atual</h2>
              <span class="pd-field__lbl">Residencial · informado no onboarding</span>
            </div>
          </div>
          <p class="pd-addr-line pd-addr-line--main">{{ enderecos[0].logradouro }}</p>
          <p class="pd-addr-line">{{ enderecos[0].bairro }}</p>
          <p class="pd-addr-line">{{ enderecos[0].cidadeUf }} · CEP {{ enderecos[0].cep }}</p>
        </div>

        <!-- Telefone -->
        <div class="pd-card" v-if="telefones[0]">
          <div class="pd-card__head pd-card__head--icon">
            <div class="pd-icon-wrap" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="7" y="2" width="10" height="20" rx="2"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>
            </div>
            <div>
              <h2 class="pd-card__title">Telefone principal</h2>
              <span class="pd-field__lbl">Celular · UF {{ telefones[0].uf }}</span>
            </div>
          </div>
          <p class="pd-tel-num">{{ telefones[0].numero }}</p>
          <span class="pd-verified-badge">Verificado por SMS</span>
          <div class="pd-tel-prefs">
            <div class="pd-tel-pref">
              <label for="canal-contato" class="pd-field__lbl">Canal de contato</label>
              <select id="canal-contato" v-model="canalContato" class="pd-select">
                <option>WhatsApp</option>
                <option>Telefone</option>
                <option>E-mail</option>
                <option>SMS</option>
              </select>
            </div>
            <div class="pd-tel-pref">
              <label for="horario-contato" class="pd-field__lbl">Horário</label>
              <select id="horario-contato" v-model="horarioContato" class="pd-select">
                <option>Manhã (08h–12h)</option>
                <option>Tarde (12h–18h)</option>
                <option>Noite (18h–21h)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <!-- ══ Tab 2: Dados Bancários ══ -->
      <section v-if="abaIcone === 2" class="pd-panel" aria-label="Dados bancários">
        <div class="pd-card">
          <div class="pd-card__head">
            <h2 class="pd-card__title">Conta para desembolso</h2>
            <button class="pd-btn-outline">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Criar Conta Digital
            </button>
          </div>
          <div class="pd-grid">
            <div class="pd-field pd-field--span2"><span class="pd-field__lbl">Banco</span><span class="pd-field__val">{{ dadosBancarios.banco }}</span></div>
            <div class="pd-field"><span class="pd-field__lbl">Agência</span><span class="pd-field__val">{{ dadosBancarios.agencia }}</span></div>
            <div class="pd-field"><span class="pd-field__lbl">Conta</span><span class="pd-field__val">{{ dadosBancarios.numero }}-{{ dadosBancarios.digito }}</span></div>
            <div class="pd-field"><span class="pd-field__lbl">Tipo</span><span class="pd-field__val">{{ dadosBancarios.tipoConta === 'CC' ? 'Conta Corrente' : dadosBancarios.tipoConta === 'CP' ? 'Conta Poupança' : dadosBancarios.tipoConta }}</span></div>
            <div class="pd-field"><span class="pd-field__lbl">Débito automático</span><span class="pd-field__val">{{ dadosBancarios.debitoAuto }}</span></div>
            <div class="pd-field"><span class="pd-field__lbl">Origem</span><span class="pd-field__val">{{ dadosBancarios.origem }}</span></div>
          </div>
          <div class="pd-info-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;margin-top:1px" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="#1D4FD7" stroke-width="1.8"/><line x1="12" y1="8" x2="12" y2="12" stroke="#1D4FD7" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16" r="1" fill="#1D4FD7"/></svg>
            <p>Titularidade validada: a conta pertence ao CPF do proponente. Dados informados no fluxo digital em {{ dadosFinanceiros.dataBase }}.</p>
          </div>
        </div>
      </section>

      <!-- ══ Tab 3: Financeiro ══ -->
      <section v-if="abaIcone === 3" class="pd-panel" aria-label="Dados financeiros">
        <!-- Condições -->
        <div class="pd-card">
          <div class="pd-card__head"><h2 class="pd-card__title">Condições do financiamento</h2></div>
          <div class="pd-grid">
            <div class="pd-field"><span class="pd-field__lbl">Valor solicitado</span><span class="pd-field__val">{{ dadosFinanceiros.valorSolicitado }}</span></div>
            <div class="pd-field"><span class="pd-field__lbl">Valor principal</span><span class="pd-field__val">{{ dadosFinanceiros.valorPrincipal }}</span></div>
            <div class="pd-field"><span class="pd-field__lbl">Valor bruto</span><span class="pd-field__val">{{ dadosFinanceiros.valorBruto }}</span></div>
            <div class="pd-field"><span class="pd-field__lbl">Parcelas</span><span class="pd-field__val">{{ dadosFinanceiros.qtdeParcelas }}× de {{ dadosFinanceiros.valorParcela }}</span></div>
            <div class="pd-field"><span class="pd-field__lbl">Segmento</span><span class="pd-field__val">{{ dadosFinanceiros.segmento }}</span></div>
            <div class="pd-field"><span class="pd-field__lbl">Motivo</span><span class="pd-field__val">{{ dadosFinanceiros.motivo }}</span></div>
            <div class="pd-field"><span class="pd-field__lbl">Data base</span><span class="pd-field__val">{{ dadosFinanceiros.dataBase }}</span></div>
            <div class="pd-field"><span class="pd-field__lbl">1º vencimento</span><span class="pd-field__val">{{ dadosFinanceiros.data1aVisto }}</span></div>
          </div>
        </div>
        <!-- Taxas -->
        <div class="pd-card">
          <div class="pd-card__head"><h2 class="pd-card__title">Análise de taxas</h2></div>
          <div class="pd-tax-grid">
            <div class="pd-tax-card">
              <p class="pd-field__lbl">Tx nominal a.a.</p>
              <p class="pd-tax-val">{{ formatPct(dadosFinanceiros.txNomAa) }}</p>
            </div>
            <div class="pd-tax-card">
              <p class="pd-field__lbl">Tx nominal a.m.</p>
              <p class="pd-tax-val">{{ formatPct(dadosFinanceiros.txNomAm) }}</p>
            </div>
            <div class="pd-tax-card">
              <p class="pd-field__lbl">CET a.a.</p>
              <p class="pd-tax-val">{{ formatPct(dadosFinanceiros.txCetAa) }}</p>
            </div>
            <div class="pd-tax-card">
              <p class="pd-field__lbl">CET a.m.</p>
              <p class="pd-tax-val">{{ formatPct(dadosFinanceiros.txCetAm) }}</p>
            </div>
            <div class="pd-tax-card">
              <p class="pd-field__lbl">IOF total</p>
              <p class="pd-tax-val">{{ formatPct(dadosFinanceiros.iofValorTotal) }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ══ Tab 4: Documentos ══ -->
      <section v-if="abaIcone === 4" class="pd-panel" aria-label="Documentos">
        <div class="pd-card">
          <div class="pd-card__head">
            <h2 class="pd-card__title">Checklist de documentos</h2>
            <span class="pd-field__lbl" style="margin-left:auto">
              {{ isConsignado
                ? gruposDocumentos.flatMap(g => g.docs).filter(d => d.count > 0).length
                : gruposDocumentosEmpPessoal.filter(d => d.count > 0).length }}
              de
              {{ isConsignado
                ? gruposDocumentos.flatMap(g => g.docs).length
                : gruposDocumentosEmpPessoal.length }} recebidos
            </span>
          </div>
          <div class="pd-doc-list">
            <template v-if="isConsignado">
              <template v-for="grupo in gruposDocumentos" :key="grupo.nome">
                <p class="pd-doc-group-lbl">{{ grupo.nome }}</p>
                <div v-for="doc in grupo.docs" :key="doc.tipo" class="pd-doc-row">
                  <span class="pd-doc-count" :class="doc.count > 0 ? 'pd-doc-count--ok' : 'pd-doc-count--pending'">{{ doc.count }}</span>
                  <span class="pd-doc-name">{{ doc.tipo }}</span>
                  <span class="pd-doc-badge" :class="doc.count > 0 ? 'pd-doc-badge--ok' : 'pd-doc-badge--pending'">{{ doc.count > 0 ? 'Recebido' : 'Pendente' }}</span>
                </div>
              </template>
            </template>
            <template v-else>
              <div v-for="doc in gruposDocumentosEmpPessoal" :key="doc.tipo" class="pd-doc-row">
                <span class="pd-doc-count" :class="doc.count > 0 ? 'pd-doc-count--ok' : 'pd-doc-count--pending'">{{ doc.count }}</span>
                <span class="pd-doc-name">{{ doc.tipo }}</span>
                <span class="pd-doc-badge" :class="doc.count > 0 ? 'pd-doc-badge--ok' : 'pd-doc-badge--pending'">{{ doc.count > 0 ? 'Recebido' : 'Pendente' }}</span>
              </div>
            </template>
          </div>
        </div>
      </section>

      <!-- ══ Tab 5: Histórico ══ -->
      <section v-if="abaIcone === 5" class="pd-panel" aria-label="Histórico da Mesa">
        <div class="pd-card">
          <div class="pd-card__head"><h2 class="pd-card__title">Histórico da Mesa</h2></div>
          <div class="pd-history">
            <div v-for="(h, i) in historicoMesa" :key="i" class="pd-history__row">
              <div class="pd-history__track">
                <div class="pd-history__dot" :class="i === historicoMesa.length - 1 ? 'pd-history__dot--active' : 'pd-history__dot--done'"></div>
                <div v-if="i < historicoMesa.length - 1" class="pd-history__line"></div>
              </div>
              <div class="pd-history__body">
                <div class="pd-history__header">
                  <span class="pd-history__ativ">{{ h.atividade }}</span>
                  <span class="pd-history__acao-badge">{{ h.acao }}</span>
                </div>
                <p class="pd-history__obs">{{ h.observacao }}</p>
                <p class="pd-history__meta">{{ h.dataHora }} · {{ h.email }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div><!-- /pd-content -->
  </main>

  <!-- ── Barra de ações (fixed) ────────────────────── -->
  <div class="pd-action-bar" aria-label="Decisão da proposta">
    <span class="pd-action-bar__label">
      Analisando proposta de <strong>{{ proposta?.nome }}</strong>
    </span>
    <button class="pd-action-obs" @click="abrirModal('observacao')">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      Observação
    </button>
    <button class="pd-action-reprovar" @click="abrirModal('reprovar')">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
      Reprovar
    </button>
    <button class="pd-action-aprovar" @click="abrirModal('aprovar')">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
      Aprovar proposta
    </button>
  </div>

  <!-- ── Toast ──────────────────────────────────────── -->
  <Transition name="pd-toast">
    <div v-if="toastMsg" class="pd-toast" role="status" aria-live="polite">{{ toastMsg }}</div>
  </Transition>

  <!-- ── Modal ──────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="modalAberto" class="pd-modal-bg" @click.self="fecharModal()" role="dialog" :aria-label="modalAberto === 'aprovar' ? 'Confirmar Aprovação' : modalAberto === 'reprovar' ? 'Confirmar Reprovação' : 'Adicionar Observação'" aria-modal="true">
      <div class="pd-modal">
        <div class="pd-modal__head">
          <div>
            <h3 class="pd-modal__title">
              {{ modalAberto === 'aprovar' ? 'Confirmar Aprovação'
               : modalAberto === 'reprovar' ? 'Confirmar Reprovação'
               : 'Adicionar Observação' }}
            </h3>
            <p class="pd-modal__sub">Proposta {{ proposta?.id }} · {{ proposta?.nome }}</p>
          </div>
          <button class="pd-modal__close" @click="fecharModal()" aria-label="Fechar modal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="pd-modal__body">
          <!-- Selecionar motivo (reprovar) -->
          <template v-if="modalAberto === 'reprovar'">
            <label for="modal-motivo" class="pd-field__lbl pd-field__lbl--block">Motivo *</label>
            <select id="modal-motivo" v-model="motivoTexto" class="pd-select pd-select--full"
              :class="{ 'pd-select--error': motivoError }">
              <option value="" disabled>Selecione...</option>
              <option v-for="m in motivosRecusa" :key="m" :value="m">{{ m }}</option>
            </select>
            <p v-if="motivoError" role="alert" class="pd-modal__error">{{ motivoError }}</p>
          </template>
          <!-- Observação (aprovar ou observacao) -->
          <template v-if="modalAberto === 'aprovar' || modalAberto === 'observacao'">
            <label for="modal-obs" class="pd-field__lbl pd-field__lbl--block">
              {{ modalAberto === 'observacao' ? 'Observação' : 'Observação (opcional)' }}
            </label>
            <textarea id="modal-obs" v-model="motivoTexto" rows="4" class="pd-textarea"
              placeholder="Digite sua observação..."></textarea>
          </template>
        </div>
        <div class="pd-modal__foot">
          <button class="pd-modal__btn-cancel" @click="fecharModal()" :disabled="processando">Cancelar</button>
          <button
            class="pd-modal__btn-confirm"
            :class="modalAberto === 'reprovar' ? 'pd-modal__btn-confirm--red' : ''"
            @click="confirmarDecisao()"
            :disabled="processando"
            :aria-busy="processando">
            <svg v-if="processando" class="pd-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            {{ processando ? 'Aguarde...'
             : modalAberto === 'aprovar' ? (stepAtual === steps.length - 1 ? 'Aprovar proposta' : 'Aprovar etapa')
             : modalAberto === 'reprovar' ? 'Reprovar'
             : 'Salvar' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes pd-toast-in { from { transform:translateY(12px);opacity:0 } to { transform:translateY(0);opacity:1 } }
@keyframes pd-spin { to { transform: rotate(360deg) } }
@keyframes pd-modal-in { from { transform:scale(.95) translateY(10px);opacity:0 } to { transform:scale(1) translateY(0);opacity:1 } }

/* ── Layout ─────────────────────────────────────────────────────── */
.pd-main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 24px 28px 100px;
  background: var(--surface-page);
}
.pd-content {
  max-width: 1180px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Breadcrumb ─────────────────────────────────────────────────── */
.pd-breadcrumb {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pd-back-btn {
  width: 36px; height: 36px;
  border-radius: 999px;
  border: 1.5px solid var(--admin-border);
  background: var(--surface-card);
  color: var(--admin-muted);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background .12s, color .12s, border-color .12s;
}
.pd-back-btn:hover { background: var(--admin-blue-100); color: var(--admin-blue); border-color: var(--admin-blue-border); }
.pd-back-btn:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: 2px; }
.pd-breadcrumb__text { font-size: 13px; color: var(--admin-muted); }
.pd-breadcrumb__cur  { color: var(--admin-text-strong); font-weight: 600; }

/* ── Hero ───────────────────────────────────────────────────────── */
.pd-hero {
  background: linear-gradient(135deg, #0E2A5C 0%, #1D4FD7 100%);
  border-radius: 22px;
  padding: 28px 32px 24px;
  color: #fff;
  box-shadow: 0 20px 50px rgba(14,42,92,.18);
}

.pd-hero__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}
.pd-hero__identity {
  display: flex; align-items: center; gap: 16px;
}
.pd-hero__avatar {
  width: 56px; height: 56px;
  border-radius: 16px;
  background: rgba(255,255,255,.14);
  border: 1px solid rgba(255,255,255,.22);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display);
  font-weight: 700; font-size: 20px; color: #fff;
  flex-shrink: 0;
}
.pd-hero__name {
  font-family: var(--font-display);
  font-size: 22px; font-weight: 600;
  letter-spacing: -0.01em; color: #fff;
  margin: 0;
}
.pd-hero__meta {
  display: flex; align-items: center; gap: 10px;
  margin-top: 6px; flex-wrap: wrap;
  font-size: 13px; color: rgba(255,255,255,.65);
}
.pd-hero__sep {
  width: 3px; height: 3px; border-radius: 50%;
  background: rgba(255,255,255,.4);
}
.pd-hero__badges { display: flex; gap: 8px; flex-wrap: wrap; }
.pd-hero__badge {
  height: 26px;
  display: inline-flex; align-items: center;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255,255,255,.14);
  border: 1px solid rgba(255,255,255,.22);
  font-size: 11px; font-weight: 700; color: #fff;
  white-space: nowrap;
}
.pd-hero__badge--status {
  display: inline-flex; align-items: center; gap: 6px;
}
.pd-hero__badge-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: currentColor; flex-shrink: 0;
}

/* Values grid */
.pd-hero__values {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 24px;
}
.pd-hero__val-card {
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.14);
  border-radius: 14px;
  padding: 14px 16px;
}
.pd-hero__val-label {
  margin: 0;
  font-size: 10px; font-weight: 700;
  letter-spacing: .06em; text-transform: uppercase;
  color: rgba(255,255,255,.55);
}
.pd-hero__val-num {
  margin: 4px 0 0;
  font-family: var(--font-display);
  font-size: 22px; font-weight: 600; color: #fff;
}

/* ── Tabs ───────────────────────────────────────────────────────── */
.pd-tabs {
  display: flex; gap: 8px; flex-wrap: wrap;
}
.pd-tab {
  height: 40px; padding: 0 18px;
  border-radius: 999px;
  border: 1.5px solid var(--admin-border);
  background: var(--surface-card);
  color: var(--admin-text);
  font-family: var(--font-body);
  font-size: 13.5px; font-weight: 600;
  cursor: pointer; white-space: nowrap;
  transition: background .15s, color .15s, border-color .15s;
}
.pd-tab:hover { background: var(--admin-blue-50); color: var(--admin-blue); border-color: var(--admin-blue-border); }
.pd-tab:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: 2px; }
.pd-tab--active {
  background: var(--admin-blue); color: #fff;
  border-color: var(--admin-blue);
}

/* ── Panel / Card ───────────────────────────────────────────────── */
.pd-panel { display: flex; flex-direction: column; gap: 16px; }
.pd-panel--2col { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }

.pd-card {
  background: var(--surface-card);
  border: 1px solid var(--admin-border);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(14,42,92,.05);
}
.pd-card__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--admin-border-light);
  flex-wrap: wrap; gap: 10px;
}
.pd-card__head--icon {
  display: flex; align-items: center; gap: 10px;
  justify-content: flex-start;
}
.pd-card__subsec {
  padding: 18px 24px;
  border-top: 1px solid var(--admin-border-light);
  border-bottom: 1px solid var(--admin-border-light);
  background: var(--admin-blue-50);
}
.pd-card__title {
  font-family: var(--font-display);
  font-size: 16px; font-weight: 600;
  color: var(--text-heading); margin: 0;
}
.pd-badge-info {
  height: 24px; display: inline-flex; align-items: center;
  padding: 0 10px; border-radius: 999px;
  background: var(--admin-blue-100); color: var(--admin-blue);
  font-size: 11px; font-weight: 700;
}

/* ── Field grid ─────────────────────────────────────────────────── */
.pd-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px 28px;
  padding: 22px 24px;
}
.pd-field { display: flex; flex-direction: column; gap: 4px; }
.pd-field--span2 { grid-column: span 2; }
.pd-field__lbl {
  font-size: 10px; font-weight: 700;
  letter-spacing: .06em; text-transform: uppercase;
  color: var(--admin-muted);
}
.pd-field__lbl--block { display: block; margin-bottom: 6px; }
.pd-field__val {
  font-size: 15px; font-weight: 600;
  color: var(--text-heading);
}

/* ── Contato ────────────────────────────────────────────────────── */
.pd-icon-wrap {
  width: 34px; height: 34px; border-radius: 10px;
  background: var(--admin-blue-100); color: var(--admin-blue);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.pd-addr-line { margin: 0 0 3px; padding: 0 24px; font-size: 14px; color: var(--admin-text); }
.pd-addr-line--main { font-size: 15px; font-weight: 600; color: var(--text-heading); padding: 0 24px; margin: 0 0 4px; }
.pd-card__head--icon + .pd-addr-line, .pd-card__head--icon ~ .pd-addr-line { }
.pd-tel-num {
  margin: 0 0 10px; padding: 0 24px;
  font-family: var(--font-display); font-size: 20px;
  font-weight: 600; color: var(--text-heading);
}
.pd-verified-badge {
  display: inline-flex; margin: 0 24px 16px;
  height: 24px; align-items: center; padding: 0 10px;
  border-radius: 999px; background: #E7F7EE;
  color: #177A4C; font-size: 11px; font-weight: 700;
}
.pd-tel-prefs {
  display: flex; gap: 14px; padding: 16px 24px;
  border-top: 1px solid var(--admin-border-light);
  flex-wrap: wrap;
}
.pd-tel-pref { display: flex; flex-direction: column; gap: 5px; min-width: 150px; flex: 1; }
.pd-select {
  height: 42px; padding: 0 12px;
  border: 1.5px solid var(--border-input);
  border-radius: 10px;
  font-size: 14px; color: var(--text-heading);
  background: var(--surface-card);
  font-family: var(--font-body);
  appearance: none;
}
.pd-select:focus { outline: none; border-color: var(--admin-blue); box-shadow: 0 0 0 3px rgba(29,79,215,.14); }
.pd-select--full { width: 100%; box-sizing: border-box; }
.pd-select--error { border-color: var(--error-600, #C2483B); }

/* ── Bancário ───────────────────────────────────────────────────── */
.pd-btn-outline {
  height: 36px; display: inline-flex; align-items: center; gap: 8px;
  padding: 0 16px; border: none; border-radius: 999px;
  background: var(--admin-blue-100); color: var(--admin-blue);
  font-size: 13px; font-weight: 600; cursor: pointer;
  font-family: var(--font-body);
  transition: background .12s;
}
.pd-btn-outline:hover { background: var(--admin-blue-border); }
.pd-btn-outline:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: 2px; }
.pd-info-box {
  margin: 0 24px 22px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #F3F8FF; border: 1px solid var(--admin-blue-border);
  display: flex; gap: 10px; align-items: flex-start;
}
.pd-info-box p { margin: 0; font-size: 13px; color: var(--admin-text-strong); line-height: 1.5; }

/* ── Taxas ──────────────────────────────────────────────────────── */
.pd-tax-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  padding: 20px 24px;
}
.pd-tax-card {
  background: #F7FAFF; border: 1px solid var(--admin-border);
  border-radius: 12px; padding: 14px 16px;
}
.pd-tax-val {
  margin: 4px 0 0;
  font-family: var(--font-display);
  font-size: 20px; font-weight: 600; color: var(--text-heading);
}

/* ── Documentos ─────────────────────────────────────────────────── */
.pd-doc-list { display: flex; flex-direction: column; gap: 10px; padding: 20px 24px; }
.pd-doc-group-lbl {
  font-size: 10px; font-weight: 700; letter-spacing: .06em;
  text-transform: uppercase; color: var(--admin-muted);
  margin: 8px 0 4px;
}
.pd-doc-group-lbl:first-child { margin-top: 0; }
.pd-doc-row {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 16px; border: 1.5px solid var(--admin-border);
  border-radius: 12px; background: #FBFDFF;
}
.pd-doc-count {
  width: 30px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; flex-shrink: 0;
}
.pd-doc-count--ok      { background: #E7F7EE; color: #177A4C; }
.pd-doc-count--pending { background: var(--admin-blue-50); color: var(--admin-muted); }
.pd-doc-name { flex: 1; font-size: 14px; font-weight: 600; color: var(--admin-text-strong); }
.pd-doc-badge {
  height: 24px; display: inline-flex; align-items: center;
  padding: 0 10px; border-radius: 999px;
  font-size: 11px; font-weight: 700;
}
.pd-doc-badge--ok      { background: #E7F7EE; color: #177A4C; }
.pd-doc-badge--pending { background: #FFF4E0; color: #93610A; }

/* ── Histórico ──────────────────────────────────────────────────── */
.pd-history { padding: 22px 24px; display: flex; flex-direction: column; }
.pd-history__row { display: flex; gap: 16px; }
.pd-history__track {
  display: flex; flex-direction: column;
  align-items: center; flex-shrink: 0; width: 20px;
}
.pd-history__dot {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid var(--admin-blue);
  flex-shrink: 0;
}
.pd-history__dot--active { background: var(--admin-blue); box-shadow: 0 0 0 4px rgba(29,79,215,.15); }
.pd-history__dot--done   { background: #fff; }
.pd-history__line {
  width: 2px; flex: 1; min-height: 16px;
  background: var(--admin-border);
  margin: 4px 0;
}
.pd-history__body { padding-bottom: 22px; min-width: 0; flex: 1; }
.pd-history__header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 6px; }
.pd-history__ativ { font-size: 14px; font-weight: 600; color: var(--text-heading); }
.pd-history__acao-badge {
  height: 22px; display: inline-flex; align-items: center;
  padding: 0 9px; border-radius: 999px;
  background: var(--admin-blue-100); color: var(--admin-blue);
  font-size: 11px; font-weight: 700;
}
.pd-history__obs { margin: 0 0 4px; font-size: 13.5px; color: var(--admin-text); line-height: 1.5; }
.pd-history__meta { margin: 0; font-size: 12px; color: var(--admin-muted); }

/* ── Sticky action bar ──────────────────────────────────────────── */
.pd-action-bar {
  position: fixed;
  bottom: 20px;
  left: calc(var(--sb-w, 216px) + 20px);
  right: 20px;
  max-width: 820px;
  margin: 0 auto;
  display: flex; align-items: center; gap: 10px;
  padding: 12px 18px;
  background: rgba(14, 42, 92, 0.96);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(14,42,92,.30), 0 0 0 1px rgba(255,255,255,.06);
  flex-wrap: wrap;
  z-index: 50;
}
.pd-action-bar__label {
  font-size: 13px; color: rgba(255,255,255,.65);
  margin-right: auto;
}
.pd-action-bar__label strong { color: #fff; font-weight: 600; }

.pd-action-obs {
  height: 40px; display: inline-flex; align-items: center; gap: 8px;
  padding: 0 16px;
  border: 1.5px solid rgba(255,255,255,.2);
  border-radius: 999px;
  background: rgba(255,255,255,.1); color: rgba(255,255,255,.85);
  font-size: 13.5px; font-weight: 600;
  cursor: pointer; font-family: var(--font-body);
  transition: background .12s, border-color .12s;
}
.pd-action-obs:hover { background: rgba(255,255,255,.18); border-color: rgba(255,255,255,.35); }
.pd-action-obs:focus-visible { outline: 2px solid rgba(255,255,255,.6); outline-offset: 2px; }

.pd-action-reprovar {
  height: 40px; display: inline-flex; align-items: center; gap: 8px;
  padding: 0 16px;
  border: 1.5px solid rgba(194, 72, 59, .5);
  border-radius: 999px;
  background: rgba(194, 72, 59, .2); color: #fca69f;
  font-size: 13.5px; font-weight: 600;
  cursor: pointer; font-family: var(--font-body);
  transition: background .12s, color .12s, border-color .12s;
}
.pd-action-reprovar:hover { background: #C2483B; color: #fff; border-color: #C2483B; }
.pd-action-reprovar:focus-visible { outline: 2px solid rgba(255,255,255,.6); outline-offset: 2px; }

.pd-action-aprovar {
  height: 40px; display: inline-flex; align-items: center; gap: 8px;
  padding: 0 20px; border: none; border-radius: 999px;
  background: linear-gradient(135deg, #1D4FD7, #3B82F6);
  color: #fff; font-size: 13.5px; font-weight: 700;
  cursor: pointer; font-family: var(--font-body);
  box-shadow: 0 4px 14px rgba(29,79,215,.45);
  transition: opacity .12s;
}
.pd-action-aprovar:hover { opacity: .88; }
.pd-action-aprovar:focus-visible { outline: 2px solid rgba(255,255,255,.6); outline-offset: 2px; }

/* ── Toast ──────────────────────────────────────────────────────── */
.pd-toast {
  position: fixed; bottom: 24px; left: 50%;
  transform: translateX(-50%);
  background: #0E2A5C; color: #fff;
  padding: 12px 22px; border-radius: 999px;
  font-size: 13.5px; font-weight: 600;
  box-shadow: 0 16px 40px rgba(14,42,92,.3);
  z-index: 300;
  white-space: nowrap;
  animation: pd-toast-in .2s ease;
}
.pd-toast-enter-active { animation: pd-toast-in .2s ease; }
.pd-toast-leave-active { transition: opacity .2s, transform .2s; }
.pd-toast-leave-to    { opacity: 0; transform: translateX(-50%) translateY(8px); }

/* ── Modal ──────────────────────────────────────────────────────── */
.pd-modal-bg {
  position: fixed; inset: 0;
  background: rgba(14,42,92,.45);
  backdrop-filter: blur(3px);
  z-index: 200;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.pd-modal {
  background: var(--surface-card); border-radius: 20px;
  width: 100%; max-width: 460px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(14,42,92,.28);
  animation: pd-modal-in .18s ease;
}
.pd-modal__head {
  display: flex; align-items: flex-start;
  justify-content: space-between;
  padding: 22px 24px; border-bottom: 1px solid var(--admin-border-light);
}
.pd-modal__title {
  font-family: var(--font-display); font-size: 17px; font-weight: 600;
  color: var(--text-heading); margin: 0;
}
.pd-modal__sub { margin: 4px 0 0; font-size: 12.5px; color: var(--admin-muted); }
.pd-modal__close {
  width: 30px; height: 30px; border-radius: 8px; border: none;
  background: var(--admin-blue-50); color: var(--admin-muted);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
  transition: background .12s, color .12s;
}
.pd-modal__close:hover { background: var(--admin-blue-border); color: var(--admin-blue); }
.pd-modal__body { padding: 20px 24px; }
.pd-modal__error { margin: 8px 0 0; font-size: 12.5px; color: #C2483B; font-weight: 600; }
.pd-modal__foot {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid var(--admin-border-light);
  background: var(--admin-blue-50);
}
.pd-modal__btn-cancel {
  height: 42px; padding: 0 18px;
  border: 1.5px solid var(--admin-border); border-radius: 999px;
  background: var(--surface-card); color: var(--admin-text);
  font-size: 13.5px; font-weight: 600; cursor: pointer;
  font-family: var(--font-body); transition: background .12s;
}
.pd-modal__btn-cancel:hover { background: var(--admin-blue-50); }
.pd-modal__btn-cancel:disabled { opacity: .5; cursor: default; }
.pd-modal__btn-confirm {
  height: 42px; padding: 0 22px; border: none; border-radius: 999px;
  background: var(--admin-blue); color: #fff;
  font-size: 13.5px; font-weight: 700; cursor: pointer;
  font-family: var(--font-body);
  display: inline-flex; align-items: center; gap: 8px;
  transition: background .12s;
}
.pd-modal__btn-confirm:hover  { background: var(--admin-blue-hover); }
.pd-modal__btn-confirm:disabled { opacity: .6; cursor: default; }
.pd-modal__btn-confirm--red   { background: #C2483B; }
.pd-modal__btn-confirm--red:hover { background: #a63527; }
.pd-textarea {
  width: 100%; box-sizing: border-box;
  padding: 12px; border: 1.5px solid var(--border-input);
  border-radius: 12px; font-size: 14px; color: var(--text-heading);
  font-family: var(--font-body); resize: vertical;
}
.pd-textarea:focus { outline: none; border-color: var(--admin-blue); box-shadow: 0 0 0 3px rgba(29,79,215,.14); }
.pd-spin { animation: pd-spin .8s linear infinite; }

/* ── Responsive ─────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .pd-hero__top    { flex-direction: column; }
  .pd-hero__values { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .pd-main         { padding: 16px 16px 100px; }
  .pd-hero         { padding: 20px; }
  .pd-hero__values { grid-template-columns: 1fr 1fr; }
  .pd-hero__val-num { font-size: 18px; }
  .pd-action-bar   { left: 0; max-width: calc(100vw - 32px); bottom: 12px; gap: 8px; }
  .pd-action-obs   { display: none; }
}
</style>