/**
 * Alert command - Check health alerts and warning thresholds
 */
import { success, COMMON_ACTIONS } from '../utils/responses.js';
import { generateMockAlerts } from '../data/mockData.js';

export function alertCommand() {
  const alerts = generateMockAlerts();
  
  const activeAlerts = alerts.filter(a => a.status !== 'ok');
  const result = {
    timestamp: new Date().toISOString(),
    alert_summary: {
      total_checks: alerts.length,
      active_alerts: activeAlerts.length,
      warnings: alerts.filter(a => a.status === 'warning').length,
      critical: alerts.filter(a => a.status === 'critical').length,
      ok: alerts.filter(a => a.status === 'ok').length
    },
    active_alerts: activeAlerts.map(alert => ({
      metric: alert.metric,
      status: alert.status,
      current_value: alert.current,
      threshold: alert.threshold,
      message: alert.message,
      priority: alert.status === 'critical' ? 'high' : 'medium'
    })),
    all_thresholds: alerts,
    recommendations: generateAlertRecommendations(alerts),
    next_check: getNextCheckTime()
  };

  const nextActions = [COMMON_ACTIONS.STATUS];

  // Add specific next actions based on alerts
  if (activeAlerts.some(a => a.metric === 'HRV')) {
    nextActions.push({
      command: 'health hrv --days 14',
      description: 'Analyze HRV trend to understand alert'
    });
  }

  if (activeAlerts.some(a => a.metric === 'Sleep Duration')) {
    nextActions.push({
      command: 'health sleep --days 7',
      description: 'Review recent sleep patterns'
    });
  }

  if (activeAlerts.some(a => a.metric === 'Daily Steps')) {
    nextActions.push({
      command: 'health status',
      description: 'Check current activity levels'
    });
  }

  // If no active alerts, suggest other commands
  if (activeAlerts.length === 0) {
    nextActions.push(
      COMMON_ACTIONS.HRV,
      COMMON_ACTIONS.SLEEP
    );
  }

  return success('alert', result, nextActions);
}

function generateAlertRecommendations(alerts: any[]): any {
  const recommendations = {
    immediate: [] as string[],
    short_term: [] as string[],
    long_term: [] as string[]
  };

  alerts.forEach(alert => {
    if (alert.status === 'warning' || alert.status === 'critical') {
      switch (alert.metric) {
        case 'HRV':
          recommendations.immediate.push('Take a rest day or reduce training intensity');
          recommendations.short_term.push('Focus on stress management and recovery practices');
          recommendations.long_term.push('Evaluate training load and recovery balance');
          break;
        
        case 'Sleep Duration':
          recommendations.immediate.push('Prioritize earlier bedtime tonight');
          recommendations.short_term.push('Establish consistent sleep schedule');
          recommendations.long_term.push('Optimize sleep environment and hygiene');
          break;
        
        case 'Daily Steps':
          recommendations.immediate.push('Take breaks for short walks throughout the day');
          recommendations.short_term.push('Incorporate more movement into daily routine');
          recommendations.long_term.push('Set progressive activity goals');
          break;
      }
    }
  });

  // Remove duplicates
  recommendations.immediate = [...new Set(recommendations.immediate)];
  recommendations.short_term = [...new Set(recommendations.short_term)];
  recommendations.long_term = [...new Set(recommendations.long_term)];

  // Add general wellness recommendations if no specific alerts
  if (recommendations.immediate.length === 0) {
    recommendations.immediate.push('All metrics within normal ranges - maintain current habits');
    recommendations.short_term.push('Continue monitoring trends for early detection');
    recommendations.long_term.push('Consider expanding health tracking metrics');
  }

  return recommendations;
}

function getNextCheckTime(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0); // 8 AM next day
  return tomorrow.toISOString();
}

// Alert configuration and thresholds
export const ALERT_CONFIG = {
  thresholds: {
    hrv_low: 30,        // milliseconds
    sleep_min: 6,       // hours
    steps_min: 5000,    // daily steps
    exercise_max: 360,  // minutes (6 hours)
    screen_time_max: 600, // minutes (10 hours)
    late_usage_threshold: 2 // hours after midnight
  },
  
  categories: {
    recovery: ['HRV', 'Sleep Duration', 'Sleep Quality'],
    activity: ['Daily Steps', 'Exercise Minutes', 'Active Calories'],
    lifestyle: ['Screen Time', 'Late Night Usage', 'Stress Level']
  },
  
  severity_levels: {
    ok: 'All metrics within healthy ranges',
    warning: 'Some metrics need attention',
    critical: 'Immediate attention required'
  }
};