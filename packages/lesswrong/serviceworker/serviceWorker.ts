
function serviceWorkerMain() {
  console.log("In serviceWorkerMain");
  self.addEventListener('activate', (event) => {
    void loadScaffoldPage();
  });
  self.addEventListener('install', (event) => {
    event.waitUntil(loadScaffoldPage());
  });
  self.addEventListener('fetch', (event) => {
    const fetchEvent = (event as any);
    const method: string = fetchEvent.request.method;
    const urlStr: string = fetchEvent.request.url;
    
    if (method !== 'GET')
      return;
    const parsedUrl = new URL(urlStr);
    const parsedOrigin = new URL(globalThis.origin);
    if (parsedUrl.hostname !== parsedOrigin.hostname)
      return;
    
    console.log(`Service worker fetch: ${parsedUrl.pathname}`);
    
    if (parsedUrl.pathname === '/') {
      fetchEvent.respondWith(getScaffoldPageResponse());
    }
  });
}

async function getScaffoldPageResponse() {
  const scaffoldResponse = await getScaffoldHtml();
  if (scaffoldResponse) {
    console.log("Responding with scaffold page");
    return scaffoldResponse;
  } else {
    console.log("Scaffold page not loaded");
    await loadScaffoldPage();
    return await getScaffoldHtml();
    // TODO: pass along the request
  }
}

let scaffoldHtml: string|null = null;

async function loadScaffoldPage() {
  const cache = await caches.open('v1');
  cache.add('/preload-scaffold');
}

async function getScaffoldHtml() {
  const cache = await caches.open('v1');
  const scaffoldCache = await cache.match('/preload-scaffold');
  return scaffoldCache ?? null;
}

serviceWorkerMain();
