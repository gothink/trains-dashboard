# Unofficial VIA Rail Dashboard

This is essentially an alternate frontend to https://tsimobile.viarail.ca. I am not affiliated in any way with VIA, use at your own discretion.

## Why?

I wanted to see how the current dashboard makes API calls to see if I could get just the data I wanted (ETA for a specific train that was currently delayed) on request, instead of having to leave the dashboard open.

I noticed the current dashboard makes a call to a single endpoint that returns a massive JSON object with an entry for _every_ VIA train -- every 15 seconds! This means even if you've navigated to, say, https://tsimobile.viarail.ca/#5 to view the status for train #5, the dashboard dutifully pulls down the entire JSON object. Even the trains that aren't running.

I solved my immediate problem with a bit of `curl` piped to `jq`, but it got me thinking about how simple it would be to build a full interactive dashboard. For starters, all the data I could ever need is just a single API call away.

## How

- Cloudflare Pages
  - CF Pages Functions allow me to make calls to the VIA API since the CORS headers aren't set
  - I am able to leverage CF's cache, reducing the load on the VIA API. (They use AWS Cloudfront for cache, ... )
  - KV or D1 may also be useful if I decide to expand the app by making the internal API more granular
- Vue.js
- OpenLayers Map (via `vue3-openlayers`)

## License

MIT