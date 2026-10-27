export const siteConfig = {
  name: 'Toby McGuire',
  title: 'Toby McGuire — Software Engineer · Simulation, Test Automation, Systems',
  description:
    'Toby McGuire — software engineer at Boeing working in modeling & simulation and automated integration testing.',
  url: 'https://tobymcguire.net',
  github: 'https://github.com/tobymcguire0',
  itch: 'https://toblet.itch.io',
  email: 'tobymcguire461@gmail.com',
  // Leave empty to point LinkedIn links at the contact section instead.
  linkedin: 'https://www.linkedin.com/in/toby-mcguire/' as string,
  resume: '/resume/Toby-McGuire-Resume.pdf',
  photo: '/images/personal/profile.jpg',
} as const;

export const linkedinLink: { href: string; target?: string; rel?: string; title?: string } =
  siteConfig.linkedin
    ? { href: siteConfig.linkedin, target: '_blank', rel: 'noopener' }
    : { href: '/#contact', title: 'LinkedIn URL not set yet' };
