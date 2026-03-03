import { _decorator, Component, EventKeyboard, input, Input, KeyCode } from 'cc';
import { DebugPanel } from './DebugPanel';

const { ccclass } = _decorator;

@ccclass('DebugHotkey')
export class DebugHotkey extends Component {
  public panel: DebugPanel | null = null;

  protected onEnable(): void {
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
  }

  protected onDisable(): void {
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
  }

  private onKeyDown(event: EventKeyboard): void {
    if (event.keyCode !== KeyCode.BACKQUOTE) return;
    this.panel?.toggle();
  }
}

