import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server } from 'ws';

export type WsEvent = 'videos' | 'watchLater' | 'history';

@WebSocketGateway()
export class EventsGateway {
  @WebSocketServer()
  private server!: Server;

  broadcast(event: WsEvent) {
    this.server?.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(event);
      }
    });
  }
}
