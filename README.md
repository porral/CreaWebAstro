# AstroForge

Genera sitios Astro completos con IA (copy, SEO, imágenes) y descárgalos como
proyecto listo para desplegar. Self-hosted: Postgres propio, auth propia
(JWT + bcrypt) y almacenamiento de imágenes en disco — sin Supabase ni Lovable.

## Desarrollo local

```bash
cp .env.example .env   # y rellena OPENAI_API_KEY, JWT_SECRET, etc.
npm install
npm run dev
```

Necesitas un Postgres accesible en `DATABASE_URL` con el esquema de
[`db/init.sql`](db/init.sql) aplicado (bótalo a mano con `psql` o levanta solo
el servicio `postgres` de `docker-compose.yml`).

## Despliegue con Docker (recomendado)

1. Copia `.env.example` a `.env` y rellena, como mínimo:
   - `JWT_SECRET`: genera uno con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
   - `OPENAI_API_KEY`: tu clave de OpenAI (usada para el copy con GPT-4o y las imágenes con gpt-image-1)
   - `POSTGRES_PASSWORD`: una contraseña propia para la base de datos
2. Levanta todo:

   ```bash
   docker compose up -d --build
   ```

   Esto construye la app, levanta Postgres (con el esquema de `db/init.sql`
   aplicado automáticamente en el primer arranque) y expone la app en el
   puerto `3000` (configurable con `APP_PORT`).
3. La app queda accesible en `http://tu-servidor:3000`. Ponle detrás un
   reverse proxy (Caddy, Nginx, Traefik) para TLS si vas a exponerla a
   Internet.

Los datos de Postgres y las imágenes generadas se persisten en los volúmenes
Docker `postgres-data` y `uploads-data`.

## Variables de entorno

Ver [`.env.example`](.env.example) para la lista completa con comentarios.
