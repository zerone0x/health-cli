/**
 * Sleep command - Sleep analysis and patterns
 */
import { success, error, COMMON_ACTIONS } from '../utils/responses.js';
import { generateMockSleep } from '../data/mockData.js';

export function sleepCommand(days: number = 7) {
  // Validate input
  if (days < 1 || days > 90) {
    return error(
      `sleep --days ${days}`,
      'Days parameter must be between 1 and 90',
      'INVALID_DAYS_RANGE',
      'Use a value between 1 and 90 days',
      [
        { command: 'health sleep', description: 'Use default 7 days' },
        { command: 'health sleep --days 14', description: 'Try 2 weeks' },
        { command: 'health sleep --days 30', description: 'Try 1 month' }
      ]
    );
  }

  const sleepData = generateMockSleep(days);
  const analysis = analyzeSleepPattern(sleepData);

  const result = {
    period: {
      days: days,
      start_date: sleepData[0].date,
      end_date: sleepData[sleepData.length - 1].date
    },
    last_night: {
      duration: sleepData[sleepData.length - 1].duration_hours,
      score: sleepData[sleepData.length - 1].sleep_score,
      bedtime: sleepData[sleepData.length - 1].bedtime,
      wake_time: sleepData[sleepData.length - 1].wake_time,
      deep_sleep: sleepData[sleepData.length - 1].deep_sleep_hours,
      rem_sleep: sleepData[sleepData.length - 1].rem_sleep_hours
    },
    averages: {
      duration: Math.round(sleepData.reduce((sum, s) => sum + s.duration_hours, 0) / days * 10) / 10,
      score: Math.round(sleepData.reduce((sum, s) => sum + s.sleep_score, 0) / days),
      deep_sleep: Math.round(sleepData.reduce((sum, s) => sum + s.deep_sleep_hours, 0) / days * 10) / 10,
      rem_sleep: Math.round(sleepData.reduce((sum, s) => sum + s.rem_sleep_hours, 0) / days * 10) / 10,
      bedtime: calculateAverageTime(sleepData.map(s => s.bedtime)),
      wake_time: calculateAverageTime(sleepData.map(s => s.wake_time))
    },
    patterns: analysis,
    sleep_debt: calculateSleepDebt(sleepData),
    consistency: calculateSleepConsistency(sleepData),
    data: sleepData.slice(-10), // Last 10 days for display
    insights: generateSleepInsights(sleepData, analysis)
  };

  const nextActions = [
    COMMON_ACTIONS.STATUS,
    COMMON_ACTIONS.HRV
  ];

  // Add period-specific next actions
  if (days === 7) {
    nextActions.push({
      command: 'health sleep --days 30',
      description: 'View monthly sleep patterns'
    });
  }

  if (result.last_night.duration < 7) {
    nextActions.unshift(COMMON_ACTIONS.ALERTS);
  }

  if (result.consistency.bedtime_variance > 60) {
    nextActions.push({
      command: 'health sleep --days 14',
      description: 'Analyze bedtime consistency over 2 weeks'
    });
  }

  return success(`sleep --days ${days}`, result, nextActions);
}

function analyzeSleepPattern(data: any[]): any {
  const durations = data.map(s => s.duration_hours);
  const scores = data.map(s => s.sleep_score);
  
  return {
    duration_trend: calculateTrend(durations),
    quality_trend: calculateTrend(scores),
    sufficient_sleep_days: durations.filter(d => d >= 7).length,
    total_days: data.length,
    best_night: {
      date: data[scores.indexOf(Math.max(...scores))].date,
      score: Math.max(...scores),
      duration: data[scores.indexOf(Math.max(...scores))].duration_hours
    },
    worst_night: {
      date: data[scores.indexOf(Math.min(...scores))].date,
      score: Math.min(...scores),
      duration: data[scores.indexOf(Math.min(...scores))].duration_hours
    }
  };
}

function calculateTrend(values: number[]): string {
  if (values.length < 3) return 'insufficient_data';
  
  const recent = values.slice(-3).reduce((sum, v) => sum + v, 0) / 3;
  const earlier = values.slice(0, 3).reduce((sum, v) => sum + v, 0) / 3;
  const change = recent - earlier;
  
  if (Math.abs(change) < 0.2) return 'stable';
  return change > 0 ? 'improving' : 'declining';
}

function calculateSleepDebt(data: any[]): any {
  const targetHours = 8;
  let totalDebt = 0;
  
  data.forEach(night => {
    if (night.duration_hours < targetHours) {
      totalDebt += targetHours - night.duration_hours;
    }
  });
  
  return {
    total_hours: Math.round(totalDebt * 10) / 10,
    avg_per_night: Math.round((totalDebt / data.length) * 10) / 10,
    status: totalDebt > 5 ? 'significant' : totalDebt > 2 ? 'moderate' : 'minimal'
  };
}

function calculateSleepConsistency(data: any[]): any {
  const bedtimes = data.map(s => timeToMinutes(s.bedtime));
  const wakeTimes = data.map(s => timeToMinutes(s.wake_time));
  
  const bedtimeAvg = bedtimes.reduce((sum, t) => sum + t, 0) / bedtimes.length;
  const wakeTimeAvg = wakeTimes.reduce((sum, t) => sum + t, 0) / wakeTimes.length;
  
  const bedtimeVariance = Math.round(Math.sqrt(
    bedtimes.reduce((sum, t) => sum + Math.pow(t - bedtimeAvg, 2), 0) / bedtimes.length
  ));
  
  const wakeTimeVariance = Math.round(Math.sqrt(
    wakeTimes.reduce((sum, t) => sum + Math.pow(t - wakeTimeAvg, 2), 0) / wakeTimes.length
  ));
  
  return {
    bedtime_variance: bedtimeVariance,
    wake_time_variance: wakeTimeVariance,
    consistency_score: Math.max(0, 100 - (bedtimeVariance + wakeTimeVariance) / 2)
  };
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function calculateAverageTime(times: string[]): string {
  const minutes = times.map(timeToMinutes);
  const avgMinutes = Math.round(minutes.reduce((sum, m) => sum + m, 0) / minutes.length);
  const hours = Math.floor(avgMinutes / 60);
  const mins = avgMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function generateSleepInsights(data: any[], analysis: any): string[] {
  const insights = [];
  const lastNight = data[data.length - 1];
  
  if (analysis.duration_trend === 'improving') {
    insights.push('💚 Sleep duration improving - good progress');
  } else if (analysis.duration_trend === 'declining') {
    insights.push('🔴 Sleep duration declining - focus on earlier bedtime');
  }
  
  if (analysis.quality_trend === 'improving') {
    insights.push('✨ Sleep quality trending up');
  } else if (analysis.quality_trend === 'declining') {
    insights.push('😴 Sleep quality declining - review sleep hygiene');
  }
  
  const sufficientPercent = (analysis.sufficient_sleep_days / analysis.total_days) * 100;
  if (sufficientPercent < 50) {
    insights.push('⚠️ Getting sufficient sleep (7+ hours) less than half the time');
  } else if (sufficientPercent > 80) {
    insights.push('🎯 Consistently meeting sleep duration goals');
  }
  
  if (lastNight.duration_hours < 6) {
    insights.push('🚨 Last night was severely sleep deprived - prioritize recovery');
  } else if (lastNight.duration_hours < 7) {
    insights.push('😴 Last night was short - aim for earlier bedtime tonight');
  }
  
  return insights;
}