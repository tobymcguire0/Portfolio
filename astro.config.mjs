import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: 'https://tobymcguire.net',
  integrations: [tailwind(), sitemap()],
  // Pages folded into the single-page home in the 2026 redesign; keeps old shared links working.
  redirects: {
    '/about': '/#about',
    '/contact': '/#contact',
    '/now': '/',
    '/resume': '/resume/Toby-McGuire-Resume.pdf',
    '/projects': '/#projects',
    '/games': '/#projects',
    // Old detail pages for entries that no longer have a case study. Remove a line here if that
    // entry gets a `caseStudy` again, or the redirect will shadow its page.
    '/projects/procedural-generation': '/#projects',
    '/projects/world-traveller-shader': '/#projects',
    '/games/adapt': '/#projects',
    '/games/c-rpg': '/#projects',
    '/games/legendarium': '/#projects',
    '/games/transmission': '/#projects',
    '/games/we-lost-the-game': '/#projects',
  },
  // Case study copy is written with straight quotes, matching the design source.
  markdown: { smartypants: false },
  output: "hybrid",
  adapter: cloudflare()
});