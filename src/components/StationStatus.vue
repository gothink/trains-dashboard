<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTrainsStore } from '@/stores/trainsStore';
import { useRouter } from 'vue-router';

const trains = useTrainsStore();
const router = useRouter();

const showTrains = ref(false);

const trainList = computed(() => {
  let stopIds: [string, number, number][] = [];
  let stopId = -1;
  for (const trainId in trains.trainData) {
    stopId = trains.trainData[trainId].times.findIndex(s => s.code === trains.stationSelected);
    if (stopId > -1) {
      let trainTime = trains.trainData[trainId].times[stopId].estimated.slice(0,1) === `&` ? trains.trainData[trainId].times[stopId].scheduled : trains.trainData[trainId].times[stopId].estimated;
      stopIds.push([trainId, stopId, new Date(trainTime).getTime()]);
    }
  }
  stopIds.sort((a,b) => (a[2] - b[2]));
  return stopIds;
});

const timeFormat = (timeStr?: string) => {
  if (timeStr) {
    let dateTime = new Date(timeStr);
    let hours = dateTime.getHours().toString();
    let minutes = dateTime.getMinutes().toString();
    return `${hours.length === 1 ? '0' : ''}${hours}:${minutes.length === 1 ? '0' : ''}${minutes}`;
  }
  return '--';
};
</script>
<template>
  <div>
    <div class="flex flex-col sm:flex-row items-center">
      <button @click="router.push('/stations')" class="p-2 border rounded-lg">&larr; Back to Train Stations</button>
      <header class="flex-1 text-center">
        <h1 class="text-3xl p-2">{{ `${trains.stationData[trains.stationSelected].name} (${trains.stationSelected})` }}</h1>
      </header>
      <div>
        <input type="checkbox" name="show-trains" id="show-trains" v-model="showTrains">
        <label for="show-trains">Show Earlier Trains</label>
      </div>
    </div>
    <table class="table-fixed sm:table-auto border-separate border-spacing-0 w-full sm:border text-center">
      <thead class="sticky top-0 bg-stone-50 dark:bg-stone-950">
        <tr class="">
          <th class="border border-l-0 sm:border-l" rowspan="2">Train</th>
          <th class="border" rowspan="2">ETA</th>
          <th class="border" colspan="2">Arrival</th>
          <th class="border" colspan="2">Departure</th>
          <th class="border border-r-0 sm:border-r" rowspan="2">Delay (mins)</th>
        </tr>
        <tr>
          <th class="border">
            <span class="hidden sm:inline">Revised</span>
            <span class="inline sm:hidden">Rev.</span>
          </th>
          <th class="border">
            <span class="hidden sm:inline">Scheduled</span>
            <span class="inline sm:hidden">Sched.</span>
          </th>
          <th class="border">
            <span class="hidden sm:inline">Revised</span>
            <span class="inline sm:hidden">Rev.</span>
          </th>
          <th class="border">
            <span class="hidden sm:inline">Scheduled</span>
            <span class="inline sm:hidden">Sched.</span>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y">
        <tr v-for="train in trainList" class="even:bg-stone-50 odd:bg-stone-200 hover:bg-stone-300 dark:even:bg-stone-950 dark:odd:bg-stone-900 dark:hover:bg-stone-800">
          <th class="py-2">{{ train[0] }}</th>
          <td>{{ trains.trainData[train[0]].times[train[1]].eta.slice(0,1) === `&` ? `--` : trains.trainData[train[0]].times[train[1]].eta }}</td>
          <td>{{ timeFormat(trains.trainData[train[0]].times[train[1]].arrival?.estimated) }}</td>
          <td>{{ timeFormat(trains.trainData[train[0]].times[train[1]].arrival?.scheduled) }}</td>
          <td>{{ timeFormat(trains.trainData[train[0]].times[train[1]].departure?.estimated) }}</td>
          <td>{{ timeFormat(trains.trainData[train[0]].times[train[1]].departure?.scheduled) }}</td>
          <td>{{ trains.trainData[train[0]].times[train[1]].diffMin ?? `--` }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>