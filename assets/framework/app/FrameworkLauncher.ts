import { _decorator, Component, Node } from 'cc';
import { FrameworkBootstrap } from './FrameworkBootstrap';
import { FrameworkContext } from './FrameworkTypes';
import { ModuleManager } from './ModuleManager';
import { UIService } from '../ui/UIService';
import { DdzModule } from '../../game/ddz/DdzModule';
import { SlotsModule } from '../../game/slots/SlotsModule';

const { ccclass, property } = _decorator;

@ccclass('FrameworkLauncher')
export class FrameworkLauncher extends Component {
  @property(Node)
  public pageRoot: Node | null = null;

  @property(Node)
  public popupRoot: Node | null = null;

  @property(Node)
  public hudRoot: Node | null = null;

  @property
  public autoConnect = false;

  @property
  public wsUrl = 'ws://127.0.0.1:9001';

  @property
  public startModule = 'ddz';

  private ctx!: FrameworkContext;
  private modules!: ModuleManager;

  protected async start(): Promise<void> {
    if (!this.pageRoot || !this.popupRoot || !this.hudRoot) {
      throw new Error('FrameworkLauncher needs pageRoot/popupRoot/hudRoot');
    }

    const ui = this.node.addComponent(UIService);
    this.ctx = FrameworkBootstrap.create(ui);
    ui.setup(this.ctx, this.pageRoot, this.popupRoot, this.hudRoot);

    this.modules = new ModuleManager(this.ctx);
    this.modules.register(new DdzModule());
    this.modules.register(new SlotsModule());

    if (this.autoConnect) await this.ctx.net.connect(this.wsUrl);
    await this.modules.enter(this.startModule);
  }
}
