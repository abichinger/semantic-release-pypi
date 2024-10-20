import { rmSync } from 'fs';

export default async function (/* globalConfig: any, projectConfig: any */) {
  rmSync('.tmp', { recursive: true, force: true });
}
