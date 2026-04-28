import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';

export const productUploadsPath = join(process.cwd(), 'uploads', 'products');

export function ensureDirectoryExists(path: string) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

export function buildUploadedFileName(originalName: string) {
  const extension = extname(originalName) || '.jpg';
  const safeBase = originalName
    .replace(extension, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return `${safeBase || 'product'}-${Date.now()}${extension}`;
}
