import { createRouter, createWebHashHistory } from 'vue-router'
import PreferencePage from '../views/PreferencePage.vue'

const routes = [
  {
    path: '/',
    name: 'Preference',
    component: PreferencePage
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/ProfilePage.vue')
  },
  {
    path: '/feedback',
    name: 'Feedback',
    component: () => import('../views/FeedbackPage.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router