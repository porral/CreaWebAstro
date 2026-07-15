import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, LogOut, LayoutDashboard, Plus, Settings } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSessionFn, signOutFn } from "@/lib/auth.functions";

export function SiteHeader() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const getSession = useServerFn(getSessionFn);
  const signOut = useServerFn(signOutFn);

  const sessionQ = useQuery({ queryKey: ["session"], queryFn: () => getSession() });
  const email = sessionQ.data?.email ?? null;

  async function handleSignOut() {
    await queryClient.cancelQueries();
    await signOut();
    queryClient.clear();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg btn-brand"><Sparkles className="h-4 w-4" /></span>
          <span>AstroForge</span>
        </Link>
        <nav className="flex items-center gap-2">
          {email ? (
            <>
              <Link to="/dashboard" className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground sm:inline-flex">
                <LayoutDashboard className="h-4 w-4" /> Mis sitios
              </Link>
              <Link to="/new" className="inline-flex items-center gap-1.5 rounded-md btn-brand px-3 py-1.5 text-sm hover:btn-brand-hover">
                <Plus className="h-4 w-4" /> Nuevo sitio
              </Link>
              <Link to="/settings" title="Ajustes" className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground">
                <Settings className="h-4 w-4" />
              </Link>
              <button onClick={handleSignOut} title="Salir" className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link to="/auth" className="rounded-md btn-brand px-4 py-1.5 text-sm hover:btn-brand-hover">Entrar</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
