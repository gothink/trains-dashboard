import { createRouter, createWebHistory } from "vue-router";
import TrainView from "@/views/TrainView.vue";
import StationView from "@/views/StationView.vue";


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:trainSelected?',
      name: 'trains',
      component: TrainView,
      props: true,
    },
    {
      path: '/stations/:stationCode?',
      name: 'StationStatus',
      component: StationView,
      props: true,
    },
  ],
});

export default router;