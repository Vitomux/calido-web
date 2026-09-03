/**
 * Prefixes a root-relative path (e.g. "/trabajos/foo/galeria/bar.mp4") with
 * `import.meta.env.BASE_URL`, so links and public/ asset references keep working
 * when the site is deployed under a subpath (GitHub Pages' `base: '/calido-web'`)
 * instead of the domain root. Astro doesn't rewrite hardcoded `/`-prefixed strings
 * on its own — only its own asset/routing helpers know about `base`. Works
 * identically in Astro frontmatter and in client <script> blocks (both go through
 * Vite, which statically replaces `import.meta.env.BASE_URL` at build time) — the
 * one place it does NOT work is a `<script is:inline>` block, which Vite never
 * processes; those need the base value passed in via `define:vars` instead.
 */
export function withBase(path: string): string {
	const base = import.meta.env.BASE_URL.replace(/\/$/, "");
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	return `${base}${normalizedPath}`;
}
