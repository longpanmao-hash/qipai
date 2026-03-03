import { FrameworkContext } from '../app/FrameworkTypes';
import { UIService } from './UIService';
import { PopupArbiterHandle, PopupArbiterTask } from './PopupArbiterTypes';

interface EnqueuedTask extends PopupArbiterTask {
  priority: number;
  enqueueSeq: number;
}

export class PopupArbiter {
  private queue: EnqueuedTask[] = [];
  private current: EnqueuedTask | null = null;
  private preemptTask: EnqueuedTask | null = null;
  private seq = 1;

  public constructor(
    private readonly ctx: FrameworkContext,
    private readonly ui: UIService,
  ) {
    this.ctx.events.on('ui.popup.closed', () => {
      this.current = null;
      this.tryOpenNext();
    }, this);
  }

  public enqueue(task: PopupArbiterTask): PopupArbiterHandle | null {
    if (task.unique && this.hasRoute(task.routeKey)) return null;

    const pending: EnqueuedTask = {
      ...task,
      priority: task.priority ?? 0,
      enqueueSeq: this.seq++,
    };

    if (
      this.current &&
      this.current.interruptable &&
      pending.priority > this.current.priority
    ) {
      this.queue.push(this.current);
      this.sortQueue();
      this.preemptTask = pending;
      this.ui.closeCurrentPopup();
      return { routeKey: pending.routeKey, owner: pending.owner };
    }

    this.queue.push(pending);
    this.sortQueue();
    this.tryOpenNext();
    return { routeKey: pending.routeKey, owner: pending.owner };
  }

  public cancelByOwner(owner: object): void {
    this.queue = this.queue.filter((task) => task.owner !== owner);
    if (this.current?.owner === owner) this.ui.closeCurrentPopup();
  }

  public clear(): void {
    this.queue.length = 0;
    this.current = null;
    this.ui.clearPopupQueue();
  }

  public dispose(): void {
    this.clear();
    this.ctx.events.offByOwner(this);
  }

  private tryOpenNext(): void {
    if (this.current) return;
    if (this.preemptTask) {
      const task = this.preemptTask;
      this.preemptTask = null;
      this.current = task;
      this.ui.openPopup(task.routeKey, task.params);
      return;
    }

    if (this.queue.length === 0) return;

    const next = this.queue.shift();
    if (!next) return;

    this.current = next;
    this.ui.openPopup(next.routeKey, next.params);
  }

  private hasRoute(routeKey: string): boolean {
    if (this.current?.routeKey === routeKey) return true;
    return this.queue.some((task) => task.routeKey === routeKey);
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.enqueueSeq - b.enqueueSeq;
    });
  }
}
