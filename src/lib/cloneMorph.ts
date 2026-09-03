import { gsap } from "gsap";

interface CloneMorphOptions {
	duration?: number;
	ease?: string;
}

/**
 * Clones `sourceEl` at its current on-screen box, animates the clone to match
 * whatever box `getTargetRect()` returns, then removes the clone and resolves. A
 * single live element grows/shrinks between two real layouts — there's never a
 * second snapshot competing with it, so there's nothing to ghost.
 *
 * `getTargetRect` may return a Promise — needed whenever the target is an element
 * the caller just gave a new `src`/content (e.g. a modal <img> with no width/height
 * attributes, sized purely by its own natural dimensions via max-h-full/max-w-full):
 * setting `src` doesn't decode synchronously, not even for a cached resource, so
 * measuring it too early (a single requestAnimationFrame is NOT enough — that fires
 * before the image's load task is guaranteed to have run) returns a 0x0 box, since
 * the browser doesn't know its natural size yet — that made the clone visibly shrink
 * to nothing instead of growing into it. The caller is responsible for waiting on
 * whatever readiness signal the target needs (e.g. its `load` event) before
 * resolving with the real rect.
 *
 * Always renders the clone with object-fit: cover. That's safe everywhere this is
 * used on this site: at the "native ratio" end of every pair (an open modal's media
 * box, sized via max-h-full/max-w-full to the content's own ratio; or GaleriaCarrusel's
 * thumbnails, sized the same way) box ratio already equals content ratio, so cover and
 * contain render identically there — and cover is also what correctly reproduces a
 * deliberately-cropped source (HeroVideoModal/VideoSecundarioModal's full-bleed
 * previews).
 *
 * Two cold-start-only costs, both paid once per clone rather than reused across a
 * session, which is why only the FIRST modal open in a session showed a stutter:
 *
 * - `will-change` on the animated properties, set before the tween starts, hints the
 *   browser to prepare a paint surface for this element ahead of time instead of
 *   doing that setup work on the first animated frame.
 * - Cloning an <img> does NOT carry over decoded pixel data — a freshly-inserted
 *   clone can still be mid-decode even when cloned from an element (or a `src`) the
 *   browser already decoded elsewhere, since each <img> has its own independent
 *   decode per the HTML image-data update spec. `decode()` (falling back to waiting
 *   for `load` where unsupported) makes sure that decode work has actually finished
 *   before the tween's setup runs, instead of the two competing for the main thread
 *   at the same moment. On a later open in the same session this resolves near-
 *   instantly (the browser's already decoded that resource before), which is
 *   consistent with the stutter only showing up the first time.
 */
export function cloneMorph(
	sourceEl: HTMLVideoElement | HTMLImageElement,
	getTargetRect: () => DOMRect | Promise<DOMRect>,
	opts: CloneMorphOptions = {}
): Promise<void> {
	const firstRect = sourceEl.getBoundingClientRect();
	const isVideo = sourceEl.tagName === "VIDEO";
	const clone = sourceEl.cloneNode(false) as HTMLVideoElement | HTMLImageElement;

	clone.style.position = "fixed";
	clone.style.top = `${firstRect.top}px`;
	clone.style.left = `${firstRect.left}px`;
	clone.style.width = `${firstRect.width}px`;
	clone.style.height = `${firstRect.height}px`;
	clone.style.objectFit = "cover";
	clone.style.zIndex = "9999";
	clone.style.margin = "0";
	clone.style.pointerEvents = "none";
	// Hint the browser to get a paint surface ready before the tween's first frame,
	// instead of paying that setup cost mid-animation.
	clone.style.willChange = "top, left, width, height";

	if (isVideo) {
		const video = clone as HTMLVideoElement;
		video.currentTime = (sourceEl as HTMLVideoElement).currentTime;
		video.muted = true;
	}

	document.body.appendChild(clone);
	if (isVideo) (clone as HTMLVideoElement).play().catch(() => {});

	// Images only: make sure THIS clone's own decode has actually finished before
	// the tween starts, rather than racing it — see the cold-start note above.
	const cloneReady: Promise<void> = isVideo
		? Promise.resolve()
		: typeof (clone as HTMLImageElement).decode === "function"
			? (clone as HTMLImageElement).decode().catch(() => {})
			: (clone as HTMLImageElement).complete
				? Promise.resolve()
				: new Promise((resolve) => {
						(clone as HTMLImageElement).addEventListener("load", () => resolve(), { once: true });
					});

	return cloneReady.then(() => getTargetRect()).then(
		(lastRect) =>
			new Promise<void>((resolve) => {
				gsap.to(clone, {
					top: lastRect.top,
					left: lastRect.left,
					width: lastRect.width,
					height: lastRect.height,
					duration: opts.duration ?? 0.45,
					ease: opts.ease ?? "power2.inOut",
					onComplete: () => {
						clone.remove();
						resolve();
					},
				});
			})
	);
}
