
module.exports = {
    apps: [{
        name: "antigravity-backend",
        script: "./index.js",
        instances: "max",
        exec_mode: "cluster",
        env: {
            NODE_ENV: "production",
            PORT: 4000
        }
    }]
}
