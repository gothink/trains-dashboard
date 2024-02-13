<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTrainsStore } from '@/stores/trainsStore';

const trains = useTrainsStore();
const router = useRouter();

const trainStatus = ref('dep');

const getNextStop = (trainNumber: string) => {
  let stopIndex = trains.trainData[trainNumber].times.findIndex((station) => station.eta !== 'ARR');
  if (stopIndex > -1) {
    let nextStation = trains.trainData[trainNumber].times[stopIndex];
    return `${nextStation.station} (${nextStation.eta})`;
  }
};

const selectTrain = (trainId: string) => {
  trains.trainSelected = trainId;
  router.push(`/train/${trainId}`);
};

</script>
<template>
  <div class="py-2 px-4 rounded-lg border border-slate-700 dark:border-slate-500 w-full overflow-auto">
    <table class="table-auto border-collapse text-center w-full">
      <thead>
        <th class="border-b border-slate-950 dark:border-slate-50">#</th>
        <th class="border-b border-slate-950 dark:border-slate-50">From</th>
        <th class="border-b border-slate-950 dark:border-slate-50">To</th>
        <th class="border-b border-slate-950 dark:border-slate-50" v-if="trainStatus==='dep'">Next Stop</th>
      </thead>
      <tbody>
        <template v-for="(train, trainId) in trains.trainData">
          <tr
            v-if="(trainStatus === 'dep' &&
              (train.departed && !train.arrived) &&
              (!trains.filteredTrains.length ||
              trains.filteredTrains.includes(trainId.toString()))) ||
              (trainStatus === 'arr' &&
              (train.departed && train.arrived)) ||
              (trainStatus === 'sch' &&
              (!train.departed && !train.arrived))"
              @click="selectTrain(trainId.toString())"
          >
            <td class="border-b border-slate-700 p-2 text-lg">{{ trainId }}</td>
            <td class="border-b border-slate-700 p-2">{{ train.from }}</td>
            <td class="border-b border-slate-700 p-2">{{ train.to }}</td>
            <td class="border-b border-slate-700 p-2" v-if="trainStatus==='dep'">{{ getNextStop(trainId.toString()) }}</td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>