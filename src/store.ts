import { reactive, ref } from 'vue'
import type { PropostaRow } from './components/PropostasAnaliseScreen.vue'
import type { Proposta } from './components/DashboardScreen.vue'

export const authStore = reactive({
  email: sessionStorage.getItem('mesa_email') ?? '',
  get isAuthenticated() {
    return this.email.length > 0
  },
  login(email: string) {
    this.email = email
    sessionStorage.setItem('mesa_email', email)
  },
  logout() {
    this.email = ''
    sessionStorage.removeItem('mesa_email')
  },
})

export type TipoProduto = 'consignado' | 'emprestimo-pessoal'

// ── Lista compartilhada de propostas (Dashboard + Propostas em Análise) ──
const hoje = new Date().toLocaleDateString('pt-BR')
const agora = new Date().toLocaleString('pt-BR')

export const propostasListStore = ref<PropostaRow[]>([
  {
    id: 'e9435f5b', qtd: 1,
    nome: 'Franciele Santos de Jesus', cpfCnpj: '412.456.508-90',
    canal: 'Unimed', dataBase: '-', liberado: '0,00',
    principal: '69.000,00', parcela: '0,00',
    dataSolicitacao: '23/12/2025', ultimaTransicao: '23/12/2025 15:49',
    ccb: '-', atividade: 'Triagem', situacao: 'EmAnalise',
    tipoProduto: 'consignado',
    matricula: '1234567', orgao: 'Unimed',
    situacaoFuncional: 'Ativo', tempoAdmissao: '3 anos e 9 meses',
  },
  {
    id: 'web-onboarding', qtd: 1,
    nome: 'Brayhon Oliveira Carvalho', cpfCnpj: '412.456.508-90',
    canal: 'Web', dataBase: '-', liberado: '0,00',
    principal: 'R$ 3.500,00', parcela: '0,00',
    dataSolicitacao: hoje, ultimaTransicao: agora,
    ccb: '-', atividade: 'Triagem', situacao: 'EmAnalise',
    tipoProduto: 'emprestimo-pessoal',
    scoreCredito: '-', limiteAprovado: 'R$ 3.500,00',
  },
])

export const propostaStore = reactive({
  current: null as (Proposta | PropostaRow) | null,
  tipoProduto: 'consignado' as TipoProduto,
  set(p: Proposta | PropostaRow, tipo: TipoProduto = 'consignado') {
    this.current = p
    this.tipoProduto = tipo
  },
  clear() {
    this.current = null
  },
})

// ── Cadastro — tipos e stores mock ───────────────────────────────────
export interface CadastroCliente {
  id: string; nome: string; cpfCnpj: string; canal: string
  status: 'Ativo' | 'Inativo'; limiteAprovado: string; ultimaAtualizacao: string
}
export interface CadastroUsuario {
  id: string; nome: string; email: string
  perfil: 'Operador' | 'Analista' | 'Admin'
  status: 'Ativo' | 'Inativo'; ultimoAcesso: string
}
export interface CadastroRisco {
  id: string; scoreMin: number; scoreMax: number
  nivel: 'Muito Alto' | 'Alto' | 'Médio' | 'Baixo' | 'Muito Baixo'; descricao: string
}
export interface CadastroProduto {
  id: string; codigo: string; nome: string; modalidade: string
  prazoMin: number; prazoMax: number; valorMin: string; valorMax: string
  status: 'Ativo' | 'Inativo'
}
export interface CadastroTaxa {
  id: string; produto: string; prazo: number
  taxaMensal: string; taxaAnual: string; cet: string
  vigenciaInicio: string; vigenciaFim: string
}

export const cadastroClientesStore = ref<CadastroCliente[]>([
  { id: 'cli-001', nome: 'Franciele Santos de Jesus', cpfCnpj: '412.456.508-90', canal: 'Unimed',   status: 'Ativo',   limiteAprovado: 'R$ 69.000,00', ultimaAtualizacao: '23/12/2025' },
  { id: 'cli-002', nome: 'Brayhon Oliveira Carvalho', cpfCnpj: '123.456.789-00', canal: 'Web',      status: 'Ativo',   limiteAprovado: 'R$ 3.500,00',  ultimaAtualizacao: '15/07/2026' },
  { id: 'cli-003', nome: 'Márcia Rodrigues Lima',     cpfCnpj: '987.654.321-00', canal: 'Bradesco', status: 'Ativo',   limiteAprovado: 'R$ 25.000,00', ultimaAtualizacao: '10/06/2026' },
  { id: 'cli-004', nome: 'João Paulo Ferreira',       cpfCnpj: '321.654.987-11', canal: 'iFood',    status: 'Inativo', limiteAprovado: 'R$ 8.000,00',  ultimaAtualizacao: '02/01/2026' },
  { id: 'cli-005', nome: 'Ana Beatriz Souza',         cpfCnpj: '741.852.963-22', canal: 'Sicoob',   status: 'Ativo',   limiteAprovado: 'R$ 45.000,00', ultimaAtualizacao: '18/07/2026' },
])

export const cadastroUsuariosStore = ref<CadastroUsuario[]>([
  { id: 'usr-001', nome: 'Ana Souza',      email: 'ana.souza@dock.tech',      perfil: 'Analista', status: 'Ativo',   ultimoAcesso: '20/07/2026 08:42' },
  { id: 'usr-002', nome: 'Carlos Lima',    email: 'carlos.lima@dock.tech',    perfil: 'Operador', status: 'Ativo',   ultimoAcesso: '20/07/2026 09:15' },
  { id: 'usr-003', nome: 'Fernanda Costa', email: 'fernanda.costa@dock.tech', perfil: 'Admin',    status: 'Ativo',   ultimoAcesso: '19/07/2026 17:30' },
  { id: 'usr-004', nome: 'Roberto Alves',  email: 'roberto.alves@dock.tech',  perfil: 'Operador', status: 'Inativo', ultimoAcesso: '01/05/2026 14:00' },
])

export const cadastroRiscosStore = ref<CadastroRisco[]>([
  { id: 'risco-001', scoreMin: 0,   scoreMax: 300,  nivel: 'Muito Alto',  descricao: 'Risco elevado — exige análise manual e garantias adicionais.' },
  { id: 'risco-002', scoreMin: 301, scoreMax: 500,  nivel: 'Alto',        descricao: 'Risco significativo — análise detalhada obrigatória.' },
  { id: 'risco-003', scoreMin: 501, scoreMax: 700,  nivel: 'Médio',       descricao: 'Risco moderado — aprovação sujeita a critérios padrão.' },
  { id: 'risco-004', scoreMin: 701, scoreMax: 850,  nivel: 'Baixo',       descricao: 'Bom perfil de crédito — aprovação simplificada.' },
  { id: 'risco-005', scoreMin: 851, scoreMax: 1000, nivel: 'Muito Baixo', descricao: 'Excelente histórico — aprovação automática elegível.' },
])

export const cadastroProdutosStore = ref<CadastroProduto[]>([
  { id: 'prod-001', codigo: 'CONS-PRIV', nome: 'Consignado Privado',  modalidade: 'Consignado',    prazoMin: 12, prazoMax: 96, valorMin: 'R$ 1.000,00',  valorMax: 'R$ 200.000,00', status: 'Ativo' },
  { id: 'prod-002', codigo: 'EMP-PES',   nome: 'Empréstimo Pessoal',  modalidade: 'Crédito Pessoal', prazoMin: 6, prazoMax: 60, valorMin: 'R$ 500,00',    valorMax: 'R$ 50.000,00',  status: 'Ativo' },
  { id: 'prod-003', codigo: 'FGTS-ANT',  nome: 'Antecipação FGTS',    modalidade: 'FGTS',          prazoMin: 1, prazoMax: 10, valorMin: 'R$ 200,00',     valorMax: 'R$ 15.000,00',  status: 'Ativo' },
])

export const cadastroTaxasStore = ref<CadastroTaxa[]>([
  { id: 'taxa-001', produto: 'Consignado Privado', prazo: 24, taxaMensal: '1,49%', taxaAnual: '19,46%', cet: '21,30%', vigenciaInicio: '01/01/2026', vigenciaFim: '31/12/2026' },
  { id: 'taxa-002', produto: 'Consignado Privado', prazo: 48, taxaMensal: '1,59%', taxaAnual: '20,96%', cet: '22,80%', vigenciaInicio: '01/01/2026', vigenciaFim: '31/12/2026' },
  { id: 'taxa-003', produto: 'Consignado Privado', prazo: 84, taxaMensal: '1,79%', taxaAnual: '23,73%', cet: '25,70%', vigenciaInicio: '01/01/2026', vigenciaFim: '31/12/2026' },
  { id: 'taxa-004', produto: 'Empréstimo Pessoal', prazo: 12, taxaMensal: '2,99%', taxaAnual: '42,46%', cet: '45,00%', vigenciaInicio: '01/01/2026', vigenciaFim: '31/12/2026' },
  { id: 'taxa-005', produto: 'Empréstimo Pessoal', prazo: 36, taxaMensal: '3,49%', taxaAnual: '50,90%', cet: '54,00%', vigenciaInicio: '01/01/2026', vigenciaFim: '31/12/2026' },
  { id: 'taxa-006', produto: 'Antecipação FGTS',   prazo: 12, taxaMensal: '1,79%', taxaAnual: '23,73%', cet: '25,00%', vigenciaInicio: '01/01/2026', vigenciaFim: '31/12/2026' },
])

// ── Cobrança — tipos e stores mock ───────────────────────────────────
export interface CobrancaParcela {
  id: string; propostaId: string; clienteNome: string
  numeroParcela: number; totalParcelas: number
  vencimento: string; valor: string; dataPagamento: string | null
  status: 'Pago' | 'Em Atraso' | 'Pendente'
}
export interface CobrancaArquivo {
  id: string; nome: string; dataGeracao: string
  banco: string; numRegistros: number
  status: 'Processado' | 'Aguardando' | 'Erro'
}

export const cobrancaParcelasStore = ref<CobrancaParcela[]>([
  // Franciele Santos de Jesus — Consignado 84x
  { id: 'parc-001', propostaId: 'e9435f5b', clienteNome: 'Franciele Santos de Jesus',    numeroParcela: 1,  totalParcelas: 84, vencimento: '05/01/2026', valor: 'R$ 1.248,90', dataPagamento: '04/01/2026', status: 'Pago' },
  { id: 'parc-002', propostaId: 'e9435f5b', clienteNome: 'Franciele Santos de Jesus',    numeroParcela: 2,  totalParcelas: 84, vencimento: '05/02/2026', valor: 'R$ 1.248,90', dataPagamento: '05/02/2026', status: 'Pago' },
  { id: 'parc-003', propostaId: 'e9435f5b', clienteNome: 'Franciele Santos de Jesus',    numeroParcela: 3,  totalParcelas: 84, vencimento: '05/03/2026', valor: 'R$ 1.248,90', dataPagamento: '06/03/2026', status: 'Pago' },
  { id: 'parc-004', propostaId: 'e9435f5b', clienteNome: 'Franciele Santos de Jesus',    numeroParcela: 4,  totalParcelas: 84, vencimento: '05/04/2026', valor: 'R$ 1.248,90', dataPagamento: '04/04/2026', status: 'Pago' },
  { id: 'parc-005', propostaId: 'e9435f5b', clienteNome: 'Franciele Santos de Jesus',    numeroParcela: 5,  totalParcelas: 84, vencimento: '05/05/2026', valor: 'R$ 1.248,90', dataPagamento: null,         status: 'Em Atraso' },
  { id: 'parc-006', propostaId: 'e9435f5b', clienteNome: 'Franciele Santos de Jesus',    numeroParcela: 6,  totalParcelas: 84, vencimento: '05/06/2026', valor: 'R$ 1.248,90', dataPagamento: null,         status: 'Pendente' },
  // Brayhon Oliveira Carvalho — Emp. Pessoal 24x
  { id: 'parc-007', propostaId: 'web-onboarding', clienteNome: 'Brayhon Oliveira Carvalho', numeroParcela: 1, totalParcelas: 24, vencimento: '20/08/2026', valor: 'R$ 175,30', dataPagamento: null, status: 'Pendente' },
  { id: 'parc-008', propostaId: 'web-onboarding', clienteNome: 'Brayhon Oliveira Carvalho', numeroParcela: 2, totalParcelas: 24, vencimento: '20/09/2026', valor: 'R$ 175,30', dataPagamento: null, status: 'Pendente' },
  // Carlos Eduardo Lima — Consignado 36x
  { id: 'parc-009', propostaId: 'f7b21c3a', clienteNome: 'Carlos Eduardo Lima',          numeroParcela: 1,  totalParcelas: 36, vencimento: '10/03/2026', valor: 'R$ 892,00',  dataPagamento: '10/03/2026', status: 'Pago' },
  { id: 'parc-010', propostaId: 'f7b21c3a', clienteNome: 'Carlos Eduardo Lima',          numeroParcela: 2,  totalParcelas: 36, vencimento: '10/04/2026', valor: 'R$ 892,00',  dataPagamento: '11/04/2026', status: 'Pago' },
  { id: 'parc-011', propostaId: 'f7b21c3a', clienteNome: 'Carlos Eduardo Lima',          numeroParcela: 3,  totalParcelas: 36, vencimento: '10/05/2026', valor: 'R$ 892,00',  dataPagamento: null,         status: 'Em Atraso' },
  { id: 'parc-012', propostaId: 'f7b21c3a', clienteNome: 'Carlos Eduardo Lima',          numeroParcela: 4,  totalParcelas: 36, vencimento: '10/06/2026', valor: 'R$ 892,00',  dataPagamento: null,         status: 'Pendente' },
  // Ana Paula Ferreira — Emp. Pessoal 12x
  { id: 'parc-013', propostaId: 'a4d89e12', clienteNome: 'Ana Paula Ferreira',           numeroParcela: 1,  totalParcelas: 12, vencimento: '15/02/2026', valor: 'R$ 430,50',  dataPagamento: '14/02/2026', status: 'Pago' },
  { id: 'parc-014', propostaId: 'a4d89e12', clienteNome: 'Ana Paula Ferreira',           numeroParcela: 2,  totalParcelas: 12, vencimento: '15/03/2026', valor: 'R$ 430,50',  dataPagamento: '15/03/2026', status: 'Pago' },
  { id: 'parc-015', propostaId: 'a4d89e12', clienteNome: 'Ana Paula Ferreira',           numeroParcela: 3,  totalParcelas: 12, vencimento: '15/04/2026', valor: 'R$ 430,50',  dataPagamento: '17/04/2026', status: 'Pago' },
  { id: 'parc-016', propostaId: 'a4d89e12', clienteNome: 'Ana Paula Ferreira',           numeroParcela: 4,  totalParcelas: 12, vencimento: '15/05/2026', valor: 'R$ 430,50',  dataPagamento: null,         status: 'Em Atraso' },
  // Roberto Silva Santos — Consignado 60x
  { id: 'parc-017', propostaId: 'b2c67f90', clienteNome: 'Roberto Silva Santos',         numeroParcela: 1,  totalParcelas: 60, vencimento: '01/04/2026', valor: 'R$ 2.105,00', dataPagamento: '01/04/2026', status: 'Pago' },
  { id: 'parc-018', propostaId: 'b2c67f90', clienteNome: 'Roberto Silva Santos',         numeroParcela: 2,  totalParcelas: 60, vencimento: '01/05/2026', valor: 'R$ 2.105,00', dataPagamento: '02/05/2026', status: 'Pago' },
  { id: 'parc-019', propostaId: 'b2c67f90', clienteNome: 'Roberto Silva Santos',         numeroParcela: 3,  totalParcelas: 60, vencimento: '01/06/2026', valor: 'R$ 2.105,00', dataPagamento: null,         status: 'Pendente' },
  // Mariana Costa Oliveira — Emp. Pessoal 48x
  { id: 'parc-020', propostaId: 'd5e34b78', clienteNome: 'Mariana Costa Oliveira',       numeroParcela: 1,  totalParcelas: 48, vencimento: '22/05/2026', valor: 'R$ 654,20',  dataPagamento: '21/05/2026', status: 'Pago' },
  { id: 'parc-021', propostaId: 'd5e34b78', clienteNome: 'Mariana Costa Oliveira',       numeroParcela: 2,  totalParcelas: 48, vencimento: '22/06/2026', valor: 'R$ 654,20',  dataPagamento: null,         status: 'Em Atraso' },
  { id: 'parc-022', propostaId: 'd5e34b78', clienteNome: 'Mariana Costa Oliveira',       numeroParcela: 3,  totalParcelas: 48, vencimento: '22/07/2026', valor: 'R$ 654,20',  dataPagamento: null,         status: 'Pendente' },
])

export const cobrancaArquivosStore = ref<CobrancaArquivo[]>([
  { id: 'arq-001', nome: 'remessa_unimed_20260105.txt',    dataGeracao: '05/01/2026 03:00', banco: 'Unimed',   numRegistros: 142, status: 'Processado' },
  { id: 'arq-002', nome: 'remessa_bradesco_20260105.txt',  dataGeracao: '05/01/2026 03:05', banco: 'Bradesco', numRegistros: 87,  status: 'Processado' },
  { id: 'arq-003', nome: 'remessa_unimed_20260205.txt',    dataGeracao: '05/02/2026 03:00', banco: 'Unimed',   numRegistros: 138, status: 'Processado' },
  { id: 'arq-004', nome: 'remessa_bradesco_20260205.txt',  dataGeracao: '05/02/2026 03:05', banco: 'Bradesco', numRegistros: 85,  status: 'Erro' },
])
