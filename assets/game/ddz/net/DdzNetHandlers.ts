import { FrameworkContext } from '../../../framework/app/FrameworkTypes';

export function createDdzNetHandlers(ctx: FrameworkContext): Array<() => void> {
  const offEnter = ctx.net.on('ddz.table.enter', (packet) => {
    console.log('[ddz] table.enter', packet.seq, packet.payload.length);
  });

  const offDeal = ctx.net.on('ddz.table.deal', (packet) => {
    console.log('[ddz] table.deal bytes=', packet.payload.length);
  });

  return [offEnter, offDeal];
}
