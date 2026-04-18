# Jira + IBM bob MCP server and UI tester

This repo now includes:

1. an MCP stdio server for Jira + IBM bob
2. a browser UI to test Jira issue intake and generate code + PR drafts

## 1) Environment variables

Set the following variables before launching MCP server or UI API endpoints:

- `JIRA_BASE_URL` (example: `https://your-company.atlassian.net`)
- `JIRA_EMAIL` (Jira account email)
- `JIRA_API_TOKEN` (Atlassian API token)
- `IBM_BOB_URL` (base URL for your IBM bob gateway, OpenAI-compatible)
- `IBM_BOB_API_KEY` (API key for IBM bob)
- `IBM_BOB_MODEL` (optional, defaults to `ibm/bob`)

## 2) Run

```bash
npm run dev
```

Open the app and use the Jira → Code + PR Draft Tester panel.

To run only the MCP server:

```bash
npm run mcp:jira-ibm-bob
```

## 3) MCP tools

- `jira_list_projects`
- `jira_search_issues`
- `jira_get_issue`
- `jira_summarize_with_ibm_bob`
- `jira_generate_pr_draft_with_ibm_bob`

## 4) HTTP API endpoints used by UI

- `GET /api/jira/issue/:issueKey`
- `POST /api/jira/generate-pr-draft`

`POST /api/jira/generate-pr-draft` request body:

```json
{
  "issueKey": "ABC-123",
  "repositoryContext": "Tech stack + constraints",
  "implementationNotes": "Optional notes"
}
```

## 5) Example MCP client config

```json
{
  "mcpServers": {
    "jira-ibm-bob": {
      "command": "npm",
      "args": ["run", "mcp:jira-ibm-bob"],
      "env": {
        "JIRA_BASE_URL": "https://your-company.atlassian.net",
        "JIRA_EMAIL": "you@company.com",
        "JIRA_API_TOKEN": "<token>",
        "IBM_BOB_URL": "https://your-ibm-bob-endpoint",
        "IBM_BOB_API_KEY": "<api-key>",
        "IBM_BOB_MODEL": "ibm/bob"
      }
    }
  }
}
```

If your IBM bob endpoint is not OpenAI-compatible (`/v1/chat/completions`), adapt `callIbmBob` in `server/integrations.jiraIbmBob.ts`.
