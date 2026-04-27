const { spawn, spawnSync } = require('node:child_process')

const build = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true,
})

if (build.error) {
  throw build.error
}

if (build.status !== 0) {
  process.exit(build.status ?? 1)
}

const server = spawn('npm', ['run', 'start', '--', '--hostname', '127.0.0.1', '--port', '3000'], {
  stdio: 'inherit',
  shell: true,
})

server.on('exit', (code) => {
  process.exit(code ?? 0)
})
