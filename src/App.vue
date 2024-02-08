<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import L from 'leaflet';

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

interface TrainInfoObject {
  [index: string]: TrainInfo;
}

const initialized = ref(false);

const center = ref<[number, number]>([44.26, -76.54]);
const zoom = ref(8);

const mapElem = ref<HTMLElement>();
const leafMap = ref<L.Map>();
const markers = ref<Record<string, L.Marker>>({});
const mapBounds = ref<[[number, number], [number, number]]>([[0,0], [0,0]]);

const groupByStatus = ref(true);

const trainData = ref<TrainInfoObject>({});

const trainTable = ref<TrainInfo[]>([]);
const trainGroups = ref<Record<string, string[]>>({
  arr: [],
  dep: [],
  sch: [],
});
const trainMap = ref<Array<keyof TrainInfoObject>>([]);
const currentTrain = ref('');

const refreshData = async () => {
  const response = await fetch('/trains');
  if (response.ok) trainData.value = await response.json();
};

const updateMarker = (trainNumber: string, coords: [number, number]) => {
  if (leafMap.value) {
    if (markers.value[trainNumber]) {
      markers.value[trainNumber].setLatLng(coords);
    } else {
      markers.value[trainNumber] = L.marker(coords)
      .addTo(leafMap.value)
      .bindPopup(trainNumber);
    }
  }
};

watch(trainData, (newData) => {
  trainGroups.value = { arr: [], dep: [], sch: [] };
  trainMap.value = [];
  for (const tnum in newData) {
    if (newData[tnum].departed) {
      if (newData[tnum].arrived) {
        trainGroups.value['arr'].push(tnum);
        // clean up markers
        if (markers.value[tnum]) delete markers.value[tnum];
      } else {
        let lat = newData[tnum].lat ?? 0;
        let lng = newData[tnum].lng ?? 0;
        if (newData[tnum].lat && newData[tnum].lng) {
          // let nextStop = newData[tnum].times.findIndex((station) => station.eta !== 'ARR');
          // if (nextStop > -1) newData[tnum].next = nextStop;
          trainMap.value.push(tnum);
          updateMarker(tnum, [lat, lng]);
          mapBounds.value = [
            [Math.max(mapBounds.value[0][0], lat), Math.min(mapBounds.value[0][1], lng)],
            [Math.min(mapBounds.value[0][0], lat), Math.max(mapBounds.value[0][1], lng)]
          ];
        }
        
        trainGroups.value['dep'].push(tnum);
      }
    } else {
      trainGroups.value['sch'].push(tnum);
      // clean up markers
      if (markers.value[tnum]) delete markers.value[tnum];
    }
  }
});

const getNextStop = (trainNumber: string) => {
  let stopIndex = trainData.value[trainNumber].times.findIndex((station) => station.eta !== 'ARR');
  if (stopIndex > -1) {
    let nextStation = trainData.value[trainNumber].times[stopIndex];
    return `${nextStation.station} (${nextStation.eta})`;
  }
};

const selectTrain = (trainNumber: string) => {
  currentTrain.value = trainNumber;
  if (trainMap.value.includes(trainNumber)) {
    leafMap.value?.flyTo([trainData.value[trainNumber].lat ?? 0, trainData.value[trainNumber].lng ?? 0], 10);
  }
};

onMounted(async () => {
  await refreshData();
  if (trainData.value && mapElem.value) {
    leafMap.value = L.map(mapElem.value).fitBounds(L.latLngBounds(mapBounds.value).pad(0.2));
    //.setView(center.value, zoom.value);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(leafMap.value);

    for (const train of trainMap.value) {
      updateMarker(train as string, [trainData.value[train].lat ?? 0, trainData.value[train].lng ?? 0]);
    }

    initialized.value = true;
  }
  setInterval(refreshData, 60 * 1000);
});
</script>

<template>
  <main>
    <div id="mapElem" ref="mapElem"></div>
    <table v-if="trainData">
      <thead>
        <tr>VIA Rail Trains</tr>
      </thead>
      <tbody>
        <tr>
          <th>In Transit</th>
        </tr>
        <tr>
          <th>Train #</th>
          <th>From</th>
          <th>Next Stop</th>
          <th>Destination</th>
          <th>Delay</th>
        </tr>
        <tr v-for="train in trainGroups['dep']" @click="selectTrain(train)">
          <td>{{ train }}</td>
          <td>{{ trainData[train].from }}</td>
          <td>{{ getNextStop(train) }}</td>
          <td>{{ trainData[train].to }}</td>
          <td>{{ trainData[train].pollMin }}</td>
        </tr>
      </tbody>
      <tbody>
        <tr>
          <th>Scheduled to Depart</th>
        </tr>
        <tr>
          <th>Train #</th>
          <th>From</th>
          <th>Destination</th>
        </tr>
        <tr v-for="train in trainGroups['sch']" @click="selectTrain(train)">
          <td>{{ train }}</td>
          <td>{{ trainData[train].from }}</td>
          <td>{{ trainData[train].to }}</td>
        </tr>
      </tbody>
      <tbody>
        <tr>
          <th>Arrived</th>
        </tr>
        <tr>
          <th>Train #</th>
          <th>From</th>
          <th>Destination</th>
        </tr>
        <tr v-for="train in trainGroups['arr']" @click="selectTrain(train)">
          <td>{{ train }}</td>
          <td>{{ trainData[train].from }}</td>
          <td>{{ trainData[train].to }}</td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<style>
#mapElem {
  height: 500px;
}
</style>