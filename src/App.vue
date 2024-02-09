<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { TrainInfoObject, TrainInfo } from '@/util/types';
import TrainMap from './components/TrainMap.vue';
import TrainTable from './components/TrainTable.vue';

const groupByStatus = ref(true);
const initialized = ref(false);
const trainData = ref<TrainInfoObject>({});

const trainGroups = ref<Record<string, string[]>>({
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

watch(trainSelected, (newTrain) => {
  if (newTrain !== '') {
    let tCoords = getTrainCoords(newTrain);
    if (tCoords) {
      mapCoords.value = [tCoords[0], tCoords[1]];
    }
  }
  window.scrollTo(0, 0);
});

onMounted(async () => {
  await refreshData();
  initialized.value = true;
  setInterval(refreshData, 60 * 1000);
});
</script>

<template>
  <main v-if="initialized">
    <TrainMap
      v-model="trainSelected"
      :train-data="trainData"
      :train-map="trainMapIds"
      :map-coords="mapCoords"
      :map-bounds="mapBounds"
    />

    <TrainTable
      v-model="trainSelected"
      :train-data="trainData"
      :train-groups="trainGroups"
    />
  </main>
</template>
