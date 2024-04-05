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
    return dateTime.toLocaleTimeString();
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
    <table class="w-full border text-center">
      <thead>
        <tr class="border">
          <th class="border" rowspan="2">Station</th>
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
        <template v-for="(stop, stopIdx) of trains.trainData[trains.trainSelected].times">
          <tr v-if="showLast || nextStopId > 0 && stopIdx >= nextStopId" class="even:bg-stone-50 odd:bg-stone-200 hover:bg-stone-300 dark:even:bg-stone-950 dark:odd:bg-stone-900 dark:hover:bg-stone-800">
            <td class="py-2" :class="stopIdx === nextStopId && `border-l-4 border-l-indigo-700 dark:border-l-indigo-500`">{{ `${stop.station} (${stop.code})` }}</td>
            <td>{{ stop.eta }}</td>
            <td>{{ timeFormat(stop.arrival?.estimated) }}</td>
            <td>{{ timeFormat(stop.arrival?.scheduled) }}</td>
            <td>{{ timeFormat(stop.departure?.estimated) }}</td>
            <td>{{ timeFormat(stop.departure?.scheduled) }}</td>
            <td>{{ stop.diffMin }} mins</td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>