<script setup lang="ts">
import { computed, onMounted, ref, watch, watchEffect } from 'vue';
import L from 'leaflet';
import type { TrainInfoObject } from '@/util/types';

const props = defineProps<{
  trainData: TrainInfoObject;
  trainMap: string[];
  trainSelected: string | undefined;
  autoUpdate?: boolean;
}>();

const emits = defineEmits<{
  selectTrain: [train: string];
}>();

const zoom = ref(10);

const mapElem = ref<HTMLElement>();
const leafMap = ref<L.Map>();
const markers = ref<Record<string, L.Marker>>({});
const mapBounds = ref<[[number, number], [number, number]]>([[0,0], [0,0]]);

const center = computed<L.LatLng | null>(() => {
  if (props.trainSelected && props.trainMap.includes(props.trainSelected) && markers.value[props.trainSelected]) {
    return markers.value[props.trainSelected].getLatLng();
  }
  return null;
});

const updateMarker = (trainNumber: string, coords: [number, number]) => {
  if (leafMap.value) {
    if (markers.value[trainNumber]) {
      markers.value[trainNumber].setLatLng(coords);
    } else {
      markers.value[trainNumber] = L.marker(coords)
      .addTo(leafMap.value)
      .bindPopup(trainNumber)
      .on('click', () => emits('selectTrain', trainNumber));
    }
  }
};

const getMapBounds = () => {
  for (const tnum of props.trainMap) {
    let lat = props.trainData[tnum].lat;
    let lng = props.trainData[tnum].lng;
    if (lat && lng) {
      mapBounds.value = [
        [Math.max(mapBounds.value[0][0], lat), Math.min(mapBounds.value[0][1], lng)],
        [Math.min(mapBounds.value[0][0], lat), Math.max(mapBounds.value[0][1], lng)]
      ];
    }
  }  
};

watchEffect(() => {
  // update markers
  for (const tnum of props.trainMap) {
    let lat = props.trainData[tnum].lat;
    let lng = props.trainData[tnum].lng;
    if (lat && lng) {
      updateMarker(tnum, [lat, lng]);
      if (!props.trainSelected) {
        mapBounds.value = [
        [Math.max(mapBounds.value[0][0], lat), Math.min(mapBounds.value[0][1], lng)],
        [Math.min(mapBounds.value[0][0], lat), Math.max(mapBounds.value[0][1], lng)]
      ];
      }
    }
  }

  // remove stale markers
  for (const markId in markers.value) {
    if (!props.trainMap.includes(markId)) delete markers.value[markId];
  }

  // update map view
  if (props.autoUpdate && leafMap.value) {
    if (props.trainSelected && center.value) {
      leafMap.value.flyTo(center.value, zoom.value);
    } else {
      leafMap.value.flyToBounds(mapBounds.value);
    }
  }
});

onMounted(() => {
  if (props.trainMap && mapElem.value) {
    leafMap.value = L.map(mapElem.value);
    if (props.trainSelected && center.value) {
      leafMap.value.setView(center.value, zoom.value);
    } else {
      getMapBounds();
      leafMap.value.fitBounds(L.latLngBounds(mapBounds.value).pad(0.2))
    }
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(leafMap.value);

    for (const train of props.trainMap) {
      updateMarker(train as string, [props.trainData[train].lat ?? 0, props.trainData[train].lng ?? 0]);
    }
  }
});
</script>
<template>
  <div id="mapElem" ref="mapElem"></div>
</template>

<style>
#mapElem {
  height: 500px;
}
</style>