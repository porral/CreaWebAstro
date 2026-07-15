import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSettingsFn, saveSettingsFn, type UserSettings } from "@/lib/settings.functions";
import { TEXT_PROVIDERS, getTextProvider } from "@/lib/ai-providers";
import { SiteHeader } from "@/components/site-header";
import { Settings as SettingsIcon, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Ajustes — AstroForge" }, { name: "robots", content: "noindex" }] }),
});

const DEFAULTS: UserSettings = {
  textProvider: "openai",
  textModel: "gpt-4o-mini",
  imageModel: "gpt-image-1",
  language: "es",
  tone: "profesional",
  style: "moderno",
  pages: 5,
  useSemrush: false,
  apiKeys: {},
};

function SettingsPage() {
  const getSettings = useServerFn(getSettingsFn);
  const saveSettings = useServerFn(saveSettingsFn);
  const q = useQuery({ queryKey: ["user-settings"], queryFn: () => getSettings() });
  const [form, setForm] = useState<UserSettings>(DEFAULTS);

  useEffect(() => { if (q.data) setForm(q.data); }, [q.data]);

  const mut = useMutation({
    mutationFn: () => saveSettings({ data: form }),
    onSuccess: () => { toast.success("Ajustes guardados"); q.refetch(); },
    onError: (e: any) => toast.error(e.message ?? "Error"),
  });

  function up<K extends keyof UserSettings>(k: K, v: UserSettings[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const provider = getTextProvider(form.textProvider);

  function selectProvider(providerId: string) {
    const p = getTextProvider(providerId);
    setForm((f) => ({ ...f, textProvider: providerId, textModel: p.models[0]!.id }));
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl btn-brand"><SettingsIcon className="h-5 w-5" /></span>
          <h1 className="mt-4 font-display text-4xl font-bold">Ajustes de IA</h1>
          <p className="mt-1 text-muted-foreground">Se aplicarán por defecto a cada nuevo sitio.</p>
        </div>

        {q.isLoading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
            className="surface-card space-y-5 rounded-2xl p-6"
          >
            <div className="rounded-lg border border-border p-4">
              <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
                Proveedor de texto (genera el plan y el copy de cada sitio)
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Proveedor">
                  <select value={form.textProvider} onChange={(e) => selectProvider(e.target.value)} className={inputCls}>
                    {TEXT_PROVIDERS.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}{p.free ? " — gratis" : ""}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Modelo">
                  <select value={form.textModel} onChange={(e) => up("textModel", e.target.value)} className={inputCls}>
                    {provider.models.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </Field>
              </div>
              <Field label={`API key de ${provider.label}`}>
                <input
                  type="password"
                  autoComplete="off"
                  value={form.apiKeys[form.textProvider] ?? ""}
                  onChange={(e) => up("apiKeys", { ...form.apiKeys, [form.textProvider]: e.target.value })}
                  className={inputCls}
                  placeholder={provider.id === "openai" ? "sk-..." : "clave de API"}
                />
                <span className="mt-1 block text-xs text-muted-foreground">
                  Si la dejas vacía, se usa la del servidor (si existe).{" "}
                  <a href={provider.keyHelpUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                    Consigue una clave de {provider.label} →
                  </a>
                </span>
              </Field>
            </div>

            <Field label="Modelo de imagen por defecto">
              <select value={form.imageModel} onChange={(e) => up("imageModel", e.target.value)} className={inputCls}>
                <option value="gpt-image-1">gpt-image-1</option>
              </select>
              <span className="mt-1 block text-xs text-muted-foreground">
                Las imágenes siempre se generan con OpenAI (clave de OpenAI arriba, aunque uses otro proveedor para el texto).
              </span>
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Idioma">
                <select value={form.language} onChange={(e) => up("language", e.target.value as UserSettings["language"])} className={inputCls}>
                  <option value="es">Español</option><option value="en">English</option>
                  <option value="pt">Português</option><option value="fr">Français</option>
                  <option value="de">Deutsch</option><option value="it">Italiano</option>
                </select>
              </Field>
              <Field label="Tono">
                <select value={form.tone} onChange={(e) => up("tone", e.target.value as UserSettings["tone"])} className={inputCls}>
                  <option value="profesional">Profesional</option><option value="cercano">Cercano</option>
                  <option value="elegante">Elegante</option><option value="atrevido">Atrevido</option><option value="minimalista">Minimalista</option>
                </select>
              </Field>
              <Field label="Estilo">
                <select value={form.style} onChange={(e) => up("style", e.target.value as UserSettings["style"])} className={inputCls}>
                  <option value="moderno">Moderno</option><option value="clasico">Clásico</option>
                  <option value="minimal">Minimal</option><option value="atrevido">Atrevido</option>
                </select>
              </Field>
            </div>

            <Field label={`Nº páginas por defecto (${form.pages})`}>
              <input type="range" min={3} max={12} value={form.pages} onChange={(e) => up("pages", Number(e.target.value))} className="w-full accent-[color:var(--brand)]" />
            </Field>

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-secondary/40 p-3 text-sm">
              <input type="checkbox" checked={form.useSemrush} onChange={(e) => up("useSemrush", e.target.checked)} className="accent-[color:var(--brand)]" />
              <span>Usar datos de Semrush por defecto</span>
            </label>

            <div className="flex items-center justify-between pt-2">
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Volver</Link>
              <button disabled={mut.isPending} type="submit" className="inline-flex items-center gap-2 rounded-md btn-brand px-5 py-2.5 text-sm font-semibold hover:btn-brand-hover disabled:opacity-50">
                {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar ajustes
              </button>
            </div>
          </form>
        )}
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
