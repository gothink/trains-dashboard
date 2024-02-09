<script setup lang="ts">
import type { TrainInfoObject } from '@/util/types';

const props = defineProps<{
  trainData: TrainInfoObject;
  trainGroups: Record<string, string[]>;
}>();

const trainSelected = defineModel<string>();

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
        <th colspan="4">VIA Rail Trains</th>
      </thead>
      <tbody>
        <tr>
          <th colspan="3">In Transit</th>
        </tr>
        <tr>
          <th>#</th>
          <th>From</th>
          <th>To</th>
          <th>Next Stop</th>
        </tr>
        <tr v-for="train in trainGroups['dep']" @click="trainSelected = train">
          <td>{{ train }}</td>
          <td>{{ trainData[train].from }}</td>
          <td>{{ trainData[train].to }}</td>
          <td>{{ getNextStop(train) }}</td>
        </tr>
      </tbody>
      <tbody>
        <tr>
          <th colspan="3">Scheduled to Depart</th>
        </tr>
        <tr>
          <th>Train #</th>
          <th>From</th>
          <th>Destination</th>
        </tr>
        <tr v-for="train in trainGroups['sch']" @click="trainSelected = train">
          <td>{{ train }}</td>
          <td>{{ trainData[train].from }}</td>
          <td>{{ trainData[train].to }}</td>
        </tr>
      </tbody>
      <tbody>
        <tr>
          <th colspan="3">Arrived</th>
        </tr>
        <tr>
          <th>Train #</th>
          <th>From</th>
          <th>Destination</th>
        </tr>
        <tr v-for="train in trainGroups['arr']" @click="trainSelected = train">
          <td>{{ train }}</td>
          <td>{{ trainData[train].from }}</td>
          <td>{{ trainData[train].to }}</td>
        </tr>
      </tbody>
    </table>
</template>