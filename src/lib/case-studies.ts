import { getCollection, type CollectionEntry } from 'astro:content';

type CaseStudy = NonNullable<CollectionEntry<'projects'>['data']['caseStudy']>;

export interface NavLink {
  label: string;
  href: string;
}

export interface CaseStudyLink {
  href: string;
  title: string;
  navLabel: string;
  nextLabel: string;
  order: number;
}

function toLink(href: string, title: string, order: number, caseStudy: CaseStudy): CaseStudyLink {
  return { href, title, order, navLabel: caseStudy.navLabel, nextLabel: caseStudy.nextLabel ?? title };
}

/** Every project or game that has a case study page, in homepage order. */
export async function getCaseStudies(): Promise<CaseStudyLink[]> {
  const [projects, games] = await Promise.all([getCollection('projects'), getCollection('games')]);
  const links: CaseStudyLink[] = [];
  for (const { slug, data } of projects) {
    if (data.caseStudy) links.push(toLink(`/projects/${slug}/`, data.title, data.order, data.caseStudy));
  }
  for (const { slug, data } of games) {
    if (data.caseStudy) links.push(toLink(`/games/${slug}/`, data.title, data.order, data.caseStudy));
  }
  return links.sort((a, b) => a.order - b.order);
}

export function caseNav(cases: CaseStudyLink[]): NavLink[] {
  return [{ label: 'Work', href: '/#work' }, ...cases.map((c) => ({ label: c.navLabel, href: c.href }))];
}
