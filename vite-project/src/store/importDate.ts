import { defineStore } from "pinia";
import { ref } from "vue";
export const useimportDateStore = defineStore("importDate", () => {
  const importDay = ref({
    name: "",
    date: "",
    remark: "",
    id: "",
  });
  const setimportDate = (data: any) => {
    importDay.value = data;
  };
  return {
    importDay,
    setimportDate,
  };
});
