import { spawnSync } from 'node:child_process';

process.env.NODE_ENV = 'production';
const isWin = process.platform === 'win32';
const cmd = isWin ? 'npx.cmd' : 'npx';
const res = spawnSync(cmd, ['next', 'build'], {
  stdio: 'inherit',
  shell: isWin,
  env: { ...process.env, NODE_ENV: 'production' },
});
process.exit(res.status ?? 0);
