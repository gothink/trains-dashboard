import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import { useUserStore } from "./userStore";
import type { MapBoundary, MapCoord, TrainInfo, TrainStatus } from "@/util/types";

interface StationData {
  name: string;
  coords?: MapCoord;
  count?: number;
}

type TrainsObject = Record<string, TrainInfo>;
type ActiveTrainsObject = Record<string, TrainInfo & Required<Pick<TrainInfo, "lat" | "lng">>>;

export const useTrainsStore = defineStore('trains', () => {
  const user = useUserStore();
  const trainData = shallowRef<TrainsObject>({});
  const trainsActive = shallowRef<ActiveTrainsObject>({});
  const trainsInView = ref<string[]>([]);
  const trainSelected = ref("");
  const trainStatus = ref<TrainStatus>("departed");
  const stationSelected = ref("");
  const stationData = shallowRef<Record<string, StationData>>({});
  let refreshIntervalRef: number;
  
  const mapBounds = computed(() => {
    let bounds: MapBoundary | null = null;
    for (const trainId in trainsActive.value) {
      if (!bounds) {
        bounds = [
          [trainsActive.value[trainId].lat, trainsActive.value[trainId].lng],
          [trainsActive.value[trainId].lat, trainsActive.value[trainId].lng],
        ];
      } else {
        bounds = [
          [
            Math.min(bounds[0][0], trainsActive.value[trainId].lat),
            Math.min(bounds[0][1], trainsActive.value[trainId].lng),
          ],
          [
            Math.max(bounds[1][0], trainsActive.value[trainId].lat),
            Math.max(bounds[1][1], trainsActive.value[trainId].lng),
          ],
        ];
      }
    }
    return bounds;
  });

  const getTrainData = async () => {
    try {
      const response = await fetch("/api/trains");
      if (response.ok) {
        let trains: TrainsObject = await response.json();

        if (trains) {
          let active: ActiveTrainsObject = {};
          Object.entries(trains).forEach(([trainId, train]) => {
            if (train.departed && !train.arrived) {
              train.next = train.times.findIndex(
                (station) => station.eta !== "ARR"
              );

              if (train.lat && train.lng) {
                active[trainId] = {
                  lat: train.lat,
                  lng: train.lng,
                  ...train,
                };
              }
            }
          });
          trainsActive.value = active;
          trainData.value = trains;
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  const getStationData = async () => {
    const response = await fetch("/api/stations");
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

  const initApp = async () => {
    user.initSettings();
    await getTrainData();
    await getStationData();
    if (user.settings.autoRefresh) {
      refreshIntervalRef = setInterval(() => getTrainData(), user.settings.refreshInterval * 1000);
    }
  };

  return {
    trainData,
    trainsActive,
    trainSelected,
    trainsInView,
    trainStatus,
    stationData,
    stationSelected,
    mapBounds,
    initApp,
  };
});