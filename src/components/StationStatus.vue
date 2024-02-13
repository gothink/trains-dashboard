<script setup lang="ts">
import { computed } from 'vue';
import { useTrainsStore } from '@/stores/trainsStore';

const props = defineProps<{ stationCode: string; }>();

const trains = useTrainsStore();

const trainList = computed(() => {
  let stopIds: [string, number, number][] = [];
  let stopId = -1;
  for (const trainId in trains.trainData) {
    stopId = trains.trainData[trainId].times.findIndex(s => s.code === props.stationCode);
    if (stopId > -1) {
      stopIds.push([trainId, stopId, new Date(trains.trainData[trainId].times[stopId].scheduled).getTime()]);
    }
  }
  stopIds.sort((a,b) => (a[2] - b[2]));
  return stopIds;
});
</script>
<template>
  <div>
    <button @click="trains.stationSelected = ''">&larr; Back to Train Stations</button>
    <br>
    <ul>
      <li v-for="train in trainList">
        <span>Train #{{ train[0] }}: {{ new Date(trains.trainData[train[0]].times[train[1]].scheduled).toString() }}</span>
      </li>
    </ul>
  </div>
</template>