import { Context } from '../@types/semantic-release/index.js';
import { OFFICIAL_PYPI_REGISTRY } from '../definitions/constants.js';
import { exchangeToken } from './token-exchange.js';

export default async function oidcContextEstablished(
  registry: string,
  context: Context,
) {
  return (
    OFFICIAL_PYPI_REGISTRY === registry && !!(await exchangeToken(context))
  );
}
