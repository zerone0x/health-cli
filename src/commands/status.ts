/**
 * Status command - Today's health overview
 */
import { success, COMMON_ACTIONS } from '../utils/responses.js';
import { generateMockStatus } from '../data/mockData.js';

export function statusCommand() {
  const status = generateMockStatus();
  
  const result = {
    ...status,
    summary: generateHealthSummary(status),
    recommendations: generateRecommendations(status)
  };

  const nextActions = [
    COMMON_ACTIONS.HRV,
    COMMON_ACTIONS.SLEEP,
    COMMON_ACTIONS.ALERTS
  ];

  // Add specific next actions based on current status
  if (status.alerts.length > 0) {
    nextActions.unshift(COMMON_ACTIONS.ALERTS);
  }

  if (status.hrv.category === 'low') {
    nextActions.push({
      command: 'health hrv --days 14',
      description: 'Analyze HRV trend over 2 weeks'
    });
  }

  if (status.sleep.last_night_hours < 7) {
    nextActions.push({
      command: 'health sleep --days 7',
      description: 'Review sleep patterns this week'
    });
  }

  return success('status', result, nextActions);
}

function generateHealthSummary(status: any): string {
  const parts = [];
  
  // HRV assessment
  if (status.hrv.category === 'high') {
    parts.push('💚 Excellent recovery state');
  } else if (status.hrv.category === 'normal') {
    parts.push('🟡 Normal recovery state');
  } else {
    parts.push('🔴 Low recovery - consider rest');
  }

  // Sleep assessment
  if (status.sleep.last_night_hours >= 8) {
    parts.push('😴 Well rested');
  } else if (status.sleep.last_night_hours >= 7) {
    parts.push('😐 Adequate sleep');
  } else {
    parts.push('😵 Sleep deprived');
  }

  // Activity assessment
  if (status.activity.steps >= 10000) {
    parts.push('🚶 Very active');
  } else if (status.activity.steps >= 7500) {
    parts.push('🚶 Moderately active');
  } else {
    parts.push('🚶 Low activity');
  }

  return parts.join(' • ');
}

function generateRecommendations(status: any): string[] {
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

  if (status.hrv.trend === 'down') {
    recommendations.push('Monitor stress levels and recovery practices');
  }

  if (recommendations.length === 0) {
    recommendations.push('Keep up the good work! Maintain current habits');
  }

  return recommendations;
}