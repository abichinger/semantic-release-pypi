# semantic-release-pypi
semantic-release plugin to publish a python package to PyPI

| Step | Description
| ---- | -----------
| ```verifyConditions``` | verify the environment variable ```PYPI_TOKEN```
| ```prepare``` | Update the version in ```setup.cfg``` and create the distribution packages
| ```publish``` | Publish the python package to the specified repository (default: pypi)

# Configuration

## Environment variables

| Variable | Description
| -------- | -----------
| ```PYPI_TOKEN``` | [API token](https://test.pypi.org/help/#apitoken) for PyPI
| [```TWINE_REPOSITORY```](https://twine.readthedocs.io/en/latest/#twine-upload) | The repository (package index) to upload the package to.

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

## Options

| Option | Type | Default | Description
| ------ | ---- | ------- | -----------
| ```setupPy``` | str | ```./setup.py``` | location of ```setup.py```
| ```distDir``` | str | ```dist``` | directory to put the source distribution archive(s) in, relative to the directory of ```setup.py```