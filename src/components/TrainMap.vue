<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import L from 'leaflet';
import type { TrainInfoObject } from '@/util/types';

interface Props {
  trainData: TrainInfoObject;
  trainMap: Record<string, [number, number]>;
  mapBounds: [[number, number], [number, number]];
  mapCoords: [number, number];
  options?: {
    autoRefresh?: boolean,
    mapTiles?: boolean,
    railTiles?: boolean,
  };
}

const trainSelected = defineModel<string>();

const props = withDefaults(defineProps<Props>(), {
  options: () => ({
    autoRefresh: true,
    mapTiles: true,
    railTiles: true,
  })
});

// const emits = defineEmits<{
//   selectTrain: [train: string];
// }>();

const zoom = ref(10);
const mapElem = ref<HTMLElement>();
const leafMap = ref<L.Map>();
// const leafMapTiles = ref<L.TileLayer>();
// const leafRailTiles = ref<L.TileLayer>();
const markers = ref<Record<string, L.Marker>>({});

const updateMarker = (trainNumber: string, coords: [number, number]) => {
  if (leafMap.value) {
    if (markers.value[trainNumber]) {
      markers.value[trainNumber].setLatLng(coords);
    } else {
      markers.value[trainNumber] = L.marker(coords)
      .addTo(leafMap.value)
      .bindPopup(`<b>${trainNumber}</b><br>Speed: ${props.trainData[trainNumber].speed}km/h<br>Dir: ${props.trainData[trainNumber].direction}`)
      .on('click', () => trainSelected.value = trainNumber);
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

  // update map
  if (leafMap.value) {
    // update view
    if (newProps.options.autoRefresh) {
      if (trainSelected.value) {
        markers.value[trainSelected.value].openPopup();
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
  }
});

onMounted(() => {
  if (props.trainMap && mapElem.value) {
    const leafMapTiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    });

    const leafRailTiles = L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', {
      maxZoom: 19,
      minZoom: 12,
      attribution: 'Data <a href="https://www.openstreetmap.org/copyright">&copy; OpenStreetMap contributors</a>, Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a> and OpenStreetMap'
    });
    
    leafMap.value = L.map(mapElem.value, {
      closePopupOnClick: false,
      layers: [leafMapTiles, leafRailTiles],
    });

    if (trainSelected.value) {
      leafMap.value.setView(props.mapCoords, zoom.value);
    } else {
      leafMap.value.fitBounds(L.latLngBounds(props.mapBounds));
    }

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
  position: sticky;
  top: 0;
  height: 50vh;
}
</style>