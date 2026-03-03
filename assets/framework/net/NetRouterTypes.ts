import { NetPacket } from './NetTypes';

export interface RouteLocation {
  tableId?: number;
  roomId?: number;
}

export interface IRouteParser {
  parse(route: string): RouteLocation;
}

export type NetReceiver = (packet: NetPacket) => void;

