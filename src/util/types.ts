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
}

export interface TrainInfoObject {
  [index: string]: TrainInfo;
}

export type TrainStatus = 'arr' | 'dep' | 'sch';