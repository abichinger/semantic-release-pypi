const execa = require('execa')
const path = require('path');
const { getOption } = require('./util')
const got = require('got')
const FormData = require('form-data');
const fs = require('fs');

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

async function verifySetupPy(setupPy){
    try {
        await execa('python', [
            path.resolve(__dirname, 'verifySetup.py'),
            path.basename(setupPy)
        ], {cwd: path.dirname(setupPy)})
    } catch(err){
        throw Error(err.stderr)
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

async function verify (pluginConfig, { logger }) {
    let setupPy = getOption(pluginConfig, 'setupPy')
    let pypiPublish = getOption(pluginConfig, 'pypiPublish')

    if (pypiPublish !== false) {
        let username = process.env['PYPI_USERNAME'] ? process.env['PYPI_USERNAME'] : '__token__'
        let token = process.env['PYPI_TOKEN']
        let repoUrl = process.env['PYPI_REPO_URL'] ? process.env['PYPI_REPO_URL'] : getOption(pluginConfig, 'repoUrl')
        
        assertEnvVar('PYPI_TOKEN')

        logger.log('Check if setuptools, wheel and twine are installed')
        await assertPackage('setuptools')
        await assertPackage('wheel')
        await assertPackage('twine')

        logger.log(`Verify authentication for ${username}@${repoUrl}`)
        await verifyAuth(repoUrl, username, token)
    }

    if(!fs.existsSync(setupPy)) {
        throw Error(`setup.py not found, path: ${setupPy}`)
    }

    logger.log('Verify that version is not set in setup.py')
    await verifySetupPy(setupPy)
}

module.exports = {
    verify,
    assertEnvVar,
    assertExitCode,
    assertPackage,
    verifySetupPy,
    verifyAuth
}