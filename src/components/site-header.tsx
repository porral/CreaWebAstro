import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, LogOut, LayoutDashboard, Plus, Settings } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
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
              <button onClick={signOut} title="Salir" className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground">
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
