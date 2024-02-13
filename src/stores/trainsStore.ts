import { defineStore } from "pinia";
import { ref } from "vue";
import type { TrainInfoObject } from "@/util/types";

export const useTrainsStore = defineStore('trains', () => {
  const initialized = ref(false);
  const trainData = ref<TrainInfoObject>({});
  const filteredTrains = ref<string[]>([]);
  const trainSelected = ref('');
  const stationSelected = ref('');
  const stationData = ref<[string, string, [number, number]][]>([]);

  const getTrainData = async () => {
    const response = await fetch('/api/trains');
    if (response.ok) trainData.value = await response.json();
  };

  const getStationData = async () => {
    const response = await fetch('/api/stations');
    if (response.ok) {
      let { stations, error } = await response.json();
      if (error) {
        console.log(error);
      }
      if (stations) {
        stationData.value = stations;
      }
    }
  };

  return {
    trainData,
    trainSelected,
    filteredTrains,
    getTrainData,
    stationData,
    stationSelected,
    getStationData,
  };
});