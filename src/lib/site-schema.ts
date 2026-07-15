// Zod schema shared between client & server
import { z } from "zod";

export const generateInputSchema = z.object({
  name: z.string().min(1).max(120),
  sector: z.string().min(1),
  brief: z.string().min(10).max(2000),
  audience: z.string().max(500).default(""),
  location: z.string().max(200).default(""),
  language: z.enum(["es", "en", "pt", "fr", "de", "it"]).default("es"),
  tone: z.enum(["profesional", "cercano", "elegante", "atrevido", "minimalista"]).default("profesional"),
  pages: z.number().int().min(3).max(12).default(5),
  style: z.enum(["moderno", "clasico", "minimal", "atrevido"]).default("moderno"),
  keywords: z.string().max(500).default(""),
  textModel: z.string().default("gpt-4o-mini"),
  imageModel: z.string().default("gpt-image-1"),
  useSemrush: z.boolean().default(false),
});

export type GenerateInput = z.infer<typeof generateInputSchema>;

export const SECTORS = [
  "Restauración",
  "Salud y bienestar",
  "E-commerce",
  "Servicios profesionales",
  "Tecnología / SaaS",
  "Inmobiliaria",
  "Educación",
  "Portfolio personal",
  "Turismo",
  "Fitness",
  "Belleza",
  "Legal / Abogados",
  "Construcción / Reformas",
  "Consultoría",
  "Fotografía",
  "Otro",
];

export interface SitePlan {
  siteName: string;
  language: string;
  seoStrategy: {
    primaryKeyword: string;
    secondaryKeywords: string[];
    audienceIntent: string;
    contentAngle: string;
    competitorInsights: string;
  };
  brandColors: { primary: string; accent: string; background: string; foreground: string };
  jsonLdType: "Organization" | "LocalBusiness" | "Product" | "Article" | "ProfessionalService";
  pages: SitePage[];
  imageSlots: ImageSlot[];
}

export interface SitePage {
  slug: string; // "index" or "servicios"
  path: string; // "/" or "/servicios"
  title: string;
  metaDescription: string;
  h1: string;
  keyword: string;
  sections: SiteSection[];
}

export interface SiteSection {
  kind: "hero" | "features" | "cta" | "faq" | "testimonials" | "gallery" | "contact" | "about" | "services" | "pricing";
  heading?: string;
  subheading?: string;
  body?: string;
  items?: Array<{ title: string; body: string }>;
  imageSlot?: string; // ref to imageSlots
}

export interface ImageSlot {
  id: string;
  prompt: string; // very detailed prompt
  alt: string;
  aspect: "16:9" | "1:1" | "4:5";
}
