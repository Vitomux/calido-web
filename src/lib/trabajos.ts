import { getCollection } from "astro:content";

/**
 * Single source of truth for project order: both the Portfolio grid and the
 * project detail page's Anterior/Siguiente nav must show projects in the
 * exact same order, so both import this instead of calling
 * `getCollection("trabajos")` directly.
 */
export async function getTrabajosOrdenados() {
	return getCollection("trabajos");
}
