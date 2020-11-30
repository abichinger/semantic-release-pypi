const defaultOptions = require('./defaultOptions')

function getOption(pluginConfig, option){
    return pluginConfig[option] ? pluginConfig[option] : defaultOptions[option]
}

module.exports = {
    getOption
}