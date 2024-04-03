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

const currentStation = computed(() => {
  return trains.stationData.find((s) => s[0] === props.stationCode);
});

const timeFormat = (timeStr?: string) => {
  if (timeStr) {
    let dateTime = new Date(timeStr);
    return dateTime.toLocaleTimeString();
  }
  return '--';
};
</script>
<template>
  <div>
    <button @click="trains.stationSelected = ''">&larr; Back to Train Stations</button>
    <header>
      <h1 class="text-3xl p-2 w-max">{{ `${currentStation?.[1]} (${currentStation?.[0]})` }}</h1>
    </header>
    <table class="w-full border text-center">
      <thead>
        <tr class="border">
          <th class="border" rowspan="2">Train</th>
          <th class="border" rowspan="2">ETA</th>
          <th class="border" colspan="2">Arrival</th>
          <th class="border" colspan="2">Departure</th>
          <th class="border" rowspan="2">Delay</th>
        </tr>
        <tr>
          <th class="border">Estimated</th>
          <th class="border">Scheduled</th>
          <th class="border">Estimated</th>
          <th class="border">Scheduled</th>
        </tr>
      </thead>
      <tbody class="divide-y">
        <tr v-for="train in trainList" class="even:bg-stone-950 odd:bg-stone-900 hover:bg-stone-800">
          <td class="py-2">{{ train[0] }}</td>
          <td>{{ trains.trainData[train[0]].times[train[1]].eta }}</td>
          <td>{{ timeFormat(trains.trainData[train[0]].times[train[1]].arrival?.estimated) }}</td>
          <td>{{ timeFormat(trains.trainData[train[0]].times[train[1]].arrival?.scheduled) }}</td>
          <td>{{ timeFormat(trains.trainData[train[0]].times[train[1]].departure?.estimated) }}</td>
          <td>{{ timeFormat(trains.trainData[train[0]].times[train[1]].departure?.scheduled) }}</td>
          <td>{{ trains.trainData[train[0]].times[train[1]].diffMin }} mins</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>