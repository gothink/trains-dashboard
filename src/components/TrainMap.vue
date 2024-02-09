<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import L from 'leaflet';
import type { TrainInfoObject } from '@/util/types';

const props = defineProps<{
  trainData: TrainInfoObject;
  trainMap: Record<string, [number, number]>;
  trainSelected: string | undefined;
  mapBounds: [[number, number], [number, number]];
  mapCoords: [number, number];
  autoUpdate?: boolean;
}>();

const emits = defineEmits<{
  selectTrain: [train: string];
}>();

const zoom = ref(10);
const mapElem = ref<HTMLElement>();
const leafMap = ref<L.Map>();
const markers = ref<Record<string, L.Marker>>({});

const updateMarker = (trainNumber: string, coords: [number, number]) => {
  if (leafMap.value) {
    if (markers.value[trainNumber]) {
      markers.value[trainNumber].setLatLng(coords);
    } else {
      markers.value[trainNumber] = L.marker(coords)
      .addTo(leafMap.value)
      .bindPopup(`<b>${trainNumber}</b><br>Speed: ${props.trainData[trainNumber].speed}km/h<br>Dir: ${props.trainData[trainNumber].direction}`)
      .on('click', () => emits('selectTrain', trainNumber));
    }
  }
};

watch(props, (newProps, oldProps) => {
  // update markers
  for (const tnum in newProps.trainMap) {
    updateMarker(tnum, newProps.trainMap[tnum]);
  }

  // remove stale markers
  for (const trainId in oldProps.trainMap) {
    if (!(trainId in newProps.trainMap)) delete markers.value[trainId];
  }

  // update map view
  if (!newProps.autoUpdate && leafMap.value) {
    if (newProps.trainSelected) {
      markers.value[newProps.trainSelected].openPopup();
      if (
        leafMap.value.getBounds().contains(newProps.mapCoords) &&
        leafMap.value.getZoom() >= zoom.value
      ) {
        leafMap.value.panTo(newProps.mapCoords);
      } else {
        leafMap.value.flyTo(newProps.mapCoords, zoom.value);
      }
    } else {
      leafMap.value.flyToBounds(newProps.mapBounds);
    }
  }
});

onMounted(() => {
  if (props.trainMap && mapElem.value) {
    leafMap.value = L.map(mapElem.value);
    if (props.trainSelected) {
      leafMap.value.setView(props.mapCoords, zoom.value);
    } else {
      leafMap.value.fitBounds(L.latLngBounds(props.mapBounds).pad(0.1))
    }
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(leafMap.value);

    for (const train in props.trainMap) {
      updateMarker(train, props.trainMap[train]);
    }
  }
});
</script>
<template>
  <div id="mapElem" ref="mapElem"></div>
</template>

<style>
#mapElem {
  height: 50vh;
}
</style>