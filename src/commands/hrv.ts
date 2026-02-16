/**
 * HRV command - Heart Rate Variability trends
 */
import { success, error, COMMON_ACTIONS } from '../utils/responses.js';
import { generateMockHRV } from '../data/mockData.js';

export function hrvCommand(days: number = 7) {
  // Validate input
  if (days < 1 || days > 90) {
    return error(
      `hrv --days ${days}`,
      'Days parameter must be between 1 and 90',
      'INVALID_DAYS_RANGE',
      'Use a value between 1 and 90 days',
      [
        { command: 'health hrv', description: 'Use default 7 days' },
        { command: 'health hrv --days 14', description: 'Try 2 weeks' },
        { command: 'health hrv --days 30', description: 'Try 1 month' }
      ]
    );
  }

  const hrvData = generateMockHRV(days);
  const analysis = analyzeHRVTrend(hrvData);

  const result = {
    period: {
      days: days,
      start_date: hrvData[0].date,
      end_date: hrvData[hrvData.length - 1].date
    },
    current: {
      value: hrvData[hrvData.length - 1].value,
      category: hrvData[hrvData.length - 1].category,
      date: hrvData[hrvData.length - 1].date
    },
    statistics: {
      average: Math.round(hrvData.reduce((sum, d) => sum + d.value, 0) / hrvData.length),
      min: Math.min(...hrvData.map(d => d.value)),
      max: Math.max(...hrvData.map(d => d.value)),
      std_dev: Math.round(calculateStandardDeviation(hrvData.map(d => d.value)) * 10) / 10
    },
    trend: analysis,
    distribution: {
      low: hrvData.filter(d => d.category === 'low').length,
      normal: hrvData.filter(d => d.category === 'normal').length,
      high: hrvData.filter(d => d.category === 'high').length
    },
    data: hrvData.slice(-10), // Last 10 days for display
    insights: generateHRVInsights(hrvData, analysis)
  };

  const nextActions = [
    COMMON_ACTIONS.STATUS,
    COMMON_ACTIONS.SLEEP
  ];

  // Add period-specific next actions
  if (days === 7) {
    nextActions.push({
      command: 'health hrv --days 14',
      description: 'Extend analysis to 2 weeks'
    });
  } else if (days === 14) {
    nextActions.push({
      command: 'health hrv --days 30',
      description: 'View monthly HRV pattern'
    });
  }

  if (result.current.category === 'low') {
    nextActions.unshift(COMMON_ACTIONS.ALERTS);
  }

  return success(`hrv --days ${days}`, result, nextActions);
}

function analyzeHRVTrend(data: any[]): any {
  if (data.length < 2) return { direction: 'insufficient_data', change: 0, significance: 'none' };

  const recent = data.slice(-3).reduce((sum, d) => sum + d.value, 0) / 3;
  const earlier = data.slice(0, 3).reduce((sum, d) => sum + d.value, 0) / 3;
  const change = recent - earlier;
  const changePercent = Math.round((change / earlier) * 100);

  let direction: string;
  let significance: string;

  if (Math.abs(change) < 2) {
    direction = 'stable';
    significance = 'none';
  } else if (change > 0) {
    direction = 'improving';
    significance = change > 5 ? 'significant' : 'moderate';
  } else {
    direction = 'declining';
    significance = change < -5 ? 'significant' : 'moderate';
  }

  return {
    direction,
    change: Math.round(change),
    change_percent: changePercent,
    significance
  };
}

function calculateStandardDeviation(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

function generateHRVInsights(data: any[], analysis: any): string[] {
  const insights = [];
  const current = data[data.length - 1];

  if (analysis.direction === 'improving') {
    insights.push('💚 HRV trending upward - recovery practices are working');
  } else if (analysis.direction === 'declining') {
    insights.push('🔴 HRV declining - consider stress management and recovery focus');
  } else {
    insights.push('🟡 HRV stable - maintain current recovery practices');
  }

  if (current.category === 'low') {
    insights.push('⚠️ Current HRV is low - prioritize rest and recovery today');
  }

  const lowDays = data.filter(d => d.category === 'low').length;
  if (lowDays > data.length * 0.3) {
    insights.push('📊 Frequent low HRV days - consider lifestyle factors (sleep, stress, training)');
  }

  if (analysis.significance === 'significant') {
    insights.push('📈 Significant trend detected - correlate with recent changes in routine');
  }

  return insights;
}