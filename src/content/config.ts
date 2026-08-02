import { defineCollection, z } from 'astro:content';

// Cada prato do cardápio é um arquivo Markdown em src/content/menu/.
// Os campos abaixo são exatamente os que o dono edita pelo /admin (Sveltia CMS).
const menu = defineCollection({
  type: 'content',
  schema: z.object({
    nome: z.string(),
    descricao: z.string().default(''),
    preco: z.string(), // texto livre, ex.: "39,90" ou "A partir de 25,00"
    categoria: z.string(), // ex.: "Frango", "Acompanhamentos", "Bebidas"
    foto: z.string().default('/images/menu/placeholder.svg'),
    ordem: z.number().default(99), // controla a ordem de exibição dentro da categoria
    disponivel: z.boolean().default(true),
  }),
});

// Informações do negócio (um único arquivo JSON), também editável pelo /admin.
const site = defineCollection({
  type: 'data',
  schema: z.object({
    tagline: z.string(),
    whatsapp: z.string(), // só dígitos, formato 55DDDNUMERO. Ex.: "5563999999999"
    mensagem_whatsapp: z.string().default('Olá! Gostaria de fazer um pedido.'),
    telefone: z.string().default(''),
    endereco: z.string(),
    mapa_url: z.string().default(''),
    horarios: z.array(
      z.object({
        dias: z.string(), // ex.: "Segunda a Sexta"
        horario: z.string(), // ex.: "11h às 22h"
      })
    ),
    hero_imagem: z.string().default('/images/hero.svg'),
    promo_titulo: z.string().default(''),
    promo_texto: z.string().default(''),
    promo_imagem: z.string().default('/images/promo.svg'),
  }),
});

export const collections = { menu, site };
