const execa = require('execa')
const path = require('path');
const fs = require('fs');
const { getOption, normalizeVersion } = require('./util')
const got = require('got')
const FormData = require('form-data');

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

async function verifyAuth(repoUrl, username, token){
    let form = new FormData()
    form.append(':action', 'file_upload')

    let basicAuth = Buffer.from(`${username}:${token}`).toString('base64')
    let headers = {
        "Authorization": `Basic ${basicAuth}`,
    }
    try{
        await got(repoUrl, {
            method: 'post',
            headers: Object.assign(headers, form.getHeaders()),
            body: form,
        })
    }
    catch(err){
        if(err.response && err.response.statusCode == 403){
            throw err
        }
    }
}

async function verify (pluginConfig) {
    let setupPy = getOption(pluginConfig, 'setupPy')
    let username = process.env['PYPI_USERNAME'] ? process.env['PYPI_USERNAME'] : '__token__'
    let token = process.env['PYPI_TOKEN']
    let repoUrl = process.env['PYPI_REPO_URL'] ? process.env['PYPI_REPO_URL'] : getOption(pluginConfig, 'repoUrl')
    
    assertEnvVar('PYPI_TOKEN')

    await assertPackage('setuptools')
    await assertPackage('wheel')
    await assertPackage('twine')

    // Skip verification because of custom pypi repos
    // verifyToken(token)
    await verifySetupPy(setupPy)
    await verifyAuth(repoUrl, username, token)
}

module.exports = {
    verify,
    assertEnvVar,
    assertExitCode,
    assertPackage,
    verifyToken,
    verifySetupPy,
    verifyAuth
}