import { describe, expect, test, vi } from 'vitest';
import { isConflictError, publish } from '../lib/publish.js';
import { genPluginArgs } from './util.js';

describe('isConflictError', () => {
  const testCases = [
    {
      output: '409 Conflict',
      expected: true,
    },
    {
      output: 'File already exists',
      expected: true,
    },
    {
      output: '409',
      expected: true,
    },
    {
      output: 'FILE ALREADY EXISTS',
      expected: true,
    },
    {
      output: 'HTTPError: 403 Forbidden',
      expected: false,
    },
    {
      output: 'Internal Server Error',
      expected: false,
    },
  ];

  testCases.forEach(({ output, expected }) => {
    test(`returns ${expected} when output is "${output}"`, () => {
      expect(isConflictError({ stderr: output, stdout: '', message: '' })).toBe(
        expected,
      );
      expect(isConflictError({ stderr: '', stdout: output, message: '' })).toBe(
        expected,
      );
      expect(isConflictError({ stderr: '', stdout: '', message: output })).toBe(
        expected,
      );
    });
  });

  test('handles objects with missing properties without throwing', () => {
    expect(isConflictError({ message: '409 Conflict' })).toBe(true);
    expect(isConflictError({})).toBe(false);
  });

  test('handles null/undefined fields without throwing', () => {
    expect(
      isConflictError({ stderr: null, stdout: undefined, message: '409' }),
    ).toBe(true);
  });
});

test('publish: pypiPublish=false logs skip message without uploading', async () => {
  const { pluginConfig, context } = genPluginArgs({
    pypiPublish: false,
    envDir: false,
  });
  await publish(pluginConfig, context);
  expect(context.logger.log).toHaveBeenCalledWith(
    'Not publishing package due to requested configuration',
  );
});

// ---------------------------------------------------------------------------
// publish — conflict handling (skipIfConflict)
// vi.mock is hoisted, so we declare it here and configure per-test via
// mockImplementation. The mock replaces util.spawn which is called inside
// publishPackage, allowing us to control the error thrown.
// ---------------------------------------------------------------------------

vi.mock('../lib/util.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/util.js')>();
  return {
    ...actual,
    spawn: vi.fn(),
  };
});

describe('publish: skipIfConflict behaviour', () => {
  test('skipIfConflict=true suppresses a 409 conflict error', async () => {
    const { spawn } = await import('../lib/util.js');
    const conflictError = Object.assign(new Error('Upload failed'), {
      stderr: '409 Conflict',
      stdout: '',
    });
    vi.mocked(spawn).mockRejectedValue(conflictError);

    const { pluginConfig, context } = genPluginArgs({
      pypiPublish: true,
      skipIfConflict: true,
      envDir: false,
      repoToken: 'fake-token',
    });

    await expect(publish(pluginConfig, context)).resolves.toBe(undefined);
    expect(context.logger.log).toHaveBeenCalledWith(
      'Package version already exists, skipping upload',
    );
  });

  test('skipIfConflict=false re-throws a 409 conflict error', async () => {
    const { spawn } = await import('../lib/util.js');
    const conflictError = Object.assign(new Error('Upload failed'), {
      stderr: '409 Conflict',
      stdout: '',
    });
    vi.mocked(spawn).mockRejectedValue(conflictError);

    const { pluginConfig, context } = genPluginArgs({
      pypiPublish: true,
      skipIfConflict: false,
      envDir: false,
      repoToken: 'fake-token',
    });

    await expect(publish(pluginConfig, context)).rejects.toThrow(
      'Upload failed',
    );
  });

  test('skipIfConflict=true still re-throws non-conflict errors', async () => {
    const { spawn } = await import('../lib/util.js');
    const authError = Object.assign(new Error('403 Forbidden'), {
      stderr: 'HTTPError: 403 Forbidden',
      stdout: '',
    });
    vi.mocked(spawn).mockRejectedValue(authError);

    const { pluginConfig, context } = genPluginArgs({
      pypiPublish: true,
      skipIfConflict: true,
      envDir: false,
      repoToken: 'fake-token',
    });

    await expect(publish(pluginConfig, context)).rejects.toThrow(
      '403 Forbidden',
    );
  });
});
