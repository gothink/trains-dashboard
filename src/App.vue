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
    <div class="w-full sm:w-2/3 sm:min-w-fit mx-auto">
      <ul class="flex flex-wrap justify-center text-center text-slate-700 dark:text-slate-300">
        <li class="p-4 w-1/2" :class="route.name === 'trains' ? 'font-bold border-b-4 border-slate-700 dark:border-slate-500 bg-slate-50 dark:bg-slate-900' : 'underline'">
          <RouterLink to="/">Trains</RouterLink>
        </li>
        <li class="p-4 w-1/2" :class="route.name === 'stations' ? 'font-bold border-b-4 border-slate-700 dark:border-slate-500 bg-slate-50 dark:bg-slate-900' : 'underline'">
          <RouterLink to="/stations">Stations</RouterLink>
        </li>
      </ul>
      <RouterView />
    </div>
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
