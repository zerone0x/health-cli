/**
 * Response utilities for agent-first CLI
 */
import { CLIResponse, NextAction, SuccessResponse, ErrorResponse } from '../types/responses.js';

export function success<T>(command: string, result: T, nextActions: NextAction[]): SuccessResponse<T> {
  return {
    ok: true,
    command: `health ${command}`,
    result,
    next_actions: nextActions
  };
}

export function error(command: string, message: string, code: string, fix: string, nextActions: NextAction[]): ErrorResponse {
  return {
    ok: false,
    command: `health ${command}`,
    error: { message, code },
    fix,
    next_actions: nextActions
  };
}

export function output(response: CLIResponse): never {
  console.log(JSON.stringify(response, null, 2));
  process.exit(response.ok ? 0 : 1);
}

// Common next actions
export const COMMON_ACTIONS = {
  ROOT: { command: 'health', description: 'Show available commands' },
  STATUS: { command: 'health status', description: 'View today\'s health overview' },
  HRV: { command: 'health hrv', description: 'View HRV trends' },
  SLEEP: { command: 'health sleep', description: 'View sleep analysis' },
  ALERTS: { command: 'health alert', description: 'Check health alerts' },
  IMPORT: { command: 'health import <file>', description: 'Import Apple Health data' }
};