interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  topics: string[];
  updated_at: string;
}

const GITHUB_USER = 'tobymcguire0';
const CACHE = new Map<string, GitHubRepo>();

export async function fetchRepo(slug: string): Promise<GitHubRepo | null> {
  if (CACHE.has(slug)) return CACHE.get(slug)!;
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${slug}`,
      { headers: { Accept: 'application/vnd.github.v3+json' } },
    );
    if (!res.ok) return null;
    const data: GitHubRepo = await res.json();
    CACHE.set(slug, data);
    return data;
  } catch {
    return null;
  }
}

export type { GitHubRepo };
