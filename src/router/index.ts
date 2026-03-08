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
    path: "/project/:id/chat",
    name: "ProjectChat",
    component: () => import("../pages/ProjectChat.vue"),
  },
  {
    path: "/project/:id/preview",
    name: "ProjectPreview",
    component: () => import("../pages/ProjectPreview.vue"),
  },
  {
    path: "/preview/:id",
    redirect: (to) => ({
      name: "ProjectPreview",
      params: { id: to.params.id },
    }),
  },
  {
    path: "/generating/:id",
    redirect: (to) => ({
      name: "ProjectChat",
      params: { id: to.params.id },
    }),
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
