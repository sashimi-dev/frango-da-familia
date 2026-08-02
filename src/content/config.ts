import { defineCollection, z } from 'astro:content';

// Cada prato do cardápio é um arquivo Markdown em src/content/menu/.
const menu = defineCollection({
  type: 'content',
  schema: z.object({
    nome: z.string(),
    descricao: z.string().default(''),
    preco: z.string(), // texto livre, ex.: "50,00"
    categoria: z.string(), // ex.: "Frangos e Carnes", "Porções"
    foto: z.string().default('/images/menu/placeholder.svg'),
    ordem: z.number().default(99),
    disponivel: z.boolean().default(true),
  }),
});

// Informações do negócio (arquivo JSON único), editável pelo /admin.
const site = defineCollection({
  type: 'data',
  schema: z.object({
    tagline: z.string(),
    whatsapp: z.string(), // só dígitos, 55DDDNUMERO. Ex.: "5563992553014"
    whatsapp2: z.string().default(''), // segundo número, opcional
    mensagem_whatsapp: z.string().default('Olá! Gostaria de fazer um pedido.'),
    telefone: z.string().default(''),
    endereco: z.string(),
    mapa_url: z.string().default(''),
    horarios: z.array(
      z.object({
        dias: z.string(),
        horario: z.string(),
      })
    ),
    hero_imagem: z.string().default('/images/hero.svg'),
    logo: z.string().default('/images/logo.svg'),
    promo_titulo: z.string().default(''),
    promo_texto: z.string().default(''),
    promo_imagem: z.string().default('/images/promo.svg'),
    instagram_handle: z.string().default(''),
    instagram_url: z.string().default(''),
    // Cole aqui o código de incorporação do Behold/SnapWidget (opcional).
    instagram_embed: z.string().default(''),
    // Grade própria de fotos em destaque (sem depender de terceiros).
    instagram_posts: z
      .array(
        z.object({
          imagem: z.string(),
          link: z.string().default(''),
        })
      )
      .default([]),
  }),
});

export const collections = { menu, site };
