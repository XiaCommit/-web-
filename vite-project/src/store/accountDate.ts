import { defineStore } from "pinia";
import { ref } from "vue";
export const useAccountDateStore = defineStore("account", () => {
  const accountDate = ref({
    name: "",
    account: null,
    accountType: null,
    date: "",
    remark: "",
    id: "",
  });
  const setAccountDate = (data: any) => {
    accountDate.value = data;
  };
  return {
    accountDate,
    setAccountDate,
  };
});
