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

const trainData = ref<TrainInfo[]>();

const refreshData = async () => {
  const response = await fetch('/trains');
  if (response.ok) trainData.value = await response.json();
};

const sortData = async (field: 'departed' | 'from' | 'arrived' | 'to') => {
  trainData.value = trainData.value?.sort((a,b) => a[field] > b[field] ? 1 : (a[field] === b[field] ? 0 : -1));
};

const activeTrains = computed(() => {
  let atrains = trainData.value;
  return atrains?.filter(train => train.departed && !train.arrived);
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
      style="height: 480px;"
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
      <!-- <ol-overlay
        v-if="trainData"
        v-for="(activeTrain, aIdx) in activeTrains"
        :position="`[${activeTrain.lng}, ${activeTrain.lat}]`"
        :key="aIdx"
      >
        <div>CHOOCHOO</div>
      </ol-overlay> -->
    </ol-map>
    <table>
      <thead>
        <th>Train #</th>
        <th>From</th>
        <th>To</th>
        <th>Departed</th>
        <th>Arrived</th>
      </thead>
      <tbody>
        <tr v-for="(train, idx) in trainData">
          <td>{{ idx }}</td>
          <td>{{ train.from }}</td>
          <td>{{ train.to }}</td>
          <td>{{ train.departed ? '✅' : '❎' }}</td>
          <td @click="sortData('arrived')">{{ train.arrived ? '✅' : '❎' }}</td>
        </tr>
      </tbody>
    </table>
  </main>
</template>
