<script setup lang="ts">
import { useTrainsStore } from '@/stores/trainsStore';
import TrainList from '@/components/TrainList.vue';
import TrainStatus from '@/components/TrainStatus.vue';
import { onMounted, watch } from 'vue';

const trains = useTrainsStore();
const props = defineProps<{ trainSelected?: string; }>();

watch(props, (newProps) => {
  trains.trainSelected = newProps.trainSelected ?? '';
});

onMounted(() => {
  if (props.trainSelected && trains.trainData[props.trainSelected]) {
    trains.trainSelected = props.trainSelected;
  }
});
</script>
<template>
  <TrainList v-if="trains.trainSelected === ''" />
  <TrainStatus v-else />
</template>