import fs from 'fs';

export default async function (/* globalConfig: any, projectConfig: any */) {
  fs.rmSync('.tmp', { recursive: true, force: true });
}
