import { ByteBuf } from './ByteBuf';
import { INetCodec, IProtoRegistry, NetPacket } from './NetTypes';

class JsonProtoRegistry implements IProtoRegistry {
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  public encode(_route: string, data: unknown): Uint8Array {
    return this.encoder.encode(JSON.stringify(data ?? {}));
  }

  public decode(_route: string, payload: Uint8Array): unknown {
    if (payload.length === 0) return {};
    return JSON.parse(this.decoder.decode(payload));
  }
}

/**
 * Packet format:
 * [cmd:u16][seq:u32][routeLen:u16][routeBytes][payload]
 */
export class ProtobufNumberCodec implements INetCodec {
  private readonly textEncoder = new TextEncoder();
  private readonly textDecoder = new TextDecoder();

  public constructor(public readonly registry: IProtoRegistry = new JsonProtoRegistry()) {}

  public encode(packet: NetPacket): ArrayBuffer {
    const routeBytes = this.textEncoder.encode(packet.route);
    const buf = new ByteBuf();
    buf.writeU16(packet.cmd);
    buf.writeU32(packet.seq);
    buf.writeU16(routeBytes.length);
    buf.writeBytes(routeBytes);
    buf.writeBytes(packet.payload);
    return buf.toArrayBuffer();
  }

  public decode(buffer: ArrayBuffer): NetPacket {
    const buf = ByteBuf.wrap(buffer);
    const cmd = buf.readU16();
    const seq = buf.readU32();
    const routeLen = buf.readU16();
    const route = this.textDecoder.decode(buf.readBytes(routeLen));
    const payload = buf.readBytes(buf.remaining());
    return { cmd, seq, route, payload };
  }

  public encodeBody(route: string, data: unknown): Uint8Array {
    return this.registry.encode(route, data);
  }

  public decodeBody(route: string, payload: Uint8Array): unknown {
    return this.registry.decode(route, payload);
  }
}
