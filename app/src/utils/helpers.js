module.exports = {
    sleep: async (ms) => new Promise(resolve => setTimeout(resolve, ms))
}