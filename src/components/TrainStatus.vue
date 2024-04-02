<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useTrainsStore } from '@/stores/trainsStore';
import { useRouter } from 'vue-router';

const trains = useTrainsStore();
const router = useRouter();

const nextStopId = computed(() => trains.trainData[trains.trainSelected].times.findIndex((station) => station.eta !== 'ARR'));
const previousStops = computed(() => {
  if (trains.trainData[trains.trainSelected].departed) {
    // in service or arrived
    if (trains.trainData[trains.trainSelected].arrived) {
      //arrived
      return trains.trainData[trains.trainSelected].times;
    } else if (nextStopId.value > -1) {
      // in service
      return trains.trainData[trains.trainSelected].times.slice(0, nextStopId.value);
    }
  } else {
    //scheduled
    return [];
  }
});
const nextStops = computed(() => trains.trainData[trains.trainSelected].times.slice(nextStopId.value));

const showLast = ref<boolean>(false);

const timeFormat = (timeStr?: string) => {
  if (timeStr) {
    let dateTime = new Date(timeStr);
    return dateTime.toLocaleTimeString();
  }
  return '--';
};

watch(trains.trainData[trains.trainSelected], (newData) => {
  console.log(`new trains!`);
});

onMounted(() => {
  if (nextStopId.value === -1) showLast.value = true;
});
</script>
<template>
  <div>
    <button @click="router.push('/')">&larr; Back to Trains</button>
    <header>
      <h1 class="text-3xl p-2 w-max border rounded-full">{{ trains.trainSelected }}</h1>
    </header>
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
        <tr v-for="stop of trains.trainData[trains.trainSelected].times" class="even:bg-stone-950 odd:bg-stone-900 hover:bg-stone-800">
          <td class="py-2">{{ `${stop.station} (${stop.code})` }}</td>
          <td>{{ stop.eta }}</td>
          <td>{{ timeFormat(stop.arrival?.estimated) }}</td>
          <td>{{ timeFormat(stop.arrival?.scheduled) }}</td>
          <td>{{ timeFormat(stop.departure?.estimated) }}</td>
          <td>{{ timeFormat(stop.departure?.scheduled) }}</td>
          <td>{{ stop.diffMin }} mins</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>