#!/usr/bin/env node
/**
 * health-cli: Agent-first health data CLI
 * HATEOAS CLI reference implementation using Effect CLI
 */

import { Command, Args, Options } from '@effect/cli';
import { Effect, Console } from 'effect';
import { output } from './utils/responses.js';
import { rootCommand } from './commands/root.js';
import { statusCommand } from './commands/status.js';
import { hrvCommand } from './commands/hrv.js';
import { sleepCommand } from './commands/sleep.js';
import { alertCommand } from './commands/alert.js';
import { importCommand } from './commands/import.js';

// Define CLI options
const daysOption = Options.integer('days').pipe(
  Options.withDescription('Number of days to analyze (1-90)'),
  Options.withDefault(7)
);

const fileArg = Args.file({ name: 'file', exists: 'yes' }).pipe(
  Args.withDescription('Path to Apple Health XML export file')
);

// Define commands
const status = Command.make('status', {}, () => 
  Effect.sync(() => output(statusCommand()))
).pipe(
  Command.withDescription('Show today\'s health overview')
);

const hrv = Command.make('hrv', { days: daysOption }, ({ days }) =>
  Effect.sync(() => output(hrvCommand(days)))
).pipe(
  Command.withDescription('Show HRV trends and analysis')
);

const sleep = Command.make('sleep', { days: daysOption }, ({ days }) =>
  Effect.sync(() => output(sleepCommand(days)))
).pipe(
  Command.withDescription('Show sleep analysis and patterns')
);

const alert = Command.make('alert', {}, () =>
  Effect.sync(() => output(alertCommand()))
).pipe(
  Command.withDescription('Check health alerts and thresholds')
);

const importCmd = Command.make('import', { file: fileArg }, ({ file }) =>
  Effect.sync(() => output(importCommand(file)))
).pipe(
  Command.withDescription('Import Apple Health XML data (parser only)')
);

// Root command (self-documenting)
const root = Command.make('health', {}, () =>
  Effect.sync(() => output(rootCommand()))
).pipe(
  Command.withDescription('Agent-first health data CLI'),
  Command.withSubcommands([status, hrv, sleep, alert, importCmd])
);

// CLI application
const cli = Command.run(root, {
  name: 'health',
  version: '1.0.0'
});

// Handle uncaught errors with proper JSON error response
process.on('uncaughtException', (error) => {
  output({
    ok: false,
    command: 'health',
    error: {
      message: error.message,
      code: 'UNCAUGHT_EXCEPTION'
    },
    fix: 'Report this error to the maintainers',
    next_actions: [
      { command: 'health', description: 'Try again with root command' }
    ]
  });
});

process.on('unhandledRejection', (reason) => {
  output({
    ok: false,
    command: 'health', 
    error: {
      message: `Unhandled promise rejection: ${reason}`,
      code: 'UNHANDLED_REJECTION'
    },
    fix: 'Report this error to the maintainers',
    next_actions: [
      { command: 'health', description: 'Try again with root command' }
    ]
  });
});

// Run the CLI
Effect.runPromise(cli(process.argv)).catch(() => {
  // Effect CLI handles its own errors, but just in case
  process.exit(1);
});