const { spawn } = require('node:child_process')

const server = spawn('npm', ['run', 'dev', '--', '--hostname', '127.0.0.1', '--port', '3000'], {
  stdio: 'inherit',
  shell: true,
})

server.on('exit', (code) => {
  process.exit(code ?? 0)
})
