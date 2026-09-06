/** Repo slugs are always `owner/name`, so they can link straight to GitHub. */
export function RepoLink({ repo, className = "" }: { repo: string; className?: string }) {
  return (
    <a href={`https://github.com/${repo}`} target="_blank" rel="noreferrer" className={`hover:text-lime hover:underline ${className}`}>
      {repo}
    </a>
  );
}
