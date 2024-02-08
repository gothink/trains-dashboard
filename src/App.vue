<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { TrainInfoObject, TrainInfo } from '@/util/types';
import TrainMap from './components/TrainMap.vue';

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

const getNextStop = (trainNumber: string) => {
  let stopIndex = trainData.value[trainNumber].times.findIndex((station) => station.eta !== 'ARR');
  if (stopIndex > -1) {
    let nextStation = trainData.value[trainNumber].times[stopIndex];
    return `${nextStation.station} (${nextStation.eta})`;
  }
};

const selectTrain = (trainNumber: string) => {
  if (trainSelected.value) {
    let tCoords = getTrainCoords(trainNumber);
    if (tCoords) {
      mapCoords.value = [tCoords[0], tCoords[1]];
    }
  } 
  trainSelected.value = trainNumber;
};

onMounted(async () => {
  await refreshData();
  initialized.value = true;
  setInterval(refreshData, 60 * 1000);
});
</script>

<template>
  <main v-if="initialized">
    <TrainMap
      :train-data="trainData"
      :train-map="trainMapIds"
      :train-selected="trainSelected"
      :map-coords="mapCoords"
      :map-bounds="mapBounds"
      @select-train="selectTrain"
    />
    <table>
      <thead>
        <tr>VIA Rail Trains</tr>
      </thead>
      <tbody>
        <tr>
          <th>In Transit</th>
        </tr>
        <tr>
          <th>Train #</th>
          <th>From</th>
          <th>Next Stop</th>
          <th>Destination</th>
          <th>Delay</th>
        </tr>
        <tr v-for="train in trainGroups['dep']" @click="selectTrain(train)">
          <td>{{ train }}</td>
          <td>{{ trainData[train].from }}</td>
          <td>{{ getNextStop(train) }}</td>
          <td>{{ trainData[train].to }}</td>
          <td>{{ trainData[train].pollMin }}</td>
        </tr>
      </tbody>
      <tbody>
        <tr>
          <th>Scheduled to Depart</th>
        </tr>
        <tr>
          <th>Train #</th>
          <th>From</th>
          <th>Destination</th>
        </tr>
        <tr v-for="train in trainGroups['sch']" @click="selectTrain(train)">
          <td>{{ train }}</td>
          <td>{{ trainData[train].from }}</td>
          <td>{{ trainData[train].to }}</td>
        </tr>
      </tbody>
      <tbody>
        <tr>
          <th>Arrived</th>
        </tr>
        <tr>
          <th>Train #</th>
          <th>From</th>
          <th>Destination</th>
        </tr>
        <tr v-for="train in trainGroups['arr']" @click="selectTrain(train)">
          <td>{{ train }}</td>
          <td>{{ trainData[train].from }}</td>
          <td>{{ trainData[train].to }}</td>
        </tr>
      </tbody>
    </table>
  </main>
</template>
