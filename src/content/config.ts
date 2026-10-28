import { defineCollection, z } from 'astro:content';

// Frontmatter for an entry's case study page (/projects/<slug> or /games/<slug>).
// Entries without one are only listed on the homepage.
const caseStudy = z.object({
  title: z.string(),
  description: z.string().optional(),
  navLabel: z.string(),
  nextLabel: z.string().optional(),
  kicker: z.string(),
  headline: z.string(),
  // May contain inline HTML such as <i>.
  lede: z.string(),
  icon: z.string().optional(),
  iconAlt: z.string().optional(),
  meta: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      mono: z.boolean().default(false),
    }),
  ),
  actions: z
    .array(
      z.object({
        label: z.string(),
        href: z.string().url(),
        primary: z.boolean().default(false),
      }),
    )
    .default([]),
  figures: z.array(z.object({ value: z.string(), caption: z.string() })).default([]),
  toc: z.array(z.object({ id: z.string(), label: z.string() })),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    stack: z.array(z.string()),
    github: z.string().url().optional(),
    live: z.string().url().optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    role: z.string().optional(),
    label: z.string().optional(),
    // One-line homepage row for projects without a case study. May contain inline HTML.
    summary: z.string().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(99),
    private: z.boolean().default(false),
    caseStudy: caseStudy.optional(),
  }),
});

const games = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pitch: z.string(),
    genre: z.string(),
    platform: z.string(),
    label: z.string().optional(),
    itchUrl: z.string().url().optional(),
    github: z.string().url().optional(),
    steam: z.string().url().optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    screenshots: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    order: z.number().default(99),
    private: z.boolean().default(false),
    caseStudy: caseStudy.optional(),
  }),
});

const now = defineCollection({
  type: 'content',
  schema: z.object({
    date: z.date(),
    title: z.string().optional(),
  }),
});

export const collections = { projects, games, now };
