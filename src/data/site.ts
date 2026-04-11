export const siteConfig = {
  name: 'Toby McGuire',
  title: 'Toby McGuire — Software & Game Developer',
  description:
    'Portfolio of Toby McGuire, a software developer and game developer building polished applications and games.',
  url: 'https://tobymcguire.net',
  github: 'https://github.com/tobymcguire0',
  itch: 'https://toblet.itch.io',
  email: 'tobymcguire461@gmail.com',
  nav: [
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/projects' },
    { label: 'Games', href: '/games' },
    { label: 'Resume', href: '/resume' },
    { label: 'About', href: '/about' },
    { label: 'Now', href: '/now' },
    { label: 'Contact', href: '/contact' },
  ],
  social: [
    { label: 'GitHub', href: 'https://github.com/tobymcguire0', icon: 'github' },
    { label: 'itch.io', href: 'https://toblet.itch.io', icon: 'itch' },
    { label: 'Email', href: 'mailto:tobymcguire461@gmail.com', icon: 'email' },
  ],
} as const;
