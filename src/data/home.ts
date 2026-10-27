interface Figure {
  value: string;
  caption: string;
}

interface SpecItem {
  label: string;
  value: string;
  mono?: boolean;
}

interface Job {
  company: string;
  when: string;
  location: string;
  title: string;
  duties: string[];
  stack: string[];
  figures: Figure[];
}

interface StackRow {
  label: string;
  items: string[];
}

interface HomeContent {
  hero: { role: string; headline: string; lede: string; resumeCta: string };
  spec: SpecItem[];
  work: { heading: string; linkLabel: string; jobs: Job[] };
  projects: { heading: string; gamesRow: { title: string; go: string } };
  tools: { heading: string; rows: StackRow[] };
  about: { photo: string; photoAlt: string; caption: string; heading: string; lede: string; aside: string };
  contact: { heading: string; lede: string };
}

export const homeContent: HomeContent = {
  hero: {
    role: 'Software Engineer',
    headline: 'I build software that has impact.',
    lede: 'Modeling & simulation and automated integration testing for flight vehicle software, validated against real sensor data. On my own time I ship multiplayer videogames, ML pipelines, and cloud apps.',
    resumeCta: 'Download resume (PDF)',
  },
  spec: [
    { label: 'Now', value: 'Boeing, 2023–present' },
    { label: 'Focus', value: 'Modeling, Simulation, Automation' },
    { label: 'Languages', value: 'C++ C# Python TS', mono: true },
    { label: 'Certified', value: 'AWS Cloud Practitioner' },
  ],
  work: {
    heading: "Where I've shipped",
    linkLabel: 'Full history in the PDF',
    jobs: [
      {
        company: 'Boeing',
        when: '2023 – present',
        location: 'Florida',
        title: 'Software Engineer — Simulation & integration test',
        duties: [
          'Developed automated integration tests that validate vehicle software against real sensor data.',
          'Designed automation tools that cut rework in half and eliminated months of manual effort.',
          'Selected for multiple high-priority cross-functional teams spanning subsystems and infrastructure.',
        ],
        stack: ['C++', 'Modeling & sim', 'Integration testing', 'Large codebases'],
        figures: [
          { value: '−50%', caption: 'rework, via automation tooling' },
          { value: 'Months', caption: 'of manual effort eliminated' },
        ],
      },
      {
        company: 'Nauticus Robotics',
        when: '2022',
        location: 'Houston, TX',
        title: 'Software Engineer — Synthetic data & computer vision',
        duties: [
          'Built a Blender-based synthetic data pipeline generating labeled training images for underwater object detection.',
          'Automated the stereo image processing pipeline.',
          'Implemented conic reconstruction algorithms from published research for real-world CV deployment.',
        ],
        stack: ['Python', 'Blender', 'TensorFlow', 'YOLOv5'],
        figures: [
          { value: '3,000+', caption: 'labeled training images generated per hour' },
          { value: '+30%', caption: 'object detection confidence in low visibility environments' },
        ],
      },
    ],
  },
  projects: {
    heading: 'Building things with purpose',
    gamesRow: { title: 'Shipped games', go: 'itch.io' },
  },
  tools: {
    heading: 'Tools',
    rows: [
      { label: 'Languages', items: ['C++', 'C', 'C#', 'Python', 'TypeScript', 'Java'] },
      { label: 'ML / AI', items: ['TensorFlow', 'YOLOv5', 'NumPy', 'Computer vision', 'Claude API', 'PyTorch (learning)'] },
      { label: 'Cloud & infra', items: ['AWS', 'Docker', 'Linux', 'Git', 'Node.js'] },
      { label: 'Sim & real-time', items: ['Unity', 'FishNet', 'Steamworks', 'Blender', 'React'] },
    ],
  },
  about: {
    photo: '/images/personal/marathon.jpeg',
    photoAlt: 'Toby finishing a marathon',
    caption: 'Marathon no. 1 of 2',
    heading: 'Robotics, Flight Software, Automation, and More',
    lede: 'My career started in underwater robotics, building ML pipelines for object detection in low-visibility water. Now I work in systems simulation at Boeing. I like work where software has physical consequences.',
    aside:
      'Outside work: two marathons, skiing across the western US and Whistler, games on Steam and itch.io, and two cats, Fern and Faun.',
  },
  contact: {
    heading: "Let's talk.",
    lede: "I'm looking for my next software engineering role. If you have any interesting opportunities in AV or robotics, feel free to reach out at my email or LinkedIn.",
  },
};
