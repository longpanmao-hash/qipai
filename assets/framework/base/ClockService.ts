export type TimerCallback = () => void;

interface TimerTask {
  id: number;
  callback: TimerCallback;
  interval: number;
  repeat: number; // -1 infinite
  elapsed: number;
  runCount: number;
  paused: boolean;
  owner?: object;
}

/**
 * Frame-driven timer service.
 * Call `tick(dt)` from a global update loop.
 */
export class ClockService {
  private nextId = 1;
  private tasks = new Map<number, TimerTask>();
  private ownerMap = new Map<object, Set<number>>();
  private paused = false;

  public tick(dt: number): void {
    if (this.paused) return;
    for (const task of Array.from(this.tasks.values())) {
      if (task.paused) continue;
      task.elapsed += dt;
      while (task.elapsed >= task.interval) {
        task.elapsed -= task.interval;
        task.callback();
        task.runCount += 1;

        if (task.repeat > 0 && task.runCount >= task.repeat) {
          this.clear(task.id);
          break;
        }
      }
    }
  }

  public setTimeout(callback: TimerCallback, delaySec: number, owner?: object): number {
    return this.createTask(callback, Math.max(delaySec, 0.0001), 1, owner);
  }

  public setInterval(callback: TimerCallback, intervalSec: number, owner?: object): number {
    return this.createTask(callback, Math.max(intervalSec, 0.0001), -1, owner);
  }

  public clear(id: number): void {
    const task = this.tasks.get(id);
    if (!task) return;

    this.tasks.delete(id);
    if (task.owner) {
      const owned = this.ownerMap.get(task.owner);
      if (owned) {
        owned.delete(id);
        if (owned.size === 0) this.ownerMap.delete(task.owner);
      }
    }
  }

  public clearByOwner(owner: object): void {
    const ids = this.ownerMap.get(owner);
    if (!ids) return;
    for (const id of Array.from(ids)) this.clear(id);
    this.ownerMap.delete(owner);
  }

  public pause(): void {
    this.paused = true;
  }

  public resume(): void {
    this.paused = false;
  }

  public pauseTimer(id: number): void {
    const task = this.tasks.get(id);
    if (task) task.paused = true;
  }

  public resumeTimer(id: number): void {
    const task = this.tasks.get(id);
    if (task) task.paused = false;
  }

  public clearAll(): void {
    this.tasks.clear();
    this.ownerMap.clear();
  }

  private createTask(callback: TimerCallback, interval: number, repeat: number, owner?: object): number {
    const id = this.nextId++;
    const task: TimerTask = {
      id,
      callback,
      interval,
      repeat,
      elapsed: 0,
      runCount: 0,
      paused: false,
      owner,
    };
    this.tasks.set(id, task);

    if (owner) {
      let ids = this.ownerMap.get(owner);
      if (!ids) {
        ids = new Set();
        this.ownerMap.set(owner, ids);
      }
      ids.add(id);
    }

    return id;
  }
}
