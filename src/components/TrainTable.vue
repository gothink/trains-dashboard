<script setup lang="ts">
import type { TrainInfoObject, TrainStatus } from '@/util/types';

interface Props {
  trainStatus: TrainStatus;
  trainData: TrainInfoObject;
  trainGroups: Record<string, string[]>;
  trainSelected: string;
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
  <table>
      <thead>
        <th>#</th>
        <th>From</th>
        <th>To</th>
        <th v-if="props.trainStatus=='dep'">Next Stop</th>
      </thead>
      <tbody>
        <template v-for="train in trainGroups[props.trainStatus]">
          <tr
            v-if="props.trainStatus !== 'dep' ||
              !props.filteredTrains.length ||
              props.filteredTrains.includes(train)"
            @click="emits('selectTrain', train, props.trainStatus === 'dep')"
          >
            <td>{{ train }}</td>
            <td>{{ trainData[train].from }}</td>
            <td>{{ trainData[train].to }}</td>
            <td v-if="props.trainStatus=='dep'">{{ getNextStop(train) }}</td>
          </tr>
        </template>
      </tbody>
    </table>
</template>