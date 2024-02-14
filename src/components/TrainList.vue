<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTrainsStore } from '@/stores/trainsStore';

const trains = useTrainsStore();
const router = useRouter();

const getNextStop = (trainNumber: string) => {
  let stopIndex = trains.trainData[trainNumber].times.findIndex((station) => station.eta !== 'ARR');
  if (stopIndex > -1) {
    let nextStation = trains.trainData[trainNumber].times[stopIndex];
    return `${nextStation.station} (${nextStation.eta})`;
  }
};

</script>
<template>
  <div class="overflow-hidden">
    <select v-model="trains.trainStatus" class="my-2 mx-auto p-2 bg-teal-100 dark:bg-teal-800 text-slate-700 dark:text-slate-200">
      <option value="dep">In Service</option>
      <option value="sch">Scheduled</option>
      <option value="arr">Arrived</option>
    </select>
    <div class="py-2 px-4 rounded-lg border border-slate-700 dark:border-slate-500 w-full overflow-auto">
      <table class="table-auto border-collapse text-center w-full">
        <thead>
          <th class="border-b border-slate-950 dark:border-slate-50">#</th>
          <th class="border-b border-slate-950 dark:border-slate-50">From</th>
          <th class="border-b border-slate-950 dark:border-slate-50">To</th>
          <th class="border-b border-slate-950 dark:border-slate-50" v-if="trains.trainStatus==='dep'">Next Stop</th>
        </thead>
        <tbody>
          <template v-for="(train, trainId) in trains.trainData">
            <tr
              v-if="(trains.trainStatus === 'dep' &&
                (train.departed && !train.arrived) &&
                (!trains.filteredTrains.length ||
                trains.filteredTrains.includes(trainId.toString()))) ||
                (trains.trainStatus === 'arr' &&
                (train.departed && train.arrived)) ||
                (trains.trainStatus === 'sch' &&
                (!train.departed && !train.arrived))"
                @click="router.push(`/${trainId}`)"
            >
              <td class="border-b border-slate-700 p-2 text-lg">{{ trainId }}</td>
              <td class="border-b border-slate-700 p-2">{{ train.from }}</td>
              <td class="border-b border-slate-700 p-2">{{ train.to }}</td>
              <td class="border-b border-slate-700 p-2" v-if="trains.trainStatus==='dep'">{{ getNextStop(trainId.toString()) }}</td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>