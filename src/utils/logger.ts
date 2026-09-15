/* eslint-disable no-console */
type Level = 'INFO' | 'STEP' | 'WARN' | 'ERROR';

// One line per navigation/action is only readable with a single worker on a
// single browser. Once WORKERS>1 (see cucumber.js) or several browsers run
// side by side (see scripts/run-cross-browser.js), those interleaved lines
// drown out Cucumber's own progress output, so default to quiet in that case;
// LOG_STEPS=true/false always overrides. Warnings/errors always print.
const WORKERS = process.env.WORKERS !== undefined ? Number(process.env.WORKERS) : (process.env.CI ? 2 : 1);
const LOG_STEPS = process.env.LOG_STEPS !== undefined ? process.env.LOG_STEPS !== 'false' : WORKERS <= 1;

function emit(level: Level, message: string): void {
  const stamp = new Date().toISOString().substring(11, 23);
  console.log(`[${stamp}] [${level}] ${message}`);
}

export const logger = {
  info: (m: string): void => { if (LOG_STEPS) emit('INFO', m); },
  step: (m: string): void => { if (LOG_STEPS) emit('STEP', `-> ${m}`); },
  warn: (m: string): void => emit('WARN', m),
  error: (m: string): void => emit('ERROR', m),
};
