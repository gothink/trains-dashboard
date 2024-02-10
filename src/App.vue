<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { TrainInfoObject, TrainInfo, TrainStatus } from '@/util/types';
import TrainMap from './components/TrainMap.vue';
import TrainTable from './components/TrainTable.vue';
import TrainView from '@/components/TrainView.vue';

const initialized = ref(false);
const showMap = ref(true);
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
  <main v-if="initialized" class="h-dvh">
    <TrainMap
      v-show="showMap"
      class="sticky top-0"
      :train-data="trainData"
      :train-map="trainMapIds"
      :train-selected="trainSelected"
      :map-coords="mapCoords"
      :map-bounds="mapBounds"
      @select-train="selectTrain"
      @filter-trains="(filtered) => filteredTrains = filtered"
    />
    <button @click="showMap = !showMap">{{ showMap ? 'Hide' : 'Show' }} Map</button>
    <div v-if="trainSelected === ''">
      <select v-model="trainStatus">
        <option value="dep">In Transit</option>
        <option value="sch">Scheduled</option>
        <option value="arr">Arrived</option>
      </select>

      <TrainTable
        :train-data="trainData"
        :train-groups="trainGroups"
        :train-status="trainStatus"
        :train-selected="trainSelected"
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
