import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getAPIToken, isTrustedPublisher } from '../lib/trusted-publishing.js';
import {
  clearTrustedPublisherEnv,
  genPluginArgs,
  setGitHubEnv,
  setGitLabEnv,
} from './util.js';

// ---------------------------------------------------------------------------
// Mock `got` so no real HTTP requests are made
// ---------------------------------------------------------------------------

vi.mock('got', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContext() {
  return genPluginArgs({}).context;
}

// ---------------------------------------------------------------------------
// isTrustedPublisher
// ---------------------------------------------------------------------------

describe('isTrustedPublisher', () => {
  beforeEach(clearTrustedPublisherEnv);
  afterEach(vi.unstubAllEnvs);

  test('returns false when no publisher env vars are set', () => {
    expect(isTrustedPublisher()).toBe(false);
  });

  test('returns true when GitHub Actions env vars are set', () => {
    setGitHubEnv();
    expect(isTrustedPublisher()).toBe(true);
  });

  test('returns false when only ACTIONS_ID_TOKEN_REQUEST_TOKEN is set', () => {
    vi.stubEnv('ACTIONS_ID_TOKEN_REQUEST_TOKEN', 'token');
    expect(isTrustedPublisher()).toBe(false);
  });

  test('returns false when only ACTIONS_ID_TOKEN_REQUEST_URL is set', () => {
    vi.stubEnv('ACTIONS_ID_TOKEN_REQUEST_URL', 'https://example.com');
    expect(isTrustedPublisher()).toBe(false);
  });

  test('returns true when GitLab PYPI_ID_TOKEN is set', () => {
    setGitLabEnv();
    expect(isTrustedPublisher()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getAPIToken
// ---------------------------------------------------------------------------

describe('getAPIToken', () => {
  beforeEach(() => {
    clearTrustedPublisherEnv();
    vi.clearAllMocks();
  });
  afterEach(clearTrustedPublisherEnv);

  test('throws when no trusted publisher is configured', async () => {
    const ctx = makeContext();
    await expect(getAPIToken(ctx)).rejects.toThrow(
      'No trusted publisher detected',
    );
  });

  test('GitHub Actions: fetches OIDC token and exchanges for API token', async () => {
    setGitHubEnv(
      'gh-req-token',
      'https://token.actions.githubusercontent.com?runtimeToken=abc',
    );
    const got = await import('got');
    vi.mocked(got.default.get).mockResolvedValue({
      body: { value: 'gh-oidc-token' },
    } as any);
    vi.mocked(got.default.post).mockResolvedValue({
      body: { token: 'pypi-api-token-from-gh' },
    } as any);

    const ctx = makeContext();
    const apiToken = await getAPIToken(ctx);

    expect(apiToken).toBe('pypi-api-token-from-gh');
    expect(got.default.get).toHaveBeenCalledWith(
      expect.stringContaining('audience=pypi'),
      expect.objectContaining({
        headers: { Authorization: 'bearer gh-req-token' },
      }),
    );
    expect(got.default.post).toHaveBeenCalledWith(
      'https://pypi.org/_/oidc/mint-token',
      expect.objectContaining({ json: { token: 'gh-oidc-token' } }),
    );
  });

  test('GitHub Actions: uses testpypi audience for test.pypi.org repo URL', async () => {
    setGitHubEnv();
    const got = await import('got');
    vi.mocked(got.default.get).mockResolvedValue({
      body: { value: 'gh-oidc-token' },
    } as any);
    vi.mocked(got.default.post).mockResolvedValue({
      body: { token: 'pypi-api-token' },
    } as any);

    const ctx = makeContext();
    await getAPIToken(ctx, 'https://test.pypi.org/legacy/');

    expect(got.default.get).toHaveBeenCalledWith(
      expect.stringContaining('audience=testpypi'),
      expect.any(Object),
    );
    expect(got.default.post).toHaveBeenCalledWith(
      'https://test.pypi.org/_/oidc/mint-token',
      expect.any(Object),
    );
  });

  test('GitLab CI: uses PYPI_ID_TOKEN to exchange for API token', async () => {
    setGitLabEnv('gitlab-id-token-value');
    const got = await import('got');
    vi.mocked(got.default.post).mockResolvedValue({
      body: { token: 'pypi-api-token-from-gl' },
    } as any);

    const ctx = makeContext();
    const apiToken = await getAPIToken(ctx);

    expect(apiToken).toBe('pypi-api-token-from-gl');
    expect(got.default.get).not.toHaveBeenCalled();
    expect(got.default.post).toHaveBeenCalledWith(
      'https://pypi.org/_/oidc/mint-token',
      expect.objectContaining({ json: { token: 'gitlab-id-token-value' } }),
    );
  });

  test('GitHub Actions takes precedence over GitLab when both are set', async () => {
    setGitHubEnv();
    setGitLabEnv();
    const got = await import('got');
    vi.mocked(got.default.get).mockResolvedValue({
      body: { value: 'gh-oidc-token' },
    } as any);
    vi.mocked(got.default.post).mockResolvedValue({
      body: { token: 'gh-api-token' },
    } as any);

    const ctx = makeContext();
    const apiToken = await getAPIToken(ctx);

    expect(apiToken).toBe('gh-api-token');
    expect(ctx.logger.log).toHaveBeenCalledWith(
      'Using GitHub Actions Trusted Publishing',
    );
    expect(got.default.get).toHaveBeenCalled();
  });

  test('throws when PyPI mint-token response does not contain a token', async () => {
    setGitLabEnv('valid-oidc-token');
    const got = await import('got');
    vi.mocked(got.default.post).mockResolvedValue({
      body: {},
    } as any);

    const ctx = makeContext();
    await expect(getAPIToken(ctx)).rejects.toThrow(
      'Trusted publishing: PyPI did not return an API token',
    );
  });

  test('logs correct publisher name for GitLab', async () => {
    setGitLabEnv('gl-token');
    const got = await import('got');
    vi.mocked(got.default.post).mockResolvedValue({
      body: { token: 'api-token' },
    } as any);

    const ctx = makeContext();
    await getAPIToken(ctx);

    expect(ctx.logger.log).toHaveBeenCalledWith(
      'Using GitLab CI Trusted Publishing',
    );
  });
});

// ---------------------------------------------------------------------------
// verify.ts integration: trusted publishing token stored in process.env
// ---------------------------------------------------------------------------

describe('verify: trusted publishing token stored in PYPI_TOKEN', () => {
  beforeEach(() => {
    vi.stubEnv('PYPI_TOKEN', undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('verify sets PYPI_TOKEN from trusted publisher when token is absent', async () => {
    // This test verifies the integration in verify.ts by importing verify
    // with mocked trusted-publishing module.
    const { verify } = await import('../lib/verify.js');

    setGitLabEnv('my-gitlab-oidc-token');
    const got = await import('got');

    // mint-token exchange
    vi.mocked(got.default.post).mockResolvedValue({
      body: { token: 'minted-pypi-token' },
    } as any);

    // Import genPackage after mocks are in place
    const { genPackage } = await import('./util.js');
    const { pluginConfig, context } = genPackage({
      legacyInterface: false,
      config: { pypiPublish: true, repoToken: '' },
      content: `[project]\nname = "test"\nversion = "1.0.0"`,
    });

    // verifyAuth will fire but we don't want another HTTP call to interfere
    // with our assertion; a 403 response will make verifyAuth throw, so we
    // let the post mock also handle the verifyAuth call — it will succeed
    // because verifyAuth ignores non-403 errors.

    await verify(pluginConfig, context);

    expect(process.env['PYPI_TOKEN']).toBe('minted-pypi-token');
  });
});
