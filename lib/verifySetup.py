import argparse
import importlib
import os
import sys
from unittest.mock import Mock

import setuptools

parser = argparse.ArgumentParser(description='Check if version is set inside setup.py')
parser.add_argument('setup_path', type=str, default="./setup.py", help="path of setup.py")
args = parser.parse_args()

sys.path.insert(0, os.path.dirname(args.setup_path))

mock = Mock()
setuptools.setup = mock

#import setup
importlib.import_module(os.path.splitext(os.path.basename(args.setup_path))[0])

if mock.call_args is not None and 'version' in mock.call_args[1]:
    sys.exit(f"version in {args.setup_path}")

sys.exit(0)