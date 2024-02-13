<script setup lang="ts">
import type { TrainInfoObject } from '@/util/types';
import { computed } from 'vue';

const props = defineProps<{
  trainData: TrainInfoObject;
  trainStation: string;
}>();

const trains = computed(() => {
  let stopIds: [string, number, number][] = [];
  let stopId = -1;
  for (const trainId in props.trainData) {
    stopId = props.trainData[trainId].times.findIndex(s => s.code === props.trainStation);
    if (stopId > -1) {
      stopIds.push([trainId, stopId, new Date(props.trainData[trainId].times[stopId].scheduled).getTime()]);
    }
  }
  stopIds.sort((a,b) => (a[2] - b[2]));
  return stopIds;
});
</script>
<template>
  <ul>
    <li v-for="train in trains">
      <span>Train #{{ train[0] }}: {{ new Date(trainData[train[0]].times[train[1]].scheduled).toString() }}</span>
    </li>
  </ul>
</template>