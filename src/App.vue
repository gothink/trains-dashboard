<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type BaseEvent from 'ol/events/Event';

const initCoords = [-76.54, 44.26];
const initZoom = 8;
const initRotation = 0;

const center = ref(initCoords);
const zoom = ref(initZoom);
const rotation = ref(initRotation);
const resolution = ref(0);

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

const trainData = ref({});

const refreshData = async () => {
  const response = await fetch('/trains');
  if (response.ok) trainData.value = await response.json();
};
onMounted(() => {
  refreshData();
  setInterval(refreshData, 60 * 1000);
});
</script>

<template>
  <main>
    <ol-map
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
    </ol-map>
  </main>
</template>
