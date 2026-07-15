import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportClientError } from "../lib/error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Error 404</p>
        <h1 className="mt-2 font-display text-6xl font-bold text-gradient">Página no encontrada</h1>
        <p className="mt-4 text-muted-foreground">La ruta que buscas no existe.</p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-md btn-brand px-5 py-2.5 text-sm hover:btn-brand-hover">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportClientError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="surface-card max-w-md rounded-2xl p-8 text-center">
        <h1 className="font-display text-2xl font-semibold">Algo salió mal</h1>
        <p className="mt-2 text-sm text-muted-foreground">Prueba a recargar la página.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md btn-brand px-4 py-2 text-sm"
          >Reintentar</button>
          <a href="/" className="rounded-md border border-border bg-secondary px-4 py-2 text-sm">Inicio</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AstroForge — Genera webs Astro con IA y SEO exhaustivo" },
      { name: "description", content: "Describe tu negocio y AstroForge crea un sitio Astro completo: análisis SEO por sector, copy optimizado, imágenes IA ultra detalladas y ZIP listo para desplegar." },
      { property: "og:title", content: "AstroForge — Genera webs Astro con IA y SEO exhaustivo" },
      { property: "og:description", content: "Describe tu negocio y AstroForge crea un sitio Astro completo: análisis SEO por sector, copy optimizado, imágenes IA ultra detalladas y ZIP listo para desplegar." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "AstroForge" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "AstroForge — Genera webs Astro con IA y SEO exhaustivo" },
      { name: "twitter:description", content: "Describe tu negocio y AstroForge crea un sitio Astro completo: análisis SEO por sector, copy optimizado, imágenes IA ultra detalladas y ZIP listo para desplegar." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster theme="dark" position="top-right" richColors />
    </QueryClientProvider>
  );
}
