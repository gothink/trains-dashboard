<script setup lang="ts">
import { useTrainsStore } from '@/stores/trainsStore';

const trains = useTrainsStore();
</script>
<template>
  <ul>
    <li v-for="station in trains.stationData" @click="trains.stationSelected = station[0]">
      {{ `${station[1]} (${station[0]})` }}
    </li>
  </ul>
</template>