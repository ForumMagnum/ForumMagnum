
function serviceWorkerMain() {
  self.addEventListener('activate', (event) => {
    void loadScaffoldPage();
  });
  self.addEventListener('install', (event) => {
    const installEvent = (event as any);
    installEvent.waitUntil(loadScaffoldPage());
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
    
    
    if (parsedUrl.pathname === '/') {
      fetchEvent.respondWith(getScaffoldPageResponse());
    }
  });
}

async function getScaffoldPageResponse() {
  const scaffoldResponse = await getScaffoldHtml();
  if (scaffoldResponse) {
    return scaffoldResponse;
  } else {
    await loadScaffoldPage();
    return await getScaffoldHtml();
  }
}

async function loadScaffoldPage() {
  const cache = await caches.open('v1');
  await cache.add('/preloadScaffold?route=home');
}

async function getScaffoldHtml() {
  const cache = await caches.open('v1');
  const scaffoldCache = await cache.match('/preloadScaffold?route=home');
  return scaffoldCache ?? null;
}

serviceWorkerMain();
