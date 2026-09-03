import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const trabajos = defineCollection({
	loader: glob({ pattern: "*/index.md", base: "./src/content/trabajos" }),
	schema: z.object({
		titulo: z.string(),
		categoria: z.string(),
		destacado: z.boolean(),
		descripcion: z.string().optional(),
		formato: z.string().optional(),
		videoPrincipal: z.object({
			videoId: z.string(),
			track: z.string().optional(),
		}),
		videoSecundario: z
			.object({
				videoId: z.string(),
				track: z.string().optional(),
			})
			.optional(),
		imagenesFeatured: z.array(z.string()).optional(),
		galeria: z.array(z.string()),
		creditos: z.array(
			z.object({
				label: z.string().optional(),
				items: z.array(
					z.object({
						rol: z.string(),
						nombre: z.union([z.string(), z.array(z.string())]),
					})
				),
			})
		),
	}),
});

export const collections = { trabajos };
