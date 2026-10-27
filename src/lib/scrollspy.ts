/** Marks whichever in-page link points at the section currently in view with aria-current="true". */
export function scrollSpy(links: HTMLAnchorElement[], rootMargin: string): void {
  if (links.length === 0) return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of links) {
          link.setAttribute('aria-current', String(link.hash === `#${entry.target.id}`));
        }
      }
    },
    { rootMargin },
  );
  for (const link of links) {
    const target = link.hash ? document.getElementById(link.hash.slice(1)) : null;
    if (target) observer.observe(target);
  }
}
