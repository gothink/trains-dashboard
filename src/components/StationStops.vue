<script setup lang="ts">
import type { TrainInfoObject } from '@/util/types';

const props = defineProps<{
  trainData: TrainInfoObject;
  stationStops: Record<string, [string, number][]>;
}>();
</script>
<template>
  <ul>
    <li v-for="(station, idx) in stationStops">
      <span>Station {{ idx }}: {{ station.length }} trains</span>
    </li>
  </ul>
</template>