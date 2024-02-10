<script setup lang="ts">
import type { TrainInfoObject, TrainStatus } from '@/util/types';

interface Props {
  trainStatus: TrainStatus;
  trainData: TrainInfoObject;
  trainGroups: Record<string, string[]>;
  filteredTrains: string[];
}

const props = defineProps<Props>();
const emits = defineEmits<{
  selectTrain: [train: string, active: boolean];
}>();

const getNextStop = (trainNumber: string) => {
  let stopIndex = props.trainData[trainNumber].times.findIndex((station) => station.eta !== 'ARR');
  if (stopIndex > -1) {
    let nextStation = props.trainData[trainNumber].times[stopIndex];
    return `${nextStation.station} (${nextStation.eta})`;
  }
};
</script>
<template>
  <div class="relative py-2 px-4 rounded-lg border border-slate-700 dark:border-slate-500 w-full overflow-auto">
    <table class="table-auto border-collapse text-center w-full">
      <thead>
        <th class="border-b border-slate-950 dark:border-slate-50">#</th>
        <th class="border-b border-slate-950 dark:border-slate-50">From</th>
        <th class="border-b border-slate-950 dark:border-slate-50">To</th>
        <th class="border-b border-slate-950 dark:border-slate-50" v-if="props.trainStatus=='dep'">Next Stop</th>
      </thead>
      <tbody>
        <template v-for="train in trainGroups[props.trainStatus]">
          <tr
            v-if="props.trainStatus !== 'dep' ||
              !props.filteredTrains.length ||
              props.filteredTrains.includes(train)"
            @click="emits('selectTrain', train, props.trainStatus === 'dep')"
          >
            <td class="border-b border-slate-700 p-2 text-lg">{{ train }}</td>
            <td class="border-b border-slate-700 p-2">{{ trainData[train].from }}</td>
            <td class="border-b border-slate-700 p-2">{{ trainData[train].to }}</td>
            <td class="border-b border-slate-700 p-2" v-if="props.trainStatus=='dep'">{{ getNextStop(train) }}</td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>