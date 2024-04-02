<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import L from 'leaflet';
import { useTrainsStore } from '@/stores/trainsStore';
import { useRouter } from 'vue-router';

const trains = useTrainsStore();
const router = useRouter();

const zoom = ref(10);
const mapElem = ref<HTMLElement>();
const leafMap = ref<L.Map>();
const markers = ref<Record<string, L.Marker>>({});
const mapBounds = ref<[[number, number], [number, number]]>([[45.5, -78.5], [44.5,-76.5]]);
const mapCenter = ref<[number, number]>([45.5,-75.5]);
const mapFollow = ref(true);

const popUpContent = (trainId: string) => {
  return `
    <div class="flex flex-col justify-center">
    <div class="mx-auto font-bold text-lg">${trainId}</div>
    <div class="mx-auto">
      <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 4V20M12 4L8 8M12 4L16 8"
          stroke="#000000"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round" 
          transform="rotate(${Math.floor(trains.trainData[trainId].direction ?? 0)}, 12, 12)"
        />
      </svg>
    </div>
    <span class="mx-auto">${trains.trainData[trainId].speed}km/h</span>
  `;
};

const getTrainCoords = (trainId: string) => {
  let lat = trains.trainData[trainId].lat;
  let lng = trains.trainData[trainId].lng;
  if (lat && lng) {
    return [lat, lng];
  }
};

const markerHover = (e: L.LeafletEvent, trainId: string) => {
  if (trainId !== trains.trainSelected) {
    if (e.type === 'mouseover') {
      e.target.openPopup();
    } else if (e.type === 'mouseout') {
      e.target.closePopup();
    }
  }
};

const updateMarker = (trainNumber: string, coords: [number, number]) => {
  if (leafMap.value) {
    if (markers.value[trainNumber]) {
      markers.value[trainNumber].setLatLng(coords);
      markers.value[trainNumber].setPopupContent(popUpContent(trainNumber));
    } else {
      markers.value[trainNumber] = L.marker(coords)
      .addTo(leafMap.value)
      .bindPopup(
        popUpContent(trainNumber),
        {
          closeButton: false,
          closeOnEscapeKey: false,
          autoClose: false,
        })
      .on('click', () => router.push(`/${trainNumber}`))
      .on('mouseover', (e) => markerHover(e, trainNumber))
      .on('mouseout', (e) => markerHover(e, trainNumber));
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
    trains.filteredTrains = filterList;
  }
};

const updateMap = (trainData = trains.trainData): Promise<void> => new Promise((resolve) => {
  let newBounds: number[][] = [[],[]];

  for (const trainId in trainData) {
    if (trainData[trainId].departed && !trainData[trainId].arrived) {
      let coords = getTrainCoords(trainId);
      if (coords) {
        // update markers
        updateMarker(trainId, [coords[0], coords[1]]);

        // update center of map
        if (trains.trainSelected === trainId) {
          mapCenter.value = [coords[0], coords[1]];
        }

        // update map bounds
        newBounds = [
          [Math.min(newBounds[0][0] ?? coords[0], coords[0]), Math.min(newBounds[0][1] ?? coords[1], coords[1])],
          [Math.max(newBounds[1][0] ?? coords[0], coords[0]), Math.max(newBounds[1][1] ?? coords[1], coords[1])],
        ];
      } else if (markers.value[trainId]) {
        delete markers.value[trainId];
      }
    }
  }

  mapBounds.value = [[newBounds[0][0], newBounds[0][1]], [newBounds[1][0], newBounds[1][1]]];

  // remove stale markers
  for (const trainId in markers.value) {
    if (!(trainId in trainData)) {
      delete markers.value[trainId];
    }
  }

  resolve();
});

watch(() => trains.trainData, async (newTrains) => {
  await updateMap(newTrains);
});

watch(() => trains.trainSelected, (newTrain, oldTrain) => {
  if (oldTrain) markers.value[oldTrain].closePopup();
  if (newTrain !== '') {
    markers.value[newTrain].openPopup();
    let coords = getTrainCoords(newTrain);
    if (coords) mapCenter.value = [coords[0], coords[1]];
  } else if (oldTrain !== '') {
    leafMap.value?.flyToBounds(L.latLngBounds(mapBounds.value));
  }
});

watch(() => mapCenter.value, (newCenter) => {
  // update map view
  if (
    leafMap.value &&
    mapFollow.value &&
    trains.trainSelected !== ''
  ) {
    if (
      leafMap.value.getBounds().contains(newCenter) &&
      leafMap.value.getZoom() >= zoom.value
    ) {
      leafMap.value.panTo(newCenter);
    } else {
      leafMap.value.flyTo(newCenter, zoom.value);
    }
  }
});

onMounted(async () => {
  if (mapElem.value) {
    const OSMBaseMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    });

    const OSMRailMap = L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', {
      maxZoom: 19,
      minZoom: 6,
      attribution: 'Data <a href="https://www.openstreetmap.org/copyright">&copy; OpenStreetMap contributors</a>, Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a> and OpenStreetMap'
    });
    
    leafMap.value = L.map(mapElem.value, {
      closePopupOnClick: false,
      layers: [OSMBaseMap, OSMRailMap],
    });

    leafMap.value.setView([63.47, -96.06], 4);

    leafMap.value.on('moveend', getTrainsInView);
    leafMap.value.on('zoomend', getTrainsInView);

    await updateMap();

    if (trains.trainSelected === '') {
      leafMap.value.fitBounds(L.latLngBounds(mapBounds.value));
    } else if (markers.value[trains.trainSelected]) {
      markers.value[trains.trainSelected].openPopup();
    }
  }
});

onUnmounted(() => {
  trains.filteredTrains = [];
});
</script>
<template>
  <div id="mapElem" ref="mapElem" class=" h-5/6"></div>
</template>
