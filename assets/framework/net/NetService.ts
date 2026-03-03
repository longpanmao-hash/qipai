import { ClockService } from '../base/ClockService';
import { Logger } from '../logger/Logger';
import { INetCodec, IRequestOptions, NetHandler, NetPacket } from './NetTypes';
import { ProtobufNumberCodec } from './ProtobufNumberCodec';

interface PendingRequest {
  resolve: (v: unknown) => void;
  reject: (err: Error) => void;
  timeoutId: number;
}

interface BoundHandler {
  route: string;
  handler: NetHandler;
  owner?: object;
}

interface BoundCmdHandler {
  cmd: number;
  handler: NetHandler;
  owner?: object;
}

export class NetService {
  private ws: WebSocket | null = null;
  private seq = 1;
  private reconnectAttempts = 0;
  private reconnectMax = 5;
  private reconnectDelaySec = 2;
  private heartbeatSec = 10;
  private heartbeatTimer = 0;

  private handlers = new Map<string, Set<BoundHandler>>();
  private cmdHandlers = new Map<number, Set<BoundCmdHandler>>();
  private ownerMap = new Map<object, Set<BoundHandler>>();
  private cmdOwnerMap = new Map<object, Set<BoundCmdHandler>>();
  private pending = new Map<number, PendingRequest>();

  public constructor(
    private readonly clock: ClockService,
    private readonly codec: INetCodec = new ProtobufNumberCodec(),
  ) {}

  public connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        Logger.info('NetService', 'connected', url);
        this.ws = ws;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        resolve();
      };

      ws.onmessage = (ev) => this.onMessage(ev.data as ArrayBuffer);
      ws.onerror = () => reject(new Error('websocket error'));
      ws.onclose = () => {
        this.stopHeartbeat();
        this.rejectAllPending(new Error('socket closed'));
        this.tryReconnect(url);
      };
    });
  }

  public disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.stopHeartbeat();
  }

  public async request(route: string, cmd: number, body: unknown, options?: IRequestOptions): Promise<unknown> {
    const seq = this.seq++;
    const payload = (this.codec as ProtobufNumberCodec).encodeBody(route, body);
    this.sendPacket({ cmd, seq, route, payload });

    const timeoutMs = options?.timeoutMs ?? 8000;
    return new Promise((resolve, reject) => {
      const timeoutId = this.clock.setTimeout(() => {
        this.pending.delete(seq);
        reject(new Error(`request timeout: ${route}`));
      }, timeoutMs / 1000);

      this.pending.set(seq, { resolve, reject, timeoutId });
    });
  }

  public notify(route: string, cmd: number, body: unknown): void {
    const payload = (this.codec as ProtobufNumberCodec).encodeBody(route, body);
    this.sendPacket({ cmd, seq: 0, route, payload });
  }

  public on(route: string, handler: NetHandler, owner?: object): () => void {
    const item: BoundHandler = { route, handler, owner };
    let set = this.handlers.get(route);
    if (!set) {
      set = new Set();
      this.handlers.set(route, set);
    }
    set.add(item);

    if (owner) {
      let ownerSet = this.ownerMap.get(owner);
      if (!ownerSet) {
        ownerSet = new Set();
        this.ownerMap.set(owner, ownerSet);
      }
      ownerSet.add(item);
    }

    return () => this.off(route, handler);
  }

  public off(route: string, handler?: NetHandler): void {
    const set = this.handlers.get(route);
    if (!set) return;

    for (const item of Array.from(set)) {
      if (!handler || item.handler === handler) this.detach(item);
    }

    if (set.size === 0) this.handlers.delete(route);
  }

  public offByOwner(owner: object): void {
    const set = this.ownerMap.get(owner);
    if (set) {
      for (const item of Array.from(set)) this.detach(item);
      this.ownerMap.delete(owner);
    }

    const cmdSet = this.cmdOwnerMap.get(owner);
    if (!cmdSet) return;
    for (const item of Array.from(cmdSet)) this.detachCmd(item);
    this.cmdOwnerMap.delete(owner);
  }

  public addHandlers(cmds: number[], handler: NetHandler, owner?: object): () => void {
    const items: BoundCmdHandler[] = [];
    for (const cmd of cmds) {
      const item: BoundCmdHandler = { cmd, handler, owner };
      let set = this.cmdHandlers.get(cmd);
      if (!set) {
        set = new Set();
        this.cmdHandlers.set(cmd, set);
      }
      set.add(item);
      items.push(item);

      if (owner) {
        let ownerSet = this.cmdOwnerMap.get(owner);
        if (!ownerSet) {
          ownerSet = new Set();
          this.cmdOwnerMap.set(owner, ownerSet);
        }
        ownerSet.add(item);
      }
    }

    return () => {
      for (const item of items) this.detachCmd(item);
    };
  }

  private sendPacket(packet: NetPacket): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) throw new Error('socket not connected');
    this.ws.send(this.codec.encode(packet));
  }

  private onMessage(buffer: ArrayBuffer): void {
    const packet = this.codec.decode(buffer);
    if (packet.seq > 0 && this.pending.has(packet.seq)) {
      const req = this.pending.get(packet.seq)!;
      this.pending.delete(packet.seq);
      this.clock.clear(req.timeoutId);
      req.resolve((this.codec as ProtobufNumberCodec).decodeBody(packet.route, packet.payload));
      return;
    }

    const handlers = this.handlers.get(packet.route);
    if (handlers) {
      for (const h of Array.from(handlers)) h.handler(packet);
    }

    const cmdHandlers = this.cmdHandlers.get(packet.cmd);
    if (!cmdHandlers) return;
    for (const h of Array.from(cmdHandlers)) h.handler(packet);
  }

  private detach(item: BoundHandler): void {
    const routeSet = this.handlers.get(item.route);
    routeSet?.delete(item);

    if (item.owner) {
      const ownerSet = this.ownerMap.get(item.owner);
      ownerSet?.delete(item);
      if (ownerSet && ownerSet.size === 0) this.ownerMap.delete(item.owner);
    }
  }

  private detachCmd(item: BoundCmdHandler): void {
    const cmdSet = this.cmdHandlers.get(item.cmd);
    cmdSet?.delete(item);
    if (cmdSet && cmdSet.size === 0) this.cmdHandlers.delete(item.cmd);

    if (item.owner) {
      const ownerSet = this.cmdOwnerMap.get(item.owner);
      ownerSet?.delete(item);
      if (ownerSet && ownerSet.size === 0) this.cmdOwnerMap.delete(item.owner);
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = this.clock.setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      this.notify('sys.heartbeat', 1, { t: Date.now() });
    }, this.heartbeatSec);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer > 0) this.clock.clear(this.heartbeatTimer);
    this.heartbeatTimer = 0;
  }

  private tryReconnect(url: string): void {
    if (this.reconnectAttempts >= this.reconnectMax) return;
    this.reconnectAttempts += 1;
    this.clock.setTimeout(() => {
      void this.connect(url).catch(() => Logger.warn('NetService', 'reconnect failed'));
    }, this.reconnectDelaySec);
  }

  private rejectAllPending(err: Error): void {
    for (const [seq, req] of Array.from(this.pending.entries())) {
      this.clock.clear(req.timeoutId);
      req.reject(err);
      this.pending.delete(seq);
    }
  }
}
