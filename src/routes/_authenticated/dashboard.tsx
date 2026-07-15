import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listSitesFn, deleteSiteFn } from "@/lib/sites.functions";
import { SiteHeader } from "@/components/site-header";
import { Plus, Trash2, FileText, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Mis sitios — AstroForge" }, { name: "robots", content: "noindex" }] }),
});

function DashboardPage() {
  const navigate = useNavigate();
  const list = useServerFn(listSitesFn);
  const del = useServerFn(deleteSiteFn);
  const q = useQuery({ queryKey: ["sites"], queryFn: () => list() });
  const delMut = useMutation({
    mutationFn: async (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Sitio eliminado"); q.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold">Mis sitios</h1>
            <p className="mt-1 text-muted-foreground">Todos los sitios Astro que has generado.</p>
          </div>
          <button onClick={() => navigate({ to: "/new" })} className="inline-flex items-center gap-1.5 rounded-md btn-brand px-4 py-2 text-sm font-semibold hover:btn-brand-hover">
            <Plus className="h-4 w-4" /> Nuevo sitio
          </button>
        </div>

        {q.isLoading && <p className="text-muted-foreground">Cargando...</p>}
        {q.data && q.data.length === 0 && (
          <div className="surface-card rounded-2xl p-16 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-brand" />
            <h2 className="mt-4 font-display text-2xl font-semibold">Aún no tienes sitios</h2>
            <p className="mt-2 text-muted-foreground">Empieza generando tu primer sitio Astro con IA.</p>
            <Link to="/new" className="mt-6 inline-flex rounded-md btn-brand px-5 py-2.5 text-sm font-semibold hover:btn-brand-hover">
              Crear mi primer sitio
            </Link>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {q.data?.map((s: any) => (
            <div key={s.id} className="surface-card group rounded-2xl p-5 transition hover:border-brand/40">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{s.sector}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${s.status === "ready" ? "bg-brand/20 text-brand" : "bg-secondary text-muted-foreground"}`}>{s.status}</span>
              </div>
              <Link to="/site/$id" params={{ id: s.id }} className="block">
                <h3 className="font-display text-xl font-semibold group-hover:text-gradient">{s.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
              </Link>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-brand" /> SEO {s.seo_score ?? "—"}/100
                </div>
                <button
                  onClick={() => { if (confirm("¿Eliminar este sitio?")) delMut.mutate(s.id); }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
