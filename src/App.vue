<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { TrainInfoObject, TrainInfo, TrainStatus } from '@/util/types';
import TrainMap from './components/TrainMap.vue';
import TrainTable from './components/TrainTable.vue';
import TrainView from '@/components/TrainView.vue';

interface Opts {
    mapFollow: boolean;
    mapTiles: boolean;
    railTiles: boolean;
}

const initialized = ref(false);
const showMap = ref(true);
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

watch(trainData, (newData) => {
  trainGroups.value = { arr: [], dep: [], sch: [] };
  trainMapIds.value = {};
  let newBounds = mapBounds.value;
  for (const tnum in newData) {
    if (newData[tnum].departed) {
      if (newData[tnum].arrived) {
        trainGroups.value['arr'].push(tnum);
      } else {
        trainGroups.value['dep'].push(tnum);

        // This is an active train, update `mapBounds` and `mapCoords`
        let tCoords = getTrainCoords(tnum, newData[tnum]);
        if (tCoords) {
          trainMapIds.value[tnum] = [tCoords[0], tCoords[1]];
          newBounds = [
            [Math.min(newBounds[0][0], tCoords[0]), Math.min(newBounds[0][1], tCoords[1])],
            [Math.max(newBounds[1][0], tCoords[0]), Math.max(newBounds[1][1], tCoords[1])],
          ];
          if (trainSelected.value === tnum) {
            mapCoords.value = [tCoords[0], tCoords[1]];
          }
        }
      }
    } else {
      trainGroups.value['sch'].push(tnum);
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
  await refreshData();
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
        <label>
          <input type="checkbox" v-model="options.mapTiles">
          Draw Map
        </label>
        <label>
          <input type="checkbox" v-model="options.railTiles">
          Draw Railways
        </label>
      </div>
    </div>
    <div>
      <button class="my-1 mx-auto px-2 rounded-sm bg-teal-200 dark:bg-teal-900 text-slate-600 dark:text-slate-300" @click="showMap = !showMap">
        {{ showMap ? 'Hide' : 'Show' }} Map
      </button>
    </div>
    <div v-if="trainSelected === ''" class=" overflow-hidden">
      <select v-model="trainStatus" class="my-2 mx-auto p-2 bg-teal-100 dark:bg-teal-800 text-slate-700 dark:text-slate-200">
        <option value="dep">In Transit</option>
        <option value="sch">Scheduled</option>
        <option value="arr">Arrived</option>
      </select>

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
  </main>
</template>
