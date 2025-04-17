# 📦🐍 semantic-release-pypi

[semantic-release](https://semantic-release.gitbook.io/semantic-release/) plugin to publish a python package to PyPI

<a href="https://www.npmjs.com/package/semantic-release-pypi">
  <img alt="npm latest version" src="https://img.shields.io/npm/v/semantic-release-pypi">
</a>
<a href="https://github.com/abichinger/semantic-release-pypi/actions?query=workflow%3ATest+branch%3Amain">
  <img alt="Build states" src="https://github.com/abichinger/semantic-release-pypi/actions/workflows/test.yml/badge.svg?branch=main">
</a>

## CI environment

- [Node.js](https://semantic-release.gitbook.io/semantic-release/support/node-version) >= 18.0.0
- Python >= 3.9

## Build System Interfaces

`semantic-release-pypi` support two [build system interfaces](https://pip.pypa.io/en/stable/reference/build-system/#)

- `pyproject.toml` based (Recommended)
  - `version` will be set inside `pyproject.toml` - [PEP 621](https://peps.python.org/pep-0621/)
  - The build backend can be specified inside `pyproject.toml` (defaults
    to `setuptools`) - [PEP 518](https://peps.python.org/pep-0518/)

<br />

- `setup.py` based (Legacy interface)
  - `setuptools` is required, other packaging tools like Poetry or Hatch are not supported when using this interface
  - `version` will be set inside `setup.cfg`
  - `version` must **not be set** inside `setup.py`

## Steps

| Step                   | Description                                                                                                                                                                                                                           
|------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
| ```verifyConditions``` | <ul><li>verify the environment variable ```PYPI_TOKEN```</li><li>verify ```PYPI_TOKEN``` is authorized to publish on the specified repository</li><li>check if the packages `setuptools`, `wheel` and `twine` are installed</li></ul> 
| ```prepare```          | Update the version in `pyproject.toml` (legacy: `setup.cfg`) and create the distribution packages                                                                                                                                     
| ```publish```          | Publish the python package to the specified repository (default: pypi)                                                                                                                                                                

## Environment variables

| Variable            | Description                                                | Required | Default                 
|---------------------|------------------------------------------------------------|----------|-------------------------
| ```PYPI_TOKEN```    | [API token](https://test.pypi.org/help/#apitoken) for PyPI | true     |
| ```PYPI_USERNAME``` | Username for PyPI                                          | false    | ```__token__```         
| ```PYPI_REPO_URL``` | Repo URL for PyPI                                          | false    | See [Options](#options) 

## Usage

The plugin can be configured in the [**semantic-release
** configuration file](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration).
Here is a minimal example:

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "semantic-release-pypi"
  ]
}
```

Note that this plugin modifies the version inside of `pyproject.toml` (legacy: `setup.cfg`).
Make sure to commit `pyproject.toml` using the `@semantic-release/git` plugin, if you want to save the changes:

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "semantic-release-pypi",
    [
      "@semantic-release/git",
      {
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
        "assets": [
          "pyproject.toml"
        ]
      }
    ]
  ]
}
```

Working examples using Github Actions can be found here:

- [semantic-release-pypi-pyproject](https://github.com/abichinger/semantic-release-pypi-pyproject)
- [semantic-release-pypi-setup](https://github.com/abichinger/semantic-release-pypi-setup)

## Options

| Option             | Type                  | Default                               | Description                                                                                                                                                                                                                                                      
|--------------------|-----------------------|---------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
| ```srcDir```       | str                   | ```.```                               | source directory (defaults to current directory)                                                                                                                                                                                                                 
| ```distDir```      | str                   | ```dist```                            | directory to put the source distribution archive(s) in, relative to ```srcDir```                                                                                                                                                                                 
| ```repoUrl```      | str                   | ```https://upload.pypi.org/legacy/``` | The repository (package index) to upload the package to.                                                                                                                                                                                                         
| ```repoUsername``` | str                   | ```__token__```                       | The repository username.                                                                                                                                                                                                                                         
| ```repoToken```    | str                   |                                       | The repository token. It's safer to set via PYPI_TOKEN environment variable.                                                                                                                                                                                     
| ```pypiPublish```  | bool                  | ```true```                            | Whether to publish the python package to the pypi registry. If false the package version will still be updated.                                                                                                                                                  
| ```gpgSign```      | bool                  | ```false```                           | Whether to sign the package using GPG. A valid PGP key must already be installed and configured on the host.                                                                                                                                                     
| ```gpgIdentity```  | str                   | ```null```                            | When ```gpgSign``` is true, set the GPG identify to use when signing files. Leave empty to use the default identity.                                                                                                                                             
| ```envDir```       | string \| ```false``` | ```.venv```                           | directory to create the virtual environment in, if set to `false` no environment will be created                                                                                                                                                                 
| ```installDeps```  | bool                  | ```true```                            | wether to automatically install python dependencies                                                                                                                                                                                                              
| ```versionCmd```   | string                | ```undefined```                       | Run a custom command to update the version (e.g. `hatch version ${version}`). `srcDir` is used as working directory. `versionCmd` is required if the version is set [dynamically](https://packaging.python.org/en/latest/specifications/pyproject-toml/#dynamic) 

## Publishing to multiple repositories

Using `release.config.js` you can read repository credentials from environment variables and publish to multiple
repositories.

```js
module.exports = {
  "plugins": [
    [
      "semantic-release-pypi",
      {
          "repoUrl": process.env['REPOSITORY_1_URL'],
          "repoUsername": process.env['REPOSITORY_1_USERNAME'],
          "repoToken": process.env['REPOSITORY_1_TOKEN']
      }
    ],
    [
      "semantic-release-pypi",
      {
          "repoUrl": process.env['REPOSITORY_2_URL'],
          "repoUsername": process.env['REPOSITORY_2_USERNAME'],
          "repoToken": process.env['REPOSITORY_2_TOKEN']
      }
    ]
  ]
}

```

## Development

### Pre-requisites

- pyenv >= 2.1.0

```shell
source init.sh
```

### Contribute

- Fork from this repository
- Run `source init.sh`
- Add your changes
- Make sure your code passes all unit tests by running `yarn test`
- Run `yarn lint` to ensure your code adheres to the linting rules
- Issue a PR

## Alternatives

[Python Semantic Release](https://github.com/python-semantic-release/python-semantic-release)