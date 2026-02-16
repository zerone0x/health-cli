/**
 * Mock health data generators
 * NO REAL PERSONAL DATA - Only example/mock data
 */
import { HRVData, SleepData, HealthStatus, AlertThreshold } from '../types/responses.js';

export function generateMockHRV(days: number): HRVData[] {
  const data: HRVData[] = [];
  const baseHRV = 45; // milliseconds
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Generate realistic HRV variation
    const variation = (Math.random() - 0.5) * 20;
    const value = Math.max(20, Math.min(80, baseHRV + variation));
    
    let category: 'low' | 'normal' | 'high';
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

export function generateMockSleep(days: number): SleepData[] {
  const data: SleepData[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Generate realistic sleep data
    const duration = 6.5 + (Math.random() * 2.5); // 6.5-9 hours
    const deepSleep = duration * (0.15 + Math.random() * 0.10); // 15-25% deep
    const remSleep = duration * (0.20 + Math.random() * 0.10); // 20-30% REM
    
    const bedtime = new Date(date);
    bedtime.setHours(22 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
    
    const wakeTime = new Date(bedtime);
    wakeTime.setTime(wakeTime.getTime() + (duration * 60 * 60 * 1000));
    
    const sleepScore = Math.round(60 + (Math.random() * 35)); // 60-95
    
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

export function generateMockStatus(): HealthStatus {
  const today = new Date().toISOString().split('T')[0];
  const recentHRV = generateMockHRV(7);
  const recentSleep = generateMockSleep(7);
  
  const currentHRV = recentHRV[recentHRV.length - 1];
  const lastNightSleep = recentSleep[recentSleep.length - 1];
  const avgSleep = recentSleep.reduce((sum, s) => sum + s.duration_hours, 0) / 7;
  
  // Determine trend
  const hrvTrend = recentHRV.length > 1 ? 
    (currentHRV.value > recentHRV[recentHRV.length - 2].value ? 'up' : 
     currentHRV.value < recentHRV[recentHRV.length - 2].value ? 'down' : 'stable') : 'stable';
  
  const alerts: string[] = [];
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

export function generateMockAlerts(): AlertThreshold[] {
  const status = generateMockStatus();
  
  return [
    {
      metric: 'HRV',
      threshold: 30,
      current: status.hrv.current,
      status: status.hrv.current < 30 ? 'warning' : 'ok',
      message: status.hrv.current < 30 ? 'HRV below recovery threshold' : 'HRV within normal range'
    },
    {
      metric: 'Sleep Duration',
      threshold: 6,
      current: status.sleep.last_night_hours,
      status: status.sleep.last_night_hours < 6 ? 'warning' : 'ok',
      message: status.sleep.last_night_hours < 6 ? 'Insufficient sleep duration' : 'Sleep duration adequate'
    },
    {
      metric: 'Daily Steps',
      threshold: 5000,
      current: status.activity.steps,
      status: status.activity.steps < 5000 ? 'warning' : 'ok',
      message: status.activity.steps < 5000 ? 'Below recommended daily steps' : 'Meeting step goals'
    }
  ];
}