<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useTrainsStore } from '@/stores/trainsStore';
import StationList from '@/components/StationList.vue';
import StationStatus from '@/components/StationStatus.vue';

const trains = useTrainsStore();
const props = defineProps<{ stationCode?: string; }>();

onMounted(() => {
  if (
    props.stationCode &&
    trains.stationData.findIndex((stat) => stat[0] === props.stationCode) > -1
  ) {
    trains.stationSelected = props.stationCode;
  }
});
</script>
<template>
  <StationList v-if="trains.stationSelected === ''" />
  <StationStatus v-else :station-code="trains.stationSelected" />
</template>