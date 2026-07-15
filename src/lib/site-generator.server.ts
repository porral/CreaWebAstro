// Server-only helpers to call an OpenAI-compatible chat API (OpenAI, Groq,
// DeepSeek, OpenRouter, ...) for site plan / page copy generation.
import type { SitePlan, SitePage, GenerateInput } from "./site-schema";

export interface LlmConfig {
  baseUrl: string;
  apiKey: string | undefined;
  model: string;
}

async function callChatJson(config: LlmConfig, systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
  if (!config.apiKey) throw new Error(`Falta la API key para el proveedor de texto configurado.`);

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Error del proveedor de IA [${res.status}]: ${body}`);
  }

  const data = await res.json();
  let content: string = data.choices?.[0]?.message?.content ?? "";
  content = content.trim();
  if (content.startsWith("```")) {
    content = content.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  }
  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) content = content.slice(firstBrace, lastBrace + 1);
  return content;
}

function buildPlannerPrompt(input: GenerateInput, semrushHints?: string) {
  const lang = input.language;
  return `You are an expert SEO strategist and web architect. Produce a complete website plan as strict minified JSON.

BUSINESS
- Name: ${input.name}
- Sector: ${input.sector}
- Brief: ${input.brief}
- Audience: ${input.audience || "general"}
- Location: ${input.location || "n/a"}
- Real services provided by the user (USE THESE VERBATIM if present, do not invent different ones): ${input.services || "not provided — infer from brief/sector"}
- Real features/differentiators provided by the user (USE THESE VERBATIM if present): ${input.features || "not provided — infer from brief/sector"}
- Real customer benefits provided by the user (USE THESE VERBATIM if present): ${input.benefits || "not provided — infer from brief/sector"}
- Language: ${lang}
- Tone: ${input.tone}
- Visual style: ${input.style}
- User keywords: ${input.keywords || "none — infer"}
- Requested pages: ${input.pages}
${semrushHints ? `\nSEMRUSH DATA:\n${semrushHints}\n` : ""}

TASK
1. Do exhaustive SEO analysis for this sector. Pick 1 primary keyword + 6-10 secondary keywords with real commercial or informational intent for the sector.
2. Design a site architecture with EXACTLY ${input.pages} pages — not fewer, not more. First page slug MUST be "index" with path "/". Common sector pages (servicios, sobre-nosotros, contacto, etc.) as fits. Every page MUST have a unique slug y una path única empezando por "/".
3. Cada página: title único (<60 chars), meta description persuasiva con beneficio claro (<160 chars), H1 único, keyword objetivo propia y 4-6 secciones. Kinds válidos: hero, features, cta, faq, testimonials, gallery, contact, about, services, pricing.
4. COPYWRITING (crítico — cada página debe VENDER y CONVERTIR):
   - Aplica fórmulas reales (AIDA / PAS / beneficio-driven). Habla en segunda persona según el tono (${input.tone}).
   - HERO de cada página: heading potente que incluya la keyword de la página + subheading con la promesa/beneficio principal (1 frase) + body de 2-3 frases (problema → solución → resultado tangible) + imageSlot con imagen 100% coherente con el TÍTULO/TEMA de esa página (no genérica).
   - CADA página debe incluir AL MENOS un CTA claro y accionable adaptado al sector ("Reserva tu mesa", "Solicita presupuesto", "Pide tu demo", "Agenda una consulta gratis", etc.), ya sea como sección "cta" propia o dentro del hero/services/pricing.
   - CADA página debe incluir AL MENOS una imagen (imageSlot) relacionada temáticamente con el título de la página. La imagen del hero de "Servicios" muestra el servicio en acción; la de "Sobre nosotros" al equipo/local; la de "Contacto" la ubicación; la del index una foto insignia del negocio.
   - "features"/"services": cada item.title es un BENEFICIO concreto (no genérico), item.body 25-45 palabras explicando el cómo y el para qué. Si el usuario ha indicado servicios/características/beneficios reales (ver arriba), ÚSALOS TAL CUAL como base de estos items — no los sustituyas por otros inventados, solo redacta/expande el copy alrededor de ellos.
   - "faq": preguntas reales de compra del sector, respuestas de 30-60 palabras que rompen objeciones.
   - "testimonials": 3 testimonios verosímiles (nombre + rol/empresa) específicos del sector con resultados medibles.
   - "body" de secciones ≥ 40 palabras. PROHIBIDO usar placeholders, "Lorem ipsum", "Descripción aquí", frases genéricas o vacías, o repetir el mismo copy entre páginas.
5. Escoge el JSON-LD correcto para el sector.
6. Paleta de color (primary, accent, background oscuro, foreground claro) en HEX según el estilo pedido.
7. Define 5-10 imageSlots con prompts ULTRA DETALLADOS de al menos 60-100 palabras cada uno, listos para pegar directamente en un generador de imágenes. Cada prompt DEBE especificar explícitamente: (a) sujeto/escena exacta y contexto real del sector/negocio (nada genérico), (b) composición y encuadre (plano, ángulo, profundidad de campo), (c) iluminación (tipo, dirección, calidez), (d) cámara/lente (p.ej. "objetivo 35mm, f/1.8"), (e) estilo fotográfico o artístico y mood/atmósfera, (f) paleta de color coherente con brandColors, (g) texturas/materiales y detalles de fondo/primer plano relevantes. Cada slot se asigna a la sección donde encaja temáticamente. Alt descriptivo con la keyword. IMPORTANTE: el campo "prompt" de cada imageSlot debe estar escrito EN ${lang} (nunca en inglés), con el mismo nivel de detalle.
8. TODO el copy en ${lang}. Nunca mezcles idiomas.
9. Devuelve el JSON COMPLETO en UNA respuesta. No trunques. Sin texto antes ni después.

OUTPUT
Return ONLY valid minified JSON, no markdown fences, matching exactly this TypeScript shape:
{"siteName":string,"language":string,"seoStrategy":{"primaryKeyword":string,"secondaryKeywords":string[],"audienceIntent":string,"contentAngle":string,"competitorInsights":string},"brandColors":{"primary":string,"accent":string,"background":string,"foreground":string},"jsonLdType":"Organization"|"LocalBusiness"|"Product"|"Article"|"ProfessionalService","pages":[{"slug":string,"path":string,"title":string,"metaDescription":string,"h1":string,"keyword":string,"sections":[{"kind":string,"heading"?:string,"subheading"?:string,"body"?:string,"items"?:[{"title":string,"body":string}],"imageSlot"?:string}]}],"imageSlots":[{"id":string,"prompt":string,"alt":string,"aspect":"16:9"|"1:1"|"4:5"}]}`;
}

export async function generateSitePlanServer(input: GenerateInput, llm: LlmConfig, semrushHints?: string): Promise<SitePlan> {
  const content = await callChatJson(
    llm,
    "You return strict minified JSON. No markdown, no prose. Never truncate the response — include every requested page and section in full.",
    buildPlannerPrompt(input, semrushHints),
    16000,
  );

  let plan: SitePlan;
  try {
    plan = JSON.parse(content) as SitePlan;
  } catch (e) {
    console.error("Plan parse failure", content.slice(0, 500));
    throw new Error("La IA devolvió un JSON inválido. Reintenta.");
  }
  // Sanity: ensure unique paths and non-empty pages
  if (Array.isArray(plan.pages)) {
    const seen = new Set<string>();
    plan.pages = plan.pages.filter((p) => {
      if (!p?.path || !p?.slug) return false;
      if (seen.has(p.path)) return false;
      seen.add(p.path);
      return true;
    });
  }
  if (!plan.pages?.length) throw new Error("La IA no devolvió páginas. Reintenta.");
  // Normalize possibly-missing arrays so downstream rendering/audit never crashes.
  plan.imageSlots = Array.isArray(plan.imageSlots) ? plan.imageSlots : [];
  for (const p of plan.pages) p.sections = Array.isArray(p.sections) ? p.sections : [];
  return plan;
}

function buildImprovePagePrompt(input: GenerateInput, plan: SitePlan, page: SitePage): string {
  const existingImageSlots = Array.from(
    new Set(page.sections.map((s) => s.imageSlot).filter((x): x is string => Boolean(x))),
  );
  return `You are an expert SEO copywriter. Improve ONE existing page of a website to maximize content value and keyword relevance to its own title/topic.

BUSINESS
- Name: ${input.name}
- Sector: ${input.sector}
- Brief: ${input.brief}
- Tone: ${input.tone}
- Language: ${input.language}
- Site primary keyword: ${plan.seoStrategy?.primaryKeyword ?? "n/a"}
- Site secondary keywords: ${(plan.seoStrategy?.secondaryKeywords ?? []).join(", ") || "n/a"}

CURRENT PAGE (to improve)
${JSON.stringify({ slug: page.slug, path: page.path, title: page.title, metaDescription: page.metaDescription, h1: page.h1, keyword: page.keyword, sections: page.sections })}

TASK
1. Rewrite title (<60 chars), metaDescription (80-160 chars, persuasiva con beneficio claro), h1 y keyword para que sean MÁS valiosos, específicos y persuasivos que la versión actual. Nunca genéricos ni de relleno.
2. La keyword objetivo de la página DEBE estar directamente alineada con su título/tema, y aparecer de forma natural en title, h1 y al menos dos veces en el body de las secciones (sin keyword stuffing).
3. Reescribe TODAS las secciones existentes aportando siempre contenido de valor real: beneficios concretos, datos, resultados tangibles — nunca relleno ni frases vacías. Body de cada sección ≥ 40 palabras.
4. ENRIQUECE la página: puedes AÑADIR nuevas secciones si faltan y aportan valor — más encabezados/subtemas relevantes, una sección "features" o "services" con características/beneficios concretos si no existe, una sección "cta" con llamada a la acción clara si no existe, "faq" o "testimonials" si encajan, información variada e importante para el usuario. No te limites a reescribir lo que ya había: el objetivo es una página más completa y útil, no solo más bonita.
5. Mantén exactamente el mismo slug y path: "${page.slug}" / "${page.path}". Kinds válidos para secciones nuevas: hero, features, cta, faq, testimonials, gallery, contact, about, services, pricing. La primera sección debe seguir siendo "hero".
6. Si una sección ya tenía imageSlot, reutiliza EXACTAMENTE el mismo id (${existingImageSlots.length ? existingImageSlots.join(", ") : "ninguno"}) — no inventes ids de imagen nuevos. Las secciones nuevas que añadas NO deben llevar imageSlot (no hay imagen generada para ellas todavía).
7. PROHIBIDO usar placeholders, "Lorem ipsum", "Descripción aquí" o frases genéricas.
8. Todo el copy en ${input.language}.

OUTPUT
Return ONLY valid minified JSON, no markdown fences, matching exactly this TypeScript shape:
{"slug":string,"path":string,"title":string,"metaDescription":string,"h1":string,"keyword":string,"sections":[{"kind":string,"heading"?:string,"subheading"?:string,"body"?:string,"items"?:[{"title":string,"body":string}],"imageSlot"?:string}]}`;
}

export async function improvePageServer(
  input: GenerateInput,
  plan: SitePlan,
  page: SitePage,
  llm: LlmConfig,
): Promise<SitePage> {
  const content = await callChatJson(
    llm,
    "You return strict minified JSON. No markdown, no prose.",
    buildImprovePagePrompt(input, plan, page),
    6000,
  );

  let improved: SitePage;
  try {
    improved = JSON.parse(content) as SitePage;
  } catch {
    console.error("Improve-page parse failure", content.slice(0, 500));
    throw new Error("La IA devolvió un JSON inválido. Reintenta.");
  }
  // Force the original slug/path — never let the rewrite drift the page's identity.
  improved.slug = page.slug;
  improved.path = page.path;
  improved.sections = Array.isArray(improved.sections) ? improved.sections : [];
  return improved;
}

export async function auditSitePlanServer(plan: SitePlan): Promise<{ score: number; suggestions: string[] }> {
  const suggestions: string[] = [];
  let score = 100;
  for (const p of plan.pages) {
    if (!p.title || p.title.length > 60) { score -= 4; suggestions.push(`El título de "${p.path}" debe tener menos de 60 caracteres.`); }
    if (!p.metaDescription || p.metaDescription.length > 160 || p.metaDescription.length < 80) {
      score -= 4;
      suggestions.push(`La meta description de "${p.path}" debe tener entre 80 y 160 caracteres.`);
    }
    if (!p.h1 || p.h1.length < 10) { score -= 3; suggestions.push(`El H1 de "${p.path}" es demasiado corto.`); }
    if (!p.keyword) { score -= 3; suggestions.push(`Falta keyword objetivo en "${p.path}".`); }
    if ((p.sections?.length ?? 0) < 3) { score -= 2; suggestions.push(`La página "${p.path}" tiene pocas secciones.`); }
  }
  if ((plan.seoStrategy?.secondaryKeywords?.length ?? 0) < 5) { score -= 5; suggestions.push("Añade más keywords secundarias."); }
  if (!plan.imageSlots?.length) { score -= 5; suggestions.push("No hay imágenes definidas."); }
  return { score: Math.max(0, Math.min(100, score)), suggestions };
}
