import { defineStore } from "pinia";
import { ref } from "vue";
import type { TrainInfoObject } from "@/util/types";

interface StationData {
  name: string;
  coords?: [number, number];
  count?: number;
}

export const useTrainsStore = defineStore('trains', () => {
  const trainData = ref<TrainInfoObject>({});
  const filteredTrains = ref<string[]>([]);
  const trainSelected = ref('');
  const trainStatus = ref('dep');
  const stationSelected = ref('');
  const stationData = ref<Record<string, StationData>>({});

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
        // count trains for each station with scheduled trains
        for (const trainId in trainData.value) {
          for (const stationStop of trainData.value[trainId].times) {
            if (!stations[stationStop.code]) {              
              stations[stationStop.code] = { name: stationStop.station };
            }
            stations[stationStop.code].count ??= 0;
            stations[stationStop.code].count++;              
          }
        }

        stationData.value = stations;
      }
    }
  };

  return {
    trainData,
    trainSelected,
    filteredTrains,
    trainStatus,
    getTrainData,
    stationData,
    stationSelected,
    getStationData,
  };
});