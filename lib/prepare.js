const execa = require('execa')
const { getOption, normalizeVersion, setopt} = require('./util')
const path = require('path')

async function setReleaseVersion(setupPy, version){
    try{
        await setopt(setupPy, 'metadata', 'version', version)
    } catch(err){
        throw Error(`failed to set release version ${version}\n${err}`)
    }   
}

async function sDistPackage(setupPy, distDir){
    try {
        await execa('python', [
            path.basename(setupPy),
            'sdist',
            '--dist-dir',
            distDir
        ], {cwd: path.dirname(setupPy)})
    } catch(err){
        throw Error(`failed to build source archive`)
    }
}

async function bDistPackage(setupPy, distDir){
    try {
        await execa('python', [
            path.basename(setupPy),
            'bdist_wheel',
            '--dist-dir',
            distDir
        ], {cwd: path.dirname(setupPy)})
    } catch(err){
        throw Error(`failed to build wheel`)
    }
}

async function prepare(pluginConfig, { nextRelease }){
    let setupPy = getOption(pluginConfig, 'setupPy')
    let distDir = getOption(pluginConfig, 'distDir')
    let version = await normalizeVersion(nextRelease.version)

    await setReleaseVersion(setupPy, version)
    await sDistPackage(setupPy, distDir)
    await bDistPackage(setupPy, distDir)
}

module.exports = {
    setReleaseVersion,
    sDistPackage,
    bDistPackage,
    prepare
}