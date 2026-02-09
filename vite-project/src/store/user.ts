import { defineStore } from "pinia";
import { loginApi, registerApi, updateUserInfoApi } from "../api/users";
interface LoginParam {
  username: string;
  password: string;
  code: string;
}
interface RegisterParam {
  username: string;
  password: string;
  gender: string;
  birthday: Date | null;
}
export const useUserStore = defineStore("user", {
  state: () => ({
    token: sessionStorage.getItem("token") || "",
    username: sessionStorage.getItem("username") || "",
    id: sessionStorage.getItem("id") || "",
    gender: sessionStorage.getItem("gender") || "",
    birthday: sessionStorage.getItem("birthday") || "",
    partnerId: (() => {
      const r = sessionStorage.getItem("partnerId");
      return r && r !== "null" && r !== "undefined" ? r : "";
    })(),
    partnerInviteCode: sessionStorage.getItem("partnerInviteCode") || "",
    inviteCode: sessionStorage.getItem("inviteCode") || "",
  }),
  actions: {
    async register(param: RegisterParam) {
      const { data } = await registerApi(param);
      return data.user.inviteCode;
    },
    async login(data: LoginParam) {
      try {
        const {
          data: {
            token,
            userInfo: {
              username,
              id,
              gender,
              birthday,
              partnerId,
              partnerInviteCode,
              inviteCode,
            },
          },
        } = await loginApi(data);
        this.token = token;
        this.username = username;
        this.id = id;
        this.birthday = birthday ? new Date(birthday).toISOString() : "";
        this.gender = gender;
        (this.partnerId = partnerId),
          (this.partnerInviteCode = partnerInviteCode);
        this.inviteCode = inviteCode;
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("username", username);
        sessionStorage.setItem("id", id);
        sessionStorage.setItem("birthday", this.birthday);
        sessionStorage.setItem("gender", gender);
        sessionStorage.setItem("partnerId", partnerId != null ? String(partnerId) : "");
        sessionStorage.setItem("partnerInviteCode", partnerInviteCode || "");
        sessionStorage.setItem("inviteCode", inviteCode);
      } catch (error) {
        console.log("登录失败");
      }
    },
    async updateUserInfo(data: any) {
      const res = await updateUserInfoApi(data);
      if (res.code === "0000") {
        this.username = data.username;
        this.gender = data.gender;
        this.birthday = data.birthday;
        sessionStorage.setItem("username", data.username);
        sessionStorage.setItem("gender", data.gender);
        sessionStorage.setItem("birthday", data.birthday);
      }
      return res;
    },
    logout() {
      this.token = "";
      this.username = "";
      this.id = "";
      this.birthday = "";
      this.gender = "";
      (this.partnerId = ""), (this.partnerInviteCode = "");
      this.inviteCode = "";
      sessionStorage.clear();
    },
  },
});
