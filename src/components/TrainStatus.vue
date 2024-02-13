<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useTrainsStore } from '@/stores/trainsStore';


const trains = useTrainsStore();

const nextStopId = computed(() => trains.trainData[trains.trainSelected].times.findIndex((station) => station.eta !== 'ARR'));
const previousStops = computed(() => trains.trainData[trains.trainSelected].times.slice(0, nextStopId.value));
const nextStops = computed(() => trains.trainData[trains.trainSelected].times.slice(nextStopId.value));

const showLast = ref<boolean>(false);

onMounted(() => {
  if (nextStopId.value === -1) showLast.value = true;
});
</script>
<template>
  <div>
    <button @click="trains.trainSelected = ''">&larr; Back to Trains</button>
    <label>
      <input v-model="showLast" type="checkbox">
      {{ showLast ? 'Hide' : 'Show' }} Previous Stops
    </label>
    <table>
      <thead>
        <th colspan="5">{{ trains.trainSelected }}</th>
      </thead>
      <tbody v-if="showLast">
        <th>Previous Stops:</th>
        <tr v-for="stop of previousStops">
          <td>{{ stop.station }}</td>
          <td>{{ stop.arrival?.estimated }}</td>
          <td>{{ stop.arrival?.scheduled }}</td>
        </tr>
      </tbody>
      <tbody>
        <tr>
          <th colspan="5">Next Stops:</th>
        </tr>
        <tr>
          <th>Station</th>
          <th>ETA</th>
          <th>Estimated</th>
          <th>Scheduled</th>
          <th>Delay</th>
        </tr>
        <tr v-for="stop of nextStops">
          <td>{{ `${stop.station} (${stop.code})` }}</td>
          <td>{{ stop.eta }}</td>
          <td>{{ stop.estimated }}</td>
          <td>{{ stop.scheduled }}</td>
          <td>{{ stop.diffMin }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>