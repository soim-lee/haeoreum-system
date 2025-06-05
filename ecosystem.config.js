module.exports = {
  apps: [{
    name: 'haeoreum-api',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 8080,
      // 데이터베이스 설정
      DATABASE_URL: 'postgresql://username:password@localhost:5432/haeoreum_db',
      // OpenAI API 키 (실제 키로 교체 필요)
      OPENAI_API_KEY: 'your-openai-api-key-here'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};