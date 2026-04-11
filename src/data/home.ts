export const homeContent = {
  hero: {
    greeting: "Hi, I'm Toby McGuire",
    tagline: 'Software Developer & Game Developer',
    intro:
      "I build polished software and ship games. Whether it's a full-stack web app or a multiplayer fighting game, I care about clean design, solid architecture, and getting things out the door.",
    primaryCta: { label: 'View Projects', href: '/projects' },
    secondaryCta: { label: 'Play My Games', href: '/games' },
  },
  sections: {
    projects: {
      heading: 'Software Projects',
      subheading: 'Selected work from my software development portfolio.',
    },
    games: {
      heading: 'Games',
      subheading: 'Published games and ongoing game development work.',
    },
  },
} as const;
