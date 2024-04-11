import type { TrainStatus } from "@/util/types";
import { defineStore } from "pinia";
import { reactive, watch } from "vue";

export const useUserStore = defineStore('user', () => {
  let settings = reactive<{
    showMap: boolean;
    filterMap: boolean;
    trainListStatus: TrainStatus;
    theme?: "light" | "dark";
    showPreviousStations: boolean;
    showPreviousTrains: boolean;
    showInactiveTrains: boolean;
    zoomLevel: number;
    autoRefresh: boolean;
    refreshInterval: 15 | 30 | 45 | 60 | 120 | 300;
  }>({
    showMap: true,
    filterMap: true,
    trainListStatus: "departed",
    showPreviousStations: false,
    showPreviousTrains: false,
    showInactiveTrains: false,
    zoomLevel: 10,
    autoRefresh: true,
    refreshInterval: 45,
  });

  const initSettings = () => {
    let localSettings = localStorage.getItem('settings');
    if (localSettings) settings = JSON.parse(localSettings);
  };

  watch(() => settings, (newSettings) => {
    localStorage.setItem('settings', JSON.stringify(newSettings));
  });

  return { settings, initSettings };
});