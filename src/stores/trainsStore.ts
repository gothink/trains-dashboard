import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import { useUserStore } from "./userStore";
import type { MapBoundary, MapCoord, TrainInfo, TrainStatus } from "@/util/types";
import routeCoords from '../../data/routes.json';
import trainRoutes from '../../data/trains.json';
import stationInfo from '../../data/stations.json';

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
  const trainHighlighted = ref<string | null>(null);
  const trainStatus = ref<TrainStatus>("departed");
  const stationSelected = ref("");
  const stationData = shallowRef<Record<string, StationData>>({});
  let refreshIntervalRef: number;
  
  const mapBounds = computed(() => {
    let bounds: MapBoundary | null = null;
    if (trainSelected.value !== '') {
      trainData.value[trainSelected.value].times.forEach((s) => {
        let coords = stationInfo[s.code as keyof typeof stationInfo].coords;
        if (!bounds) {
          bounds = [
            [ parseFloat(coords[0]), parseFloat(coords[1]) ],
            [ parseFloat(coords[0]), parseFloat(coords[1]) ],
          ];
        } else {
          bounds = [
            [
              Math.min(bounds[0][0], parseFloat(coords[0])),
              Math.min(bounds[0][1], parseFloat(coords[1])),
            ],
            [
              Math.max(bounds[1][0], parseFloat(coords[0])),
              Math.max(bounds[1][1], parseFloat(coords[1])),
            ],
          ];
        }
      });
    } else {
      for (const trainId in trainsActive.value) {
        if (!bounds) {
          bounds = [
            [trainsActive.value[trainId].lng, trainsActive.value[trainId].lat],
            [trainsActive.value[trainId].lng, trainsActive.value[trainId].lat],
          ];
        } else {
          bounds = [
            [
              Math.min(bounds[0][0], trainsActive.value[trainId].lng),
              Math.min(bounds[0][1], trainsActive.value[trainId].lat),
            ],
            [
              Math.max(bounds[1][0], trainsActive.value[trainId].lng),
              Math.max(bounds[1][1], trainsActive.value[trainId].lat),
            ],
          ];
        }
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
    trainHighlighted,
    trainsInView,
    trainStatus,
    stationData,
    stationSelected,
    mapBounds,
    initApp,
  };
});