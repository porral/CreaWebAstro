import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createSiteFn, generatePlanFn } from "@/lib/sites.functions";
import { getSettingsFn } from "@/lib/settings.functions";
import { SECTORS, type GenerateInput } from "@/lib/site-schema";
import { SiteHeader } from "@/components/site-header";
import { Wand2, Loader2, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/new")({
  component: NewSitePage,
  head: () => ({ meta: [{ title: "Nuevo sitio — AstroForge" }, { name: "robots", content: "noindex" }] }),
});

function NewSitePage() {
  const navigate = useNavigate();
  const create = useServerFn(createSiteFn);
  const generate = useServerFn(generatePlanFn);
  const getSettings = useServerFn(getSettingsFn);

  const settingsQ = useQuery({ queryKey: ["user-settings"], queryFn: () => getSettings() });

  const [form, setForm] = useState<GenerateInput>({
    name: "",
    sector: SECTORS[0],
    brief: "",
    audience: "",
    location: "",
    language: "es",
    tone: "profesional",
    pages: 5,
    style: "moderno",
    keywords: "",
    textModel: "gpt-4o-mini",
    imageModel: "gpt-image-1",
    useSemrush: false,
  });

  // Apply saved settings as defaults when they load
  useEffect(() => {
    const s = settingsQ.data;
    if (!s) return;
    setForm((f) => ({
      ...f,
      language: s.language ?? f.language,
      tone: s.tone ?? f.tone,
      style: s.style ?? f.style,
      pages: s.pages ?? f.pages,
      textModel: s.textModel ?? f.textModel,
      imageModel: s.imageModel ?? f.imageModel,
      useSemrush: s.useSemrush ?? f.useSemrush,
    }));
  }, [settingsQ.data]);


  const mut = useMutation({
    mutationFn: async () => {
      const { id } = await create({ data: form });
      return { id };
    },
    onSuccess: async ({ id }) => {
      toast.success("Sitio creado. Generando plan SEO…");
      navigate({ to: "/site/$id", params: { id } });
      // Kick off generation in background (route will poll/show progress)
      generate({ data: { siteId: id } }).catch((e) => {
        console.error(e);
        toast.error(`Error generando: ${e.message ?? e}`);
      });
    },
    onError: (e: any) => toast.error(e.message ?? "Error"),
  });

  function update<K extends keyof GenerateInput>(key: K, value: GenerateInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl btn-brand"><Wand2 className="h-5 w-5" /></span>
          <h1 className="mt-4 font-display text-4xl font-bold">Nuevo sitio Astro</h1>
          <p className="mt-1 text-muted-foreground">Cuéntanos sobre tu negocio. La IA hará el resto.</p>
          <Link to="/settings" className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <SettingsIcon className="h-3.5 w-3.5" /> Ajustes de IA por defecto
          </Link>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="surface-card space-y-5 rounded-2xl p-6">
          <Field label="Nombre del negocio / proyecto">
            <input required value={form.name} onChange={(e) => update("name", e.target.value)} className={inputCls} placeholder="Café Nube" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sector">
              <select value={form.sector} onChange={(e) => update("sector", e.target.value)} className={inputCls}>
                {SECTORS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Ubicación (opcional)">
              <input value={form.location} onChange={(e) => update("location", e.target.value)} className={inputCls} placeholder="Madrid, España" />
            </Field>
          </div>
          <Field label="Descripción del negocio">
            <textarea required rows={4} value={form.brief} onChange={(e) => update("brief", e.target.value)} className={inputCls} placeholder="Qué haces, qué te diferencia, tu propuesta de valor…" />
          </Field>
          <Field label="Público objetivo (opcional)">
            <input value={form.audience} onChange={(e) => update("audience", e.target.value)} className={inputCls} placeholder="Ej: freelancers 25-40 años en España" />
          </Field>
          <Field label="Keywords que quieres targetear (opcional, separadas por coma)">
            <input value={form.keywords} onChange={(e) => update("keywords", e.target.value)} className={inputCls} placeholder="cafetería especialidad, café de origen, brunch madrid" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Idioma">
              <select value={form.language} onChange={(e) => update("language", e.target.value as any)} className={inputCls}>
                <option value="es">Español</option><option value="en">English</option>
                <option value="pt">Português</option><option value="fr">Français</option>
                <option value="de">Deutsch</option><option value="it">Italiano</option>
              </select>
            </Field>
            <Field label="Tono">
              <select value={form.tone} onChange={(e) => update("tone", e.target.value as any)} className={inputCls}>
                <option value="profesional">Profesional</option><option value="cercano">Cercano</option>
                <option value="elegante">Elegante</option><option value="atrevido">Atrevido</option><option value="minimalista">Minimalista</option>
              </select>
            </Field>
            <Field label="Estilo visual">
              <select value={form.style} onChange={(e) => update("style", e.target.value as any)} className={inputCls}>
                <option value="moderno">Moderno</option><option value="clasico">Clásico</option>
                <option value="minimal">Minimal</option><option value="atrevido">Atrevido</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={`Páginas (${form.pages})`}>
              <input type="range" min={3} max={12} value={form.pages} onChange={(e) => update("pages", Number(e.target.value))} className="w-full accent-[color:var(--brand)]" />
            </Field>
            <Field label="Modelo texto">
              <select value={form.textModel} onChange={(e) => update("textModel", e.target.value)} className={inputCls}>
                <option value="gpt-4o-mini">GPT-4o mini (recomendado)</option>
                <option value="gpt-4o">GPT-4o (máxima calidad)</option>
              </select>
            </Field>
            <Field label="Modelo imagen">
              <select value={form.imageModel} onChange={(e) => update("imageModel", e.target.value)} className={inputCls}>
                <option value="gpt-image-1">gpt-image-1</option>
              </select>
            </Field>
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-secondary/40 p-3 text-sm">
            <input type="checkbox" checked={form.useSemrush} onChange={(e) => update("useSemrush", e.target.checked)} className="accent-[color:var(--brand)]" />
            <span>Usar datos reales de Semrush si está conectado <span className="text-muted-foreground">(opcional)</span></span>
          </label>

          <button disabled={mut.isPending} type="submit" className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md btn-brand px-6 py-3 text-sm font-semibold hover:btn-brand-hover disabled:opacity-50">
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {mut.isPending ? "Creando…" : "Generar sitio"}
          </button>
        </form>
      </main>
    </div>
  );
}

const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
