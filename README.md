# campaign2json

React UI for building campaign decision tree JSON configurations. Used with AWS Connect/Lex for SMS and voice campaigns.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run test
```

## Output Format

```json
{
  "CampaignName": {
    "1": {
      "message": "Response text",
      "risk": "high",
      "needs_followup": true
    },
    "2": {
      "message": "Another response",
      "risk": "low",
      "needs_followup": false,
      "then": {
        "1": { "message": "Sub-option 1", "risk": "medium" },
        "2": { "message": "Sub-option 2", "risk": "medium" }
      }
    }
  }
}
```

## Fields

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | SMS/voice response text |
| `risk` | `low` / `medium` / `high` | Priority level |
| `needs_followup` | boolean | Coordinator callback flag |
| `then` | object | Nested sub-menu options |

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide Icons
