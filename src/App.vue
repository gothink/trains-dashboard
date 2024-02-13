<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { TrainInfoObject, TrainInfo, TrainStatus, TrainTimes } from '@/util/types';
import TrainMap from './components/TrainMap.vue';

import { useTrainsStore } from './stores/trainsStore';

import { RouterView } from 'vue-router';

interface Opts {
    mapFollow: boolean;
    mapTiles: boolean;
    railTiles: boolean;
}

const trains = useTrainsStore();

const initialized = ref(false);
const showMap = ref(false);
const options = ref<Opts>({
  mapFollow: true,
  mapTiles: true,
  railTiles: true,
});
const trainStatus = ref<TrainStatus>('dep');
const trainData = ref<TrainInfoObject>({});
const filteredTrains = ref<string[]>([]);

const trainGroups = ref<Record<TrainStatus, string[]>>({
  arr: [],
  dep: [],
  sch: [],
});

const trainMapIds = ref<Record<string, [number, number]>>({});
const trainSelected = ref('');

const stationSelected = ref('');
const stationFilter = ref('');
const allStations = ref<[string, string, [number, number]][]>([]);
const filteredStations = ref<[string, string][]>([]);

const mapBounds = ref<[[number, number], [number, number]]>([[45.5, -78.5], [44.5,-76.5]]);
const mapCoords = ref<[number, number]>([45.5,-75.5]);

const refreshData = async () => {
  const response = await fetch('/trains');
  if (response.ok) trainData.value = await response.json();
};

const getTrainCoords = (trainId: string, trainInfo: TrainInfo = trainData.value[trainId]) => {
  if (trainInfo.lat && trainInfo.lng) {
    return [trainInfo.lat, trainInfo.lng];
  }
};

const getStations = async () => {
  const response = await fetch('/stations');
  if (response.ok) {
    let { stations, error } = await response.json();
    if (error) {
      console.log(error);
    }
    if (stations) {
      allStations.value = stations;
    }
  }
};

// watch(stationFilter, (filterString) => {
//   filteredStations.value = [];
//   filterString = filterString.toLowerCase();
//   for (const statId in stations) {
//     if (
//       filterString === '' ||
//       statId.toLowerCase().includes(filterString) ||
//       stations[statId as keyof typeof stations].name.toLowerCase().includes(filterString)
//     ) {
//       filteredStations.value.push([statId, stations[statId as keyof typeof stations].name]);
//     }
//   }
//   if (filteredStations.value.length === 1) {
//     stationSelected.value = filteredStations.value[0][0];
//   }
// }, { immediate: true });

watch(trainData, (newData) => {
  trainGroups.value = { arr: [], dep: [], sch: [] };
  trainMapIds.value = {};
  let newBounds = mapBounds.value;
  for (const trainId in newData) {
    if (newData[trainId].departed) {
      if (newData[trainId].arrived) {
        trainGroups.value['arr'].push(trainId);
      } else {
        trainGroups.value['dep'].push(trainId);

        // This is an active train, update `mapBounds` and `mapCoords`
        let tCoords = getTrainCoords(trainId, newData[trainId]);
        if (tCoords) {
          trainMapIds.value[trainId] = [tCoords[0], tCoords[1]];
          newBounds = [
            [Math.min(newBounds[0][0], tCoords[0]), Math.min(newBounds[0][1], tCoords[1])],
            [Math.max(newBounds[1][0], tCoords[0]), Math.max(newBounds[1][1], tCoords[1])],
          ];
          if (trainSelected.value === trainId) {
            mapCoords.value = [tCoords[0], tCoords[1]];
          }
        }
      }
    } else {
      trainGroups.value['sch'].push(trainId);
    }
  }

  mapBounds.value = newBounds;

}, { immediate: true });

const selectTrain = (trainId: string, inTransit: boolean = true) => {
  if (trainId !== '' && inTransit) {
    let tCoords = getTrainCoords(trainId);
    if (tCoords) {
      mapCoords.value = [tCoords[0], tCoords[1]];
    }
  }
  window.scrollTo(0, 0);
  trainSelected.value = trainId;
};

onMounted(async () => {
  await trains.getTrainData();
  initialized.value = true;
  setInterval(refreshData, 60 * 1000);
});
</script>

<template>
  <main v-if="initialized" class="h-max">
    <div v-if="showMap" class="sticky top-0 h-[50vh]">
      <TrainMap
        :train-data="trainData"
        :train-map="trainMapIds"
        :train-selected="trainSelected"
        :map-coords="mapCoords"
        :map-bounds="mapBounds"
        :options="options"
        @select-train="selectTrain"
        @filter-trains="(filtered) => filteredTrains = filtered"
      />
      <div>
        <label>
          <input type="checkbox" v-model="options.mapFollow">
          Map Sync
        </label>
      </div>
    </div>
    <div>
      <button class="my-1 mx-auto px-2 rounded-sm bg-teal-200 dark:bg-teal-900 text-slate-600 dark:text-slate-300" @click="showMap = !showMap">
        {{ showMap ? 'Hide' : 'Show' }} Map
      </button>
    </div>
    <RouterLink to="/">Trains</RouterLink>
    <RouterLink to="/stations">Stations</RouterLink>
    <RouterView />
    <!-- <div v-if="trainSelected === ''" class=" overflow-hidden">
      <select v-model="trainStatus" class="my-2 mx-auto p-2 bg-teal-100 dark:bg-teal-800 text-slate-700 dark:text-slate-200">
        <option value="dep">In Transit</option>
        <option value="sch">Scheduled</option>
        <option value="arr">Arrived</option>
      </select>

      <input type="text" list="stations-datalist" v-model="stationFilter">
      <datalist id="stations-datalist">
        <option v-for="station in filteredStations" :value="station[0]">{{ `${station[1]} (${station[0]})` }}</option>
      </datalist>

      <TrainTable
        :train-data="trainData"
        :train-groups="trainGroups"
        :train-status="trainStatus"
        :filtered-trains="filteredTrains"
        @select-train="selectTrain"
      />
    </div>
    <div v-else>
      <button @click="trainSelected=''">Back to trains</button>
      <br>
      <TrainView
        :train-selected="trainSelected"
        :train-times="trainData[trainSelected].times"
      />
    </div>
    <div v-if="stationSelected">
      <StationStops :train-data="trainData" :train-station="stationSelected" />
    </div> -->
  </main>
</template>
