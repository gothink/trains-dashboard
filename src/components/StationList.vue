<script setup lang="ts">
import { useTrainsStore } from '@/stores/trainsStore';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const trains = useTrainsStore();
const router = useRouter();

const stationSearch = ref('');

const filteredStations = computed(() => {
  if (stationSearch.value === '') return trains.stationData;
  
  let stationList = [];
  for (const station of trains.stationData) {
    if (
      station[0].toLowerCase().includes(stationSearch.value.toLowerCase()) ||
      station[1].toLowerCase().includes(stationSearch.value.toLowerCase())
    ) stationList.push(station);
  }
  return stationList;
});
</script>
<template>
  <div class="max-w-max mx-auto">
    <div class="my-2 border border-neutral-400 dark:border-neutral-700">
      <label for="station-search" class="p-1">Search: </label>
      <input v-model="stationSearch" type="search" name="station-search" class="bg-neutral-400 dark:bg-neutral-700 p-1">
    </div>
    <ul class="divide-y mx-auto text-center">
      <li v-for="station in filteredStations" @click="router.push(`/stations/${station[0]}`)" class="py-2 bg-stone-200 hover:bg-stone-300 dark:bg-stone-900 dark:hover:bg-stone-800 cursor-pointer">
        {{ `${station[1]} (${station[0]})` }}
      </li>
    </ul>
  </div>
</template>