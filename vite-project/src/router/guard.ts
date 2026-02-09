import router from "./index";
import { useUserStore } from "../store/user";
router.beforeEach((to) => {
  const userStore = useUserStore();
  const isLogin = userStore.token;
  if (!isLogin) {
    if (to.path !== "/login" && to.path !== "/register") {
      return { path: "/login" };
    }
  } else {
    if (to.path === "/login" || to.path === "/register") {
      return { path: "/" };
    }
  }
});
