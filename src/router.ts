import { createRouter, createWebHashHistory } from 'vue-router'
import { authStore } from './store'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: () => (authStore.isAuthenticated ? '/dashboard' : '/login'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('./components/LoginScreen.vue'),
      beforeEnter: (_to, _from, next) => {
        if (authStore.isAuthenticated) next('/dashboard')
        else next()
      },
    },
    {
      path: '/',
      component: () => import('./components/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('./components/DashboardScreen.vue'),
        },
        {
          path: 'propostas',
          name: 'propostas',
          component: () => import('./components/PropostasAnaliseScreen.vue'),
        },
        {
          path: 'proposta/:id',
          name: 'proposta-detalhe',
          component: () => import('./components/PropostaDetalheScreen.vue'),
        },
        {
          path: 'cadastro',
          redirect: '/cadastro/clientes',
        },
        {
          path: 'cadastro/clientes',
          name: 'cadastro-clientes',
          component: () => import('./components/CadastroClientesScreen.vue'),
        },
        {
          path: 'cadastro/usuarios',
          name: 'cadastro-usuarios',
          component: () => import('./components/CadastroUsuariosScreen.vue'),
        },
        {
          path: 'cadastro/riscos',
          name: 'cadastro-riscos',
          component: () => import('./components/CadastroRiscosScreen.vue'),
        },
        {
          path: 'cadastro/produtos',
          name: 'cadastro-produtos',
          component: () => import('./components/CadastroProdutosScreen.vue'),
        },
        {
          path: 'cadastro/taxas',
          name: 'cadastro-taxas',
          component: () => import('./components/CadastroTaxasScreen.vue'),
        },
        {
          path: 'cobranca',
          name: 'cobranca',
          component: () => import('./components/CobrancaScreen.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router
