<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import TrainMap from './components/TrainMap.vue';
import { useTrainsStore } from './stores/trainsStore';
import { RouterView, useRoute } from 'vue-router';

const trains = useTrainsStore();
const route = useRoute();

const initialized = ref(false);
const showMap = ref(true);

// watch(stationFilter, (filterString) => {
//   filteredStations.value = [];
//   filterString = filterString.toLowerCase();
//   for (const statId in stations) {
//     if (
//       filterString === '' ||
//       statId.toLowerCase().includes(filterString) ||
//       stations[statId as keyof typeof stations].name.toLowerCase().includes(filterString)
//     ) {
//       filteredStations.value.push([statId, stations[statId as keyof typeof stations].name]);
//     }
//   }
//   if (filteredStations.value.length === 1) {
//     stationSelected.value = filteredStations.value[0][0];
//   }
// }, { immediate: true });



onMounted(async () => {
  await trains.getTrainData();
  initialized.value = true;
  // setInterval(trains.getTrainData, 60 * 1000);
  // await trains.getStationData();
});
</script>

<template>
  <main v-if="initialized" class="h-max">
    <div v-if="showMap" class="sticky top-0 h-[50vh]">
      <TrainMap />
    </div>
    <div>
      <button class="my-1 mx-auto px-2 rounded-sm bg-teal-200 dark:bg-teal-900 text-slate-600 dark:text-slate-300" @click="showMap = !showMap">
        {{ showMap ? 'Hide' : 'Show' }} Map
      </button>
    </div>
    <ul class="flex flex-wrap text-center bg-slate-300 text-slate-700 active:bg-slate-100 active:text-blue-700 dark:bg-slate-600 dark:text-slate-300 active:dark:bg-slate-900 active:dark:text-blue-500">
      <li class="me-2 p-4 rounded-t-lg" :class="route.name === 'trains' ? 'active' : ''">
        <RouterLink to="/" class="border border-1 border-b-0 bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-300">Trains</RouterLink>
      </li>
      <li class="p-4 rounded-t-lg bg-teal-200 dark:bg-teal-900 text-slate-600 dark:text-slate-300">
        <RouterLink to="/stations">Stations</RouterLink>
      </li>
    </ul>
    <RouterView />
    <!-- <div v-if="trainSelected === ''" class=" overflow-hidden">

      <input type="text" list="stations-datalist" v-model="stationFilter">
      <datalist id="stations-datalist">
        <option v-for="station in filteredStations" :value="station[0]">{{ `${station[1]} (${station[0]})` }}</option>
      </datalist>

    </div>
    <div v-if="stationSelected">
      <StationStops :train-data="trainData" :train-station="stationSelected" />
    </div> -->
  </main>
</template>
