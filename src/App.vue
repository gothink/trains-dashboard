<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import TrainMap from './components/TrainMap.vue';
import { useTrainsStore } from './stores/trainsStore';
import { RouterView, useRoute } from 'vue-router';

const trains = useTrainsStore();
const route = useRoute();

const initialized = ref(false);
const showMap = ref(true);

onMounted(async () => {
  await trains.getTrainData();
  initialized.value = true;
  setInterval(trains.getTrainData, 60 * 1000);
  trains.getStationData();
});
</script>

<template>
  <main v-if="initialized" class="flex flex-col lg:flex-row h-screen overflow-hidden">
    <div class="w-full lg:h-screen flex flex-col" :class="showMap ? 'flex-none h-[50vh] lg:w-[50vw]' : 'h-fit lg:w-fit'">
      <div class="flex-grow">
        <TrainMap v-if="showMap" />
      </div>
      <div class="flex-none">
        <button class="my-1 mx-auto px-2 rounded-sm bg-indigo-700 dark:bg-indigo-500" @click="showMap = !showMap">
          {{ showMap ? '<< Hide' : '>> Show' }} Map
        </button>
      </div>
    </div>
    <div class="w-full lg:max-w-screen-lg overflow-auto px-4">
      <ul class="flex flex-wrap justify-center text-center">
        <li class="p-4 w-1/2 border-neutral-700 dark:border-neutral-400" :class="route.name === 'trains' ? 'font-bold border-2 border-b-0' : 'border-b-2 bg-stone-200 dark:bg-stone-900 underline'">
          <RouterLink :to="`/${trains.trainSelected}`">Trains</RouterLink>
        </li>
        <li class="p-4 w-1/2 border-neutral-700 dark:border-neutral-400" :class="route.name === 'stations' ? 'font-bold border-2 border-b-0' : 'border-b-2 bg-stone-200 dark:bg-stone-900 underline'">
          <RouterLink :to="`/stations/${trains.stationSelected}`">Stations</RouterLink>
        </li>
      </ul>
      <div class="border-neutral-700 dark:border-neutral-400 border-2 border-t-0 p-2">
        <RouterView />
      </div>
    </div>
  </main>
</template>
