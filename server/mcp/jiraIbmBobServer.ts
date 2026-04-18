import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { callIbmBob, generatePrDraftFromJiraIssue, getJiraIssue, jiraRequest } from "../integrations.jiraIbmBob";

const server = new McpServer({
  name: "jira-ibm-bob",
  version: "1.1.0",
});

server.registerTool(
  "jira_list_projects",
  {
    title: "List Jira projects",
    description: "Lists projects available to the authenticated Jira user.",
    inputSchema: {},
  },
  async () => {
    const projects = await jiraRequest("/rest/api/3/project/search");
    return {
      content: [{ type: "text", text: JSON.stringify(projects.values ?? projects, null, 2) }],
    };
  }
);

server.registerTool(
  "jira_search_issues",
  {
    title: "Search Jira issues",
    description: "Searches Jira issues with JQL.",
    inputSchema: {
      jql: z.string().min(1),
      maxResults: z.number().int().min(1).max(100).default(20),
    },
  },
  async ({ jql, maxResults }) => {
    const query = new URLSearchParams({
      jql,
      maxResults: String(maxResults),
      fields: "summary,status,assignee,priority,issuetype,updated",
    });

    const issues = await jiraRequest(`/rest/api/3/search?${query.toString()}`);
    return {
      content: [{ type: "text", text: JSON.stringify(issues, null, 2) }],
    };
  }
);

server.registerTool(
  "jira_get_issue",
  {
    title: "Get Jira issue",
    description: "Fetches detailed Jira issue data by issue key.",
    inputSchema: { issueKey: z.string().min(1) },
  },
  async ({ issueKey }) => {
    const issue = await getJiraIssue(issueKey);
    return {
      content: [{ type: "text", text: JSON.stringify(issue, null, 2) }],
    };
  }
);

server.registerTool(
  "jira_summarize_with_ibm_bob",
  {
    title: "Summarize Jira issue with IBM bob",
    description: "Reads a Jira issue, then asks IBM bob for summary, risks, and next steps.",
    inputSchema: {
      issueKey: z.string().min(1),
      prompt: z.string().optional().default("Summarize this issue and provide suggested next actions for the engineering team."),
    },
  },
  async ({ issueKey, prompt }) => {
    const issue = await getJiraIssue(issueKey);

    const ibmResponse = await callIbmBob(
      "You are IBM bob, a project management assistant specialized in Jira issue triage.",
      `${prompt}\n\nIssue payload:\n${JSON.stringify(issue, null, 2)}`
    );

    return {
      content: [{ type: "text", text: ibmResponse }],
    };
  }
);

server.registerTool(
  "jira_generate_pr_draft_with_ibm_bob",
  {
    title: "Generate code and PR draft for Jira issue",
    description: "Creates an implementation draft, code sketch, and PR text from a Jira issue using IBM bob.",
    inputSchema: {
      issueKey: z.string().min(1),
      repositoryContext: z.string().min(1),
      implementationNotes: z.string().optional(),
    },
  },
  async ({ issueKey, repositoryContext, implementationNotes }) => {
    const output = await generatePrDraftFromJiraIssue({ issueKey, repositoryContext, implementationNotes });
    return {
      content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Failed to start jira-ibm-bob MCP server", error);
  process.exit(1);
});
