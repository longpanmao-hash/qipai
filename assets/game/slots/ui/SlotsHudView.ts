import { _decorator, Button, Label, Node } from 'cc';
import { StateMachine } from '../../../framework/base/StateMachine';
import { UIViewBase } from '../../../framework/ui/UIViewBase';

const { ccclass } = _decorator;

interface SlotsStateCtx {
  view: SlotsHudView;
}

@ccclass('SlotsHudView')
export class SlotsHudView extends UIViewBase {
  private spinButton: Node | null = null;
  private fsm = new StateMachine<SlotsStateCtx>({ view: this });

  public onOpen(): void {
    this.fsm
      .add({
        name: 'idle',
        onEnter: () => this.ctx.ui.toast('Slots Idle'),
      })
      .add({
        name: 'spinning',
        onEnter: () => this.ctx.ui.toast('Spinning...'),
      });
    this.fsm.enter('idle');

    this.spinButton = new Node('spinButton');
    const label = this.spinButton.addComponent(Label);
    label.string = 'Spin';
    const button = this.spinButton.addComponent(Button);
    button.node.on(Button.EventType.CLICK, this.onSpinClick, this);
    this.node.addChild(this.spinButton);
  }

  public onClose(): void {
    this.spinButton?.off(Button.EventType.CLICK, this.onSpinClick, this);
    this.fsm.clear();
  }

  private onSpinClick(): void {
    this.fsm.enter('spinning');
    this.ctx.ui.toast('Spin! Good luck!');
    this.ctx.clock.setTimeout(() => this.fsm.enter('idle'), 1.0, this);
  }
}
