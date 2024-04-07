<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useTrainsStore } from '@/stores/trainsStore';
import { useRouter } from 'vue-router';

const trains = useTrainsStore();
const router = useRouter();

const nextStopId = computed(() => trains.trainData[trains.trainSelected].times.findIndex((station) => station.eta !== 'ARR'));

const showLast = ref<boolean>(false);

const timeFormat = (timeStr?: string) => {
  if (timeStr) {
    let dateTime = new Date(timeStr);
    let hours = dateTime.getHours().toString();
    let minutes = dateTime.getMinutes().toString();
    return `${hours.length === 1 ? '0' : ''}${hours}:${minutes.length === 1 ? '0' : ''}${minutes}`;
  }
  return '--';
};

onMounted(() => {
  if (nextStopId.value === -1) showLast.value = true;
});
</script>
<template>
  <div>
    <div class="flex flex-col sm:flex-row items-center">
      <button @click="router.push('/')" class="p-2 border rounded-lg">&larr; Back to Trains</button>
      <header class="flex-1 text-center">
        <h1 class="text-3xl p-2">Train {{ trains.trainSelected }}</h1>
      </header>
      <div>
        <input type="checkbox" name="show-trains" id="show-trains" v-model="showLast">
        <label for="show-trains">Show Past Stops</label>
      </div>
    </div>
    <table class="border-separate border-spacing-0 w-full sm:border text-center">
      <thead class="sticky top-0 bg-stone-50 dark:bg-stone-950">
        <tr>
          <th class="border border-l-0 sm:border-l" rowspan="2" style="width: max-content;">Station</th>
          <th class="border" rowspan="2">ETA</th>
          <th class="border" colspan="2">Arrival</th>
          <th class="border" colspan="2">Departure</th>
          <th class="border border-r-0 sm:border-r" rowspan="2" style="width: min-content;">Delay</th>
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
        <template v-for="(stop, stopIdx) of trains.trainData[trains.trainSelected].times">
          <tr v-if="showLast || nextStopId > 0 && stopIdx >= nextStopId" class="even:bg-stone-50 odd:bg-stone-200 hover:bg-stone-300 dark:even:bg-stone-950 dark:odd:bg-stone-900 dark:hover:bg-stone-800">
            <td class="py-2" :class="stopIdx === nextStopId && `border-l-4 border-l-indigo-700 dark:border-l-indigo-500`">
              {{ `${stop.station}` }}<span class="hidden sm:inline"> ({{ stop.code }})</span>
            </td>
            <td>{{ stop.eta }}</td>
            <td>{{ timeFormat(stop.arrival?.estimated) }}</td>
            <td>{{ timeFormat(stop.arrival?.scheduled) }}</td>
            <td>{{ timeFormat(stop.departure?.estimated) }}</td>
            <td>{{ timeFormat(stop.departure?.scheduled) }}</td>
            <td>{{ stop.diffMin }}</td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>