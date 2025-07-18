module.exports = {
  apps: [{
    name: 'haeoreum-api',
    script: 'server/index.ts',
    interpreter: 'npx',
    interpreter_args: 'tsx',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      DATABASE_URL: 'postgresql://haeoreum_user:haeoreum2024!@localhost:5432/haeoreum_db'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};