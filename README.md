# semantic-release-pypi
semantic-release plugin to publish a python package to PyPI

| Step | Description
| ---- | -----------
| ```verifyConditions``` | <ul><li>verify the environment variable ```PYPI_TOKEN```</li><li>verify ```PYPI_TOKEN``` is authorized to publish on the specified repository</li><li>verify that `version` is not set inside `setup.py` (**version will be set in `setup.cfg`**)</li><li>check if the packages `setuptools`, `wheel` and `twine` are installed</li></ul>
| ```prepare``` | Update the version in ```setup.cfg``` and create the distribution packages
| ```publish``` | Publish the python package to the specified repository (default: pypi)

# Configuration

## Environment variables

| Variable | Description
| -------- | -----------
| ```PYPI_TOKEN``` | [API token](https://test.pypi.org/help/#apitoken) for PyPI

## Usage

The plugin can be configured in the [**semantic-release** configuration file](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration):

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "semantic-release-pypi",
  ]
}
```
An example using Github Actions can be found in the repo [semantic-release-pypi-example](https://github.com/abichinger/semantic-release-pypi-example).

## Options

| Option | Type | Default | Description
| ------ | ---- | ------- | -----------
| ```setupPy``` | str | ```./setup.py``` | location of ```setup.py```
| ```distDir``` | str | ```dist``` | directory to put the source distribution archive(s) in, relative to the directory of ```setup.py```
| ```repoUrl``` | str | ```https://upload.pypi.org/legacy/``` | The repository (package index) to upload the package to.