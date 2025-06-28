
/**
 * During pageload, there's a window of time in which we've streamed SSR'ed
 * components to the client, but not yet downloaded and run the javascript
 * bundle. By default, any events (ie clicks) during this time would be lost.
 * For clicks that are on <a> tags, this has an acceptable fallback (they have
 * an href, so the click is handled by following the link). But for clicks that
 * are supposed to do things other than navigate, this doesn't work.
 *
 * To address this, we inject a small script which captures and stores events.
 * After calling `hydrateClient`, we replay them. This makes it so that clicks
 * may be delayed until the page is done downloading, but they aren't lost.
 *
 * This hack is particularly motivated by the notifications icon, which users
 * are relatively likely to click on immediately. This also works for front
 * page tabs (Recent/Enriched/Recommended/Susbcribed/etc) and for anything else
 * that's clickable but not a link.
 */
export const eventCaptureScript = `<script>(function(){ const q=[]; const types=['click']; const cap=e=>q.push(e); types.forEach(t=>document.addEventListener(t,cap,true)); window.__replayEvents=()=>{ types.forEach(t=>document.removeEventListener(t,cap,true)); q.forEach(e=>{ const evt=new e.constructor(e.type,e); e.target.dispatchEvent(evt)})}})()</script>`;
