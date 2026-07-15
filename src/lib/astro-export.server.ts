// Server-only: builds an Astro project ZIP from a SitePlan and image buffers.
import JSZip from "jszip";
import type { SitePlan, SitePage } from "./site-schema";
import { renderSection, esc, SITE_CSS, type AssetMap } from "./site-render";

function baseLayoutAstro(plan: SitePlan) {
  const primary = plan.brandColors?.primary ?? "#a76bff";
  const accent = plan.brandColors?.accent ?? "#5cd6ff";
  return `---
export interface Props { title: string; description: string; canonical: string; jsonLd?: object; }
const { title, description, canonical, jsonLd } = Astro.props;
const siteUrl = Astro.site?.toString() ?? "";
---
<!doctype html>
<html lang="${plan.language ?? "es"}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={new URL(canonical, siteUrl).toString()} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={new URL(canonical, siteUrl).toString()} />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&display=swap" />
    <link rel="stylesheet" href="/styles/global.css" />
    <style>:root{--brand:${primary};--brand2:${accent}}</style>
    {jsonLd && <script type="application/ld+json" set:html={JSON.stringify(jsonLd)}></script>}
  </head>
  <body>
    <slot />
  </body>
</html>`;
}

function navDataTs(plan: SitePlan): string {
  const items = plan.pages.map((p) => {
    const raw = (p.slug === "index" || p.path === "/") ? "Inicio" : p.slug.replace(/[-_]+/g, " ").trim();
    const label = raw.charAt(0).toUpperCase() + raw.slice(1);
    return { label: label.length > 24 ? label.slice(0, 22) + "…" : label, path: p.path };
  });
  return `export const siteName = ${JSON.stringify(plan.siteName)};
export const navItems: { label: string; path: string }[] = ${JSON.stringify(items, null, 2)};
`;
}

function headerAstro(): string {
  return `---
import { siteName, navItems } from "../data/nav";
export interface Props { activePath?: string }
const { activePath } = Astro.props;
---
<header class="nav">
  <a href="/" style="font-weight:700">{siteName}</a>
  <nav>
    {navItems.map((item) => (
      <a href={item.path} class={activePath === item.path ? "active" : undefined}>{item.label}</a>
    ))}
  </nav>
</header>`;
}

function footerAstro(): string {
  return `---
import { siteName } from "../data/nav";
const year = new Date().getFullYear();
---
<footer class="foot">© {year} {siteName}</footer>`;
}

function pageAstro(_plan: SitePlan, page: SitePage, _allPages: SitePage[], assets: AssetMap, imageSlots: SitePlan["imageSlots"], jsonLdType: string, siteName: string): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": jsonLdType,
    name: siteName,
    description: page.metaDescription,
  };
  const sections = page.sections.map((s) => renderSection(s, assets, imageSlots)).join("\n");
  return `---
import Base from "../layouts/Base.astro";
import Header from "../components/Header.astro";
import Footer from "../components/Footer.astro";
const jsonLd = ${JSON.stringify(jsonLd)};
---
<Base title="${esc(page.title)}" description="${esc(page.metaDescription)}" canonical="${page.path}" jsonLd={jsonLd}>
  <Header activePath="${esc(page.path)}" />
  <main>
    ${sections}
  </main>
  <Footer />
</Base>`;
}

export async function buildAstroZip(plan: SitePlan, assets: AssetMap, imageBuffers: Record<string, Uint8Array>): Promise<Uint8Array> {
  const zip = new JSZip();
  const projName = (plan.siteName || "sitio").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "mi-sitio";
  const root = zip.folder(projName)!;

  root.file("package.json", JSON.stringify({
    name: projName, private: true, type: "module",
    scripts: { dev: "astro dev", build: "astro build", preview: "astro preview" },
    dependencies: { astro: "^4.15.0", "@astrojs/sitemap": "^3.1.0" },
  }, null, 2));

  root.file("astro.config.mjs", `import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({
  site: 'https://example.com',
  integrations: [sitemap()],
});
`);

  root.file(".gitignore", "node_modules\ndist\n.env\n");
  root.file("public/robots.txt", `User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap-index.xml\n`);
  root.file("public/favicon.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="${plan.brandColors?.primary ?? "#a76bff"}"/><text x="50%" y="55%" text-anchor="middle" fill="#0e1020" font-family="sans-serif" font-weight="700" font-size="18">${esc(plan.siteName[0] ?? "A")}</text></svg>`);
  root.file("public/styles/global.css", SITE_CSS);
  root.file("src/layouts/Base.astro", baseLayoutAstro(plan));
  root.file("src/data/nav.ts", navDataTs(plan));
  root.file("src/components/Header.astro", headerAstro());
  root.file("src/components/Footer.astro", footerAstro());

  for (const page of plan.pages) {
    const fileName = page.slug === "index" ? "index.astro" : `${page.slug}.astro`;
    root.file(`src/pages/${fileName}`, pageAstro(plan, page, plan.pages, assets, plan.imageSlots, plan.jsonLdType, plan.siteName));
  }
  for (const [slot, buf] of Object.entries(imageBuffers)) {
    root.file(`public/images/${slot}.png`, buf);
  }

  const kw = plan.seoStrategy.primaryKeyword;
  root.file("README.md", `# ${plan.siteName}

Sitio generado por AstroForge.

## Instalación
\`\`\`bash
npm install
npm run dev
\`\`\`

## SEO
- Keyword principal: **${kw}**
- Keywords secundarias: ${plan.seoStrategy.secondaryKeywords.join(", ")}
- JSON-LD: ${plan.jsonLdType}

## Despliegue
Compatible con Netlify, Vercel, Cloudflare Pages. Cambia \`site\` en \`astro.config.mjs\` por tu dominio real.
`);

  return zip.generateAsync({ type: "uint8array" });
}
