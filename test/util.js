const { setopt } = require('../lib/util')
const path = require('path')
const fs = require('fs-extra')
const got = require('got')
const { v4: uuidv4 } = require('uuid')

const defaultSetupPy = `
from setuptools import setup
setup()
`

const defaultPyproject = `
[project]
name = "example_package"
version = "0.0.1"
`

async function genPackage(buildFile, name="example_package", content=null){

    let isLegacyInterface = path.basename(buildFile).startsWith("setup");
    content = content ?? (isLegacyInterface ? defaultSetupPy : defaultPyproject);

    let dir = path.dirname(buildFile)
    fs.mkdirSync(dir, {recursive: true})
    fs.writeFileSync(buildFile, content)

    if (isLegacyInterface) {
        let options = [
            ['name', name],
        ]
    
        for(let [option, value] of options){
            await setopt(buildFile, 'metadata', option, value)
        }
    }
}

async function hasPackage(repoUrl, packageName, version){
    let url = `${repoUrl}/pypi/${packageName}/${version}/json`
    try {
        await got.get(url)
        return true
    }
    catch(err) {
        return false
    }
}

/**
 * 
 * @param {string} setupPy path of setup.py
 * @returns {{config: object, context: object, packageName: string}} 
 */
 async function genPluginArgs(setupPy, name='integration'){
    let packageName = `semantic-release-pypi-${name}-test-`+uuidv4()

    let config = {
        setupPy: setupPy,
        repoUrl: 'https://test.pypi.org/legacy/'
    }

    let context = {
        nextRelease: {
            version: '1.2.3'
        },
        logger: {
            log: jest.fn()
        },
        stdout: process.stdout,
        stderr: process.stderr,
    }

    return {config, context, packageName}
}

module.exports = {
    genPackage,
    hasPackage,
    genPluginArgs
}