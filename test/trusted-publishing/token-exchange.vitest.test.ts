import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  GITHUB_ACTIONS_PROVIDER_NAME,
  OFFICIAL_PYPI_REGISTRY,
} from '../../lib/definitions/constants.js';
import type { Context } from '../../lib/@types/semantic-release/index.js';

const { getIDTokenMock, envCiMock } = vi.hoisted(() => ({
  getIDTokenMock: vi.fn(),
  envCiMock: vi.fn(),
}));

vi.mock('@actions/core', () => ({
  getIDToken: getIDTokenMock,
}));

vi.mock('env-ci', () => ({
  default: envCiMock,
}));

import { resolveToken } from '../../lib/trusted-publishing/token-exchange.js';

describe('resolveToken', () => {
  const fetchMock = vi.fn();
  const context = { logger: { log: vi.fn() } } as unknown as Context;
  let repoToken = ''

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    delete process.env['PYPI_TOKEN']
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('returns an access token when token exchange succeeds on GitHub Actions', async () => {
    envCiMock.mockReturnValue({ isCi: true, name: GITHUB_ACTIONS_PROVIDER_NAME });
    getIDTokenMock.mockResolvedValue('id-token-value');
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ token: 'token-value' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await expect(resolveToken(repoToken, context)).resolves.toBe('token-value');
    expect(getIDTokenMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `${OFFICIAL_PYPI_REGISTRY}_/oidc/mint-token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'id-token-value' }),
      },
    );
  });

  test('returns empty string when ID token retrieval fails on GitHub Actions', async () => {
    envCiMock.mockReturnValue({ isCi: true, name: GITHUB_ACTIONS_PROVIDER_NAME });
    getIDTokenMock.mockRejectedValue(
      new Error('Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable'),
    );

    await expect(resolveToken(repoToken, context)).resolves.toBe('');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('returns empty string when token exchange fails on GitHub Actions', async () => {
    envCiMock.mockReturnValue({ isCi: true, name: GITHUB_ACTIONS_PROVIDER_NAME });
    getIDTokenMock.mockResolvedValue('id-token-value');
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ message: 'foo' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await expect(resolveToken(repoToken, context)).resolves.toBe('');
  });

  test('returns empty string when no supported CI provider is detected', async () => {
    envCiMock.mockReturnValue({ isCi: true, name: 'Other Service' });

    expect(resolveToken(repoToken, context)).resolves.toBe('');
    expect(getIDTokenMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('returns env token when present', async () => {
    process.env['PYPI_TOKEN'] = 'env-token'
    expect(resolveToken(repoToken, context)).resolves.toBe('env-token')
  })

  test('returns repoToken when no env token present', async () => {
    expect(resolveToken('repo-token', context)).resolves.toBe('repo-token')
  })
});
