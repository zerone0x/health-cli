/**
 * Import command - Apple Health XML parser (structure only, no personal data storage)
 */
import { success, error, COMMON_ACTIONS } from '../utils/responses.js';
import { ImportResult } from '../types/responses.js';
import * as fs from 'fs';
import * as path from 'path';

export function importCommand(filePath: string): any {
  // Validate file exists
  if (!fs.existsSync(filePath)) {
    return error(
      `import ${filePath}`,
      `File not found: ${filePath}`,
      'FILE_NOT_FOUND',
      'Check the file path and ensure the file exists',
      [
        { command: 'ls -la', description: 'List files in current directory' },
        { command: 'health', description: 'Return to main menu' }
      ]
    );
  }

  // Check file size (warn if too large)
  const stats = fs.statSync(filePath);
  const fileSizeMB = stats.size / (1024 * 1024);
  
  if (fileSizeMB > 100) {
    return error(
      `import ${filePath}`,
      `File too large: ${fileSizeMB.toFixed(1)}MB (max 100MB for demo)`,
      'FILE_TOO_LARGE',
      'Use a smaller Apple Health export or process in chunks',
      [
        { command: 'health', description: 'Return to main menu' },
        { command: 'health status', description: 'View current mock data instead' }
      ]
    );
  }

  try {
    // Parse XML structure (demo implementation)
    const xmlContent = fs.readFileSync(filePath, 'utf8');
    const parseResult = parseAppleHealthXML(xmlContent);

    const result: ImportResult = {
      file: path.basename(filePath),
      records_processed: parseResult.recordCount,
      data_types: parseResult.dataTypes,
      date_range: parseResult.dateRange,
      warnings: parseResult.warnings
    };

    const nextActions = [
      COMMON_ACTIONS.STATUS,
      {
        command: 'health hrv --days 30',
        description: 'View HRV trends (using mock data for demo)'
      },
      {
        command: 'health sleep --days 30', 
        description: 'View sleep patterns (using mock data for demo)'
      }
    ];

    // Add warnings to next actions if any critical issues
    if (parseResult.warnings.length > 0) {
      nextActions.unshift({
        command: 'health alert',
        description: 'Check for any data quality alerts'
      });
    }

    return success(`import ${filePath}`, result, nextActions);

  } catch (parseError: any) {
    return error(
      `import ${filePath}`,
      `Failed to parse Apple Health XML: ${parseError.message}`,
      'PARSE_ERROR',
      'Ensure the file is a valid Apple Health export XML',
      [
        { command: 'health', description: 'Return to main menu' },
        { command: 'health status', description: 'Use mock data instead' }
      ]
    );
  }
}

interface ParseResult {
  recordCount: number;
  dataTypes: string[];
  dateRange: {
    start: string;
    end: string;
  };
  warnings: string[];
}

function parseAppleHealthXML(xmlContent: string): ParseResult {
  const warnings: string[] = [];
  
  // Basic XML validation
  if (!xmlContent.includes('<HealthData')) {
    throw new Error('Not a valid Apple Health export - missing HealthData root element');
  }

  // Extract basic structure info (demo parsing - not storing actual data)
  const recordMatches = xmlContent.match(/<Record[^>]*>/g) || [];
  const workoutMatches = xmlContent.match(/<Workout[^>]*>/g) || [];
  
  const recordCount = recordMatches.length + workoutMatches.length;
  
  // Extract data types from Record elements
  const dataTypes = new Set<string>();
  
  recordMatches.slice(0, 1000).forEach(record => { // Sample first 1000 for performance
    const typeMatch = record.match(/type="([^"]+)"/);
    if (typeMatch) {
      const fullType = typeMatch[1];
      // Simplify type names (remove HKQuantityTypeIdentifier prefix)
      const simplifiedType = fullType.replace(/HK[A-Za-z]*TypeIdentifier/, '').replace(/([A-Z])/g, ' $1').trim();
      dataTypes.add(simplifiedType);
    }
  });

  // Extract date range
  let startDate = '';
  let endDate = '';
  
  const dateMatches = xmlContent.match(/startDate="([^"]+)"/g) || [];
  if (dateMatches.length > 0) {
    const dates = dateMatches
      .map(match => match.match(/startDate="([^"]+)"/)?.[1])
      .filter(Boolean)
      .sort();
    
    startDate = dates[0]?.split(' ')[0] || '';
    endDate = dates[dates.length - 1]?.split(' ')[0] || '';
  }

  // Generate warnings based on data analysis
  if (recordCount === 0) {
    warnings.push('No health records found in export');
  }
  
  if (recordCount > 50000) {
    warnings.push(`Large dataset (${recordCount} records) - processing limited for demo`);
  }
  
  if (!dataTypes.has('Heart Rate Variability SDNN')) {
    warnings.push('HRV data not found in export');
  }
  
  if (!dataTypes.has('Sleep Analysis')) {
    warnings.push('Sleep data not found in export');
  }

  // Privacy notice
  warnings.push('NOTE: This is a parser demo - no personal health data is stored or transmitted');

  return {
    recordCount,
    dataTypes: Array.from(dataTypes).sort(),
    dateRange: {
      start: startDate,
      end: endDate
    },
    warnings
  };
}

// Supported Apple Health data types (for reference)
export const SUPPORTED_DATA_TYPES = {
  vitals: [
    'Heart Rate',
    'Heart Rate Variability SDNN',
    'Resting Heart Rate',
    'Blood Pressure Systolic',
    'Blood Pressure Diastolic',
    'Respiratory Rate'
  ],
  
  activity: [
    'Step Count',
    'Distance Walking Running',
    'Active Energy Burned',
    'Basal Energy Burned',
    'Flights Climbed',
    'Exercise Minutes'
  ],
  
  sleep: [
    'Sleep Analysis',
    'Sleep Duration'
  ],
  
  body: [
    'Body Mass',
    'Height',
    'Body Fat Percentage',
    'Lean Body Mass'
  ],
  
  nutrition: [
    'Dietary Energy Consumed',
    'Dietary Protein',
    'Dietary Carbohydrates',
    'Dietary Fat Total'
  ]
};