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
  <div class="py-2 px-4 overflow-hidden bg-slate-50 dark:bg-slate-900">
    <div class="w-full text-center">
      <select v-model="trains.trainStatus" class="my-2 p-2 bg-teal-100 dark:bg-teal-800 text-slate-700 dark:text-slate-200">
        <option value="dep">In Service</option>
        <option value="sch">Scheduled</option>
        <option value="arr">Arrived</option>
      </select>
    </div>
    <div class="w-fit sm:mx-auto overflow-auto">
      <table class="table-auto border-separate sm:border-collapse border-spacing-y-2 border-spacing-x-1 sm:border-spacing-0 text-center w-full">
        <thead class="border-b border-slate-950 dark:border-slate-50">
          <th class="text-right">#</th>
          <th>From &rarr; To</th>
          <th class="text-left" v-if="trains.trainStatus==='dep'">Next Stop</th>
        </thead>
        <tbody>
          <template v-for="(train, trainId) in trains.trainData">
            <tr
              class="cursor-pointer outline outline-1 outline-offset-0 outline-slate-600 dark:outline-slate-400 rounded-md sm:outline-0 sm:border-0 sm:border-b border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800"
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
              <td class="p-2 text-lg font-bold text-right">{{ trainId }}</td>
              <td class="p-2">
                <div class="flex flex-col sm:flex-row justify-center">
                  <div>
                    {{ train.from }}
                  </div>
                  <div class="text-slate-600 dark:text-slate-400 hidden sm:block">&nbsp; &rarr; &nbsp;</div>
                  <div class="text-slate-600 dark:text-slate-400 sm:hidden">&darr;</div>
                  <div>
                    {{ train.to }}
                  </div>
                </div>
              </td>
              <td class="p-2 text-left" v-if="trains.trainStatus==='dep'">{{ getNextStop(trainId.toString()) }}</td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>