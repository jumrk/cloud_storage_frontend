module.exports = {
  apps: [
    {
      name: "frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "/home/d2mbox2/frontend",
      exec_mode: "cluster",
      instances: "4",
      max_memory_restart: "4G",
      autorestart: true,

      env: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: 3000,
      },

      // Logging
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // Restart strategy
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 5000,

      watch: false,
      ignore_watch: ["node_modules", ".next", "logs", ".git"],
    },
  ],
};
