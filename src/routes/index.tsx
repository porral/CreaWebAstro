import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Sparkles, Search, ImageIcon, FileCode2, Gauge, LineChart, Wand2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "AstroForge — Genera webs Astro con IA y SEO exhaustivo" },
      { name: "description", content: "Describe tu negocio y AstroForge crea un sitio Astro completo: análisis SEO por sector, copy optimizado, imágenes IA ultra detalladas y ZIP listo para desplegar." },
      { property: "og:title", content: "AstroForge — Genera webs Astro con IA y SEO exhaustivo" },
      { property: "og:description", content: "Describe tu negocio y AstroForge crea un sitio Astro completo: análisis SEO por sector, copy optimizado, imágenes IA ultra detalladas y ZIP listo para desplegar." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

function LandingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-glow)" }} />
          <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-24 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-3 w-3 text-brand" /> IA + SEO exhaustivo
            </span>
            <h1 className="mx-auto mt-6 max-w-4xl font-display text-5xl font-bold leading-[1.05] sm:text-7xl">
              Genera webs <span className="text-gradient">Astro</span> completas con IA en minutos
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Describe tu sector. AstroForge analiza SEO, escribe el copy, genera imágenes ultra detalladas y te entrega un proyecto Astro listo para desplegar.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link to="/new" className="rounded-md btn-brand px-6 py-3 text-sm font-semibold hover:btn-brand-hover">
                Crear mi sitio
              </Link>
              <Link to="/auth" className="rounded-md border border-border bg-secondary px-6 py-3 text-sm">
                Iniciar sesión
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Sin tarjeta. Descarga el .zip cuando estés listo.</p>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <h2 className="mb-12 text-center font-display text-3xl font-semibold sm:text-4xl">Cómo funciona</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Search, title: "1. Análisis SEO por sector", desc: "Keywords, intención de búsqueda, competencia y estructura óptima según tu industria." },
              { icon: Wand2, title: "2. Copy y estructura por IA", desc: "Multi-página, meta tags únicos, JSON-LD, canonical y arquitectura semántica." },
              { icon: ImageIcon, title: "3. Imágenes IA detalladas", desc: "Prompts ricos en composición, iluminación y estilo. Streaming en tiempo real." },
            ].map((f, i) => (
              <div key={i} className="surface-card rounded-2xl p-6">
                <div className="grid h-11 w-11 place-items-center rounded-xl btn-brand"><f.icon className="h-5 w-5" /></div>
                <h3 className="mt-4 font-display text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features grid */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: FileCode2, title: "Proyecto Astro real", desc: "package.json, astro.config, Tailwind, sitemap.xml, robots.txt y layout Base." },
              { icon: Gauge, title: "Auditoría SEO", desc: "Puntuación 0-100 con sugerencias accionables y opción de aplicarlas con un clic." },
              { icon: LineChart, title: "Datos de Semrush", desc: "Si conectas tu cuenta, usamos KD real, SERP y keywords del sector." },
              { icon: Sparkles, title: "Impulsado por OpenAI", desc: "GPT-4o para el copy y la estrategia SEO, gpt-image-1 para las imágenes." },
              { icon: ImageIcon, title: "Imágenes premium", desc: "gpt-image-1 en alta calidad, ultra detallado y coherente con cada página." },
              { icon: Search, title: "Multi-idioma", desc: "Genera el copy en el idioma que necesites para tu público objetivo." },
            ].map((f, i) => (
              <div key={i} className="surface-card rounded-2xl p-5">
                <f.icon className="h-6 w-6 text-brand" />
                <h3 className="mt-3 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-4xl px-6 pb-32">
          <div className="surface-card rounded-3xl p-10 text-center">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">¿Listo para tu próximo sitio?</h2>
            <p className="mt-3 text-muted-foreground">Un sector, una descripción y en minutos tienes un proyecto Astro completo.</p>
            <Link to="/new" className="mt-8 inline-flex rounded-md btn-brand px-6 py-3 text-sm font-semibold hover:btn-brand-hover">
              Empezar ahora
            </Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        <p>AstroForge · Generador de sitios Astro con IA</p>
      </footer>
    </div>
  );
}
