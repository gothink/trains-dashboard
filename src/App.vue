<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type BaseEvent from 'ol/events/Event';

const initialized = ref(false);
const initCoords = [-76.54, 44.26];
const initZoom = 8;
const initRotation = 0;

const center = ref(initCoords);
const zoom = ref(initZoom);
const rotation = ref(initRotation);
const resolution = ref(0);

const groupByStatus = ref(true);

interface TrainTimes {
  station: string;
  code: string;
  estimated: string;
  scheduled: string;
  eta: string;
  diff: string;
  diffMin: number;
  arrival?: {
    estimated: string;
    scheduled: string;
  };
  departure?: {
    estimated: string;
    scheduled: string;
  };
}
interface TrainInfo {
  departed: boolean;
  arrived: boolean;
  from: string;
  to: string;
  instance: string;
  times: TrainTimes[];
	lat?: number;
  lng?: number;
  speed?: number;
  direction?: number;
  poll?: string;
  pollMin?: number;
  number?: string;
  status?: 'arr' | 'dep' | 'sch';
}
interface TrainInfoObject {
  [index: string]: TrainInfo;
}

function resolutionChanged(event: BaseEvent) {
  resolution.value = event.target.getResolution();
  zoom.value = event.target.getZoom();
}
function centerChanged(event: BaseEvent) {
  center.value = event.target.getCenter();
}
function rotationChanged(event: BaseEvent) {
  rotation.value = event.target.getRotation();
}

const trainData = ref<TrainInfoObject>();

const refreshData = async () => {
  const response = await fetch('/trains');
  if (response.ok) trainData.value = await response.json();
};

const trainArray = computed(() => {
  let arrived: TrainInfo[] = [];
  let departed: TrainInfo[] = [];
  let scheduled: TrainInfo[] = [];
  for (const tnum in trainData.value) {
    if (trainData.value[tnum].departed) {
      if (trainData.value[tnum].arrived) {
        arrived.push({number: tnum, status: 'arr', ...trainData.value[tnum]});
      } else {
        departed.push({number: tnum, status: 'dep', ...trainData.value[tnum]});
      }
    } else {
      scheduled.push({number: tnum, status: 'sch', ...trainData.value[tnum]});
    }
  }
  return groupByStatus.value ? [departed, scheduled, arrived] : [[...departed, ...scheduled, ...arrived]];
});

onMounted(async () => {
  await refreshData();
  if (trainData.value) initialized.value = true;
  setInterval(refreshData, 60 * 1000);
});
</script>

<template>
  <main>
    <ol-map
      v-if="initialized"
      :loadTilesWhileAnimating="true"
      :loadTilesWhileInteracting="true"
      style="height: 280px; width: 280px;"
    >
      <ol-view
        ref="view"
        :center="initCoords"
        :rotation="0"
        :zoom="initZoom"
        :projection="'EPSG:4326'"
        @change:center="centerChanged"
        @change:resolution="resolutionChanged"
        @change:rotation="rotationChanged"

      />
      <ol-tile-layer>
        <ol-source-osm />
      </ol-tile-layer>
      <ol-overlay
        v-for="activeTrain in trainArray[0]"
        :position="`[${activeTrain.lng ?? 0}, ${activeTrain.lat ?? 0}]`"
        :key="activeTrain.number"
      >
        <div>CHOOCHOO</div>
      </ol-overlay>
    </ol-map>
    <input type="checkbox" v-model="groupByStatus">
    <table>
      <thead>
        <th>Train #</th>
        <th>From</th>
        <th>To</th>
        <th>Status</th>
      </thead>
      <tbody v-for="trainSet in trainArray">
        <tr v-for="train in trainSet">
          <td>{{ train.number }}</td>
          <td>{{ train.from }}</td>
          <td>{{ train.to }}</td>
          <td>{{ train.status }}</td>
        </tr>
      </tbody>
    </table>
  </main>
</template>
