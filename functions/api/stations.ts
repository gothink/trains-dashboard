export interface Env {
	TRAIN_STATIONS: KVNamespace;
}

type TrainStation = [string, string, [number, number]];

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const RAIL_NETWORK = `VIA Rail`;

  try {
    let allStations: TrainStation[] = await context.env.TRAIN_STATIONS.get(RAIL_NETWORK, 'json');
    if (allStations) {
      return Response.json({ stations: allStations });
    } else {
      return Response.json({ error: `No data returned from KV` }, { status: 500 });
    }
  } catch (e) {
    return Response.json({ error: `Error fetching train station data from KV` }, { status: 500 });
  }
};