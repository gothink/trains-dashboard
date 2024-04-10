<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, toRaw, watch } from 'vue';
import L from 'leaflet';
import { useTrainsStore } from '@/stores/trainsStore';
import { useRouter } from 'vue-router';
import type { MapBoundary, MapCoord } from '@/util/types';

const props = defineProps<{
  mapElement: string
}>();

const trains = useTrainsStore();
const router = useRouter();

const TRAIN_ZOOM = 10;

let trainMarkers: Record<string, L.Marker> = {};
let stationMarkers: Record<string, L.Tooltip> = {};
const mapFollow = ref(true);
const activeTrain = computed(() => {
  if (trains.trainSelected !== '') {
    return { id: trains.trainSelected, ...trains.trainList.active[trains.trainSelected] };
  }
});
const stationList = computed(() => activeTrain.value?.times.map((s) => s.code));

const OSMBaseMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
});

const OSMRailMap = L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', {
  maxZoom: 19,
  minZoom: 6,
  attribution: 'Data <a href="https://www.openstreetmap.org/copyright">&copy; OpenStreetMap contributors</a>, Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a> and OpenStreetMap'
});

const leafMap = L.map(props.mapElement, {
  closePopupOnClick: false,
  layers: [OSMBaseMap, OSMRailMap],
}).setView([62.4, -96.46], 3);

leafMap.on('moveend', () => filterTrainsInView());
leafMap.on('resize', () => { updateMapView(true) });

// updateMap(true);

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
          transform="rotate(${Math.floor(trains.trainList.active[trainId].direction ?? 0)}, 12, 12)"
        />
      </svg>
    </div>
    <span class="mx-auto">${trains.trainList.active[trainId].speed}km/h</span>
  `;
};

const stationMarkerContent = (stationCode: string) => {
  return `
    <div class="flex">
      <div class="flex-none">
        <img src="/station-sign.svg" width="24px">
      </div>
      <div class="flex-1">
        <p>${stationCode}</p>
        <p>ETA: ${trains.trainList.active[trains.trainSelected].times.find(s => s.code === stationCode)?.eta}</p>
    </div>
  `;
};

const trainDivIcon = (trainId: string) => {
  let dir = trains.trainList.active[trainId].direction;
  dir = dir ? Math.floor(dir) : dir;
  return `
<svg height="36px" width="36px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 498.923 498.923" xml:space="preserve">
  <path
   style="fill:#000000"
   d="M 249.462,0 C 151.018,0 70.951,80.106 70.951,178.511 c 0,92.436 133.617,192.453 172.248,315.948 0.83,2.667 3.322,4.484 6.116,4.465 2.804,-0.039 5.256,-1.876 6.048,-4.563 C 292.841,367.828 427.963,271.054 427.972,178.492 427.963,80.106 347.886,0 249.462,0 Z m 0,313.925 c -77.184,0 -139.987,-62.812 -139.987,-139.987 0,-77.184 62.803,-139.987 139.987,-139.987 77.165,0 139.977,62.803 139.977,139.987 0,77.175 -62.813,139.987 -139.977,139.987 z"
   id="path2" />

		<path
   style="fill:#ffffff;fill-opacity:1;stroke:#000000;stroke-width:51.447;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
   d="m 376.68238,501.57329 c -11.54516,-1.21568 -33.58177,-6.07169 -45.972,-10.13042 C 258.3208,467.72979 201.68316,407.13403 182.9976,333.40719 175.60111,304.22318 174.48828,263.79635 180.32036,236.14841 193.62818,173.06042 229.933,121.17618 284.2767,87.581462 338.02695,54.353615 408.37544,46.219652 469.40788,66.175886 c 16.53369,5.406141 45.48375,20.06793 60.00091,30.38752 15.7135,11.170004 41.89968,37.382424 52.90151,52.954474 29.6839,42.01479 43.99737,92.80772 40.68752,144.38421 -6.74522,105.10888 -87.50232,191.67802 -192.76946,206.64301 -11.80217,1.67782 -41.88976,2.25557 -53.54598,1.02819 z"
   id="path2998"
   transform="scale(0.62365375)" />
   
   <path
   style="${dir ? 'display:none;' : ''}fill:#000000;fill-opacity:1;stroke:#000000;stroke-width:8.02128;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
   d="m 245.78415,208.65137 c -1.80005,-0.18954 -5.23585,-0.94666 -7.16766,-1.57947 -11.28651,-3.69718 -20.11707,-13.14488 -23.0304,-24.63988 -1.15322,-4.55018 -1.32672,-10.85327 -0.41742,-15.16395 2.07487,-9.83627 7.73527,-17.92572 16.20819,-23.16359 8.38038,-5.18066 19.34866,-6.44886 28.86444,-3.33741 2.57782,0.84289 7.09152,3.12886 9.35494,4.73782 2.44995,1.74155 6.53273,5.82842 8.24806,8.25631 4.62812,6.55067 6.85978,14.46997 6.34373,22.51144 -1.05167,16.38789 -13.64279,29.88518 -30.05535,32.21842 -1.84011,0.2616 -6.53117,0.35168 -8.34853,0.16031 z"
   id="path3273" />
   
   <path
   id="path1004"
   d="M 248.75885,67.153381 V 267.15338 m 0,-199.999999 -50,49.999999 m 50,-49.999999 50,49.999999"
   style="${dir ? '' : 'display:none;'}fill:#010002;stroke:#000000;stroke-width:25;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1"
   ${dir ? 'transform="rotate(' + dir + ', 250, 170)"' : ''} />
</svg>
  `;
};

// -- Trains markers, icons and overlays --

const markerHover = (e: L.LeafletEvent, trainId: string) => {
  if (trainId !== trains.trainSelected) {
    if (e.type === 'mouseover') {
      e.target.openPopup();
    } else if (e.type === 'mouseout') {
      e.target.closePopup();
    }
  }
};

const filterTrainsInView = () => {
  let filterList: string[] = [];
  for (const trainId in trainMarkers) {
    if (leafMap.getBounds().contains([trains.trainList.active[trainId].lat, trains.trainList.active[trainId].lng])) {
      filterList.push(trainId);
    }
  }
  trains.filteredTrains = filterList;
};

const updateMarkers = () => {
  // add or update markers
  Object.entries(trains.trainList.active).forEach(([trainId, train]) => {
    if (trainMarkers[trainId]) {
      trainMarkers[trainId].setLatLng([train.lat, train.lng]);
      trainMarkers[trainId].setPopupContent(popUpContent(trainId));
      trainMarkers[trainId].setIcon(L.divIcon({html: trainDivIcon(trainId), className: '', iconAnchor: [18,36], popupAnchor: [0,-36]}));
    } else {
      trainMarkers[trainId] = L.marker([train.lat, train.lng], {icon: L.divIcon({html: trainDivIcon(trainId), className: '', iconAnchor: [18,36], popupAnchor: [0,-36]})})
      .addTo(leafMap)
      .bindPopup(
        popUpContent(trainId),
        {
          closeButton: false,
          closeOnEscapeKey: false,
          autoClose: false,
        })
      .on('click', () => router.push(`/${trainId}`))
      .on('mouseover', (e) => markerHover(e, trainId))
      .on('mouseout', (e) => markerHover(e, trainId));
    }
  });

  // remove stale markers
  for (const trainId in trainMarkers) {
    if (!(trainId in trains.trainList.active)) {
      trainMarkers[trainId].remove();
      delete trainMarkers[trainId];
    }
  }

};

// -- Station markers, icons and overlays --

const updateStationMarkers = () => {
  if (stationList.value) {
    stationList.value.forEach((stationCode) => {
      if (stationMarkers[stationCode]) {
        stationMarkers[stationCode].setContent(`<p>${stationCode}</p><p>ETA: ${activeTrain.value?.times.find(s => s.code === stationCode)?.eta}</p>`);
      } else {
        if (trains.stationData[stationCode] && trains.stationData[stationCode].coords) {
          stationMarkers[stationCode] = L.tooltip({ permanent: true, direction: 'bottom', offset: [0,4], className: 'custom-tooltip' })
            .setLatLng(trains.stationData[stationCode].coords as [number, number])       
            .setContent(stationMarkerContent(stationCode))   
            .addTo(leafMap);
        } else {
          stationMarkers[stationCode].remove();
          delete stationMarkers[stationCode];
        }
      }
    });

    // clean up stale markers
    for (const statMarker in stationMarkers.value) {
      if (!(statMarker in stationList.value)) {
        stationMarkers[statMarker].remove();
        delete stationMarkers[statMarker]
      }
    }
  } else {
    // clean up all markers
    for (const statMarker in stationMarkers.value) {
      stationMarkers[statMarker].remove();
    }
    stationMarkers = {};
  }
};


// -- Leaflet map coordinates, boundaries, movement --

const updateMapView = (reset?: boolean) => {
  if (mapFollow.value) {
    // stash current boundary to compare for triggering filter update
    const currentBounds = leafMap.getBounds();

    if (activeTrain.value) {
      if (reset) trainMarkers[trains.trainSelected]?.openPopup();

      let center: MapCoord = [activeTrain.value.lat, activeTrain.value.lng];
      if (leafMap.getBounds().contains(center) && leafMap.getZoom() >= TRAIN_ZOOM) {
        leafMap.panTo(center);
      } else {
        leafMap.flyTo(center, TRAIN_ZOOM);
      }
    } else if (reset && trains.mapBounds) {
      leafMap.flyToBounds(L.latLngBounds(trains.mapBounds));
    }

    // boundary hasn't changed, check if trains have entered/left boundary
    if (leafMap.getBounds().equals(currentBounds)) {
      filterTrainsInView();
    }
  }
};

// -- Train store watchers

watch(() => trains.trainList.active, () => {
  updateMapView();
  updateMarkers();
  updateStationMarkers();
});

watch(() => trains.trainSelected, (_newTrain, oldTrain) => {
  if (oldTrain) trainMarkers[oldTrain]?.closePopup();
  updateMapView(true);
  updateStationMarkers();
});

// -- Setup and cleanup --

onMounted(() => {
  // initialize map view
  if (activeTrain.value) {
    leafMap.setView([activeTrain.value.lat, activeTrain.value.lng], TRAIN_ZOOM);
    // TODO: get boundary for train's station stops if no coords avail
  } else if (trains.mapBounds) {
    leafMap.fitBounds(trains.mapBounds);
  }

  // update train markers
  updateMarkers();
  // update station markers
});

onUnmounted(() => {
  leafMap.remove();
});
</script>
<template>
</template>
<style>
.custom-tooltip {
  @apply bg-stone-50 dark:bg-stone-950 text-neutral-900 dark:text-neutral-200;
}
</style>