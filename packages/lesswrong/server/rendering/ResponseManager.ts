import type { Request, Response } from 'express';
import { Writable } from 'node:stream';

export class ResponseForwarderStream extends Writable {
  private res: Response
  private corked: boolean;
  private _data: string[] = [];

  constructor({res, corked}: {
    res: Response,
    corked: boolean
  }) {
    super();
    this.res = res;
    this.corked = corked;
  }

  _write(chunk: any, _encoding: string, callback: (error?: Error|null) => void) {
    if (!this.corked) {
      this.res.write(chunk);
    }
    this._data.push(chunk);
    callback();
  }
  
  uncork() {
    if (this.corked) {
      this.corked = false;
      for (const chunk of this._data) {
        this.res.write(chunk);
      }
    }
  }

  public getString(): string {
    return this._data.join('');
  }
}
