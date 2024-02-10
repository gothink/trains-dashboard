<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import L from 'leaflet';
import type { TrainInfoObject } from '@/util/types';

interface Props {
  trainData: TrainInfoObject;
  trainMap: Record<string, [number, number]>;
  trainSelected: string;
  mapBounds: [[number, number], [number, number]];
  mapCoords: [number, number];
  options?: {
    mapFollow?: boolean,
    mapTiles?: boolean,
    railTiles?: boolean,
  };
}

const props = withDefaults(defineProps<Props>(), {
  options: () => ({
    mapFollow: true,
    mapTiles: true,
    railTiles: true,
  })
});

const emits = defineEmits<{
  selectTrain: [train: string];
  filterTrains: [trains: string[]];
}>();

const zoom = ref(10);
const mapElem = ref<HTMLElement>();
const leafMap = ref<L.Map>();
const leafMapTiles = ref<L.TileLayer>();
const leafRailTiles = ref<L.TileLayer>();
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

const getTrainsInView = () => {
  if (leafMap.value) {
    let filterList: string[] = [];
    for (const trainId in markers.value) {
      if (leafMap.value.getBounds().contains(markers.value[trainId].getLatLng())) {
        filterList.push(trainId);
      }
    }
    emits('filterTrains', filterList);
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
  if (leafMap.value) {
    if (newProps.options.mapFollow) {
      if (newProps.trainSelected !== '') {
        if (markers.value[newProps.trainSelected]) {
          markers.value[newProps.trainSelected].openPopup();
          if (
            leafMap.value.getBounds().contains(newProps.mapCoords) &&
            leafMap.value.getZoom() >= zoom.value
          ) {
            leafMap.value.panTo(newProps.mapCoords);
          } else {
            leafMap.value.flyTo(newProps.mapCoords, zoom.value);
          }
        }
      } else {
        leafMap.value.flyToBounds(newProps.mapBounds);
        markers.value[oldProps.trainSelected]?.closePopup();
      }
    }

    // update map layers
    if (leafMapTiles.value) {
      if (!newProps.options.mapTiles && leafMap.value.hasLayer(leafMapTiles.value)) {
        leafMap.value.removeLayer(leafMapTiles.value);
      } else if (newProps.options.mapTiles && !leafMap.value.hasLayer(leafMapTiles.value)) {
        leafMap.value.addLayer(leafMapTiles.value);
      }
    }

    if (leafRailTiles.value) {
      if (!newProps.options.mapTiles && leafMap.value.hasLayer(leafRailTiles.value)) {
        leafMap.value.removeLayer(leafRailTiles.value);
      } else if (newProps.options.mapTiles && !leafMap.value.hasLayer(leafRailTiles.value)) {
        leafMap.value.addLayer(leafRailTiles.value);
      }
    }
  }
});

onMounted(() => {
  if (props.trainMap && mapElem.value) {
    leafMapTiles.value = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    });

    leafRailTiles.value = L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', {
      maxZoom: 19,
      minZoom: 6,
      attribution: 'Data <a href="https://www.openstreetmap.org/copyright">&copy; OpenStreetMap contributors</a>, Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a> and OpenStreetMap'
    });
    
    leafMap.value = L.map(mapElem.value, {
      closePopupOnClick: false,
    });

    if (props.options.mapTiles) {
      leafMap.value.addLayer(leafMapTiles.value);
    }

    if (props.options.railTiles) {
      leafMap.value.addLayer(leafRailTiles.value);
    }

    leafMap.value.on('moveend', getTrainsInView);
    leafMap.value.on('zoomend', getTrainsInView);

    if (props.trainSelected !== '') {
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
  <div id="mapElem" ref="mapElem" class="h-full"></div>
</template>
