const execa = require('execa')
const path = require('path');
const fs = require('fs');
const { getOption, normalizeVersion } = require('./util')

function assertEnvVar(name){
    if (!process.env[name]) {
        throw new Error(`Environment variable ${name} is not set`)
    }
}

async function assertExitCode(executable, args=[], exitCode=0){
    let res
    try {
        res = await execa(executable, args)
    }
    catch(err){
        res = err
    }
    if(res.exitCode != exitCode){
        throw Error(`command: ${res.command}, exit code: ${res.exitCode}, expected: ${exitCode}`)
    }
}

async function assertPackage(name){
    try{
        await assertExitCode('pip', ['show', name], 0)
    }
    catch(err){
        throw Error(`Package ${name} is not installed`)
    }
}

const versionRe = /version[^\n]+,/

function verifySetupPy(setupPy){
    
    return new Promise((resolve, reject) => {
        fs.readFile(setupPy, (err, data) => {
            if(err){
                reject(err)
            }
            
            if(versionRe.test(data)){
                reject(Error(`version in ${setupPy}`))
            }
            resolve()
        })
    })
}

function verifyToken(token){
    if(!token.startsWith('pypi-')){
        throw Error('Token does not include pypi- prefix')
    }
}

async function verify (pluginConfig, { nextRelease }) {
    let setupPy = getOption(pluginConfig, 'setupPy')
    
    assertEnvVar('PYPI_TOKEN')

    await assertPackage('setuptools')
    await assertPackage('wheel')
    await assertPackage('twine')

    verifyToken(process.env['PYPI_TOKEN'])
    verifySetupPy(setupPy)
    await normalizeVersion(nextRelease.version)
}

module.exports = {
    verify,
    assertEnvVar,
    assertExitCode,
    assertPackage,
    verifyToken,
    verifySetupPy
}