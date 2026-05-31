module.exports = {
  apps: [
    {
      name: 'golden-valley',
      script: 'npm',
      args: 'start -- -p 3000',
      cwd: '/var/www/golden-valley',
      node_args: '--dns-result-order=ipv4first',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
}
