import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
    path: '/',
    name: 'login',
    component: () => import('../views/Login.vue')
    },
    {
    path: '/RouletteMain',
    name: 'home',
    component: () => import('../views/RouletteMain.vue')
    },
  ],
})



export default router
