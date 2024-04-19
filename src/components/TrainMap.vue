<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useTrainsStore } from '@/stores/trainsStore';
import { useRouter } from 'vue-router';
import type { MapBoundary, MapCoord } from '@/util/types';
import { Map, Marker, NavigationControl, Popup, ScaleControl } from 'maplibre-gl';
import routeCoords from '../../data/routes.json';
import trainRoutes from '../../data/trains.json';
import stationData from '../../data/stations.json';

const props = defineProps<{
  mapElement: HTMLElement
}>();

const trains = useTrainsStore();
const router = useRouter();

const TRAIN_ZOOM = 10;

let trainMarkers: Record<string, Marker> = {};
let stationPopups: Record<string, Popup> = {};
const mapFollow = ref(true);
const activeTrain = computed(() => {
  if (trains.trainSelected !== '' && trains.trainsActive[trains.trainSelected]) {
    return trains.trainsActive[trains.trainSelected];
  }
  return null;
});

const stationList = computed(() => {
  let newList: string[] = [];
  if (activeTrain.value) newList.push(...activeTrain.value.times.map((s) => s.code));
  if (trains.trainHighlighted && trainRoutes[trains.trainHighlighted.split(' ')[0] as keyof typeof trainRoutes]) {
    newList.push(...trainRoutes[trains.trainHighlighted.split(' ')[0] as keyof typeof trainRoutes].stop_list);
  }
  return newList;

});

const routeList = computed(() => {
  let newList: string[] = [];
  if (trains.trainSelected) newList.push(trainRoutes[trains.trainSelected.split(' ')[0] as keyof typeof trainRoutes].route_id);
  if (trains.trainHighlighted && trainRoutes[trains.trainHighlighted.split(' ')[0] as keyof typeof trainRoutes]) {
    newList.push(trainRoutes[trains.trainHighlighted.split(' ')[0] as keyof typeof trainRoutes].route_id);
  }
  return newList;
});

const mapgl = new Map({
  container: props.mapElement,
  style: `https://api.maptiler.com/maps/975f1322-b68e-4ccb-b409-50c24d12ce90/style.json?key=59iDEGyxgh5V2i0JQrZA`,
  center: [-84,50],
  zoom: 4,
});

mapgl.on('moveend', () => filterTrainsInView());
mapgl.on('rotateend', () => { Object.keys(trainMarkers).forEach((trainId) => updateMarkerIcon(trainId)) });
// mapgl.on('mouseover', 'station-stops', () => {  });

const stationsToGeojson = () => {
  let featureList: GeoJSON.Feature[] = [];
  Object.entries(stationData).forEach(([code, data]) => {
    featureList.push({
      type: 'Feature',
      properties: {
        type: 'station',
        code: code,
        name: data.name
      },
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(data.coords[0]), parseFloat(data.coords[1])]
      }
    });
  });
  return {
    type: 'FeatureCollection',
    features: featureList
  } as GeoJSON.GeoJSON;
};

const routesToGeojson = () => {
  let featureList: GeoJSON.Feature[] = [];
  Object.entries(routeCoords).forEach(([route, coords]) => {
    featureList.push({
      type: 'Feature',
      properties: {
        name: route
      },
      geometry: {
        type: 'LineString',
        coordinates: coords.map((coord) => [parseFloat(coord[0]), parseFloat(coord[1])])
      },
    });
  });
  return {
    type: 'FeatureCollection',
    features: featureList,
  } as GeoJSON.GeoJSON;
};

mapgl.on('load', async () => {
  mapgl.addControl(new NavigationControl(), 'top-right');
  mapgl.addControl(new ScaleControl(), 'bottom-left');

  mapgl.addSource('stations', {
    type: 'geojson',
    data: stationsToGeojson()
  });

  mapgl.addSource('routes', {
    type: 'geojson',
    data: routesToGeojson()
  });

  mapgl.addLayer({
    id: 'route-lines',
    source: 'routes',
    type: 'line',
    paint: {
      'line-width': 3,
      'line-color': 'orange',
    },
    filter: [
      'in',
      ['get', 'name'],
      trains.trainSelected === '' ? '' : trainRoutes[trains.trainSelected.split(' ')[0] as keyof typeof trainRoutes].route_id
    ],
  });

  mapgl.addLayer({
    id: 'station-stops',
    source: 'stations',
    type: 'circle',
    paint: {
      'circle-radius': [
      'interpolate', ['linear'], ['zoom'],
      1, 1,
      5, 4,
      8, 6,
      12, 8,
      16, 10,
    ],
      'circle-color': 'blue',
      'circle-opacity': [
        'interpolate', ['linear'], ['zoom'],
        8, 1,
        12, 0.5,
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': 'orange',
      'circle-pitch-alignment': 'map',
    },
    filter: ['in', ['get', 'code'], ''],
  });
});

const popUpContent = (trainId: string) => {
  return `
    <div class="flex flex-col justify-center bg-stone-900">
      <div class="mx-auto font-bold text-lg">${trainId}</div>
      <span class="mx-auto">${trains.trainsActive[trainId].speed}km/h</span>
    </div>
  `;
};

const createStationPopup = (stationCode: string) => {
  const popupContainer = document.createElement('div');
  popupContainer.classList.add('flex');
  popupContainer.classList.add('bg-stone-900');
  popupContainer.innerHTML = `
    <div class="flex-none">
      <img src="/station-sign.svg" width="24px">
    </div>
    <div class="flex-1">
      <p>${stationCode}</p>
      <p>ETA: ${trains.trainsActive[trains.trainSelected].times.find(s => s.code === stationCode)?.eta}</p>
    </div>
  `;
  return popupContainer;
};

const createTrainMarker = (trainId: string) => {
  let dir = trains.trainsActive[trainId].direction;
  dir = dir ? Math.floor(dir - mapgl.getBearing()) : dir;

  const trainIconContainer = document.createElement('div');
  trainIconContainer.innerHTML = `
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
   style="visibility:${dir ? 'hidden' : 'visible'};fill:#000000;fill-opacity:1;stroke:#000000;stroke-width:8.02128;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
   d="m 245.78415,208.65137 c -1.80005,-0.18954 -5.23585,-0.94666 -7.16766,-1.57947 -11.28651,-3.69718 -20.11707,-13.14488 -23.0304,-24.63988 -1.15322,-4.55018 -1.32672,-10.85327 -0.41742,-15.16395 2.07487,-9.83627 7.73527,-17.92572 16.20819,-23.16359 8.38038,-5.18066 19.34866,-6.44886 28.86444,-3.33741 2.57782,0.84289 7.09152,3.12886 9.35494,4.73782 2.44995,1.74155 6.53273,5.82842 8.24806,8.25631 4.62812,6.55067 6.85978,14.46997 6.34373,22.51144 -1.05167,16.38789 -13.64279,29.88518 -30.05535,32.21842 -1.84011,0.2616 -6.53117,0.35168 -8.34853,0.16031 z"
   id="marker_dot" />
   
   <path
   id="marker_arrow"
   d="M 248.75885,67.153381 V 267.15338 m 0,-199.999999 -50,49.999999 m 50,-49.999999 50,49.999999"
   style="visibility:${dir ? 'visible' : 'hidden'};fill:#010002;stroke:#000000;stroke-width:25;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1"
   ${dir ? 'transform="rotate(' + dir + ', 250, 170)"' : ''} />
</svg>
  `;

  trainIconContainer.classList.add('cursor-pointer');

  trainIconContainer.addEventListener('click', () => router.push(`/${trainId}`));
  trainIconContainer.addEventListener('mouseover', () => { trains.trainHighlighted = trainId });
  trainIconContainer.addEventListener('mouseout', () => { trains.trainHighlighted = null });

  return trainIconContainer;
};

const updateMarkerIcon = (trainId: string) => {
  // update arrow or dot in marker
  let iconElem: HTMLElement = trainMarkers[trainId]?.getElement();
  if (iconElem) {
    let arrowPath: SVGPathElement | null = iconElem.querySelector('#marker_arrow');
    let dotPath: SVGPathElement | null = iconElem.querySelector('#marker_dot');
    if (trains.trainsActive[trainId].direction) {
      if (dotPath) dotPath.style.visibility = 'hidden';
      let arrowDir = Math.floor((trains.trainsActive[trainId].direction ?? 0) - mapgl.getBearing());
      if (arrowPath) arrowPath.setAttribute('transform', `rotate(${arrowDir}, 250, 170)`);
      // if (arrowPath) arrowPath.style.transform = (`rotate(' + ${arrowDir} + ', 250, 170)`);
    } else {
      if (dotPath) dotPath.setAttribute('visibility', 'visible');
      if (arrowPath) arrowPath.setAttribute('visibility', 'hidden');
    }
  }
};

// -- Trains markers, icons and overlays --

const toggleMarkerPopup = (action: 'open' | 'close', trainId: string) => {
  if (trainMarkers[trainId]) {
    let popup = trainMarkers[trainId].getPopup();
    if (popup) {
      if (action === 'open' && !popup.isOpen()) {
        trainMarkers[trainId].togglePopup();
      } else if (action === 'close' && popup.isOpen()) {
        trainMarkers[trainId].togglePopup();
      }
    }
  }
};

const filterTrainsInView = () => {
  let filterList: string[] = [];
  for (const trainId in trainMarkers) {
    if (
      trains.trainsActive[trainId] &&
      mapgl.getBounds().contains([trains.trainsActive[trainId].lng, trains.trainsActive[trainId].lat])
    ) {
      filterList.push(trainId);
    }
  }
  trains.trainsInView = filterList;
};

const updateMarkers = () => {
  // add or update markers
  Object.entries(trains.trainsActive).forEach(([trainId, train]) => {
    if (trainMarkers[trainId]) {
      // move marker, update popup
      trainMarkers[trainId].setLngLat([train.lng, train.lat]);
      trainMarkers[trainId].getPopup().setHTML(popUpContent(trainId));

      updateMarkerIcon(trainId);
    } else {
      trainMarkers[trainId] = new Marker({
        element: createTrainMarker(trainId),
        offset: [0,-18]
      })
        .setLngLat([train.lng, train.lat])
        .addTo(mapgl);

      trainMarkers[trainId].setPopup(new Popup({
          offset: 40,
          closeButton: false,
          closeOnClick: false,
        })
        .setHTML(popUpContent(trainId)));
    }
  });

  // remove stale markers
  for (const trainId in trainMarkers) {
    if (!(trainId in trains.trainsActive)) {
      trainMarkers[trainId].remove();
      delete trainMarkers[trainId];
    }
  }

};

// -- Station markers, icons and overlays --

const updateStationMarkers = () => {
  Object.values(stationPopups).forEach((popup) => {
    popup.remove();
  });

  if (activeTrain.value) {
    // create popups for first, last, and next stops
    for (const idx of [0, activeTrain.value.times.length - 1, activeTrain.value.next]) {
      if (typeof idx === 'number' && idx > -1) {
        stationPopups[activeTrain.value.times[idx].code] = new Popup({ anchor: 'top', offset: 12, closeButton: false, closeOnClick: false })
          .setDOMContent(createStationPopup(activeTrain.value.times[idx].code))
          .setLngLat(stationData[activeTrain.value.times[idx].code as keyof typeof stationData].coords.map((c) => parseFloat(c)) as MapCoord)
          .addTo(mapgl);
      }
    }
  }
};


// -- Map coordinates, boundaries, movement --

const updateMapView = (reset?: boolean) => {
  if (mapFollow.value) {
    // stash current boundary to compare for triggering filter update
    const currentCenter = mapgl.getCenter();
    const currentZoom = mapgl.getZoom();

    if (activeTrain.value) {
      if (reset) trainMarkers[trains.trainSelected]?.togglePopup();

      let center: MapCoord = [activeTrain.value.lng, activeTrain.value.lat];
      if (mapgl.getBounds().contains(center) && currentZoom >= TRAIN_ZOOM) {
        mapgl.flyTo({center, zoom: TRAIN_ZOOM});
      } else {
        mapgl.flyTo({center, zoom: TRAIN_ZOOM});
      }
    } else if (reset && trains.mapBounds) {
      mapgl.fitBounds(trains.mapBounds);
    }

    // boundary hasn't changed, check if trains have entered/left boundary
    if (mapgl.getCenter().lat === currentCenter.lat && mapgl.getCenter().lng === currentCenter.lng && mapgl.getZoom() === currentZoom) {
      filterTrainsInView();
    }
  }
};

// -- Train store watchers

watch(() => trains.trainsActive, () => {
  updateMapView();
  updateMarkers();
  updateStationMarkers();
});

watch(() => trains.trainSelected, (newTrain, oldTrain) => {
  if (oldTrain) trainMarkers[oldTrain]?.getPopup().remove();
  updateMapView(true);
  updateMarkers();
  updateStationMarkers();
});

watch (() => trains.trainHighlighted, (newTrain, oldTrain) => {
  if (oldTrain) {
    toggleMarkerPopup('close', oldTrain);
  }
  if (newTrain) {
    toggleMarkerPopup('open', newTrain);
  }
});

watch(stationList, (newList) => {
  mapgl.setFilter('station-stops', [
    'in',
    ['get', 'code'],
    newList.join()
  ]);
});

watch(routeList, (newList) => {
  mapgl.setFilter('route-lines', [
    'in',
    ['get', 'name'],
    newList.join()
  ]);
});

// -- Setup and cleanup --

onMounted(() => {
  // initialize map view
  if (activeTrain.value) {
    mapgl.setCenter([activeTrain.value.lng, activeTrain.value.lat]);
    mapgl.setZoom(TRAIN_ZOOM);
    // TODO: get boundary for train's station stops if no coords avail
  } else if (trains.mapBounds) {
    mapgl.fitBounds(trains.mapBounds);
  }

  updateMarkers();
  updateStationMarkers();
  updateMapView(true);
});

onBeforeUnmount(() => {
  console.log('unmounting');
  mapgl.remove();
});
</script>
<template>
</template>
<style>
.maplibregl-popup-anchor-top .maplibregl-popup-tip {
  @apply border-b-stone-900;
}

.maplibregl-popup-anchor-bottom .maplibregl-popup-tip {
  @apply border-t-stone-900;
}

.maplibregl-popup-content {
  @apply bg-stone-900;
}
</style>