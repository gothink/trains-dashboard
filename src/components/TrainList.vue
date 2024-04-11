<script setup lang="ts">
import { computed, ref, shallowReactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTrainsStore } from '@/stores/trainsStore';
import { useUserStore } from '@/stores/userStore';

const trains = useTrainsStore();
const router = useRouter();
const user = useUserStore();

const trainSearch = ref('');

const trainList = shallowReactive<{
  'departed': typeof trains.trainData,
  'arrived': typeof trains.trainData,
  'scheduled': typeof trains.trainData,
}>({
  arrived: {},
  departed: {},
  scheduled: {},
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

const filteredTrains = computed(() => {
  let trainFilt: typeof trains.trainData;

  // filter by train status
  if (trains.trainStatus === 'departed') {
    if (user.settings.showInactiveTrains) trainFilt = { ...trainList.departed };
    else trainFilt = { ...trains.trainsActive };
  } else if (trains.trainStatus === 'arrived') {
    trainFilt = { ...trainList.arrived };
  } else if (trains.trainStatus === 'scheduled') {
    trainFilt = { ...trainList.scheduled };
  } else {
    trainFilt = { ...trainList.arrived, ...trainList.departed, ...trainList.scheduled };
  }

  Object.keys(trainFilt).forEach((trainId) => {
    // check if train is in map view
    if (trains.trainStatus === 'departed' && user.settings.showMap && user.settings.filterMap) {
      if (!(trains.trainsInView.includes(trainId))) {
        delete trainFilt[trainId];
      }
    }

    // check if train matches search criteria
    if (trainSearch.value !== '' && !trainId.toLowerCase().includes(trainSearch.value.toLowerCase())) {
      delete trainFilt[trainId];
    }
  });

  return trainFilt;
});

watch(() => trains.trainData, (newTrains) => {
  Object.entries(newTrains).forEach(([trainId, train]) => {
    if (train.departed) {
      if (train.arrived) {
        trainList.arrived[trainId] = train;
      } else {
        trainList.departed[trainId] = train;
      }
    } else {
      trainList.scheduled[trainId] = train;
    }
  });
}, { immediate: true });

</script>
<template>
  <div class="flex flex-col items-center">
    <div class="">
      <select name="train-status-select" v-model="trains.trainStatus" class="my-2 p-2 bg-indigo-700 dark:bg-indigo-500 text-neutral-900 dark:text-neutral-200">
        <!-- <option value="all">All</option> -->
        <option value="departed">In Service</option>
        <option value="scheduled">Scheduled</option>
        <option value="arrived">Arrived</option>
      </select>
    </div>
    <div class="my-2 border border-neutral-700 dark:border-neutral-400">
      <label for="train-search" class="p-1">Search: </label>
      <input v-model="trainSearch" type="search" name="train-search" id="train-search" class="bg-neutral-700 dark:bg-neutral-400 p-1">
    </div>
    <ul class="flex flex-col gap-1 overflow-auto">
      <template v-for="(train, trainId) in filteredTrains" :key="trainId">
        <li @click="router.push(`/${trainId}`)" class="grid grid-cols-[1fr_5fr] sm:grid-cols-[2fr_5fr_5fr] gap-1 items-center bg-stone-200 dark:bg-stone-900 p-2 border rounded-lg border-neutral-400 hover:border-neutral-700 dark:border-neutral-700 dark:hover:border-neutral-400 cursor-pointer">
          <div class="row-span-2 sm:row-auto self-stretch flex flex-col justify-center text-4xl text-center border-r border-neutral-400 dark:border-neutral-700">
            <span>{{ trainId.toString().split(' ')[0] }} <span class="text-xl">{{ trainId.toString().split(' ')[1] ?? '' }}</span></span>
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
            <div v-if="trains.trainStatus === 'departed'" class="grid grid-cols-[1fr_2fr] items-end text-center text-sm">
              <div class="text-neutral-700 dark:text-neutral-400 text-right">Next Stop:</div>
              <div class="text-left sm:text-base ml-1">{{ train.times[train.next ?? 0]?.station }} <span class="text-neutral-400">in</span> {{ train.times[train.next ?? 0]?.eta }}</div>
              <div class="text-neutral-700 dark:text-neutral-400 text-right">Status:</div>
              <div class="text-left sm:text-base ml-1">{{ formatDelay(train.times[train.next ?? 0]?.diffMin) }}</div>
            </div>
            <div v-else-if="trains.trainStatus === 'all'" class="text-center">
              <span>{{ (trainId in trainList.departed) ? 'In Service' : (trainId in trainList.arrived) ? 'Arrived' : 'Scheduled' }}</span>
            </div>
          </div>
        </li>
      </template>
    </ul>
  </div>
</template>