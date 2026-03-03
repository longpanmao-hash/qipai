export interface NetPacket {
  cmd: number;
  seq: number;
  route: string;
  payload: Uint8Array;
}

export interface IRequestOptions {
  timeoutMs?: number;
}

export type NetHandler = (packet: NetPacket) => void;

export interface IProtoRegistry {
  encode(route: string, data: unknown): Uint8Array;
  decode(route: string, payload: Uint8Array): unknown;
}

export interface INetCodec {
  encode(packet: NetPacket): ArrayBuffer;
  decode(buffer: ArrayBuffer): NetPacket;
}
