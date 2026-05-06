import { cp, rm } from 'fs/promises';
import { join } from 'path';

void (async () => {
  const src = join(__dirname, '../../web/dist');
  const dest = join(__dirname, '../dist/web');
  await rm(dest, { recursive: true, force: true });
  await cp(src, dest, { recursive: true });
})();
