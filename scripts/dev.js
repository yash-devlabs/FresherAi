import 'dotenv/config';
import { execFileSync, spawn } from 'node:child_process';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const frontendPort = Number(process.env.VITE_PORT || 5173);
const backendPort = Number(process.env.PORT || 5001);

function canBind(port) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', (error) => {
      if (['EADDRINUSE', 'EACCES', 'EPERM'].includes(error.code)) return resolve(false);
      reject(error);
    });
    server.listen(port, '0.0.0.0', () => {
      server.close((error) => error ? reject(error) : resolve(true));
    });
  });
}

async function get(url, options = {}) {
  try {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(2000) });
    return { response, body: await response.text() };
  } catch (error) {
    return { error };
  }
}

function listeningPids(port) {
  try {
    return [...new Set(execFileSync('lsof', ['-t', '-nP', `-iTCP:${port}`, '-sTCP:LISTEN'], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim().split(/\s+/).filter(Boolean))];
  } catch {
    return [];
  }
}

function processWorkingDirectory(pid) {
  try {
    const output = execFileSync('lsof', ['-a', '-p', pid, '-d', 'cwd', '-Fn'], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return output.split('\n').find((line) => line.startsWith('n'))?.slice(1);
  } catch {
    return undefined;
  }
}

async function stopStaleProjectListeners(ports) {
  const pids = [...new Set(ports.flatMap(listeningPids))];
  if (!pids.length || pids.some((pid) => processWorkingDirectory(pid) !== projectRoot)) return false;

  try {
    for (const pid of pids) {
      try {
        process.kill(Number(pid), 'SIGTERM');
      } catch (error) {
        if (error.code !== 'ESRCH') throw error;
      }
    }
  } catch (error) {
    console.error(`Could not gracefully restart the existing FresherAI processes: ${error.message}`);
    console.error('No process outside this project was targeted. Stop the stale project services in their owning terminal and rerun npm run dev.');
    return false;
  }

  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const availability = await Promise.all(ports.map(canBind));
    if (availability.every(Boolean)) {
      console.log('Gracefully stopped the stale FresherAI listeners after verifying their working directory.');
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.error('The verified FresherAI listeners did not release their ports after SIGTERM. No force kill was attempted.');
  return false;
}

async function checkExistingPair() {
  const frontendUrl = `http://localhost:${frontendPort}`;
  const backendUrl = `http://localhost:${backendPort}`;
  const [frontendBound, backendBound] = await Promise.all([
    canBind(frontendPort),
    canBind(backendPort),
  ]);

  if (frontendBound && backendBound) return { occupied: false };

  const [frontend, backend] = await Promise.all([
    get(frontendUrl),
    get(`${backendUrl}/health`),
  ]);
  const [module, resumeModule] = await Promise.all([
    get(`${frontendUrl}/src/components/agents/interview-agent.jsx`),
    get(`${frontendUrl}/src/components/agents/resume-agent.jsx`),
  ]);
  const typeLabels = module.body?.match(/children:\s*["'](Technical|Behavioral|Mixed|HR)["']/g) || [];
  const proxy = await get(`${frontendUrl}/api/interview/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  const frontendHealthy = frontend.response?.status === 200
    && frontend.body?.includes('FresherAI')
    && module.response?.status === 200
    && resumeModule.response?.status === 200
    && typeLabels.length === 2
    && /Technical/.test(module.body)
    && /Behavioral/.test(module.body)
    && !/Label \(optional\)|name:\s*["']fileName["']/.test(resumeModule.body || '');
  const backendHealthy = backend.response?.status === 200
    && backend.body?.includes('"service":"FresherAI backend"');
  const proxyHealthy = proxy.response?.status === 401
    && proxy.body?.includes('signed in');
  const staleInterviewTypes = /children:\s*["'](?:Mixed|HR)["']/.test(module.body || '');
  const staleResumeLabel = /Label \(optional\)|name:\s*["']fileName["']/.test(resumeModule.body || '');

  if (!frontendBound && !backendBound && frontendHealthy && backendHealthy && proxyHealthy) {
    console.log('FresherAI development services are already running and healthy; reusing them.');
    console.log(`Frontend: ${frontendUrl}`);
    console.log(`Backend:  ${backendUrl}`);
    console.log('The frontend API proxy reaches the authenticated backend.');
    return { occupied: true, reused: true };
  }

  if (staleInterviewTypes || staleResumeLabel) {
    const stalePorts = [!frontendBound && frontendPort, !backendBound && backendPort].filter(Boolean);
    if (await stopStaleProjectListeners(stalePorts)) return { occupied: false };
  }

  const busyPorts = [
    !frontendBound && `frontend ${frontendPort}`,
    !backendBound && `backend ${backendPort}`,
  ].filter(Boolean);
  console.error(`Cannot start another FresherAI development pair: ${busyPorts.join(' and ')} port(s) are occupied.`);
  console.error(`Checks: frontend=${frontendHealthy ? 'healthy' : 'failed'}, backend=${backendHealthy ? 'healthy' : 'failed'}, API proxy=${proxyHealthy ? 'healthy' : 'failed'}.`);
  if (!frontendHealthy || !backendHealthy || !proxyHealthy) {
    console.error('The existing listeners did not pass the FresherAI frontend, backend health, and API proxy checks.');
  }
  if (staleInterviewTypes || staleResumeLabel) {
    const staleFeatures = [staleInterviewTypes && 'interview options', staleResumeLabel && 'resume label field'].filter(Boolean).join(' and ');
    console.error(`The existing Vite server is serving stale ${staleFeatures}; restart that project server to load the current source.`);
  }
  for (const port of [!frontendBound && frontendPort, !backendBound && backendPort].filter(Boolean)) {
    console.error(`Inspect port ${port} with: lsof -nP -iTCP:${port} -sTCP:LISTEN`);
  }
  console.error('Stop only the identified stale FresherAI process, then run npm run dev again.');
  return { occupied: true, reused: false };
}

if (frontendPort === backendPort) {
  console.error(`Frontend and backend cannot both use port ${frontendPort}. Set distinct VITE_PORT and PORT values.`);
  process.exitCode = 1;
} else {
  const existing = await checkExistingPair();
  if (existing.occupied && !existing.reused) {
    process.exitCode = 1;
  } else if (!existing.occupied) {
    const concurrently = path.join(projectRoot, 'node_modules/concurrently/dist/bin/concurrently.js');
    const child = spawn(process.execPath, [
      concurrently,
      '--kill-others-on-fail',
      '--names', 'frontend,backend',
      'npm run dev:frontend',
      'npm run dev:backend',
    ], { cwd: projectRoot, env: process.env, stdio: 'inherit' });

    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.once(signal, () => child.kill(signal));
    }
    child.once('error', (error) => {
      console.error(`Could not start the development services: ${error.message}`);
      process.exitCode = 1;
    });
    child.once('exit', (code, signal) => {
      process.exitCode = code ?? (signal ? 1 : 0);
    });
  }
}
