import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';

const publicRoot = resolve('./public');
const publicImage = z.string().refine((asset) => {
  const fullPath = resolve(publicRoot, asset);
  return fullPath.startsWith(publicRoot + sep) && existsSync(fullPath);
}, '图片必须是 public/ 中存在的相对路径');

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.enum(['essay', 'diary', 'book', 'short']),
    excerpt: z.string(),
    author: reference('authors'),
    draft: z.boolean().default(false),
  }),
});

const authors = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/authors' }),
  schema: z.object({
    name: z.string().min(1),
    role: z.enum(['founder', 'guest']),
    tagline: z.string().min(1),
    bio: z.string().optional(),
    portrait: publicImage.optional(),
    portraitAlt: z.string().optional(),
    portraitWidth: z.number().int().positive().default(720),
    portraitHeight: z.number().int().positive().default(720),
    cover: publicImage.optional(),
    coverAlt: z.string().optional(),
    coverWidth: z.number().int().positive().default(1536),
    coverHeight: z.number().int().positive().default(1024),
    links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
    featured: z.boolean().default(false),
    order: z.number().int().default(100),
    featuredPost: reference('posts').optional(),
  }),
});

const topics = defineCollection({
  loader: file('./src/content/topics.json'),
  schema: z.object({
    title: z.string().min(1),
    introduction: z.string().min(1),
    cover: z.string().optional(),
    coverWidth: z.number().int().positive().default(1600),
    coverHeight: z.number().int().positive().default(900),
    posts: z.array(reference('posts')).min(1),
    order: z.number().int().default(100),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts, authors, topics };
