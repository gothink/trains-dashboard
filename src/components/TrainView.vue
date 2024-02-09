<script setup lang="ts">
import { computed, ref } from 'vue';
import type { TrainTimes } from '@/util/types';
interface Props {
  trainSelected: string;
  trainTimes: TrainTimes[];
}
const props = defineProps<Props>();

const nextStopId = computed(() => props.trainTimes.findIndex((station) => station.eta !== 'ARR'));
const previousStops = computed(() => props.trainTimes.slice(0, nextStopId.value));
const nextStops = computed(() => props.trainTimes.slice(nextStopId.value));

</script>
<template>
  <table>
    <thead>
      <th>{{ props.trainSelected }}</th>
    </thead>
    <tbody>
      <tr v-for="stop of previousStops">
        <td>{{ stop.station }}</td>
      </tr>
    </tbody>
    <tbody>
      <tr v-for="stop of nextStops">
        <td>{{ stop.station }}</td>
      </tr>
    </tbody>
  </table>
</template>