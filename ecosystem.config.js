module.exports = {
  apps: [
    {
      name: "frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "/home/d2mbox/frontend",
      exec_mode: "fork", // Next.js tự xử lý clustering nội bộ, không nên dùng cluster mode
      instances: 1, // Chỉ chạy 1 instance, Next.js sẽ tự scale
      max_memory_restart: "2G", // Giảm từ 4G xuống 2G vì chỉ 1 instance
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
