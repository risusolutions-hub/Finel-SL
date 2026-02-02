module.exports = {
  apps: [
    {
      name: 'sparkel-backend',
      script: './server.js',
      cwd: './backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 4000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      
      // Restart policies
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads', '.env'],
      max_memory_restart: '1G',
      
      // Error & output logs
      error_file: './backend/logs/error.log',
      out_file: './backend/logs/out.log',
      log_file: './backend/logs/combined.log',
      time: true,
      
      // Startup & shutdown
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Health check
      max_fails: 3,
      fail_count: 0,
      
      // Merge logs from cluster instances
      merge_logs: true,
      
      // Advanced
      interpreter: 'node',
      interpreter_args: '--max-old-space-size=4096',
      
      // Post-update actions
      post_update: ['npm install']
    }
  ],
  
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-production-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/sparkel.git',
      path: '/var/www/sparkel',
      'post-deploy': 'npm install && npm run build && pm2 restart ecosystem.config.js --env production'
    }
  }
};
