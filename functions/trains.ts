export const onRequestGet: PagesFunction = async (context) => {
  const VIA_URL = `https://tsimobile.viarail.ca/data/allData.json`;

  let request = new Request(VIA_URL, context.request);
  console.log(request.cf.latitude, request.cf.longitude);
  request.headers.set("Origin", new URL(VIA_URL).origin);

  const cacheKey = new Request(VIA_URL, request);
  const cache = caches.default;

  let response = await cache.match(cacheKey);

  if (!response) {
    response = await fetch(request);

    response = new Response(response.body, response);
    response.headers.set("Access-Control-Allow-Origin", context.request.url);
    response.headers.append("Vary", "Origin");
    response.headers.append("Cache-Control", "s-maxage=30");

    context.waitUntil(cache.put(cacheKey, response.clone()));
  }
  
  return response;
};