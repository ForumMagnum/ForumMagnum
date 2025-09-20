import React from 'react';
import type { Request, Response } from 'express';
import { Writable } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { toEmbeddableJson } from '@/lib/utils/jsonUtils';
import { createServerInsertedHtmlContext, type ServerInsertedHtml, ServerInsertedHtmlContext } from '@/components/hooks/useServerInsertedHtml';

const debugStreamTiming = false;

export class ResponseManager {
  res: Response
  startTimeMs: number
  status: number|null = null;
  prefetchHeader: string|null
  headBlockElements: string[] = []
  body: ResponseForwarderStream|string|null = null
  footerElements: string[] = []
  generateStructuredData: (() => Record<string,AnyBecauseHard>)|null = null;
  structuredData: (Record<string,AnyBecauseHard>)|null = null;

  aborted = false
  httpHeadersClosed = false;
  prefetchHeaderSent = false;
  headBlockClosed = false;
  headBlockSent = false;
  bodyClosed = false;
  bodyUncorked = false;
  bodyFinished = false;
  footerClosed = false;
  footerSent = false;
  structuredDataSent = false;

  constructor(res: Response) {
    this.res = res;
    this.startTimeMs = new Date().getTime();

    res.setHeader("X-Accel-Buffering", "no"); // force nginx to send start of response as soon as available
  }


  setHeader(header: string, value: string) {
    if (this.httpHeadersClosed) {
      this._errorTooLate(`Tried to set ${header} after headers were already closed`);
      return;
    }
    this.res.setHeader(header, value);
  }

  setStatus(status: number) {
    if (status === this.status) {
      return;
    }
    if (this.httpHeadersClosed) {
      this._errorTooLate(`Tried to set status ${status} after headers were already closed`);
      return;
    }
    this.status = status;
    this.res.status(status);
  }

  redirect(status: number, absoluteUrl: string) {
    if (this.httpHeadersClosed) {
      this._errorTooLate(`Tried to redirect after headers were already closed`);
      return;
    }
    this.res.status(status).redirect(absoluteUrl);
  }

  commitToNotUpdateHeaders() {
    if (!this.httpHeadersClosed) {
      this.httpHeadersClosed = true;
      this._sendReadyComponents();
    }
  }


  setPrefetchHeader(prefetchHeader: string) {
    this.prefetchHeader = prefetchHeader;
    this._sendReadyComponents();
  }

  addToHeadBlock(html: string) {
    if (this.headBlockClosed) {
      this._errorTooLate(`Tried to add to head block after headers were already closed`);
      return;
    }
    this.headBlockElements.push(html);
  }

  commitToNotAddToHeadBlock() {
    if (!this.headBlockClosed) {
      this.headBlockClosed = true;
      this._sendReadyComponents();
    }
  }
  
  async addBodyStream(Body: React.ReactNode): Promise<string> {
    if (this.body) {
      this._errorTooLate(`Response body was already set`);
      return "";
    }
    if (this.aborted) {
      this._errorTooLate(`Response was aborted`);
      return "";
    }
    
    const serverInsertedHtmlContext = createServerInsertedHtmlContext();
    const WrappedBody = <ServerInsertedHtmlContext.Provider value={serverInsertedHtmlContext}>
      {Body}
    </ServerInsertedHtmlContext.Provider>

    const bodyStream = this.body = new ResponseForwarderStream({
      res: this.res,
      corked: true,
      startTimeMs: this.startTimeMs,
      serverInsertedHtmlProvider: serverInsertedHtmlContext,
    });
    await new Promise<void>((resolve) => {
      const reactPipe = renderToPipeableStream(WrappedBody, {
        onAllReady: () => {
          this.bodyFinished = true;
          resolve();
        },
      });
      reactPipe.pipe(bodyStream);
    });
    return bodyStream.getString();
  }
  
  addBodyString(bodyString: string) {
    if (this.body) {
      this._errorTooLate(`Response body was already set`);
      return "";
    }

    this.body = bodyString;
  }

  addToFooter(html: string) {
    if (this.footerClosed) {
      this._errorTooLate(`Tried to add to footer after footer was already clsoed`);
      return;
    }
    this.footerElements.push(html);
  }
  
  commitToNotAddToFootBlock() {
    if (!this.footerClosed) {
      this.footerClosed = true;
      this._sendReadyComponents();
    }
  }
  
  isAborted(): boolean {
    return this.aborted || this.res.closed;
  }
  abort(status: number) {
    if (!this.httpHeadersClosed) {
      this.res.status(status);
    }
    this.aborted = true;
    this.httpHeadersClosed = this.headBlockClosed = this.bodyClosed = this.footerClosed = true;
    this.res.end();
  }

  _sendReadyComponents() {
    if (!this.httpHeadersClosed) return;
    if (!this.status) return;
    
    if (!this.prefetchHeader) return;
    if (!this.prefetchHeaderSent) {
      this._sendPrefetchHeaders();
    }
    if (!this.headBlockClosed) return;
    if (!this.headBlockSent) {
      this._sendHeadBlock();
    }
    if (!this.body) return;
    if (!this.bodyUncorked) {
      this._uncorkBody();
    }
    if (!this.bodyFinished) return;
    if (!this.footerClosed) return;
    if (!this.footerSent) {
      this._sendFooter();
    }
    if (!this.structuredDataSent) {
      this._sendStructuredData();
    }
    this.res.end();
  }
  
  _warnNotReadyComponents() {
    if (!this.httpHeadersClosed) console.error("HTTP headers not closed"); //eslint-disable-line no-console
    if (!this.status) console.error("Status not set"); //eslint-disable-line no-console
    if (!this.prefetchHeader) console.error("Prefetch header not set"); //eslint-disable-line no-console
    if (!this.headBlockClosed) console.error("Head block not closed"); //eslint-disable-line no-console
    if (!this.body) console.error("Body not set"); //eslint-disable-line no-console
    if (!this.footerClosed) console.error("Footer not closed"); //eslint-disable-line no-console
  }

  _sendPrefetchHeaders() {
    this._write(`<!doctype html>\n<html lang="en">\n<head>${this.prefetchHeader}`);
    this.prefetchHeaderSent = true;
  }
  
  _sendHeadBlock() {
    this._write(`${this.headBlockElements.join("")}</head>`);
    this.headBlockSent = true;
  }

  _uncorkBody() {
    if (this.body) {
      this.bodyUncorked = true;
      if (typeof this.body === 'string') {
        this._write(this.body);
        this.bodyFinished = true;
        this._sendReadyComponents();
      } else {
        this.body.uncork();
      }
    }
  }
  
  _sendFooter() {
    this._write(this.footerElements.join(""));
    this.footerSent = true;
  }
  
  setStructuredData(generate: () => Record<string,AnyBecauseHard>) {
    this.generateStructuredData = generate;
  }
  getStructuredData(): Record<string,AnyBecauseHard>|null {
    if (!this.structuredData && this.generateStructuredData) {
      this.structuredData = this.generateStructuredData();
    }
    return this.structuredData;
  }

  _sendStructuredData() {
    if (!this.structuredData && this.generateStructuredData) {
      this.structuredData = this.generateStructuredData();
    }
    this.structuredDataSent = true;
    if (this.structuredData) {
      this._write(`<script type="application/ld+json">${toEmbeddableJson(this.structuredData)}</script>`);
    }
  }

  _write(data: string) {
    if (debugStreamTiming) {
      this.res.write(`<!-- ${new Date().getTime() - this.startTimeMs}ms -->`);
      // eslint-disable-next-line no-console
      console.log(`Wrote ${data.length}b`);
    }
    this.res.write(data);
  }
  
  async sendAndClose(): Promise<void> {
    if (this.aborted) {
      return;
    }
    this.commitToNotUpdateHeaders();
    this.commitToNotAddToHeadBlock();
    this.commitToNotAddToFootBlock();
    if (!this.body) {
      // eslint-disable-next-line no-console
      console.error("Closing request but no body was provided");
    }
    
    this._warnNotReadyComponents();
    this._sendReadyComponents();
  }
  
  _errorTooLate(message: string) {
    // eslint-disable-next-line no-console
    console.error(message);
  }
}

export class ResponseForwarderStream extends Writable {
  private res: Response
  private corked: boolean;
  private pendingData: string[] = [];
  private pendingServerInsertedHtml: string[] = [];
  private allChunks: string[] = [];
  private startTimeMs: number
  private serverInsertedHtmlProvider: ServerInsertedHtml

  constructor({res, corked, startTimeMs, serverInsertedHtmlProvider}: {
    res: Response,
    corked: boolean
    startTimeMs: number
    serverInsertedHtmlProvider: ServerInsertedHtml
  }) {
    super();
    this.res = res;
    this.corked = corked;
    this.startTimeMs = startTimeMs;
    this.serverInsertedHtmlProvider = serverInsertedHtmlProvider;
  }

  _write(chunk: any, _encoding: string, callback: (error?: Error|null) => void) {
    this.pendingData.push(chunk);
    if (this.serverInsertedHtmlProvider.callbacks.length > 0) {
      for (const callback of this.serverInsertedHtmlProvider.callbacks) {
        const insertedHtml = callback();
        if (insertedHtml) {
          this.pendingServerInsertedHtml.push(insertedHtml);
        }
      }
    }
    
    this.waitForInsertionPointAndFlush();

    callback();
  }
  
  waitForInsertionPointAndFlush() {
    // When injecting into a response stream, we need to find a safe place to
    // perform the injection; if we insert at any arbitrary block boundary,
    // we could be in the middle of an HTML tag, or a React Suspense script,
    // etc. The rule for when it' safe to inject, apparently, is that React
    // can write blocks that aren't safe to inject in between, but only
    // synchronously, ie, it will never yield to the nodejs event loop in
    // between two writes if injection in between those writes is unsafe. This
    // behavior is not documented, but nextjs relied on it and then all the
    // other libraries that do content injection reverse-engineered the nextjs
    // implementation and copied this property.
    //
    // See:
    //   https://github.com/brillout/react-streaming/tree/main/src
    //   https://github.com/apollographql/apollo-client-integrations/issues/325#issuecomment-2205375796
    if (this.pendingServerInsertedHtml.length > 0) {
      setImmediate(() => this.flush());
    } else {
      this.flush();
    }
  }
  
  flush() {
    const newChunks = [...this.pendingServerInsertedHtml, ...this.pendingData];
    this.pendingData = [];
    this.pendingServerInsertedHtml = [];
    this.allChunks.push(...newChunks);
    
    if (!this.corked) {
      if (debugStreamTiming) {
        this.res.write(`<!-- ${new Date().getTime() - this.startTimeMs}ms -->`);
        for (const newChunk of newChunks) {
          // eslint-disable-next-line no-console
          console.log(`Wrote ${newChunk.length}b`);
        }
      }
      for (const newChunk of newChunks) {
        this.res.write(newChunk);
      }
    }
  }
  
  uncork() {
    if (this.corked) {
      this.corked = false;
      if (debugStreamTiming) {
        this.res.write(`<!-- ${new Date().getTime() - this.startTimeMs}ms -->`);
      }
      for (const chunk of this.allChunks) {
        this.res.write(chunk);
      }
    }
  }

  public getString(): string {
    return this.allChunks.join('');
  }
}

