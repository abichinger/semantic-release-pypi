import got from 'got';
import { Context } from './@types/semantic-release/index.js';

function getMintTokenUrl(repoUrl: string): string {
  const url = new URL(repoUrl);
  const host = url.hostname.replace(/^upload\./, '');
  if (url.port === '443' || url.port === '80' || url.port === '') {
    return `${url.protocol}//${host}/_/oidc/mint-token`;
  }
  return `${url.protocol}//${host}:${url.port}/_/oidc/mint-token`;
}

function getAudience(repoUrl: string): string {
  const url = new URL(repoUrl);
  const host = url.hostname.replace(/^upload\./, '');
  if (host === 'test.pypi.org') return 'testpypi';
  return 'pypi';
}

async function mintApiToken(
  oidcToken: string,
  mintUrl: string,
): Promise<string> {
  const response = await got.post(mintUrl, {
    json: { token: oidcToken },
    responseType: 'json',
  });
  const body = response.body as { token: string };
  if (!body.token) {
    throw new Error(`Trusted publishing: PyPI did not return an API token`);
  }
  return body.token;
}

async function getGithubOidcToken(audience: string): Promise<string> {
  const requestToken = process.env['ACTIONS_ID_TOKEN_REQUEST_TOKEN'];
  const requestUrl = process.env['ACTIONS_ID_TOKEN_REQUEST_URL'];

  const url = `${requestUrl}&audience=${audience}`;
  const response = await got.get(url, {
    headers: { Authorization: `bearer ${requestToken}` },
    responseType: 'json',
  });
  const body = response.body as { value: string };
  return body.value;
}

export function getTrustedPublisher(): 'github' | 'gitlab' | null {
  if (
    !!process.env['ACTIONS_ID_TOKEN_REQUEST_TOKEN'] &&
    !!process.env['ACTIONS_ID_TOKEN_REQUEST_URL']
  ) {
    return 'github';
  }
  if (!!process.env['PYPI_ID_TOKEN']) {
    return 'gitlab';
  }

  return null;
}

export function isTrustedPublisher(): boolean {
  return getTrustedPublisher() !== null;
}

export async function getAPIToken(
  context: Context,
  repoUrl = 'https://upload.pypi.org/legacy/',
): Promise<string> {
  const { logger } = context;

  const mintUrl = getMintTokenUrl(repoUrl);
  const audience = getAudience(repoUrl);

  const trustedPublisher = getTrustedPublisher();

  if (trustedPublisher === 'github') {
    logger.log('Using GitHub Actions Trusted Publishing');
    const oidcToken = await getGithubOidcToken(audience);
    return mintApiToken(oidcToken, mintUrl);
  }

  if (trustedPublisher === 'gitlab') {
    logger.log('Using GitLab CI Trusted Publishing');
    const oidcToken = process.env['PYPI_ID_TOKEN']!;
    return mintApiToken(oidcToken, mintUrl);
  }

  throw new Error(
    'No trusted publisher detected. Set PYPI_TOKEN, configure repoToken, or use a supported Trusted Publisher (GitHub Actions or GitLab CI).',
  );
}
