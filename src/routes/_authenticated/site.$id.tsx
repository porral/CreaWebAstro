import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteFn, saveImageFn, generatePlanFn } from "@/lib/sites.functions";
import { buildZipFn } from "@/lib/export.functions";
import { SiteHeader } from "@/components/site-header";
import { buildPreviewHtml } from "@/lib/site-render";
import type { SitePlan } from "@/lib/site-schema";
import { streamImage, base64FromDataUrl } from "@/lib/stream-image";
import { Download, Loader2, ImageIcon, TrendingUp, Code2, Eye, Search, RefreshCcw, Sparkles, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/site/$id")({
  component: SitePage,
  head: () => ({ meta: [{ title: "Sitio — AstroForge" }, { name: "robots", content: "noindex" }] }),
});

type Tab = "preview" | "seo" | "images" | "code";

function SitePage() {
  const { id } = Route.useParams();
  const getSite = useServerFn(getSiteFn);
  const generate = useServerFn(generatePlanFn);
  const saveImg = useServerFn(saveImageFn);
  const buildZip = useServerFn(buildZipFn);

  const q = useQuery({
    queryKey: ["site", id],
    queryFn: () => getSite({ data: { id } }),
    refetchInterval: (query) => (query.state.data?.site?.status === "generating" ? 2500 : false),
  });

  const site = q.data?.site;
  const plan = site?.plan as SitePlan | undefined;
  const assets = q.data?.assets ?? [];

  const [tab, setTab] = useState<Tab>("preview");
  const [activePage, setActivePage] = useState(0);

  const regen = useMutation({
    mutationFn: () => generate({ data: { siteId: id } }),
    onSuccess: () => { toast.success("Plan regenerado"); q.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const zipMut = useMutation({
    mutationFn: () => buildZip({ data: { siteId: id } }),
    onSuccess: ({ base64, filename }) => {
      const bin = atob(base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast.success("Descarga lista");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const assetMap = useMemo(() => {
    const m: Record<string, { url: string; alt: string }> = {};
    for (const a of assets) if (a.slot && a.url) m[a.slot] = { url: a.url, alt: a.prompt ?? "" };
    return m;
  }, [assets]);

  if (q.isLoading) return <FullscreenLoader label="Cargando…" />;
  if (!site) return <div className="p-8">No encontrado.</div>;

  const isError = site.status === "error";
  const isGenerating = !isError && (site.status === "generating" || !plan);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">← Mis sitios</Link>
            <h1 className="mt-1 font-display text-3xl font-bold">{site.name}</h1>
            <p className="text-sm text-muted-foreground">{site.sector} · {new Date(site.created_at).toLocaleDateString()}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => regen.mutate()} disabled={regen.isPending || isGenerating} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-2 text-sm disabled:opacity-50">
              {regen.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Regenerar
            </button>
            <button onClick={() => zipMut.mutate()} disabled={zipMut.isPending || isGenerating} className="inline-flex items-center gap-1.5 rounded-md btn-brand px-4 py-2 text-sm font-semibold hover:btn-brand-hover disabled:opacity-50">
              {zipMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Descargar .zip
            </button>
          </div>
        </header>

        {isError ? (
          <ErrorView message={site.error_message} onRetry={() => regen.mutate()} retrying={regen.isPending} />
        ) : isGenerating ? (
          <GeneratingView />
        ) : (
          <>
            <TabsBar tab={tab} setTab={setTab} score={site.seo_score} />

            {tab === "preview" && plan && (
              <PreviewTab siteId={id} plan={plan} assets={assetMap} activePage={activePage} setActivePage={setActivePage} />
            )}
            {tab === "seo" && plan && <SeoTab plan={plan} score={site.seo_score} />}
            {tab === "images" && plan && (
              <ImagesTab
                plan={plan}
                assets={assets}
                imageModel={(site.config as any)?.imageModel ?? "gpt-image-1"}
                onSave={async (slotId, prompt, base64) => {
                  await saveImg({ data: { siteId: id, slot: slotId, prompt, base64 } });
                  toast.success(`Imagen "${slotId}" guardada — ya visible en el Preview`);
                  q.refetch();
                }}
              />
            )}
            {tab === "code" && plan && <CodeTab plan={plan} />}
          </>
        )}
      </main>
    </div>
  );
}

function ErrorView({ message, onRetry, retrying }: { message: string | null | undefined; onRetry: () => void; retrying: boolean }) {
  return (
    <div className="surface-card rounded-2xl p-12 text-center">
      <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
      <h2 className="mt-4 font-display text-2xl font-semibold">No se pudo generar el sitio</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{message || "Error desconocido."}</p>
      <button
        onClick={onRetry}
        disabled={retrying}
        className="mx-auto mt-6 inline-flex items-center gap-1.5 rounded-md btn-brand px-4 py-2 text-sm font-semibold hover:btn-brand-hover disabled:opacity-50"
      >
        {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Reintentar
      </button>
    </div>
  );
}

function GeneratingView() {
  return (
    <div className="surface-card rounded-2xl p-12 text-center">
      <Sparkles className="mx-auto h-10 w-10 animate-pulse text-brand" />
      <h2 className="mt-4 font-display text-2xl font-semibold">Generando tu sitio…</h2>
      <p className="mt-2 text-sm text-muted-foreground">Analizando SEO, escribiendo copy y diseñando la estructura. Esto puede tardar 30-60 segundos.</p>
      <div className="mx-auto mt-6 h-1 w-64 overflow-hidden rounded-full bg-secondary">
        <div className="h-full w-1/3 animate-pulse rounded-full" style={{ background: "var(--gradient-brand)" }} />
      </div>
    </div>
  );
}

function TabsBar({ tab, setTab, score }: { tab: Tab; setTab: (t: Tab) => void; score: number | null }) {
  const items: Array<[Tab, string, any]> = [
    ["preview", "Preview", Eye],
    ["seo", "SEO", Search],
    ["images", "Imágenes", ImageIcon],
    ["code", "Código", Code2],
  ];
  return (
    <div className="mb-6 flex items-center justify-between gap-2 border-b border-border">
      <div className="flex gap-1">
        {items.map(([k, l, Icon]) => (
          <button key={k} onClick={() => setTab(k)} className={`inline-flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm ${tab === k ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <Icon className="h-4 w-4" /> {l}
          </button>
        ))}
      </div>
      {score != null && (
        <div className="flex items-center gap-1.5 text-sm">
          <TrendingUp className="h-4 w-4 text-brand" /> SEO <strong className="text-gradient">{score}</strong>/100
        </div>
      )}
    </div>
  );
}

function PreviewTab({ siteId, plan, assets, activePage, setActivePage }: { siteId: string; plan: SitePlan; assets: Record<string, { url: string; alt: string }>; activePage: number; setActivePage: (n: number) => void }) {
  const page = plan.pages[activePage] ?? plan.pages[0];
  const html = useMemo(() => buildPreviewHtml(plan, page, assets), [plan, page, assets]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => { if (iframeRef.current) iframeRef.current.srcdoc = html; }, [html]);
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data;
      if (!d || d.type !== "astroforge:nav" || typeof d.path !== "string") return;
      const idx = plan.pages.findIndex((p) => p.path === d.path);
      if (idx >= 0) setActivePage(idx);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [plan, setActivePage]);
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {plan.pages.map((p, i) => (
            <button key={p.slug} onClick={() => setActivePage(i)} className={`rounded-full border px-3 py-1 text-xs ${i === activePage ? "border-brand bg-brand/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {p.path}
            </button>
          ))}
        </div>
        <a
          href={`/api/preview/${siteId}/${page.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Abrir en pestaña nueva
        </a>
      </div>
      <div className="surface-card overflow-hidden rounded-2xl">
        <iframe ref={iframeRef} title="Preview" className="h-[800px] w-full bg-white" sandbox="allow-same-origin allow-scripts" />
      </div>
    </div>
  );
}

function SeoTab({ plan, score }: { plan: SitePlan; score: number | null }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="surface-card rounded-2xl p-6">
        <h3 className="font-display text-lg font-semibold">Estrategia SEO</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <Kv k="Keyword principal" v={plan.seoStrategy.primaryKeyword} />
          <Kv k="Keywords secundarias" v={plan.seoStrategy.secondaryKeywords.join(", ")} />
          <Kv k="Intención de búsqueda" v={plan.seoStrategy.audienceIntent} />
          <Kv k="Ángulo de contenido" v={plan.seoStrategy.contentAngle} />
          <Kv k="Competencia" v={plan.seoStrategy.competitorInsights} />
          <Kv k="Schema JSON-LD" v={plan.jsonLdType} />
        </dl>
      </div>
      <div className="surface-card rounded-2xl p-6">
        <h3 className="font-display text-lg font-semibold">Puntuación SEO</h3>
        <div className="mt-4 text-center">
          <div className="text-6xl font-bold text-gradient">{score ?? "—"}</div>
          <p className="mt-1 text-xs text-muted-foreground">Auditoría automática</p>
        </div>
      </div>
      <div className="surface-card rounded-2xl p-6 md:col-span-2">
        <h3 className="mb-4 font-display text-lg font-semibold">Meta por página</h3>
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr><th className="py-2">Ruta</th><th>Title</th><th>Meta</th><th>Keyword</th></tr>
          </thead>
          <tbody>
            {plan.pages.map((p) => (
              <tr key={p.slug} className="border-b border-border/50 align-top">
                <td className="py-2 font-mono text-xs">{p.path}</td>
                <td className="py-2 pr-4">{p.title}</td>
                <td className="py-2 pr-4 text-muted-foreground">{p.metaDescription}</td>
                <td className="py-2 text-brand">{p.keyword}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">{k}</dt>
      <dd className="mt-0.5 text-foreground">{v}</dd>
    </div>
  );
}

function ImagesTab({ plan, assets, imageModel, onSave }: {
  plan: SitePlan;
  assets: Array<{ slot: string | null; url: string | null; prompt: string | null }>;
  imageModel: string;
  onSave: (slotId: string, prompt: string, base64: string) => Promise<void>;
}) {
  const [previews, setPreviews] = useState<Record<string, { url: string; final: boolean }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [queued, setQueued] = useState<string[]>([]);
  const queueRef = useRef<Array<{ slotId: string; prompt: string }>>([]);
  const processingRef = useRef(false);

  const existingBySlot = useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of assets) if (a.slot && a.url) m[a.slot] = a.url;
    return m;
  }, [assets]);

  async function processQueue() {
    if (processingRef.current) return;
    processingRef.current = true;
    while (queueRef.current.length > 0) {
      const { slotId, prompt } = queueRef.current[0];
      setBusy(slotId);
      try {
        let finalUrl = "";
        await streamImage(prompt, (f) => {
          setPreviews((p) => ({ ...p, [slotId]: { url: f.dataUrl, final: f.isFinal } }));
          if (f.isFinal) finalUrl = f.dataUrl;
        }, { model: imageModel, quality: "high" });
        if (!finalUrl) throw new Error("Sin imagen final");
        await onSave(slotId, prompt, base64FromDataUrl(finalUrl));
      } catch (e: any) {
        toast.error(`${slotId}: ${e.message ?? "Error"}`);
      } finally {
        queueRef.current = queueRef.current.slice(1);
        setQueued(queueRef.current.map((q) => q.slotId));
        setBusy(null);
      }
    }
    processingRef.current = false;
  }

  function handleClick(slotId: string, prompt: string) {
    if (busy === slotId || queueRef.current.some((q) => q.slotId === slotId)) return;
    queueRef.current = [...queueRef.current, { slotId, prompt }];
    setQueued(queueRef.current.map((q) => q.slotId));
    processQueue();
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {plan.imageSlots.map((slot) => {
        const preview = previews[slot.id];
        const url = preview?.url ?? existingBySlot[slot.id];
        const isFinal = preview?.final ?? Boolean(existingBySlot[slot.id]);
        return (
          <div key={slot.id} className="surface-card overflow-hidden rounded-2xl">
            <div className="relative aspect-video bg-secondary">
              {url ? (
                <img src={url} alt={slot.alt} className={`h-full w-full object-cover transition-[filter] ${isFinal ? "blur-0" : "blur-xl"}`} />
              ) : (
                <div className="grid h-full place-items-center text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>
              )}
            </div>
            <div className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">{slot.id}</span>
                <span className="text-xs text-muted-foreground">{slot.aspect}</span>
              </div>
              <p className="line-clamp-3 text-xs text-muted-foreground">{slot.prompt}</p>
              <button
                onClick={() => handleClick(slot.id, slot.prompt)}
                disabled={busy === slot.id || queued.includes(slot.id)}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md btn-brand px-3 py-2 text-xs font-semibold hover:btn-brand-hover disabled:opacity-50"
              >
                {busy === slot.id ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generando…</>
                ) : queued.includes(slot.id) ? (
                  <><Loader2 className="h-3.5 w-3.5" /> En cola ({queued.indexOf(slot.id) + 1})</>
                ) : (
                  <><Sparkles className="h-3.5 w-3.5" /> {existingBySlot[slot.id] ? "Regenerar" : "Generar"}</>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CodeTab({ plan }: { plan: SitePlan }) {
  const files = [
    { path: "package.json", desc: "Dependencias del proyecto Astro" },
    { path: "astro.config.mjs", desc: "Configuración con sitemap" },
    { path: "src/layouts/Base.astro", desc: "Layout base con meta, OG, JSON-LD, canonical" },
    ...plan.pages.map((p) => ({ path: `src/pages/${p.slug === "index" ? "index" : p.slug}.astro`, desc: p.title })),
    { path: "public/robots.txt", desc: "Robots" },
    { path: "public/favicon.svg", desc: "Favicon" },
    ...plan.imageSlots.map((s) => ({ path: `public/images/${s.id}.png`, desc: s.alt })),
    { path: "README.md", desc: "Instrucciones de despliegue y notas SEO" },
  ];
  return (
    <div className="surface-card rounded-2xl p-6">
      <h3 className="mb-4 font-display text-lg font-semibold">Estructura del proyecto</h3>
      <ul className="space-y-2 font-mono text-sm">
        {files.map((f) => (
          <li key={f.path} className="flex items-center justify-between border-b border-border/50 py-1.5">
            <span className="text-brand">{f.path}</span>
            <span className="ml-4 truncate text-xs text-muted-foreground">{f.desc}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-muted-foreground">Descarga el .zip para obtener todos estos archivos listos. Después: <code className="text-brand">npm install &amp;&amp; npm run dev</code></p>
    </div>
  );
}

function FullscreenLoader({ label }: { label: string }) {
  return <div className="grid min-h-screen place-items-center"><Loader2 className="h-8 w-8 animate-spin text-brand" /><p className="mt-2 text-sm text-muted-foreground">{label}</p></div>;
}
