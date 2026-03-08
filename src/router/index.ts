import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Create",
    component: () => import("../pages/Create.vue"),
  },
  {
    path: "/generating/:id",
    name: "Generating",
    component: () => import("../pages/Generating.vue"),
  },
  {
    path: "/preview/:id",
    name: "Preview",
    component: () => import("../pages/Preview.vue"),
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
