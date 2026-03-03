import { NetService } from './NetService';
import { NetPacket } from './NetTypes';
import { DefaultRouteParser } from './DefaultRouteParser';
import { IRouteParser, NetReceiver } from './NetRouterTypes';

interface ReceiverBinding {
  receiver: NetReceiver;
  owner?: object;
}

export class NetRouter {
  private tableReceivers = new Map<number, Set<ReceiverBinding>>();
  private roomReceivers = new Map<number, Set<ReceiverBinding>>();
  private tableOwnerMap = new Map<object, Set<ReceiverBinding>>();
  private roomOwnerMap = new Map<object, Set<ReceiverBinding>>();

  public constructor(
    private readonly net: NetService,
    private readonly parser: IRouteParser = new DefaultRouteParser(),
  ) {}

  public registerTable(tableId: number, receiver: NetReceiver, owner?: object): () => void {
    const item: ReceiverBinding = { receiver, owner };
    this.addBinding(this.tableReceivers, this.tableOwnerMap, tableId, item);
    return () => this.unregisterTable(tableId, receiver);
  }

  public unregisterTable(tableId: number, receiver?: NetReceiver): void {
    this.removeBinding(this.tableReceivers, tableId, receiver);
  }

  public registerRoom(roomId: number, receiver: NetReceiver, owner?: object): () => void {
    const item: ReceiverBinding = { receiver, owner };
    this.addBinding(this.roomReceivers, this.roomOwnerMap, roomId, item);
    return () => this.unregisterRoom(roomId, receiver);
  }

  public unregisterRoom(roomId: number, receiver?: NetReceiver): void {
    this.removeBinding(this.roomReceivers, roomId, receiver);
  }

  public clearOwner(owner: object): void {
    this.clearOwnerFromMap(this.tableOwnerMap, this.tableReceivers, owner);
    this.clearOwnerFromMap(this.roomOwnerMap, this.roomReceivers, owner);
    this.net.offByOwner(owner);
  }

  public bindCmds(cmds: number[], owner?: object): () => void {
    return this.net.addHandlers(cmds, this.dispatch, owner ?? this);
  }

  private dispatch = (packet: NetPacket): void => {
    const location = this.parser.parse(packet.route);

    if (location.tableId !== undefined) {
      this.notify(this.tableReceivers.get(location.tableId), packet);
    }

    if (location.roomId !== undefined) {
      this.notify(this.roomReceivers.get(location.roomId), packet);
    }
  };

  private notify(set: Set<ReceiverBinding> | undefined, packet: NetPacket): void {
    if (!set) return;
    for (const item of Array.from(set)) item.receiver(packet);
  }

  private addBinding(
    buckets: Map<number, Set<ReceiverBinding>>,
    ownerMap: Map<object, Set<ReceiverBinding>>,
    id: number,
    item: ReceiverBinding,
  ): void {
    let set = buckets.get(id);
    if (!set) {
      set = new Set();
      buckets.set(id, set);
    }
    set.add(item);

    if (!item.owner) return;
    let ownerSet = ownerMap.get(item.owner);
    if (!ownerSet) {
      ownerSet = new Set();
      ownerMap.set(item.owner, ownerSet);
    }
    ownerSet.add(item);
  }

  private removeBinding(buckets: Map<number, Set<ReceiverBinding>>, id: number, receiver?: NetReceiver): void {
    const set = buckets.get(id);
    if (!set) return;

    for (const item of Array.from(set)) {
      if (!receiver || receiver === item.receiver) this.detach(item, buckets, id);
    }
  }

  private clearOwnerFromMap(
    ownerMap: Map<object, Set<ReceiverBinding>>,
    buckets: Map<number, Set<ReceiverBinding>>,
    owner: object,
  ): void {
    const ownerSet = ownerMap.get(owner);
    if (!ownerSet) return;

    for (const item of Array.from(ownerSet)) {
      for (const [id, set] of Array.from(buckets.entries())) {
        if (!set.has(item)) continue;
        this.detach(item, buckets, id);
      }
    }
    ownerMap.delete(owner);
  }

  private detach(item: ReceiverBinding, buckets: Map<number, Set<ReceiverBinding>>, id: number): void {
    const set = buckets.get(id);
    set?.delete(item);
    if (set && set.size === 0) buckets.delete(id);

    if (!item.owner) return;
    this.tableOwnerMap.get(item.owner)?.delete(item);
    this.roomOwnerMap.get(item.owner)?.delete(item);
    if (this.tableOwnerMap.get(item.owner)?.size === 0) this.tableOwnerMap.delete(item.owner);
    if (this.roomOwnerMap.get(item.owner)?.size === 0) this.roomOwnerMap.delete(item.owner);
  }
}

