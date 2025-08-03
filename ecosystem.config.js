module.exports = {
  apps: [
    {
      name: "fe",
      script: "npm",
      args: "run dev",
      env: {
        PORT: 3000,
        HOST: "0.0.0.0",
      },
    },
  ],
};
