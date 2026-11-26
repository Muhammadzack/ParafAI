# Paraf AI

[Studio](https://ruang-agen.vercel.app/) · [Dashboard VPS & Hermes](https://ruang-agen.vercel.app/operasional/)

An Indonesian-language workspace for researching creative bounties with Hermes. The Studio runs on mobile and desktop. The rotating wireframe, platform cards and dashboard transitions respect reduced-motion settings. The pause button controls motion on both screens.

## Demo for the OpenServ team

1. In Studio, open **Bounty pilihan → Minta riset Hermes**. Copy the research request into a Hermes session, then import its JSON reply with **Impor hasil Hermes**. Results are saved in that browser.
2. Inspect the official listing link, evidence, deadline and last check. An open listing can become a local task. The archived Nosana example shows the closed state. Refreshing the page preserves imported results.
3. Open **Operasional** to inspect agents and services. The initial dashboard is labeled **Data contoh**. A user-configured JSON feed supplies actual VPS snapshots.

### Integration feedback

During setup, Hermes reached the SERV Reasoning models endpoint but displayed “0 model(s) visible”. The model field then required a manually entered ID. The OpenServ quickstart shows the exact model ID and Chat Completions format. A copyable Hermes configuration and a one-request check in the console would make it easier to distinguish model discovery from successful inference.

[OpenServ quickstart](https://docs.openserv.ai/serv-reasoning/introduction)

### Deployment

Serve the contents of `dist/` for the browser-only demo. Deploy the repository root on Vercel to include `api/riset-bounty.js`. Direct VPS research requires server-side environment variables `HERMES_BASE_URL` (HTTPS base ending in /v1), `HERMES_API_KEY` (Hermes gateway credential) and `PARAF_STUDIO_PASSWORD`. The SERV model key belongs on the VPS. The copy/import demo works independently of this connection.

## License

[MIT](LICENSE) · Copyright 2026 Muhammadzack.
