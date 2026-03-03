import { IRouteParser, RouteLocation } from './NetRouterTypes';

export class DefaultRouteParser implements IRouteParser {
  public parse(route: string): RouteLocation {
    const tableMatch = route.match(/(?:^|[./:_-])table(?:[./:_-])?(\d+)/i);
    const roomMatch = route.match(/(?:^|[./:_-])room(?:[./:_-])?(\d+)/i);

    return {
      tableId: tableMatch ? Number(tableMatch[1]) : undefined,
      roomId: roomMatch ? Number(roomMatch[1]) : undefined,
    };
  }
}

