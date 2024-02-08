export const onRequestGet: PagesFunction = async (context) => {
  const VIA_URL = `https://tsimobile.viarail.ca/data/allData.json`;

  let request = new Request(VIA_URL, context.request);

  request.headers.set("Origin", new URL(VIA_URL).origin);

  const cacheKey = new Request(VIA_URL, request);
  // const cache = caches.default;

  let response = await fetch(request, {
    cf: {
      cacheTtl: 30,
      cacheEverything: true,
      cacheKey: cacheKey.url,
    }
  });

  // if (!response) {
  //   console.log(`cache miss`);
    // response = await fetch(request, {
    //   cf: {
    //     cacheTtl: 30,
    //     cacheEverything: true,
    //     cacheKey: cacheKey.url,
    //   }
    // });

    // response = new Response(response.body, response);
    // response.headers.set("Access-Control-Allow-Origin", context.request.url);
    // response.headers.append("Vary", "Origin");
    // response.headers.set("Cache-Control", "max-age=30");
    // response.headers.delete("ETag");

    // context.waitUntil(cache.put(cacheKey, response.clone()));
  // }
  // console.log(context.request.cf.latitude, context.request.cf.longitude);  
  return response;
};