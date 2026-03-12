import { beforeEach, describe, expect, test, vi } from 'vitest';

import { OFFICIAL_PYPI_REGISTRY } from '../../lib/definitions/constants.js';
import type { Context } from '../../lib/@types/semantic-release/index.js';

const { exchangeTokenMock } = vi.hoisted(() => ({
  exchangeTokenMock: vi.fn(),
}));

vi.mock('../../lib/trusted-publishing/token-exchange.js', () => ({
  exchangeToken: exchangeTokenMock,
}));

import oidcContextEstablished from '../../lib/trusted-publishing/oidc-context.js';

describe('oidcContextEstablished', () => {
  const context = { logger: { log: vi.fn() } } as unknown as Context;

  beforeEach(() => {
    vi.clearAllMocks();
    exchangeTokenMock.mockResolvedValue('');
  });

  test('returns true when trusted publishing is established with the official registry', async () => {
    exchangeTokenMock.mockResolvedValue('token-value');

    await expect(
      oidcContextEstablished(OFFICIAL_PYPI_REGISTRY, context),
    ).resolves.toBe(true);
  });

  test('returns false when OIDC token exchange fails in a supported CI provider', async () => {
    exchangeTokenMock.mockResolvedValue('');

    await expect(
      oidcContextEstablished(OFFICIAL_PYPI_REGISTRY, context),
    ).resolves.toBe(false);
  });

  test('returns false when a custom registry is targeted', async () => {
    await expect(
      oidcContextEstablished('https://custom.registry.org/', context),
    ).resolves.toBe(false);
    expect(exchangeTokenMock).not.toHaveBeenCalled();
  });
});
