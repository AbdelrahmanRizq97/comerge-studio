import { mkdir, cp, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..');
const srcAssetsDir = path.join(repoRoot, 'src', 'assets');
const distAssetsDir = path.join(repoRoot, 'dist', 'assets');

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

if (await exists(srcAssetsDir)) {
  await mkdir(distAssetsDir, { recursive: true });
  await cp(srcAssetsDir, distAssetsDir, { recursive: true });
}


