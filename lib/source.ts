import { loader } from 'fumadocs-core/source';
import { createMDXSource } from 'fumadocs-mdx';
import { blog, docs, products } from '@/.source';

// See https://fumadocs.vercel.app/docs/headless/source-api for more info
export const source = loader({
  // it assigns a URL to your pages
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
});

export const blogSource = loader({
  baseUrl: '/blog',
  source: createMDXSource(blog),
});

export const productSource = loader({
  baseUrl: '/products',
  source: createMDXSource(products),
});
