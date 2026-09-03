// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite"

// https://astro.build/config
export default defineConfig({
    site: 'https://vitomux.github.io',
    base: '/calido-web',
    vite: {
        plugins: [tailwindcss()]
    }
});
