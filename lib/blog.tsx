import path from 'node:path';
import type { BlogMetadata } from './types/post-metadata';
import { getMDXData } from './utils/mdx';

/**
 * Get all blog posts with metadata and content
 */
export function getBlogPosts() {
  return getMDXData<BlogMetadata>(path.join(process.cwd(), 'content', 'blog'));
}
