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

async function sDistPackage(srcDir, distDir, context){
    let cp = execa('python3', [
        "-m",
        "build",
        '--sdist',
        '--outdir',
        distDir
    ], {cwd: srcDir})

    cp.stdout.pipe(context.stdout, {end: false})
    cp.stderr.pipe(context.stderr, {end: false})

    await cp
}

async function bDistPackage(srcDir, distDir, context){
    try {
        let cp = execa('python3', [
            "-m",
            "build",
            '--wheel',
            '--outdir',
            distDir
        ], {cwd: srcDir})

        cp.stdout.pipe(context.stdout, {end: false})
        cp.stderr.pipe(context.stderr, {end: false})

        await cp
    } catch(err){
        console.log(err)
        throw Error(`failed to build wheel`)
    }
}

async function prepare(pluginConfig, context){
    let { logger, nextRelease } = context;
    let setupPy = getOption(pluginConfig, 'setupPy')
    let distDir = getOption(pluginConfig, 'distDir')
    let pypiPublish = getOption(pluginConfig, 'pypiPublish')

    let version = await normalizeVersion(nextRelease.version)

    logger.log(`Set version to ${version}`)    
    await setReleaseVersion(setupPy, version)

    if (pypiPublish !== false) {
        logger.log(`Build source archive`)    
        await sDistPackage(path.dirname(setupPy), distDir, context)
        logger.log(`Build wheel`)    
        await bDistPackage(path.dirname(setupPy), distDir, context)
    }
}

module.exports = {
    setReleaseVersion,
    sDistPackage,
    bDistPackage,
    prepare
}