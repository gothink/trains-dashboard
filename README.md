# Train Tracker

Live version: https://trains.gothink.dev

This is essentially an alternate frontend to https://tsimobile.viarail.ca. I am not affiliated in any way with VIA, use at your own discretion.

## What is this?

This is web app that consumes VIA Rail's single API endpoint for their live train tracking web app. The VIA app only allows you to view the status of a single train at a time, even though the endpoint pulls in data for every VIA train that day on every call.

Train Tracker allows you to view and track all currently operating trains, past trains or scheduled trains. Filter by train number, station stops or by zooming/panning the map. When tracking a single train, Train Tracker will still show and update nearby trains and stations.

## Background

Recently, I was poking around in DevTools on VIA's live train tracking web app to see if I could just grab the ETA of a train for a specific station stop. What I found instead was that the current dashboard makes a call to a _single endpoint_ that returns a massive JSON object with an entry for _every_ VIA train operating that day -- every 15 seconds! This means even if you've navigated to, say, https://tsimobile.viarail.ca/#5 to view the status for train #5, the dashboard dutifully pulls down the entire JSON object. Even the trains that aren't running.

I solved my immediate problem with a bit of `curl` piped to `jq`, but it got me thinking about how simple it would be to build a full interactive dashboard. For starters, all the data I could ever need is just a single API call away.

Check out ==the blog post== for some more background and details on how it was built.

## Stack

- Vue.js
  - SPA app built with vue-router and pinia
- Leaflet
  - OpenStreetMaps + OpenRailwayMap tiles
- Tailwind CSS
- Cloudflare Pages
  - Cloudflare Pages Functions for proxying requests to the VIA Rail API and getting station info from KV
  - Configured with custom domain to allow for custom cache control to reduce load on VIA's endpoint
- Cloudflare Workers
  - Scheduled worker calls the overpass.de API to fetch a list of all train stations in Canada
  - Runs every 24 hours, stores data in Workers KV

## License

MIT