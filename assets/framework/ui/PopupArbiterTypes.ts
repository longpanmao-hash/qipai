export interface PopupArbiterTask {
  routeKey: string;
  params?: unknown;
  priority?: number;
  unique?: boolean;
  interruptable?: boolean;
  owner?: object;
}

export interface PopupArbiterHandle {
  routeKey: string;
  owner?: object;
}
