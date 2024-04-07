<script setup lang="ts">
import { useTrainsStore } from '@/stores/trainsStore';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const trains = useTrainsStore();
const router = useRouter();

const stationSearch = ref('');

const filteredStations = computed(() => {
  if (stationSearch.value === '') return trains.stationData;
  
  let stationList: typeof trains.stationData = {};
  for (const stationCode in trains.stationData) {
    if (
      stationCode.toLowerCase().includes(stationSearch.value.toLowerCase()) ||
      trains.stationData[stationCode].name.toLowerCase().includes(stationSearch.value.toLowerCase())
    ) stationList[stationCode] = trains.stationData[stationCode];
  }
  return stationList;
});
</script>
<template>
  <div class="max-w-max mx-auto">
    <div class="my-2 border border-neutral-400 dark:border-neutral-700">
      <label for="station-search" class="p-1">Search: </label>
      <input v-model="stationSearch" type="search" name="station-search" id="station-search" class="bg-neutral-400 dark:bg-neutral-700 p-1">
    </div>
    <ul class="divide-y mx-auto text-center">
      <li v-for="(station, stationCode) in filteredStations" @click="router.push(`/stations/${stationCode}`)" class="py-2 bg-stone-200 hover:bg-stone-300 dark:bg-stone-900 dark:hover:bg-stone-800 cursor-pointer">
        {{ `${station.name} - ${stationCode}` }} {{ `(${station.count ?? '0'} train${station.count!==1 ? 's' : ''})` }}
      </li>
    </ul>
  </div>
</template>