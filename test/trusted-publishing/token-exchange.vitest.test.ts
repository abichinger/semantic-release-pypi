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

import { exchangeToken } from '../../lib/trusted-publishing/token-exchange.js';

describe('exchangeToken', () => {
  const fetchMock = vi.fn();
  const context = { logger: { log: vi.fn() } } as unknown as Context;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
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

    await expect(exchangeToken(context)).resolves.toBe('token-value');
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

  test('returns undefined when ID token retrieval fails on GitHub Actions', async () => {
    envCiMock.mockReturnValue({ isCi: true, name: GITHUB_ACTIONS_PROVIDER_NAME });
    getIDTokenMock.mockRejectedValue(
      new Error('Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable'),
    );

    await expect(exchangeToken(context)).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('returns undefined when token exchange fails on GitHub Actions', async () => {
    envCiMock.mockReturnValue({ isCi: true, name: GITHUB_ACTIONS_PROVIDER_NAME });
    getIDTokenMock.mockResolvedValue('id-token-value');
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ message: 'foo' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await expect(exchangeToken(context)).resolves.toBeUndefined();
  });

  test('returns undefined when no supported CI provider is detected', async () => {
    envCiMock.mockReturnValue({ isCi: true, name: 'Other Service' });

    expect(exchangeToken(context)).toBeUndefined();
    expect(getIDTokenMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
