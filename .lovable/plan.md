
# Generador de Webs Astro con IA + SEO

App donde el usuario describe su negocio/sector, la IA analiza SEO y genera un sitio Astro completo (multi-página) con copy optimizado e imágenes IA muy detalladas. Preview en la app + descarga ZIP del proyecto Astro. Requiere login, guarda historial.

## Stack & backend
- Activar **Lovable Cloud** (auth email/password + Google, base de datos, storage).
- Tablas:
  - `profiles(id → auth.users, display_name)` + trigger de creación.
  - `sites(id, user_id, name, sector, brief, config jsonb, plan jsonb, status, created_at)` — `config` guarda proveedor IA, idioma, tono, nº páginas; `plan` guarda el JSON generado (páginas, secciones, meta, prompts de imagen).
  - `site_assets(id, site_id, kind, prompt, storage_path, meta jsonb)` — imágenes generadas subidas a Storage bucket `site-images`.
  - `user_ai_keys(user_id, provider, key_ciphertext)` — claves BYOK cifradas AES-GCM con `APP_USER_CONNECTION_KEY_SECRET`.
- RLS: cada usuario ve solo lo suyo. Bucket privado, URLs firmadas.

## SEO exhaustivo (máximo)
1. **On-page automático por IA** (Gemini): title/description/H1 únicos por página, keyword principal + secundarias por sector, JSON-LD (Organization + LocalBusiness/Product/Article según sector), alt en imágenes, slugs, sitemap.xml, robots.txt, canonical, OG/Twitter, breadcrumbs.
2. **Semrush (connector)**: al pedir generación, si el usuario ha conectado Semrush se llama gateway para `phrase_kdi`, `phrase_related`, `phrase_questions`, `serp_analysis` y competencia del sector; la IA usa esos datos reales para elegir keywords objetivo por página. Botón "Conectar Semrush" en Ajustes.
3. **Auditoría posterior**: tras generar, un server fn evalúa el sitio (densidad keyword, longitud copy, meta, headings, alt) y devuelve puntuación 0-100 + sugerencias. Botón "Aplicar sugerencias" re-invoca la IA con feedback.

## Integración IA (ambas opciones)
- Ajustes → selector proveedor:
  - **Lovable AI (por defecto)**: texto `google/gemini-3-flash-preview`; opción a `openai/gpt-5.4` para calidad; imágenes `openai/gpt-image-2` (alta calidad) o `google/gemini-3-pro-image` (muy detallado). Streaming SSE con blur en parciales.
  - **BYOK**: el usuario pega su clave (OpenAI, Anthropic o Gemini). Server fn cifra y guarda; en cada llamada se descifra y se usa directamente contra el proveedor.
- Todas las llamadas IA viven en `createServerFn` (nunca en cliente).

## Flujo de usuario
1. `/` landing (hero, cómo funciona, ejemplos, CTA).
2. `/auth` login/registro (email+password, Google).
3. `/_authenticated/dashboard` historial de sitios con miniaturas.
4. `/_authenticated/new` formulario:
   - Nombre negocio, sector (selector con presets: restauración, salud, ecommerce, servicios, tecnología, inmobiliaria, educación, portfolio…), descripción libre, público objetivo, ubicación, idioma, tono, nº páginas (3–8), estilo visual (moderno/clásico/minimal/atrevido), keywords objetivo (opcionales).
   - Toggle "Usar Semrush si está conectado".
5. Al enviar → pantalla `/_authenticated/site/$id/generating` con progreso en tiempo real:
   - Paso 1: Análisis SEO del sector (Semrush + IA).
   - Paso 2: Arquitectura del sitio (páginas + secciones).
   - Paso 3: Copy SEO por página (streaming).
   - Paso 4: Prompts de imagen ultra-detallados (composición, iluminación, estilo, cámara).
   - Paso 5: Generación imágenes en paralelo (streaming con blur).
6. `/_authenticated/site/$id`:
   - Tabs: **Preview** (iframe con HTML renderizado), **SEO** (puntuación, keywords, meta), **Código** (árbol de archivos Astro), **Imágenes**.
   - Botón **Descargar .zip** → server fn genera proyecto Astro completo con JSZip.

## Estructura del ZIP Astro generado
```text
mi-sitio/
├── package.json         (astro, @astrojs/sitemap, @astrojs/tailwind)
├── astro.config.mjs     (site, sitemap, integrations)
├── tailwind.config.mjs
├── public/
│   ├── robots.txt
│   ├── favicon.svg
│   └── images/*.webp    (imágenes IA)
├── src/
│   ├── layouts/Base.astro    (meta, OG, JSON-LD, canonical)
│   ├── components/           (Nav, Footer, Hero, Section, CTA…)
│   ├── pages/
│   │   ├── index.astro
│   │   ├── servicios.astro
│   │   ├── sobre-nosotros.astro
│   │   ├── contacto.astro
│   │   └── [+ páginas del sector]
│   └── styles/global.css
└── README.md            (cómo desplegar, keywords objetivo, notas SEO)
```

## Diseño (app)
Estilo editorial-tech, oscuro con acentos vibrantes, tipografía grande, cards con degradados sutiles, animaciones motion suaves. Tokens en `src/styles.css` (oklch), sin colores hardcoded. Componentes shadcn como base con variantes propias.

## Detalles técnicos
- Imágenes IA: streaming `/api/generate-image` (server route TSS, `stream: true`, `partial_images: 1`, blur en parciales). Al completarse se sube a Storage y se guarda `storage_path` en `site_assets`.
- Generación de estructura: `createServerFn` con `Output.object` para schema estricto de páginas/secciones (schema plano, sin bounds; límites en el prompt).
- Auditoría SEO: server fn puro TS + Gemini para sugerencias.
- ZIP: `jszip` (compatible Worker) construyendo Astro desde plantillas + datos del `plan`.
- Semrush: `standard_connectors--connect` cuando el usuario pulse "Conectar Semrush". Datos cacheados por sector 24h.
- robots.txt / sitemap.xml de la propia app + `llms.txt` + head metadata correcta.

## Fuera de alcance de esta primera entrega
- Editor visual WYSIWYG (se puede iterar después).
- Publicación directa a Netlify/Vercel (se descarga el ZIP y el usuario despliega).
- Multi-idioma dentro de un mismo sitio generado (uno por idioma).

¿Procedo con esta implementación?
