import argparse
import os

from tomlkit import dumps, parse

parser = argparse.ArgumentParser(description='Set version in pyproject.toml')
parser.add_argument('srcdir', type=str, help="source directory")
parser.add_argument('-v', '--version', type=str, default="1.0.0", help="version")
args = parser.parse_args()

pyproject_path = os.path.join(args.srcdir, 'pyproject.toml')

# read file
file = open(pyproject_path, "r")
pyproject = file.read()
file.close()

# modifiy version (tomlkit will preserve comments)
toml = parse(pyproject)
if 'tool' in toml and 'poetry' in toml['tool']:
    print(f'Poetry package detected')
    toml['tool']['poetry']['version'] = args.version
else:
    toml['project']['version'] = args.version
print(f'Set version to {args.version} ({pyproject_path})')
pyproject = dumps(toml)

# write file
file = open(pyproject_path,"w")
file.write(pyproject)
file.close()

