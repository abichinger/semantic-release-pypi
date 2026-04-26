import http from 'http';
import { expect, test, vi } from 'vitest';
import {
  getAPIToken,
  getTrustedPublisher,
} from '../../lib/trusted-publishing.js';
import { verifyAuth } from '../../lib/verify.js';

test('trusted publishing: GitHub Actions — mints a real API token from TestPyPI', async () => {
  if (getTrustedPublisher() != 'github') {
    console.warn('skipped: not running inside GitHub Actions');
    return;
  }

  // TestPyPI requires the audience to be "testpypi"
  const repoUrl = 'https://test.pypi.org/legacy/';
  const fakeContext = { logger: { log: console.log } } as any;
  const apiToken = await getAPIToken(fakeContext, repoUrl);

  // The minted token is a short-lived PyPI API token — it must be non-empty
  // and follow the "pypi-..." prefix used by PyPI
  expect(typeof apiToken).toBe('string');
  expect(apiToken.length).toBeGreaterThan(0);

  // verify the token works against TestPyPI
  await expect(verifyAuth(repoUrl, '__token__', apiToken)).resolves.toBe(
    undefined,
  );
}, 30000);

test('trusted publishing: mint-token exchange populates PYPI_TOKEN', async () => {
  // Stand up a mock mint-token endpoint
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/_/oidc/mint-token') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ token: 'fake-minted-token' }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  server.listen();
  const { port } = server.address() as any;

  vi.stubEnv('PYPI_ID_TOKEN', 'any-gitlab-oidc-token');
  vi.stubEnv('PYPI_TOKEN', undefined);

  try {
    const ctx = { logger: { log: () => {} } } as any;
    const repoUrl = `http://localhost:${port}/legacy/`;
    const token = await getAPIToken(ctx, repoUrl);
    expect(token).toBe('fake-minted-token');
  } finally {
    vi.unstubAllEnvs();
    await new Promise<Error | undefined>((r) => server.close(r));
  }
}, 10000);
