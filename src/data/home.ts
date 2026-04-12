export const homeContent = {
  hero: {
    greeting: "Hi, I'm Toby McGuire",
    tagline: 'Software Developer',
    intro:
      "I create things people enjoy. Whether it's a full-stack web app or a multiplayer fighting game, I care about clean design, solid architecture, and getting things out the door.",
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
  photos:{
    icon: 'images/personal/profile.jpg',
    marathon: 'images/personal/marathon.jpeg',
    vab: 'images/personal/vab.jpeg',
    cats: 'images/personal/cats.jpeg'
  }
} as const;
