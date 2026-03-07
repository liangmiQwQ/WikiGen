import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import Index from "../pages/Index.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Index",
    component: Index,
  },
  {
    path: "/settings",
    name: "Settings",
    component: () => import("../pages/Settings.vue"),
  },
  {
    path: "/projects",
    name: "Projects",
    component: () => import("../pages/Projects.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
