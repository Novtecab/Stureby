import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import Home from '../views/Home.vue';
import Shop from '../views/Shop.vue';
import Magazine from '../views/Magazine.vue';
import Booking from '../views/Booking.vue';
import Apply from '../views/Apply.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/shop',
    name: 'Shop',
    component: Shop
  },
  {
    path: '/magazine',
    name: 'Magazine',
    component: Magazine
  },
  {
    path: '/booking',
    name: 'Booking',
    component: Booking
  },
  {
    path: '/apply',
    name: 'Apply',
    component: Apply
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;