export const onRequestGet: PagesFunction = async (context) => {
  const VIA_URL = `https://tsimobile.viarail.ca/data/allData.json`;

  let request = new Request(VIA_URL, context.request);

  request.headers.set("Origin", new URL(VIA_URL).origin);

  const cache = caches.default;

  let response = await cache.match(request);

  if (!response) {
    console.log(`cache miss`);

    response = await fetch(request);
    response = new Response(response.body, response);
    response.headers.set("Access-Control-Allow-Origin", context.request.url);
    response.headers.append("Vary", "Origin");
    response.headers.set("Cache-Control", "max-age=30");

    context.waitUntil(cache.put(request, response.clone()));
  } else {
    console.log(`cache hit`);
  }

  return response;
};