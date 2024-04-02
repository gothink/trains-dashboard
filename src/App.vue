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
  <main v-if="initialized" class="flex flex-col lg:flex-row h-screen overflow-hidden">
    <div class="flex-none h-[50vh] w-full lg:w-[50vw] lg:h-screen">
      <TrainMap v-if="showMap" />
      <button class="my-1 mx-auto px-2 rounded-sm bg-indigo-700 dark:bg-indigo-500" @click="showMap = !showMap">
        {{ showMap ? '<< Hide' : '>> Show' }} Map
      </button>
    </div>
    <div class="w-full lg:max-w-screen-lg overflow-scroll px-4">
      <ul class="flex flex-wrap justify-center text-center">
        <li class="p-4 w-1/2 border-neutral-700 dark:border-neutral-400" :class="route.name === 'trains' ? 'font-bold border-2 border-b-0' : 'border-b-2 bg-stone-200 dark:bg-stone-900 underline'">
          <RouterLink to="/">Trains</RouterLink>
        </li>
        <li class="p-4 w-1/2 border-neutral-700 dark:border-neutral-400" :class="route.name === 'stations' ? 'font-bold border-2 border-b-0' : 'border-b-2 bg-stone-200 dark:bg-stone-900 underline'">
          <RouterLink to="/stations">Stations</RouterLink>
        </li>
      </ul>
      <div class="border-neutral-700 dark:border-neutral-400 border-2 border-t-0 p-2">
        <RouterView />
      </div>
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
