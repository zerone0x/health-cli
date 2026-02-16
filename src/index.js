#!/usr/bin/env node
/**
 * health-cli: Agent-first health data CLI
 * HATEOAS CLI reference implementation
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Response utilities
function success(command, result, nextActions) {
  return {
    ok: true,
    command: `health ${command}`,
    result,
    next_actions: nextActions
  };
}

function error(command, message, code, fix, nextActions) {
  return {
    ok: false,
    command: `health ${command}`,
    error: { message, code },
    fix,
    next_actions: nextActions
  };
}

function output(response) {
  console.log(JSON.stringify(response, null, 2));
  process.exit(response.ok ? 0 : 1);
}

// Common next actions
const COMMON_ACTIONS = {
  ROOT: { command: 'health', description: 'Show available commands' },
  STATUS: { command: 'health status', description: 'View today\'s health overview' },
  HRV: { command: 'health hrv', description: 'View HRV trends' },
  SLEEP: { command: 'health sleep', description: 'View sleep analysis' },
  ALERTS: { command: 'health alert', description: 'Check health alerts' },
  IMPORT: { command: 'health import <file>', description: 'Import Apple Health data' }
};

// Mock data generators
function generateMockHRV(days) {
  const data = [];
  const baseHRV = 45;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const variation = (Math.random() - 0.5) * 20;
    const value = Math.max(20, Math.min(80, baseHRV + variation));
    
    let category;
    if (value < 30) category = 'low';
    else if (value > 60) category = 'high';
    else category = 'normal';
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value),
      category
    });
  }
  
  return data;
}

function generateMockSleep(days) {
  const data = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const duration = 6.5 + (Math.random() * 2.5);
    const deepSleep = duration * (0.15 + Math.random() * 0.10);
    const remSleep = duration * (0.20 + Math.random() * 0.10);
    
    const bedtime = new Date(date);
    bedtime.setHours(22 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
    
    const wakeTime = new Date(bedtime);
    wakeTime.setTime(wakeTime.getTime() + (duration * 60 * 60 * 1000));
    
    const sleepScore = Math.round(60 + (Math.random() * 35));
    
    data.push({
      date: date.toISOString().split('T')[0],
      duration_hours: Math.round(duration * 10) / 10,
      deep_sleep_hours: Math.round(deepSleep * 10) / 10,
      rem_sleep_hours: Math.round(remSleep * 10) / 10,
      sleep_score: sleepScore,
      bedtime: bedtime.toTimeString().substring(0, 5),
      wake_time: wakeTime.toTimeString().substring(0, 5)
    });
  }
  
  return data;
}

function generateMockStatus() {
  const today = new Date().toISOString().split('T')[0];
  const recentHRV = generateMockHRV(7);
  const recentSleep = generateMockSleep(7);
  
  const currentHRV = recentHRV[recentHRV.length - 1];
  const lastNightSleep = recentSleep[recentSleep.length - 1];
  const avgSleep = recentSleep.reduce((sum, s) => sum + s.duration_hours, 0) / 7;
  
  const hrvTrend = recentHRV.length > 1 ? 
    (currentHRV.value > recentHRV[recentHRV.length - 2].value ? 'up' : 
     currentHRV.value < recentHRV[recentHRV.length - 2].value ? 'down' : 'stable') : 'stable';
  
  const alerts = [];
  if (currentHRV.value < 30) alerts.push('🔴 HRV is low - consider rest day');
  if (lastNightSleep.duration_hours < 6) alerts.push('😴 Insufficient sleep last night');
  
  return {
    date: today,
    hrv: {
      current: currentHRV.value,
      trend: hrvTrend,
      category: currentHRV.category
    },
    sleep: {
      last_night_hours: lastNightSleep.duration_hours,
      avg_7_day: Math.round(avgSleep * 10) / 10,
      score: lastNightSleep.sleep_score
    },
    activity: {
      steps: 8500 + Math.floor(Math.random() * 3000),
      active_calories: 450 + Math.floor(Math.random() * 200),
      exercise_minutes: 25 + Math.floor(Math.random() * 40)
    },
    alerts
  };
}

// Commands
function rootCommand() {
  const result = {
    name: 'health-cli',
    version: '1.0.0',
    description: 'Agent-first health data CLI - HATEOAS CLI reference implementation',
    design_principles: [
      'JSON-only output for agent consumption',
      'HATEOAS next_actions for discoverability',
      'Self-documenting command structure',
      'Consistent error handling with fix suggestions',
      'Mock data only - no personal health data'
    ],
    commands: [
      {
        name: 'health',
        description: 'Show this help and available commands',
        usage: 'health'
      },
      {
        name: 'status',
        description: 'Today\'s health overview with key metrics',
        usage: 'health status'
      },
      {
        name: 'hrv',
        description: 'Heart Rate Variability trends and analysis',
        usage: 'health hrv [--days 7]'
      },
      {
        name: 'sleep',
        description: 'Sleep analysis and patterns',
        usage: 'health sleep [--days 7]'
      },
      {
        name: 'alert',
        description: 'Check health alerts and warning thresholds',
        usage: 'health alert'
      },
      {
        name: 'import',
        description: 'Import Apple Health XML data (parser only)',
        usage: 'health import <file>'
      }
    ],
    examples: [
      'health status                 # Today\'s overview',
      'health hrv --days 14         # 2 weeks HRV trend',
      'health sleep --days 30       # Monthly sleep analysis',
      'health alert                 # Check current alerts',
      'health import export.xml     # Parse Apple Health export'
    ]
  };

  return success('', result, [
    COMMON_ACTIONS.STATUS,
    COMMON_ACTIONS.HRV,
    COMMON_ACTIONS.SLEEP,
    COMMON_ACTIONS.ALERTS
  ]);
}

function statusCommand() {
  const status = generateMockStatus();
  
  const result = {
    ...status,
    summary: generateHealthSummary(status),
    recommendations: generateRecommendations(status)
  };

  const nextActions = [COMMON_ACTIONS.HRV, COMMON_ACTIONS.SLEEP, COMMON_ACTIONS.ALERTS];
  
  if (status.alerts.length > 0) {
    nextActions.unshift(COMMON_ACTIONS.ALERTS);
  }

  return success('status', result, nextActions);
}

function generateHealthSummary(status) {
  const parts = [];
  
  if (status.hrv.category === 'high') {
    parts.push('💚 Excellent recovery state');
  } else if (status.hrv.category === 'normal') {
    parts.push('🟡 Normal recovery state');
  } else {
    parts.push('🔴 Low recovery - consider rest');
  }

  if (status.sleep.last_night_hours >= 8) {
    parts.push('😴 Well rested');
  } else if (status.sleep.last_night_hours >= 7) {
    parts.push('😐 Adequate sleep');
  } else {
    parts.push('😵 Sleep deprived');
  }

  if (status.activity.steps >= 10000) {
    parts.push('🚶 Very active');
  } else if (status.activity.steps >= 7500) {
    parts.push('🚶 Moderately active');
  } else {
    parts.push('🚶 Low activity');
  }

  return parts.join(' • ');
}

function generateRecommendations(status) {
  const recommendations = [];

  if (status.hrv.category === 'low') {
    recommendations.push('Consider a rest day or light activity');
    recommendations.push('Focus on stress management and recovery');
  }

  if (status.sleep.last_night_hours < 7) {
    recommendations.push('Prioritize earlier bedtime tonight');
    recommendations.push('Consider sleep hygiene improvements');
  }

  if (status.activity.steps < 7500) {
    recommendations.push('Add more walking or light movement today');
  }

  if (recommendations.length === 0) {
    recommendations.push('Keep up the good work! Maintain current habits');
  }

  return recommendations;
}

function hrvCommand(days = 7) {
  if (days < 1 || days > 90) {
    return error(
      `hrv --days ${days}`,
      'Days parameter must be between 1 and 90',
      'INVALID_DAYS_RANGE',
      'Use a value between 1 and 90 days',
      [
        { command: 'health hrv', description: 'Use default 7 days' },
        { command: 'health hrv --days 14', description: 'Try 2 weeks' }
      ]
    );
  }

  const hrvData = generateMockHRV(days);
  const current = hrvData[hrvData.length - 1];

  const result = {
    period: {
      days: days,
      start_date: hrvData[0].date,
      end_date: current.date
    },
    current: {
      value: current.value,
      category: current.category,
      date: current.date
    },
    statistics: {
      average: Math.round(hrvData.reduce((sum, d) => sum + d.value, 0) / hrvData.length),
      min: Math.min(...hrvData.map(d => d.value)),
      max: Math.max(...hrvData.map(d => d.value))
    },
    data: hrvData.slice(-10),
    insights: [`Current HRV: ${current.value}ms (${current.category})`]
  };

  return success(`hrv --days ${days}`, result, [
    COMMON_ACTIONS.STATUS,
    COMMON_ACTIONS.SLEEP,
    days === 7 ? { command: 'health hrv --days 30', description: 'View monthly trend' } : COMMON_ACTIONS.ROOT
  ]);
}

function sleepCommand(days = 7) {
  if (days < 1 || days > 90) {
    return error(
      `sleep --days ${days}`,
      'Days parameter must be between 1 and 90',
      'INVALID_DAYS_RANGE',
      'Use a value between 1 and 90 days',
      [
        { command: 'health sleep', description: 'Use default 7 days' },
        { command: 'health sleep --days 30', description: 'Try 1 month' }
      ]
    );
  }

  const sleepData = generateMockSleep(days);
  const lastNight = sleepData[sleepData.length - 1];
  const avgDuration = sleepData.reduce((sum, s) => sum + s.duration_hours, 0) / days;

  const result = {
    period: {
      days: days,
      start_date: sleepData[0].date,
      end_date: lastNight.date
    },
    last_night: {
      duration: lastNight.duration_hours,
      score: lastNight.sleep_score,
      bedtime: lastNight.bedtime,
      wake_time: lastNight.wake_time
    },
    averages: {
      duration: Math.round(avgDuration * 10) / 10,
      score: Math.round(sleepData.reduce((sum, s) => sum + s.sleep_score, 0) / days)
    },
    data: sleepData.slice(-10),
    insights: [`Average sleep: ${Math.round(avgDuration * 10) / 10}h over ${days} days`]
  };

  return success(`sleep --days ${days}`, result, [
    COMMON_ACTIONS.STATUS,
    COMMON_ACTIONS.HRV,
    days === 7 ? { command: 'health sleep --days 30', description: 'View monthly pattern' } : COMMON_ACTIONS.ROOT
  ]);
}

function alertCommand() {
  const status = generateMockStatus();
  const alerts = [];
  
  if (status.hrv.current < 30) {
    alerts.push({
      metric: 'HRV',
      status: 'warning',
      current: status.hrv.current,
      threshold: 30,
      message: 'HRV below recovery threshold'
    });
  }
  
  if (status.sleep.last_night_hours < 6) {
    alerts.push({
      metric: 'Sleep Duration',
      status: 'warning', 
      current: status.sleep.last_night_hours,
      threshold: 6,
      message: 'Insufficient sleep duration'
    });
  }

  const result = {
    timestamp: new Date().toISOString(),
    alert_summary: {
      total_checks: 3,
      active_alerts: alerts.length,
      warnings: alerts.filter(a => a.status === 'warning').length
    },
    active_alerts: alerts,
    recommendations: alerts.length === 0 
      ? ['All metrics within normal ranges'] 
      : alerts.map(a => `Address ${a.metric}: ${a.message}`)
  };

  return success('alert', result, [
    COMMON_ACTIONS.STATUS,
    alerts.some(a => a.metric === 'HRV') ? { command: 'health hrv --days 14', description: 'Analyze HRV trend' } : null,
    alerts.some(a => a.metric === 'Sleep Duration') ? { command: 'health sleep --days 7', description: 'Review sleep patterns' } : null
  ].filter(Boolean));
}

function importCommand(filePath) {
  return error(
    `import ${filePath}`,
    'Import functionality is a demo - not implemented in this simplified version',
    'NOT_IMPLEMENTED',
    'This demonstrates the CLI structure - full XML parsing would be implemented here',
    [
      COMMON_ACTIONS.STATUS,
      COMMON_ACTIONS.ROOT
    ]
  );
}

// Parse arguments and route commands
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    output(rootCommand());
  }
  
  const command = args[0].toLowerCase();
  
  switch (command) {
    case 'status':
      output(statusCommand());
      break;
      
    case 'hrv': {
      let days = 7;
      const daysIndex = args.indexOf('--days');
      if (daysIndex !== -1 && args[daysIndex + 1]) {
        days = parseInt(args[daysIndex + 1]);
      }
      output(hrvCommand(days));
      break;
    }
      
    case 'sleep': {
      let days = 7;
      const daysIndex = args.indexOf('--days');
      if (daysIndex !== -1 && args[daysIndex + 1]) {
        days = parseInt(args[daysIndex + 1]);
      }
      output(sleepCommand(days));
      break;
    }
      
    case 'alert':
      output(alertCommand());
      break;
      
    case 'import':
      if (!args[1]) {
        output(error('import', 'Missing file path', 'MISSING_FILE', 'Usage: health import <file>', [COMMON_ACTIONS.ROOT]));
      }
      output(importCommand(args[1]));
      break;
      
    default:
      output(error(command, `Unknown command: ${command}`, 'UNKNOWN_COMMAND', 'Run health to see available commands', [COMMON_ACTIONS.ROOT]));
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  output({
    ok: false,
    command: 'health',
    error: {
      message: error.message,
      code: 'UNCAUGHT_EXCEPTION'
    },
    fix: 'Report this error to the maintainers',
    next_actions: [COMMON_ACTIONS.ROOT]
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
    next_actions: [COMMON_ACTIONS.ROOT]
  });
});

main();