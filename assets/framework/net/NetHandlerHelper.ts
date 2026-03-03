export function parseTableId(route: string): number {
  const m = route.match(/table\.(\d+)/i);
  return m ? Number(m[1]) : 0;
}

export function parseRoomId(route: string): number {
  const m = route.match(/room\.(\d+)/i);
  return m ? Number(m[1]) : 0;
}
