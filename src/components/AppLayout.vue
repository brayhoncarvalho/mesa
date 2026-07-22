<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authStore } from '../store'

const router = useRouter()
const route  = useRoute()

// â”€â”€ Sidebar collapse â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const sidebarOpen    = ref(true)   // desktop: expanded vs collapsed
const mobileMenuOpen = ref(false)  // mobile overlay

function toggleSidebar() {
  if (window.innerWidth < 768) {
    mobileMenuOpen.value = !mobileMenuOpen.value
  } else {
    sidebarOpen.value = !sidebarOpen.value
  }
}
function closeMobileMenu() { mobileMenuOpen.value = false }

// â”€â”€ Nav items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface NavChild { key: string; label: string; route: string }
interface NavItem  { key: string; label: string; route: string | null; icon: string; children?: NavChild[] }

const expandedGroups = reactive<Record<string, boolean>>({})
function toggleGroup(key: string) { expandedGroups[key] = !expandedGroups[key] }

watch(() => route.path, (p) => {
  if (p.startsWith('/cadastro')) expandedGroups['cadastro'] = true
}, { immediate: true })

const navItems: NavItem[] = [
  {
    key: 'dashboard', label: 'Dashboard', route: '/dashboard',
    icon: `<path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/>`,
  },
  {
    key: 'analise', label: 'Análise Mesa', route: '/propostas',
    icon: `<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>`,
  },
  {
    key: 'cadastro', label: 'Cadastro', route: null,
    icon: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>`,
    children: [
      { key: 'clientes', label: 'Clientes', route: '/cadastro/clientes' },
      { key: 'usuarios', label: 'Usuários', route: '/cadastro/usuarios' },
      { key: 'riscos',   label: 'Riscos',   route: '/cadastro/riscos'   },
      { key: 'produtos', label: 'Produtos', route: '/cadastro/produtos' },
      { key: 'taxas',    label: 'Taxas',    route: '/cadastro/taxas'    },
    ],
  },
  {
    key: 'cobranca', label: 'Cobrança', route: '/cobranca',
    icon: `<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6" stroke-linecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke-linecap="round"/><line x1="3" y1="10" x2="21" y2="10"/>`,
  },
]

function isActive(item: NavItem) {
  if (item.route === '/dashboard') return route.path === '/dashboard'
  if (item.route === '/propostas') return route.path.startsWith('/proposta')
  if (item.route) return route.path === item.route
  if (item.children) return item.children.some(c => route.path.startsWith(c.route))
  return false
}

function navClick(item: NavItem) {
  if (item.children) { toggleGroup(item.key); return }
  if (item.route) { router.push(item.route); closeMobileMenu() }
}

// â”€â”€ Operador â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const operadorNome = computed(() => {
  const part = authStore.email.split('@')[0].split('.')[0]
  return part.charAt(0).toUpperCase() + part.slice(1)
})
const operadorInicial = computed(() => operadorNome.value.charAt(0))

const menuOpen = ref(false)
function toggleMenu() { menuOpen.value = !menuOpen.value }
function closeMenu() { menuOpen.value = false }

function handleOutsideClick(e: MouseEvent) {
  const menu = document.querySelector('.app-user-menu')
  if (menu && !menu.contains(e.target as Node)) closeMenu()
}
onMounted(() => document.addEventListener('click', handleOutsideClick, true))
onBeforeUnmount(() => document.removeEventListener('click', handleOutsideClick, true))

function sair() {
  closeMenu()
  authStore.logout()
  router.push('/login')
}

function resetFluxo() {
  localStorage.removeItem('mesa_proposta_pendente')
  localStorage.removeItem('mesa_dados_pessoais')
  localStorage.removeItem('mesa_endereco')
  closeMenu()
  window.location.reload()
}

function irMeusDados() {
  closeMenu()
  router.push('/dashboard')
}
</script>

<template>
  <div class="app-layout">

    <!-- â•â• TOPBAR â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <header class="app-topbar">
      <div class="app-topbar__left">
        <!-- Hamburger / toggle -->
        <button
          class="app-hamburger"
          @click="toggleSidebar"
          :aria-label="sidebarOpen ? 'Recolher menu' : 'Expandir menu'"
          :aria-expanded="sidebarOpen"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <!-- Logo Dock -->
        <a
          class="app-brand"
          href="#/dashboard"
          aria-label="Mesa de Crédito — ir para Dashboard"
        >
          <img
            class="app-dock-logo"
            :src="'/mesa/assets/dock-logo-color.png'"
            alt="Dock"
            aria-hidden="true"
          />
        </a>
      </div>

      <div class="app-topbar__right">
        <span class="app-topbar__nome">{{ operadorNome }}</span>
        <div class="app-user-menu">
          <button
            class="app-avatar"
            @click="toggleMenu"
            :aria-label="`Menu do usuário — ${authStore.email}`"
            :aria-expanded="menuOpen"
            aria-haspopup="true"
          >
            {{ operadorInicial }}
          </button>
          <div v-if="menuOpen" class="app-dropdown" role="menu">
            <div class="app-dropdown__header">
              <span class="app-dropdown__email">{{ authStore.email }}</span>
            </div>
            <button class="app-dropdown__item" role="menuitem" @click="irMeusDados">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              Meus Dados
            </button>
            <button class="app-dropdown__item app-dropdown__item--danger" role="menuitem" @click="resetFluxo">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
              Resetar Fluxo Salvo
            </button>
            <div class="app-dropdown__divider"></div>
            <button class="app-dropdown__item app-dropdown__item--exit" role="menuitem" @click="sair">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- â•â• BODY â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <div class="app-body" :style="{ '--sb-w': sidebarOpen ? '216px' : '60px' }">

      <!-- Mobile backdrop -->
      <div
        v-if="mobileMenuOpen"
        class="app-backdrop"
        @click="closeMobileMenu"
        aria-hidden="true"
      />

      <!-- â”€â”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
      <nav
        class="app-sidebar"
        :class="{
          'app-sidebar--collapsed': !sidebarOpen,
          'app-sidebar--mobile-open': mobileMenuOpen,
        }"
        aria-label="Menu principal"
      >
        <p class="app-sidebar__section">Mesa</p>
        <ul class="app-sidebar__list">
          <li v-for="item in navItems" :key="item.key">
            <button
              class="app-nav-item"
              :class="{
                'app-nav-item--active':  isActive(item),
                'app-nav-item--group':   !!item.children,
              }"
              @click="navClick(item)"
              :aria-current="isActive(item) ? 'page' : undefined"
              :aria-expanded="item.children ? !!expandedGroups[item.key] : undefined"
              :title="!sidebarOpen ? item.label : undefined"
            >
              <svg
                width="17" height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="app-nav-icon"
                aria-hidden="true"
                v-html="item.icon"
              />
              <span class="app-nav-label">{{ item.label }}</span>
              <svg
                v-if="item.children"
                class="app-nav-chevron"
                :class="{ 'app-nav-chevron--open': expandedGroups[item.key] }"
                width="11" height="11" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                aria-hidden="true"
              ><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <ul
              v-if="item.children && expandedGroups[item.key] && (sidebarOpen || mobileMenuOpen)"
              class="app-nav-subitems"
            >
              <li v-for="child in item.children" :key="child.key">
                <button
                  class="app-nav-subitem"
                  :class="{ 'app-nav-subitem--active': route.path === child.route }"
                  @click="router.push(child.route); closeMobileMenu()"
                  :aria-current="route.path === child.route ? 'page' : undefined"
                >
                  {{ child.label }}
                </button>
              </li>
            </ul>
          </li>
        </ul>

        <!-- Toggle collapse (desktop only) -->
        <button
          class="app-sidebar__toggle"
          @click="sidebarOpen = !sidebarOpen"
          :aria-label="sidebarOpen ? 'Recolher sidebar' : 'Expandir sidebar'"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <polyline v-if="sidebarOpen"  points="15 18 9 12 15 6"/>
            <polyline v-else              points="9 18 15 12 9 6"/>
          </svg>
          <span class="app-nav-label">{{ sidebarOpen ? 'Recolher' : '' }}</span>
        </button>
      </nav>

      <!-- â”€â”€ Main content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
      <main class="app-main">
        <router-view />
      </main>

    </div>
  </div>
</template>

<style scoped>
/* â”€â”€ Root â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--surface-page);
  font-family: var(--font-body);
  color: var(--text-body);
}

/* â”€â”€ Topbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.app-topbar {
  height: 60px;
  background: var(--surface-card);
  border-bottom: 1px solid var(--admin-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--sp-6) 0 var(--sp-5);
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
  box-shadow: 0 1px 0 var(--border-hairline);
}
.app-topbar__left  { display: flex; align-items: center; gap: var(--sp-3_5); }
.app-topbar__right { display: flex; align-items: center; gap: var(--sp-2_5); }

.app-hamburger {
  width: 36px; height: 36px;
  border: 1.5px solid var(--admin-border);
  background: #fff;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: var(--admin-text);
  transition: background 0.15s, border-color 0.15s;
  flex-shrink: 0;
}
.app-hamburger:hover { background: var(--admin-blue-50); border-color: var(--admin-blue-border); color: var(--admin-blue); }
.app-hamburger:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: 2px; }

/* Dock logo brand */
.app-brand {
  display: flex;
  align-items: center;
  cursor: pointer;
  border-radius: var(--radius-sm);
  padding: 2px var(--sp-1);
  transition: opacity 0.15s;
  text-decoration: none;
}
.app-brand:hover { opacity: 0.8; }
.app-brand:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: 2px; border-radius: 6px; }
.app-dock-logo { height: 26px; width: auto; display: block; }

.app-topbar__nome {
  font-size: var(--fs-caption);
  font-weight: 600;
  color: var(--admin-text-strong);
}
.app-avatar {
  width: 34px; height: 34px;
  border-radius: var(--radius-full);
  border: none;
  background: var(--admin-blue-100);
  color: var(--admin-blue);
  font-size: var(--fs-fine);
  font-weight: 700;
  cursor: pointer;
  font-family: var(--font-display);
  transition: background 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.app-avatar:hover { background: var(--admin-blue-border); }
.app-avatar:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: 3px; }

/* ── User dropdown ────────────────────────────────────────────── */
.app-user-menu { position: relative; }
.app-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 220px;
  background: var(--surface-card);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card-sm);
  z-index: 200;
  overflow: hidden;
}
.app-dropdown__header {
  padding: var(--sp-3) var(--sp-4);
  border-bottom: 1px solid var(--border-hairline);
}
.app-dropdown__email {
  font-size: var(--fs-fine);
  color: var(--text-muted);
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.app-dropdown__item {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  width: 100%;
  padding: var(--sp-2_5) var(--sp-4);
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--fs-caption);
  font-family: var(--font-body);
  color: var(--text-strong);
  text-align: left;
  transition: background 0.12s;
}
.app-dropdown__item:hover { background: var(--admin-blue-50); color: var(--admin-blue); }
.app-dropdown__item--danger { color: var(--text-muted); }
.app-dropdown__item--danger:hover { background: #fff5f5; color: #dc2626; }
.app-dropdown__item--exit { color: var(--text-muted); }
.app-dropdown__item--exit:hover { background: #fff5f5; color: #dc2626; }
.app-dropdown__divider { height: 1px; background: var(--border-hairline); margin: var(--sp-1) 0; }

/* â”€â”€ Body â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

/* Mobile backdrop */
.app-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(14, 42, 92, 0.45);
  z-index: 90;
  backdrop-filter: blur(2px);
}

/* â”€â”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.app-sidebar {
  width: 216px;
  flex-shrink: 0;
  background: var(--surface-card);
  border-right: 1px solid var(--admin-border);
  padding: var(--sp-5) var(--sp-3) var(--sp-3);
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 0.22s ease;
  z-index: 95;
}
.app-sidebar--collapsed {
  width: 60px;
}
.app-sidebar__section {
  font-family: var(--font-body);
  font-size: var(--fs-step);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--admin-muted);
  padding: 0 var(--sp-3) var(--sp-2_5);
  margin: 0 0 var(--sp-1);
  white-space: nowrap;
  overflow: hidden;
  transition: opacity 0.15s;
}
.app-sidebar--collapsed .app-sidebar__section { opacity: 0; }

.app-sidebar__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--sp-2_5);
  padding: var(--sp-2_5) var(--sp-3);
  border-radius: 10px;
  border: none;
  background: none;
  font-size: var(--fs-label);
  font-weight: 500;
  color: var(--admin-text);
  cursor: pointer;
  text-align: left;
  font-family: var(--font-body);
  transition: background 0.12s, color 0.12s;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
}
.app-nav-item:hover:not(.app-nav-item--disabled) {
  background: var(--admin-blue-50);
  color: var(--admin-blue);
}
.app-nav-item--active {
  background: var(--admin-blue-100);
  color: var(--admin-blue);
  font-weight: 600;
}
.app-nav-item--disabled {
  cursor: default;
  opacity: 0.4;
  pointer-events: none;
}
.app-nav-item:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: 2px; }

.app-nav-icon {
  flex-shrink: 0;
  opacity: 0.65;
}
.app-nav-item--active .app-nav-icon,
.app-nav-item:hover .app-nav-icon { opacity: 1; }

.app-nav-label {
  transition: opacity 0.15s;
  overflow: hidden;
  text-overflow: ellipsis;
}
.app-sidebar--collapsed .app-nav-label { opacity: 0; width: 0; pointer-events: none; }

/* Divider before toggle */
.app-sidebar__divider {
  height: 1px;
  background: var(--admin-border);
  margin: var(--sp-3) var(--sp-3);
  flex-shrink: 0;
}

/* Toggle collapse button (desktop) */
.app-sidebar__toggle {
  margin-top: auto;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--sp-2);
  padding: var(--sp-2_5) var(--sp-3);
  border-radius: 10px;
  border: none;
  background: none;
  font-size: var(--fs-fine);
  color: var(--admin-muted);
  cursor: pointer;
  font-family: var(--font-body);
  transition: background 0.12s, color 0.12s;
  white-space: nowrap;
  overflow: hidden;
  height: 40px;
  flex-shrink: 0;
}
.app-sidebar__toggle:hover { background: var(--admin-blue-50); color: var(--admin-blue); }
.app-sidebar__toggle:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: 2px; }
/* When collapsed: center the arrow icon */
.app-sidebar--collapsed .app-sidebar__toggle {
  justify-content: center;
  padding: 0;
}

/* â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.app-main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  background: var(--surface-page);
}

/* â”€â”€ Responsividade â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/* ── Nav sub-items ──────────────────────────────────────────────────────── */
.app-nav-subitems {
  list-style: none;
  margin: 1px 0 3px;
  padding: 0 0 0 var(--sp-6);
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.app-nav-subitem {
  width: 100%;
  display: flex;
  align-items: center;
  padding: var(--sp-2) var(--sp-3);
  border-radius: 10px;
  border: none;
  background: none;
  font-size: var(--fs-fine);
  font-weight: 400;
  color: var(--admin-text);
  cursor: pointer;
  text-align: left;
  font-family: var(--font-body);
  transition: background 0.12s, color 0.12s;
  white-space: nowrap;
  overflow: hidden;
}
.app-nav-subitem:hover { background: var(--admin-blue-50); color: var(--admin-blue); }
.app-nav-subitem--active {
  background: var(--admin-blue-100);
  color: var(--admin-blue);
  font-weight: 600;
}
.app-nav-subitem:focus-visible { outline: 2px solid var(--admin-blue); outline-offset: 2px; }

.app-nav-chevron {
  margin-left: auto;
  flex-shrink: 0;
  opacity: 0.55;
  transition: transform 0.2s;
}
.app-nav-chevron--open { transform: rotate(180deg); }
.app-sidebar--collapsed .app-nav-chevron { opacity: 0; width: 0; overflow: hidden; }

@media (max-width: 767px) {
  .app-sidebar {
    position: fixed;
    top: 60px;
    left: 0;
    bottom: 0;
    width: 240px !important;
    transform: translateX(-100%);
    transition: transform 0.22s ease;
    z-index: 95;
    box-shadow: 4px 0 24px rgba(14, 42, 92, 0.18);
  }
  .app-sidebar--mobile-open { transform: translateX(0); }
  .app-sidebar__toggle { display: none; }
  .app-sidebar--mobile-open .app-nav-label { opacity: 1; width: auto; pointer-events: auto; }
  .app-sidebar--mobile-open .app-sidebar__section { opacity: 1; }
}
</style>
