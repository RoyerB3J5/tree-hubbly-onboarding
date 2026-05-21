module.exports = {
  apps: [
    {
      name: "treehubly-app",
      script: "bun",
      args: "run start",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
}
