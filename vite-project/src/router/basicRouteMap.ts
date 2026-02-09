import { type RouteRecordRaw } from "vue-router";
const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("@/layout/DefaultLayout.vue"),
    redirect: "/dashboard",
    children: [
      {
        path: "/dashboard",
        name: "dashboard",
        component: () => import("@/views/dashboard/Dashboard.vue"),
      },
      {
        path: "/account",
        name: "account",
        component: () => import("@/views/account/account.vue"),
      },
      {
        path: "/account/allaccount",
        name: "allaccount",
        component: () => import("@/views/account/allaccount.vue"),
      },
      {
        path: "/talk",
        name: "talk",
        component: () => import("@/views/talk/Talk.vue"),
      },
      {
        path: "/music",
        name: "music",
        component: () => import("@/views/music/Music.vue"),
      },
      {
        path: "/commonMusic",
        name: "commonMusic",
        component: () => import("@/views/music/commonMusic.vue"),
      },
      {
        path: "/track",
        name: "track",
        component: () => import("@/views/track/Track.vue"),
      },
      {
        path: "/personal",
        name: "personal",
        component: () => import("@/views/personal/Personal.vue"),
      },
      {
        path: "/track/detail",
        name: "trackDetail",
        component: () => import("@/views/track/components/EditTract.vue"),
      }
    ],
  },
  {
    path: "/login",
    name: "/login",
    component: () => import("@/views/Login.vue"),
  },
  {
    path: "/register",
    name: "/register",
    component: () => import("@/views/Register.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/NotFound.vue"),
  },
];
export default routes;
