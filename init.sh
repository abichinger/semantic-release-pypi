#!/usr/bin/env bash

set -u -e

# when running natively
if command -v pyenv &>/dev/null; then
  pyenv install --skip-existing
fi

python -m venv venv
# shellcheck disable=SC1091
source venv/bin/activate
pip install --quiet --requirement lib/py/requirements.txt

set +e +u
