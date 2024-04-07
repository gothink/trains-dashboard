<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useTrainsStore } from '@/stores/trainsStore';
import StationList from '@/components/StationList.vue';
import StationStatus from '@/components/StationStatus.vue';

const trains = useTrainsStore();
const props = defineProps<{ stationCode?: string; }>();

watch(props, (newProps) => {
  trains.stationSelected = newProps.stationCode ?? '';
});

onMounted(async () => {
  if (
    props.stationCode &&
    trains.stationData[props.stationCode.toUpperCase()]
  ) {
    trains.stationSelected = props.stationCode.toUpperCase();
  }
});
</script>
<template>
  <StationList v-if="trains.stationSelected === ''" />
  <StationStatus v-else />
</template>