import { create as createStream } from "combined-stream2";

export class ServerSink {
  constructor(request, arch) {
    this.request = request;
    this.arch = arch;
    this.head = "";
    this.body = "";
    this.htmlById = Object.create(null);
    this.maybeMadeChanges = false;
    this.statusCode = null;
    this.responseHeaders = {};
  }

  appendToHead(html) {
    if (appendContent(this, "head", html)) {
      this.maybeMadeChanges = true;
    }
  }

  appendToBody(html) {
    if (appendContent(this, "body", html)) {
      this.maybeMadeChanges = true;
    }
  }

  appendToElementById(id, html) {
    if (appendContent(this.htmlById, id, html)) {
      this.maybeMadeChanges = true;
    }
  }

  renderIntoElementById(id, html) {
    this.htmlById[id] = "";
    this.appendToElementById(id, html);
  }

  redirect(location, code = 301) {
    this.maybeMadeChanges = true;
    this.statusCode = code;
    this.responseHeaders.Location = location;
  }

  // server only methods
  setStatusCode(code) {
    this.maybeMadeChanges = true;
    this.statusCode = code;
  }

  setHeader(key, value) {
    this.maybeMadeChanges = true;
    this.responseHeaders[key] = value;
  }

  getHeaders() {
    return this.request.headers;
  }

  getCookies() {
    return this.request.cookies;
  }
}

export function isReadable(stream) {
  return (
    stream !== null &&
    typeof stream === 'object' &&
    typeof stream.pipe === 'function' &&
    stream.readable !== false &&
    typeof stream._read === 'function' &&
    typeof stream._readableState === 'object'
  );
}

function appendContent(object, property, content) {
  let madeChanges = false;

  if (Array.isArray(content)) {
    content.forEach(elem => {
      if (appendContent(object, property, elem)) {
        madeChanges = true;
      }
    });
  } else if (isReadable(content)) {
    object[property] = catenateStringsOrStreams(object[property], content);
    madeChanges = true;
  } else if ((content = content && content.toString("utf8"))) {
    object[property] = (object[property] || "") + content;
    madeChanges = true;
  } 
  return madeChanges;
}

// Given two things which are each either strings, streams, or null,
// concatenate them, resulting in either a string or a readable stream.
//
// Note that using this many times would be a "Shlemiel the Painter" algorithm,
// and not performant.
export function catenateStringsOrStreams(first, second) {
  // Handle case where either argument is null. (In that case return the
  // non-null one, or empty string.)
  if (!first && !second) return "";
  else if (!first) return second;
  else if (!second) return first;

  // Handle case where both are strings. In that case, catenate them together.
  if (typeof first==='string' && typeof second==='string')
    return first+second;

  // Otherwise use combined-stream2 to make a stream that plays back the first
  // followed by the second.
  const stream = createStream();
  stream.append(first);
  stream.append(second);
  return stream;
}
