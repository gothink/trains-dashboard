import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";
import type { MapBoundary, MapCoord, TrainInfo } from "@/util/types";

interface StationData {
  name: string;
  coords?: [number, number];
  count?: number;
}

type TrainsObject = Record<string, TrainInfo>;
type ActiveTrainsObject = Record<string, TrainInfo & Required<Pick<TrainInfo, "lat" | "lng">>>;

export const useTrainsStore = defineStore('trains', () => {
  const trainData = shallowRef<TrainsObject>({});
  const trainList = shallowRef<{
    active: ActiveTrainsObject;
    departed: TrainsObject;
    arrived: TrainsObject;
    scheduled: TrainsObject;
  }>({
    active: {},
    departed: {},
    arrived: {},
    scheduled: {},
  });
  const filteredTrains = ref<string[]>([]);
  const trainSelected = ref('');
  const trainStatus = ref('dep');
  const stationSelected = ref('');
  const stationData = shallowRef<Record<string, StationData>>({});
  const mapBounds = ref<MapBoundary>();

  const getTrainData = async () => {
    const response = await fetch('/api/trains');
    if (response.ok) {
      let trains: TrainsObject = await response.json();
      if (trains) {
        let active: ActiveTrainsObject = {};
        let departed: TrainsObject = {};
        let scheduled: TrainsObject = {};
        let arrived: TrainsObject = {};
        let coords: MapCoord;
        let bounds: MapBoundary | null = null;

        Object.entries(trains).forEach(([trainId, train]) => {
          // populate trainList
          if (train.departed) {
            if (train.arrived) {
              arrived[trainId] = train;
            } else {
              // add next stop
              train.next = train.times.findIndex(
                (station) => station.eta !== "ARR"
              );
              
              departed[trainId] = train;

              // has coordinates?
              if (train.lat && train.lng) {
                active[trainId] = { ...train, lat: train.lat, lng: train.lng };

                // update map bounds
                coords = [train.lat, train.lng];
                if (!bounds) {
                  bounds = [coords, coords];
                } else {
                  bounds = [
                    [
                      Math.min(bounds[0][0], coords[0]),
                      Math.min(bounds[0][1], coords[1]),
                    ],
                    [
                      Math.max(bounds[1][0], coords[0]),
                      Math.max(bounds[1][1], coords[1]),
                    ],
                  ];
                }
              }
            }
          } else {
            scheduled[trainId] = train;
          }
        });

        trainList.value = { active, departed, arrived, scheduled };
        if (bounds) mapBounds.value = bounds;
      }
    }
  }

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