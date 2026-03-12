import { getIDToken } from '@actions/core';
import envCi from 'env-ci';

import {
  OFFICIAL_PYPI_REGISTRY,
  GITHUB_ACTIONS_PROVIDER_NAME,
} from '../definitions/constants.js';
import { Context } from '../@types/semantic-release/index.js';

async function exchangeIdToken(idToken: string, context: Context) {
  const { logger } = context;
  const response = await fetch(`${OFFICIAL_PYPI_REGISTRY}_/oidc/mint-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: idToken }),
  });
  const responseBody = await response.json();

  if (response.ok) {
    logger.log('OIDC token exchange with the PyPI registry succeeded');

    return responseBody.token;
  }

  logger.log(
    `OIDC token exchange with the PyPI registry failed: ${response.status} ${responseBody.message}`,
  );

  return '';
}

async function exchangeGithubActionsToken(context: Context) {
  const { logger } = context;
  let idToken;

  logger.log('Verifying OIDC context for publishing from GitHub Actions');

  try {
    idToken = await getIDToken();
  } catch (e: any) {
    logger.log(`Retrieval of GitHub Actions OIDC token failed: ${e.message}`);
    logger.log(
      'Have you granted the `id-token: write` permission to this workflow?',
    );

    return '';
  }

  return exchangeIdToken(idToken, context);
}

function exchangeToken(context: Context) {
  const ciEnv = envCi();
  if (ciEnv.isCi) {
    if (GITHUB_ACTIONS_PROVIDER_NAME === ciEnv.name.toString()) {
      return exchangeGithubActionsToken(context);
    }
  }
  return '';
}

async function resolveToken(repoToken: string, context: Context) {
  let pypiToken = process.env['PYPI_TOKEN'] ?? repoToken
  if (!pypiToken) {
    pypiToken = await exchangeToken(context)
  }
  return pypiToken
}

export { resolveToken };
