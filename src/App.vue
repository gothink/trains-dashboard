<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { TrainInfoObject } from '@/util/types';
import TrainMap from './components/TrainMap.vue';

const groupByStatus = ref(true);

const trainData = ref<TrainInfoObject>({});

const trainGroups = ref<Record<string, string[]>>({
  arr: [],
  dep: [],
  sch: [],
});
const trainMapIds = ref<string[]>([]);
const trainSelected = ref('');

const refreshData = async () => {
  const response = await fetch('/trains');
  if (response.ok) trainData.value = await response.json();
};

watch(trainData, (newData) => {
  trainGroups.value = { arr: [], dep: [], sch: [] };
  trainMapIds.value = [];
  for (const tnum in newData) {
    if (newData[tnum].departed) {
      if (newData[tnum].arrived) {
        trainGroups.value['arr'].push(tnum);
      } else {
        if (newData[tnum].lat && newData[tnum].lng) {
          trainMapIds.value.push(tnum);
        }
        
        trainGroups.value['dep'].push(tnum);
      }
    } else {
      trainGroups.value['sch'].push(tnum);
    }
  }
});

const getNextStop = (trainNumber: string) => {
  let stopIndex = trainData.value[trainNumber].times.findIndex((station) => station.eta !== 'ARR');
  if (stopIndex > -1) {
    let nextStation = trainData.value[trainNumber].times[stopIndex];
    return `${nextStation.station} (${nextStation.eta})`;
  }
};

const selectTrain = (trainNumber: string) => {
  trainSelected.value = trainNumber;
};

onMounted(async () => {
  await refreshData();
  setInterval(refreshData, 60 * 1000);
});
</script>

<template>
  <main v-if="trainData">
    <TrainMap :train-data="trainData" :train-map="trainMapIds" :train-selected="trainSelected" />
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

<style>
#mapElem {
  height: 500px;
}
</style>