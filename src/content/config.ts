import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    stack: z.array(z.string()),
    github: z.string().url().optional(),
    live: z.string().url().optional(),
    image: z.string().optional(),
    role: z.string().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(99),
    private: z.boolean().default(false),
  }),
});

const games = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pitch: z.string(),
    genre: z.string(),
    platform: z.string(),
    itchUrl: z.string().url().optional(),
    github: z.string().url().optional(),
    steam: z.string().url().optional(),
    image: z.string().optional(),
    screenshots: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    order: z.number().default(99),
    private: z.boolean().default(false),
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
