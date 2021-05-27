const { setopt } = require('../lib/util')
const path = require('path')
const fs = require('fs-extra')

defaultContent = `
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

module.exports = {
    genPackage
}