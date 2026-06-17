export interface IClientChannel {
  send(data: Uint8Array): void;
}

type BunWs = { send(data: Uint8Array): number | void };

export class BunWsChannel implements IClientChannel {
  private ws: BunWs;

  constructor(raw: unknown) {
    this.ws = raw as BunWs;
  }

  send(data: Uint8Array): void {
    this.ws.send(data);
  }
}
