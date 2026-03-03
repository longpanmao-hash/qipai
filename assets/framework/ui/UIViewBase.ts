import { _decorator, Component } from 'cc';
import { FrameworkContext } from '../app/FrameworkTypes';

const { ccclass } = _decorator;

@ccclass('UIViewBase')
export class UIViewBase extends Component {
  protected ctx!: FrameworkContext;

  public bindContext(ctx: FrameworkContext): void {
    this.ctx = ctx;
  }

  public onOpen(_params?: unknown): void {
    // override in subclass
  }

  public onClose(): void {
    // override in subclass
  }

  protected onDestroy(): void {
    if (!this.ctx) return;
    this.ctx.events.offByOwner(this);
    this.ctx.clock.clearByOwner(this);
    this.ctx.net.offByOwner(this);
    this.ctx.data.settings.disposeOwner(this);
    this.ctx.data.user.disposeOwner(this);
  }
}
