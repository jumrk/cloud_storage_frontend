module.exports = {
  apps: [
    {
      name: "fe",
      script: "npm",
      args: "run dev",
      interpreter: "none",
      env: {
        HOST: "0.0.0.0",
        PORT: 3000,
      },
    },
  ],
};
