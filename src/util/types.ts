export interface TrainTimes {
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

export interface TrainInfo {
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
  next?: number;
}

export type MapCoord = [number, number];
export type MapBoundary = [MapCoord, MapCoord];

export type TrainStatus = 'arrived' | 'departed' | 'scheduled' | 'all';