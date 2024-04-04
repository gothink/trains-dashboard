<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTrainsStore } from '@/stores/trainsStore';

const trains = useTrainsStore();
const router = useRouter();

const trainSearch = ref('');

const getNextStop = (trainNumber: number) => {
  let stopIndex = trains.trainData[trainNumber].times.findIndex((station) => station.eta !== 'ARR');
  if (stopIndex > -1) {
    let nextStation = trains.trainData[trainNumber].times[stopIndex];
    return [nextStation.station, nextStation.eta];
  }
};

const nextStops = computed(() => {
  let stops: Record<string, number> = {};
  for (const trainId in trains.trainData) {
    let stopIndex = trains.trainData[trainId].times.findIndex((station) => station.eta !== 'ARR');
    if (stopIndex > -1) {
      stops[trainId] = stopIndex;
    }
  }
  return stops;
});

const formatDelay = (delay: number) => {
  if (delay > 0) {
    return `${delay.toString()} mins late`;
  } else if (delay < 0) {
    return `${Math.abs(delay).toString()} mins early`;
  } else {
    return `On-time`;
  }
};

const showTrain = (trainId: string, status = trains.trainStatus) => {
  if (!filteredTrains.value.includes(trainId)) {
    return false;
  }
  if (status === 'all') {
    return true;
  }
  if (status === 'dep' && trains.filteredTrains.includes(trainId) && trains.trainData[trainId].departed && !trains.trainData[trainId].arrived) {
    return true;
  }
  if (status === 'sch' && !trains.trainData[trainId].departed && !trains.trainData[trainId].arrived) {
    return true;
  }
  if (status === 'arr' && trains.trainData[trainId].departed && trains.trainData[trainId].arrived) {
    return true;
  }
  return false;
}

const filteredTrains = computed(() => {
  if (trainSearch.value === '') return Object.keys(trains.trainData);
  
  let trainList = [];
  for (const trainId in trains.trainData) {
    if (trainId.toLowerCase().includes(trainSearch.value.toLowerCase())) {
      trainList.push(trainId);
    }
  }
  return trainList;
});

watch(trainSearch, (newSearch, oldSearch) => {

});

</script>
<template>
  <div class="flex flex-col items-center">
    <div class="">
      <select name="train-status-select" v-model="trains.trainStatus" class="my-2 p-2 bg-indigo-700 dark:bg-indigo-500 text-neutral-900 dark:text-neutral-200">
        <option value="all">All</option>
        <option value="dep">In Service</option>
        <option value="sch">Scheduled</option>
        <option value="arr">Arrived</option>
      </select>
    </div>
    <div class="my-2 border border-neutral-700 dark:border-neutral-400">
      <label for="train-search" class="p-1">Search: </label>
      <input v-model="trainSearch" type="search" name="train-search" class="bg-neutral-700 dark:bg-neutral-400 p-1">
    </div>
    <ul class="flex flex-col gap-1 overflow-scroll">
      <template v-for="(train, trainId) in trains.trainData" :key="trainId">
        <li v-if="showTrain(trainId.toString())" @click="router.push(`/${trainId}`)" class="grid grid-cols-[1fr_5fr] sm:grid-cols-[2fr_5fr_5fr] gap-1 items-center bg-stone-200 dark:bg-stone-900 p-2 border rounded-lg border-neutral-400 hover:border-neutral-700 dark:border-neutral-700 dark:hover:border-neutral-400 cursor-pointer">
          <div class="row-span-2 sm:row-auto self-stretch flex flex-col justify-center text-4xl text-center border-r border-neutral-400 dark:border-neutral-700">
            <span>{{ trainId }}</span>
          </div>
          <div class="flex items-center text-center text-lg md:text-xl lg:text-2xl">
            <div class="flex-1">
              <div>{{ train.times[0].station ?? train.from }}</div>
              <div class="hidden sm:block text-sm">{{ train.times[0].code }}</div>
            </div>
            <div class="mx-1">&rarr;</div>
            <div class="flex-1">
              <div>{{ train.times[train.times.length - 1].station ?? train.to }}</div>
              <div class="hidden sm:block text-sm">{{ train.times[train.times.length - 1].code }}</div>
            </div>
          </div>
          <div class="col-start-2 sm:col-auto">
            <div v-if="trains.trainStatus === 'dep'" class="grid grid-cols-[1fr_2fr] items-end text-center text-sm">
              <div class="text-neutral-700 dark:text-neutral-400 text-right">Next Stop:</div>
              <div class="text-left sm:text-base ml-1">{{ train.times[nextStops[trainId]]?.station }} <span class="text-neutral-400">in</span> {{ train.times[nextStops[trainId]]?.eta }}</div>
              <div class="text-neutral-700 dark:text-neutral-400 text-right">Status:</div>
              <div class="text-left sm:text-base ml-1">{{ formatDelay(train.times[nextStops[trainId.toString()]]?.diffMin) }}</div>
            </div>
            <div v-else-if="trains.trainStatus === 'all'" class="text-center">
              <span>{{ showTrain(trainId.toString(), 'dep') ? 'In Service' : showTrain(trainId.toString(), 'arr') ? 'Arrived' : 'Scheduled' }}</span>
            </div>
          </div>
        </li>
      </template>
    </ul>
  </div>
</template>