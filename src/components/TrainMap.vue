<script setup lang="ts">
import { onMounted, onUnmounted, ref, toRaw, watch } from 'vue';
import L from 'leaflet';
import { useTrainsStore } from '@/stores/trainsStore';
import { useRouter } from 'vue-router';

const trains = useTrainsStore();
const router = useRouter();

const TRAIN_ZOOM = 10;

type MapCoord = [number, number];
type MapBoundary = [MapCoord, MapCoord];

// const zoom = ref(10);
const mapElem = ref<HTMLElement>();
const leafMap = ref<L.Map>();
const trainMarkers = ref<Record<string, L.Marker>>({});
const stationMarkers = ref<Record<string, L.Tooltip>>({});
const mapBounds = ref<[MapCoord, MapCoord]>();
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

const stationMarkerContent = (stationCode: string) => {
  return `
    <div class="flex">
      <div class="flex-none">
        <img src="/station-sign.svg" width="24px">
      </div>
      <div class="flex-1">
        <p>${stationCode}</p>
        <p>ETA: ${trains.trainData[trains.trainSelected].times.find(s => s.code === stationCode)?.eta}</p>
    </div>
  `;
};

const trainDivIcon = (trainId: string) => {
  let dir = trains.trainData[trainId].direction;
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

// -- Utility functions --

const getTrainCoords = (trainId: string): [number, number] | undefined => {
  let lat = trains.trainData[trainId].lat;
  let lng = trains.trainData[trainId].lng;
  if (lat && lng) {
    return [lat, lng];
  }
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
  console.log('filtering...');
  if (leafMap.value) {
    let filterList: string[] = [];
    let currentBounds = leafMap.value.getBounds();
    let currentCoord: MapCoord | undefined;
    for (const trainId in trainMarkers.value) {
      currentCoord = getTrainCoords(trainId);
      if (currentCoord && currentBounds.contains(currentCoord)) {
        filterList.push(trainId);
      }
    }
    trains.filteredTrains = filterList;
  }
};

const updateMarker = (trainNumber: string, coords: [number, number]) => {
  if (leafMap.value) {
    if (trainMarkers.value[trainNumber]) {
      trainMarkers.value[trainNumber].setLatLng(coords);
      trainMarkers.value[trainNumber].setPopupContent(popUpContent(trainNumber));
      trainMarkers.value[trainNumber].setIcon(L.divIcon({html: trainDivIcon(trainNumber), className: '', iconAnchor: [18,36], popupAnchor: [0,-36]}));
    } else {
      trainMarkers.value[trainNumber] = L.marker(coords, {icon: L.divIcon({html: trainDivIcon(trainNumber), className: '', iconAnchor: [18,36], popupAnchor: [0,-36]})})
      .addTo(toRaw(leafMap.value))
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

// -- Station markers, icons and overlays --

const handleStationMarkers = (stationList: string[], cleanUp = true) => {
  if (leafMap.value) {
    if (cleanUp) {
      // clean up old markers
      for (const statMarker in stationMarkers.value) {
        toRaw(stationMarkers.value[statMarker]).remove();
      }
      stationMarkers.value = {};
    }

    if (stationList.length) {
      for (const stationCode of stationList) {
        if (trains.stationData[stationCode] && trains.stationData[stationCode].coords) {
          stationMarkers.value[stationCode] = L.tooltip({ permanent: true, direction: 'bottom', offset: [0,4], className: 'custom-tooltip' })
            .setLatLng(trains.stationData[stationCode].coords as [number, number])       
            .setContent(stationMarkerContent(stationCode))   
            .addTo(toRaw(leafMap.value));
        }
      }
    }
  }
};

const updateStationMarkers = (stationList: string[]) => {
  if (leafMap.value) {
    if (stationList.length) {
      let newStations: string[] = [];
      for (const stationCode of stationList) {
        if (stationMarkers.value[stationCode]) {
          stationMarkers.value[stationCode].setContent(`<p>${stationCode}</p><p>ETA: ${trains.trainData[trains.trainSelected].times.find(s => s.code === stationCode)?.eta}</p>`);
        } else {
          newStations.push(stationCode);
        }
      }
      if (newStations.length) handleStationMarkers(newStations, false);
    }
  }
};

// -- Leaflet map coordinates, boundaries, movement --

const initMapView = (newBounds?: MapBoundary) => {
  if (leafMap.value) {
    if (trains.trainSelected !== '') {
      let center = getTrainCoords(trains.trainSelected);
      if (center) leafMap.value.setView(center, TRAIN_ZOOM);
      // TODO: get boundary for train's station stops if no coords avail
      else leafMap.value.setView([62.4, -96.46], 6);
    } else if (newBounds) {
      leafMap.value.fitBounds(newBounds);
    }
    else {
      leafMap.value.setView([62.4, -96.46], 6);
    }
  }
};

const updateMapView = ({ center, reset }: { center?: MapCoord, reset?: boolean } = {}) => {
  if (leafMap.value && mapFollow.value) {
    // stash current boundary to compare for triggering filter update
    const currentBounds = leafMap.value.getBounds();

    if (trains.trainSelected !== '') {
      center ??= getTrainCoords(trains.trainSelected);
      if (center) {
        if (leafMap.value.getBounds().contains(center) && leafMap.value.getZoom() >= TRAIN_ZOOM) {
          leafMap.value.panTo(center);
        } else {
          leafMap.value.flyTo(center, TRAIN_ZOOM);
        }
      }
    } else if (reset && mapBounds.value) {
      leafMap.value.flyToBounds(L.latLngBounds(mapBounds.value));
    }

    // boundary hasn't changed, trigger event
    if (leafMap.value.getBounds().equals(currentBounds)) {
      filterTrainsInView();
    }
  }
};

const updateMap = (initMap?: boolean, trainData = trains.trainData) => {
  let newBounds: MapBoundary | undefined;

  for (const trainId in trainData) {
    if (trainData[trainId].departed && !trainData[trainId].arrived) {
      let coords = getTrainCoords(trainId);
      if (coords) {
        // update markers
        updateMarker(trainId, coords);

        // update map bounds
        if (!newBounds) {
          newBounds = [coords, coords];
        } else {
          newBounds = [
            [Math.min(newBounds[0][0], coords[0]), Math.min(newBounds[0][1], coords[1])],
            [Math.max(newBounds[1][0], coords[0]), Math.max(newBounds[1][1], coords[1])],
          ];
        }
      } else if (trainMarkers.value[trainId]) {
        trainMarkers.value[trainId].remove();
        delete trainMarkers.value[trainId];
      }
    }
  }

  if (newBounds) mapBounds.value = newBounds;
  
  if (initMap) initMapView(newBounds);
  else updateMapView();

  // remove stale markers
  for (const trainId in trainMarkers.value) {
    if (!(trainId in trainData)) {
      trainMarkers.value[trainId].remove();
      delete trainMarkers.value[trainId];
    }
  }
};

// -- Train store watchers

watch(() => trains.trainData, (newTrains) => {
  updateMap(false, newTrains);
  // update station marker content
  if (trains.trainSelected !== '') {
    updateStationMarkers(trains.trainData[trains.trainSelected].times.map((s) => s.code));
  }
});

watch(() => trains.trainSelected, (newTrain, oldTrain) => {
  if (leafMap.value) {
    if (oldTrain) trainMarkers.value[oldTrain]?.closePopup();
    if (newTrain !== '') {
      let coords = getTrainCoords(newTrain);
      if (coords) {
        updateMapView({ center: coords });
        trainMarkers.value[newTrain]?.openPopup();
      }
      handleStationMarkers(trains.trainData[newTrain].times.map((s) => s.code));
    } else {
      handleStationMarkers([]);
      updateMapView({ reset: true });
    }
  }
});

// -- Setup and cleanup --

onMounted(() => {
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

    leafMap.value.on('moveend', () => filterTrainsInView());
    leafMap.value.on('resize', () => { updateMapView({ reset: true }) });

    updateMap(true);
  }
});

onUnmounted(() => {
  toRaw(leafMap.value)?.remove();
});
</script>
<template>
  <div id="mapElem" ref="mapElem" class="h-full"></div>
</template>
<style>
.custom-tooltip {
  @apply bg-stone-50 dark:bg-stone-950 text-neutral-900 dark:text-neutral-200;
}
</style>