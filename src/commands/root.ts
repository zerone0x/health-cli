/**
 * Root command - Self-documenting command tree
 * Following agent-first CLI principles
 */
import { success, COMMON_ACTIONS } from '../utils/responses.js';

export function rootCommand() {
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
        usage: 'health hrv [--days 7]',
        options: [
          { name: '--days', description: 'Number of days to analyze (default: 7)' }
        ]
      },
      {
        name: 'sleep',
        description: 'Sleep analysis and patterns',
        usage: 'health sleep [--days 7]',
        options: [
          { name: '--days', description: 'Number of days to analyze (default: 7)' }
        ]
      },
      {
        name: 'alert',
        description: 'Check health alerts and warning thresholds',
        usage: 'health alert'
      },
      {
        name: 'import',
        description: 'Import Apple Health XML data (parser only)',
        usage: 'health import <file>',
        note: 'Parser implementation - processes structure without storing personal data'
      }
    ],
    examples: [
      'health status                 # Today\'s overview',
      'health hrv --days 14         # 2 weeks HRV trend',
      'health sleep --days 30       # Monthly sleep analysis',
      'health alert                 # Check current alerts',
      'health import export.xml     # Parse Apple Health export'
    ],
    data_sources: {
      note: 'All data is mock/example data for demonstration',
      supported_formats: ['Apple Health XML', 'HealthKit exports'],
      privacy: 'No personal health data is stored or transmitted'
    }
  };

  const nextActions = [
    COMMON_ACTIONS.STATUS,
    COMMON_ACTIONS.HRV,
    COMMON_ACTIONS.SLEEP,
    COMMON_ACTIONS.ALERTS
  ];

  return success('', result, nextActions);
}