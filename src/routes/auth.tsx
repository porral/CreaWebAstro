import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { getSessionFn, signInFn, signUpFn } from "@/lib/auth.functions";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Iniciar sesión — AstroForge" },
      { name: "description", content: "Accede a AstroForge para generar sitios Astro con IA y guardar tu historial." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const getSession = useServerFn(getSessionFn);
  const signIn = useServerFn(signInFn);
  const signUp = useServerFn(signUpFn);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSession().then((user) => {
      if (user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp({ data: { email, password } });
        toast.success("Cuenta creada.");
      } else {
        await signIn({ data: { email, password } });
      }
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Error de autenticación");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-6 py-16">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl btn-brand"><Sparkles className="h-5 w-5" /></span>
          <h1 className="mt-4 font-display text-3xl font-semibold">
            {mode === "signin" ? "Bienvenido" : "Crea tu cuenta"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Entra para acceder a tus sitios" : "Empieza a generar sitios Astro con IA"}
          </p>
        </div>

        <div className="surface-card rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">Contraseña</label>
              <input
                type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-md btn-brand px-4 py-2.5 text-sm font-semibold hover:btn-brand-hover disabled:opacity-50">
              {loading ? "..." : mode === "signin" ? "Entrar" : "Crear cuenta"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Entra"}
          </button>
        </div>
      </main>
    </div>
  );
}
