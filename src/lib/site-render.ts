// Client-safe rendering helpers used by both the in-app preview iframe and the
// Astro ZIP export. No JSZip or Node here — server-only work lives in
// astro-export.server.ts.
import type { SitePlan, SitePage, SiteSection, ImageSlot } from "./site-schema";
import { DEFAULT_FONT } from "./theme-presets";

export interface AssetMap { [slot: string]: { url: string; alt: string } }

// CSS custom properties (brand/accent/background/foreground/fonts) shared by
// the in-app preview and the exported Astro layout.
export function themeVarsCss(plan: SitePlan): string {
  const c = plan.brandColors ?? ({} as SitePlan["brandColors"]);
  const font = plan.fontFamily ?? DEFAULT_FONT;
  return `:root{--brand:${c.primary ?? "#a76bff"};--brand2:${c.accent ?? "#5cd6ff"};--bg:${c.background ?? "#0e1020"};--fg:${c.foreground ?? "#f5f6fb"};--font-heading:${font.headingFamily};--font-body:${font.bodyFamily}}`;
}

export function googleFontsHref(plan: SitePlan): string {
  const font = plan.fontFamily ?? DEFAULT_FONT;
  return `https://fonts.googleapis.com/css2?${font.googleFontsParam}&display=swap`;
}

export function esc(s: string) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderSection(s: SiteSection, assets: AssetMap, imageSlots: ImageSlot[]): string {
  const img = s.imageSlot ? assets[s.imageSlot] : undefined;
  const slot = s.imageSlot ? imageSlots.find((i) => i.id === s.imageSlot) : undefined;
  const alt = img?.alt || slot?.alt || "";
  switch (s.kind) {
    case "hero":
      return `<section class="hero"><div class="hero-inner"><h1>${esc(s.heading ?? "")}</h1>${s.subheading ? `<p class="lead">${esc(s.subheading)}</p>` : ""}${s.body ? `<p>${esc(s.body)}</p>` : ""}</div>${img ? `<img src="/images/${s.imageSlot}.png" alt="${esc(alt)}" loading="eager" />` : ""}</section>`;
    case "features":
    case "services":
      return `<section class="grid-section"><h2>${esc(s.heading ?? "")}</h2>${s.subheading ? `<p class="lead">${esc(s.subheading)}</p>` : ""}<div class="grid">${(s.items ?? []).map((it) => `<article><h3>${esc(it.title)}</h3><p>${esc(it.body)}</p></article>`).join("")}</div></section>`;
    case "cta":
      return `<section class="cta"><h2>${esc(s.heading ?? "")}</h2>${s.body ? `<p>${esc(s.body)}</p>` : ""}<a class="btn" href="#contacto">Contactar</a></section>`;
    case "faq":
      return `<section class="faq"><h2>${esc(s.heading ?? "FAQ")}</h2>${(s.items ?? []).map((it) => `<details><summary>${esc(it.title)}</summary><p>${esc(it.body)}</p></details>`).join("")}</section>`;
    case "testimonials":
      return `<section class="testimonials"><h2>${esc(s.heading ?? "")}</h2><div class="grid">${(s.items ?? []).map((it) => `<blockquote><p>${esc(it.body)}</p><footer>— ${esc(it.title)}</footer></blockquote>`).join("")}</div></section>`;
    case "gallery":
      return `<section class="gallery"><h2>${esc(s.heading ?? "")}</h2>${img ? `<img src="/images/${s.imageSlot}.png" alt="${esc(alt)}" />` : ""}</section>`;
    case "contact":
      return `<section id="contacto" class="contact"><h2>${esc(s.heading ?? "Contacto")}</h2>${s.body ? `<p>${esc(s.body)}</p>` : ""}<form><input type="email" placeholder="Tu email" required /><textarea placeholder="Mensaje" required></textarea><button type="submit">Enviar</button></form></section>`;
    case "about":
      return `<section class="about"><h2>${esc(s.heading ?? "")}</h2>${s.body ? `<p>${esc(s.body)}</p>` : ""}${img ? `<img src="/images/${s.imageSlot}.png" alt="${esc(alt)}" />` : ""}</section>`;
    case "pricing":
      return `<section class="pricing"><h2>${esc(s.heading ?? "Precios")}</h2><div class="grid">${(s.items ?? []).map((it) => `<article class="price"><h3>${esc(it.title)}</h3><p>${esc(it.body)}</p></article>`).join("")}</div></section>`;
    default:
      return "";
  }
}

export const SITE_CSS = `:root{--nav-h:64px;--card:color-mix(in srgb, var(--fg) 7%, var(--bg));--border:color-mix(in srgb, var(--fg) 10%, transparent);--muted:color-mix(in srgb, var(--fg) 58%, var(--bg))}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--font-body);line-height:1.6;padding-top:var(--nav-h);-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:var(--font-heading);letter-spacing:-.02em;margin:0 0 .5em;line-height:1.15}
h1{font-size:clamp(2rem,5.5vw,4rem)}h2{font-size:clamp(1.6rem,3.8vw,2.6rem);margin-top:0}h3{font-size:clamp(1.15rem,2vw,1.4rem)}
p{color:var(--muted);margin:.5em 0}p.lead{color:var(--fg);font-size:clamp(1rem,1.6vw,1.2rem)}
a{color:var(--brand2);text-decoration:none}img{max-width:100%;height:auto;border-radius:1rem;display:block}
[id]{scroll-margin-top:calc(var(--nav-h) + 12px)}
header.nav{position:fixed;top:0;left:0;right:0;z-index:50;height:var(--nav-h);backdrop-filter:saturate(140%) blur(14px);-webkit-backdrop-filter:saturate(140%) blur(14px);background:linear-gradient(180deg,color-mix(in srgb, var(--bg) 85%, transparent),color-mix(in srgb, var(--bg) 60%, transparent));border-bottom:1px solid var(--border);display:flex;align-items:center;gap:1rem;padding:0 clamp(1rem,3vw,2rem)}
header.nav>a:first-child{font-family:var(--font-heading);font-size:1.05rem;letter-spacing:-.01em;color:var(--fg);white-space:nowrap;display:inline-flex;align-items:center;gap:.55rem}
header.nav>a:first-child::before{content:"";width:22px;height:22px;border-radius:7px;background:linear-gradient(135deg,var(--brand),var(--brand2));box-shadow:0 4px 14px -2px color-mix(in srgb, var(--brand) 55%, transparent)}
header.nav nav{margin-left:auto;display:flex;align-items:center;gap:.15rem;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;max-width:100%}
header.nav nav::-webkit-scrollbar{display:none}
header.nav nav a{position:relative;color:var(--muted);padding:.5rem .85rem;border-radius:.6rem;font-size:.92rem;font-weight:500;white-space:nowrap;transition:color .18s ease,background .18s ease}
header.nav nav a:hover{color:var(--fg);background:rgba(255,255,255,.04)}
header.nav nav a.active{color:var(--fg);background:rgba(255,255,255,.06)}
header.nav nav a.active::after{content:"";position:absolute;left:20%;right:20%;bottom:2px;height:2px;border-radius:2px;background:linear-gradient(90deg,var(--brand),var(--brand2))}
@media (max-width:640px){header.nav{padding:0 .85rem;gap:.5rem}header.nav>a:first-child{font-size:.95rem}header.nav nav a{padding:.4rem .65rem;font-size:.85rem}}
main{max-width:1100px;margin:0 auto;padding:1.5rem clamp(1rem,3vw,1.5rem)}
section{margin:clamp(2.5rem,6vw,4.5rem) 0}
.hero{position:relative;text-align:center;padding:clamp(3rem,7vw,5.5rem) 1rem clamp(2rem,4vw,3rem);background:radial-gradient(60% 60% at 50% 0%,color-mix(in srgb, var(--brand) 25%, transparent),transparent 70%)}
.hero .hero-inner{max-width:820px;margin:0 auto}
.hero img{margin:clamp(1.5rem,4vw,2.5rem) auto 0;max-width:min(900px,100%)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:clamp(.9rem,2vw,1.25rem);margin-top:2rem}
.grid article,.grid blockquote{background:var(--card);border:1px solid var(--border);padding:clamp(1.1rem,2.5vw,1.6rem);border-radius:1rem}
blockquote{margin:0}blockquote footer{color:var(--muted);margin-top:.5rem;font-size:.9rem}
.cta{text-align:center;background:linear-gradient(135deg,color-mix(in srgb, var(--brand) 15%, transparent),color-mix(in srgb, var(--brand2) 10%, transparent));border:1px solid var(--border);padding:clamp(1.75rem,5vw,3rem);border-radius:1.5rem}
.btn{display:inline-block;background:linear-gradient(135deg,var(--brand),var(--brand2));color:#0e1020;padding:.9rem 1.6rem;border-radius:.75rem;font-weight:600;margin-top:1rem;box-shadow:0 12px 30px -12px color-mix(in srgb, var(--brand) 60%, transparent);transition:transform .15s ease}
.btn:hover{transform:translateY(-1px)}
details{background:var(--card);border:1px solid var(--border);padding:1rem 1.25rem;border-radius:.75rem;margin:.5rem 0}
summary{cursor:pointer;font-weight:600;color:var(--fg)}
form{max-width:560px;margin:1.5rem auto;display:grid;gap:.75rem}
input,textarea{background:var(--card);border:1px solid var(--border);color:var(--fg);padding:.85rem 1rem;border-radius:.5rem;font:inherit;width:100%}
textarea{min-height:120px;resize:vertical}
button[type=submit]{background:linear-gradient(135deg,var(--brand),var(--brand2));color:#0e1020;font-weight:600;border:0;padding:.9rem;border-radius:.5rem;cursor:pointer}
footer.foot{border-top:1px solid var(--border);padding:2rem 1.5rem;text-align:center;color:var(--muted);font-size:.9rem;margin-top:4rem}`;

function navLabel(p: SitePage): string {
  if (p.slug === "index" || p.path === "/") return "Inicio";
  // Derive a short, human label from the slug rather than the H1 (which is long / SEO-y)
  const raw = p.slug.replace(/[-_]+/g, " ").trim();
  const label = raw.charAt(0).toUpperCase() + raw.slice(1);
  return label.length > 24 ? label.slice(0, 22) + "…" : label;
}

export function buildNav(plan: SitePlan, opts: { hrefMode: "path" | "hash"; activePath?: string; hrefFor?: (p: SitePage) => string }): string {
  return plan.pages
    .map((p) => {
      const label = esc(navLabel(p));
      const isActive = opts.activePath === p.path;
      const cls = isActive ? ' class="active"' : "";
      if (opts.hrefFor) {
        return `<a href="${esc(opts.hrefFor(p))}"${cls}>${label}</a>`;
      }
      if (opts.hrefMode === "hash") {
        return `<a href="#" data-nav-path="${esc(p.path)}"${cls}>${label}</a>`;
      }
      return `<a href="${esc(p.path)}"${cls}>${label}</a>`;
    })
    .join("");
}

export function buildPreviewHtml(plan: SitePlan, page: SitePage, assets: AssetMap, opts?: { hrefFor?: (p: SitePage) => string }): string {
  const nav = buildNav(plan, { hrefMode: "hash", activePath: page.path, hrefFor: opts?.hrefFor });
  const sections = page.sections.map((s) => renderSection(s, assets, plan.imageSlots))
    .join("\n")
    .replace(/src="\/images\/([^"]+)\.png"/g, (_m, slotId) => {
      const a = assets[slotId];
      return a?.url ? `src="${esc(a.url)}"` : `src=""`;
    });
  const homePage = plan.pages.find((p) => p.slug === "index" || p.path === "/") ?? plan.pages[0];
  const logoHref = opts?.hrefFor ? esc(opts.hrefFor(homePage)) : "#";
  const logoAttrs = opts?.hrefFor ? "" : ' data-nav-path="/"';
  return `<!doctype html><html lang="${plan.language}"><head><meta charset="utf-8"><title>${esc(page.title)}</title><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${googleFontsHref(plan)}">
<style>${themeVarsCss(plan)}${SITE_CSS}
header.nav nav a.active{color:var(--brand2);font-weight:600}</style></head>
<body><header class="nav"><a href="${logoHref}"${logoAttrs} style="font-weight:700">${esc(plan.siteName)}</a><nav>${nav}</nav></header><main>${sections}</main><footer class="foot">© ${new Date().getFullYear()} ${esc(plan.siteName)}</footer>
<script>
document.addEventListener('click', function(e){
  var a = e.target && e.target.closest && e.target.closest('a[data-nav-path]');
  if (!a) return;
  e.preventDefault();
  parent.postMessage({ type: 'astroforge:nav', path: a.getAttribute('data-nav-path') }, '*');
});
</script>
</body></html>`;
}

