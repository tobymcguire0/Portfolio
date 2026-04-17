export const homeContent = {
  hero: {
    greeting: "Hi, I'm Toby McGuire",
    tagline: 'Software Engineer',
    subline: 'AI, Automation, Systems',
    intro:
      "I build software that works in the real world. I'm drawn to problems where code has physical consequences: robotics, autonomous systems, AI, and anything I can learn from. I also make games.",
    primaryCta: { label: 'View My Work', href: '/projects' },
    secondaryCta: { label: 'Play My Games', href: '/games' },
  },
  sections: {
    projects: {
      heading: 'Software Projects',
      subheading: 'Selected engineering work from my portfolio.',
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
