# health-cli

**Agent-first health data CLI - HATEOAS CLI reference implementation**

A demonstration CLI that showcases agent-first design principles for building CLIs that work seamlessly with AI agents and automation tools.

## 🎯 Project Purpose

This project serves as a **reference implementation** for building agent-first CLIs following HATEOAS (Hypermedia as the Engine of Application State) principles. It demonstrates how to design command-line interfaces that are:

- **AI-agent friendly** - JSON-only output for easy parsing
- **Self-documenting** - Commands provide their own metadata and available actions  
- **Discoverable** - HATEOAS-style `next_actions` guide users and agents
- **Consistent** - Standardized response formats across all commands
- **Error-helpful** - Errors include fix suggestions and alternative actions

## 🏗️ Design Principles

### 1. JSON-Only Output
All commands return structured JSON responses instead of human-readable text:

```json
{
  "ok": true,
  "command": "health status", 
  "result": {...},
  "next_actions": [
    {"command": "health hrv", "description": "View HRV trends"},
    {"command": "health sleep", "description": "View sleep analysis"}
  ]
}
```

### 2. HATEOAS Next Actions  
Every response includes `next_actions` that guide what commands make sense to run next, enabling agents to discover and navigate the CLI autonomously.

### 3. Self-Documentation
The root command (`health`) returns complete metadata about available commands, options, and usage examples.

### 4. Consistent Error Handling
Errors follow a standard format with actionable fix suggestions:

```json
{
  "ok": false,
  "command": "health hrv --days 200",
  "error": {"message": "Days parameter must be between 1 and 90", "code": "INVALID_DAYS_RANGE"},
  "fix": "Use a value between 1 and 90 days",
  "next_actions": [...]
}
```

### 5. Mock Data Only
This CLI uses **only mock/example data** for demonstration. No personal health information is stored, transmitted, or processed.

## 🛠️ Technology Stack

- **Runtime:** [Bun](https://bun.sh) - Fast JavaScript runtime
- **CLI Framework:** [@effect/cli](https://effect.website/docs/cli) - Type-safe CLI building
- **Language:** TypeScript - For type safety and developer experience

## 📦 Installation

### Prerequisites
- [Bun](https://bun.sh) (v1.0+)
- Node.js 18+ (for compatibility)

### Install Dependencies
```bash
cd health-cli
bun install
```

### Build
```bash
bun run build
```

### Make Executable
```bash
chmod +x dist/index.js
```

### Global Installation (Optional)
```bash
npm install -g .
# or
bun link
```

## 🚀 Usage

### Basic Commands

```bash
# Show all available commands (self-documentation)
health

# Today's health overview  
health status

# HRV trends (default: 7 days)
health hrv
health hrv --days 14

# Sleep analysis
health sleep  
health sleep --days 30

# Check health alerts
health alert

# Parse Apple Health XML (demo parser)
health import ~/Desktop/apple_health_export.xml
```

### Example Output

```bash
$ health status
{
  "ok": true,
  "command": "health status",
  "result": {
    "date": "2024-01-15",
    "hrv": {
      "current": 45,
      "trend": "stable", 
      "category": "normal"
    },
    "sleep": {
      "last_night_hours": 7.2,
      "avg_7_day": 7.1,
      "score": 82
    },
    "activity": {
      "steps": 9250,
      "active_calories": 520,
      "exercise_minutes": 35  
    },
    "alerts": [],
    "summary": "💚 Excellent recovery state • 😴 Well rested • 🚶 Moderately active"
  },
  "next_actions": [
    {"command": "health hrv", "description": "View HRV trends"},
    {"command": "health sleep", "description": "View sleep analysis"},
    {"command": "health alert", "description": "Check health alerts"}
  ]
}
```

## 🏥 Available Commands

| Command | Description | Options |
|---------|-------------|---------|
| `health` | Self-documenting root command showing all available commands | - |
| `health status` | Today's health overview with key metrics | - |
| `health hrv` | Heart Rate Variability trends and analysis | `--days` (1-90, default: 7) |
| `health sleep` | Sleep analysis and patterns | `--days` (1-90, default: 7) |
| `health alert` | Check health alerts and warning thresholds | - |
| `health import <file>` | Parse Apple Health XML (structure only) | File path |

## 🔒 Privacy & Data

**⚠️ IMPORTANT: This CLI contains NO real personal health data.**

- All health metrics are **mock/example data** generated for demonstration
- The import command only **parses XML structure** without storing personal data
- No data is transmitted to external services
- This is purely a CLI design reference implementation

## 🤖 Agent Integration

This CLI is designed to work seamlessly with AI agents:

### Bash Agent Example
```bash
# Agent can discover commands
COMMANDS=$(health | jq -r '.result.commands[].name')

# Agent can follow next_actions  
NEXT=$(health status | jq -r '.next_actions[0].command')
eval "$NEXT"

# Agent can handle errors gracefully
health hrv --days 200 | jq -r '.fix'
# Output: "Use a value between 1 and 90 days"
```

### Python Agent Example  
```python
import json, subprocess

def run_health_cmd(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return json.loads(result.stdout)

# Self-discovery
root = run_health_cmd("health")
commands = [c["name"] for c in root["result"]["commands"]]

# Follow next actions
status = run_health_cmd("health status") 
for action in status["next_actions"]:
    print(f"Suggested: {action['command']} - {action['description']}")
```

## 🧪 Development

### Project Structure
```
health-cli/
├── src/
│   ├── commands/          # Individual command implementations
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Response utilities
│   ├── data/              # Mock data generators
│   └── index.ts           # Main CLI entry point
├── dist/                  # Built output
└── package.json
```

### Development Commands
```bash
# Install dependencies
bun install

# Run in development mode  
bun run dev

# Build for production
bun run build

# Run tests
bun test

# Lint code
bun run lint

# Format code
bun run format
```

### Adding New Commands

1. Create command file in `src/commands/`
2. Implement using response utilities from `src/utils/responses.ts`
3. Add to main CLI in `src/index.ts`
4. Follow the established patterns for success/error responses

## 📚 References

This implementation follows the agent-first CLI design principles inspired by:

- **Joel Hooks** - Agent-first CLI design philosophy
- **HATEOAS** - REST architectural constraint for discoverability
- **Effect CLI** - Type-safe CLI construction patterns

## 🤝 Contributing

This is a reference implementation. Contributions that improve the demonstration of agent-first CLI principles are welcome:

- Enhanced self-documentation patterns
- Better error handling examples  
- Additional HATEOAS navigation patterns
- Improved agent integration examples

## 📄 License

MIT License - See LICENSE file for details.

---

**Remember: This is a design pattern demonstration using mock data only. No real health data is processed or stored.**