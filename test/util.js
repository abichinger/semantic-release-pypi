const { setopt } = require('../lib/util')
const path = require('path')
const fs = require('fs-extra')
const got = require('got')
const { v4: uuidv4 } = require('uuid')

const defaultContent = `
from setuptools import setup
setup()
`

async function genPackage(setupPy, name, content=defaultContent){

    let dir = path.dirname(setupPy)
    fs.mkdirSync(dir, {recursive: true})
    fs.writeFileSync(setupPy, content)

    let options = [
        ['name', name],
    ]

    for(let [option, value] of options){
        await setopt(setupPy, 'metadata', option, value)
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
 async function genPluginArgs(setupPy, name='integration', channel=null){
    let packageName = `semantic-release-pypi-${name}-test-`+uuidv4()

    let config = {
        setupPy: setupPy,
        repoUrl: 'https://test.pypi.org/legacy/'
    }

    let context = {
        nextRelease: {
            version: '1.2.3',
            channel,
        },
        logger: {
            log: jest.fn()
        },
        stdout: process.stdout,
        stderr: process.stderr,
    }

    await genPackage(setupPy, packageName)

    return {config, context, packageName}
}

module.exports = {
    genPackage,
    hasPackage,
    genPluginArgs
}