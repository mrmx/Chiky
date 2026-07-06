// Pure media-kind detection backing the `<Gallery>` component (see
// `components/Gallery.svelte`). Kept dependency-free so it's cheap to unit test without
// rendering the component (Svelte component rendering isn't set up in this package's test
// harness — see tests/media.test.ts, and the same rationale as `src/lib/seo.ts`).

export type MediaItem = {
	src: string;
	alt: string;
	caption?: string;
};

const VIDEO_EXTENSIONS = new Set(['mp4', 'webm']);

/**
 * Detects whether `src` points at a video file by its extension (`.mp4`/`.webm`), ignoring
 * any query string or hash fragment (e.g. `clip.mp4?v=2` is still a video). Case-insensitive.
 * Anything else (including no extension at all) is treated as an image.
 */
export function isVideoSrc(src: string): boolean {
	const path = src.split(/[?#]/, 1)[0];
	const match = /\.([a-z0-9]+)$/i.exec(path);
	if (!match) return false;
	return VIDEO_EXTENSIONS.has(match[1].toLowerCase());
}
