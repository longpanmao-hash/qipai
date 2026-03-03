import { _decorator, Button, Label, Node } from 'cc';
import { UIViewBase } from '../../../framework/ui/UIViewBase';

const { ccclass } = _decorator;

@ccclass('DdzRoomView')
export class DdzRoomView extends UIViewBase {
  private exitButton: Node | null = null;

  public onOpen(): void {
    const title = new Node('title');
    const label = title.addComponent(Label);
    label.string = '斗地主房间';
    this.node.addChild(title);

    this.exitButton = new Node('exitButton');
    const btnLabel = this.exitButton.addComponent(Label);
    btnLabel.string = '退出';
    const btn = this.exitButton.addComponent(Button);
    btn.node.on(Button.EventType.CLICK, this.onClickExit, this);
    this.node.addChild(this.exitButton);
  }

  public onClose(): void {
    this.exitButton?.off(Button.EventType.CLICK, this.onClickExit, this);
  }

  private onClickExit(): void {
    this.ctx.ui.close(this.node);
  }
}
