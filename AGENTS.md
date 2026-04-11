# Repository Guidelines

## Project Structure

```
Portfolio/
├── src/
│   ├── components/       # Reusable Astro components
│   │   ├── layout/       # Header, Footer
│   │   ├── seo/          # SEO meta component
│   │   └── shared/       # ProjectCard, GameCard, SectionHeading
│   ├── content/          # Content collections (Markdown)
│   │   ├── projects/     # Software project entries
│   │   ├── games/        # Game entries
│   │   └── now/          # Now page updates
│   ├── data/             # Static data (site config, homepage content)
│   ├── layouts/          # BaseLayout wrapper
│   ├── lib/              # Utility functions (GitHub API, etc.)
│   └── pages/            # Astro page routes
├── public/               # Static assets (favicon, resume PDF)
├── astro.config.mjs      # Astro config with Tailwind + Sitemap
└── tailwind.config.mjs   # Tailwind theme (custom colors, fonts)
```

## Build & Development Commands

| Command           | Purpose                          |
|-------------------|----------------------------------|
| `npm run dev`     | Start dev server on localhost    |
| `npm run build`   | Production static build to dist/ |
| `npm run preview` | Preview the production build     |
| `npm run check`   | Run Astro type checking          |
| `npm run lint`    | Alias for `astro check`         |

## Coding Conventions

- **Language**: TypeScript (strict mode via `astro/tsconfigs/strict`)
- **Indentation**: 2 spaces
- **Components**: PascalCase `.astro` files
- **Content files**: kebab-case Markdown in `src/content/`
- **Styling**: Tailwind CSS utility classes; custom colors defined in `tailwind.config.mjs` under `primary` and `surface` scales

## Content Model

Add new projects or games by creating `.md` files in the corresponding `src/content/` directory. Frontmatter schemas are defined in `src/content/config.ts`. Featured items appear on the homepage; set `featured: true` and `order` to control placement.

## Commit Conventions

Use imperative mood: `feat: add project card hover effect`, `fix: correct nav link on mobile`.
Common types: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`.
