import { useState } from "react";

type JiraIssue = {
  key: string;
  fields?: {
    summary?: string;
    status?: { name?: string };
    priority?: { name?: string };
    assignee?: { displayName?: string };
    reporter?: { displayName?: string };
    updated?: string;
  };
};

type DraftResponse = {
  issue: JiraIssue;
  draft: {
    issueKey: string;
    branchName: string;
    summary: string;
    implementationPlan: string[];
    proposedCode: string;
    testPlan: string[];
    prTitle: string;
    prBody: string;
  };
};

const defaultRepoContext = `Tech stack:\n- Node.js + TypeScript\n- React frontend\n- Express backend\n\nCoding constraints:\n- Keep changes minimal and focused\n- Add tests/checks where possible\n- Follow existing file structure and naming conventions`;

export function App() {
  const [issueKey, setIssueKey] = useState("");
  const [repositoryContext, setRepositoryContext] = useState(defaultRepoContext);
  const [implementationNotes, setImplementationNotes] = useState("");

  const [issue, setIssue] = useState<JiraIssue | null>(null);
  const [draft, setDraft] = useState<DraftResponse["draft"] | null>(null);
  const [loadingIssue, setLoadingIssue] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIssue = async () => {
    try {
      setLoadingIssue(true);
      setError(null);
      setDraft(null);

      const response = await fetch(`/api/jira/issue/${encodeURIComponent(issueKey.trim())}`);
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.message ?? "Failed to fetch Jira issue");
      }

      setIssue(body as JiraIssue);
    } catch (requestError) {
      setIssue(null);
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoadingIssue(false);
    }
  };

  const generateDraft = async () => {
    try {
      setLoadingDraft(true);
      setError(null);

      const response = await fetch("/api/jira/generate-pr-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueKey: issueKey.trim(),
          repositoryContext,
          implementationNotes: implementationNotes.trim() || undefined,
        }),
      });

      const body = (await response.json()) as DraftResponse | { message?: string };
      if (!response.ok || !("draft" in body)) {
        throw new Error("message" in body ? body.message ?? "Failed to generate draft" : "Failed to generate draft");
      }

      setIssue(body.issue);
      setDraft(body.draft);
    } catch (requestError) {
      setDraft(null);
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoadingDraft(false);
    }
  };

  return (
    <main className="container">
      <h1>Jira → Code + PR Draft Tester (IBM bob)</h1>
      <p className="subtitle">
        Enter a Jira issue key, pull issue details, and generate an implementation/code/PR draft using your IBM bob-backed MCP integration.
      </p>

      <section className="panel">
        <h2>1) Jira issue</h2>
        <label htmlFor="issueKey">Issue key</label>
        <input id="issueKey" value={issueKey} onChange={(event) => setIssueKey(event.target.value)} placeholder="ABC-123" />
        <div className="buttonRow">
          <button onClick={fetchIssue} disabled={loadingIssue || !issueKey.trim()}>
            {loadingIssue ? "Loading issue..." : "Fetch Jira issue"}
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>2) Repository context + notes</h2>
        <label htmlFor="repoContext">Repository context (passed to IBM bob)</label>
        <textarea id="repoContext" rows={10} value={repositoryContext} onChange={(event) => setRepositoryContext(event.target.value)} />

        <label htmlFor="implementationNotes">Additional implementation notes (optional)</label>
        <textarea
          id="implementationNotes"
          rows={5}
          value={implementationNotes}
          onChange={(event) => setImplementationNotes(event.target.value)}
          placeholder="Any constraints, architecture rules, or acceptance criteria"
        />

        <div className="buttonRow">
          <button onClick={generateDraft} disabled={loadingDraft || !issueKey.trim() || !repositoryContext.trim()}>
            {loadingDraft ? "Generating draft..." : "Generate code + PR draft"}
          </button>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      {issue ? (
        <section className="panel">
          <h2>Jira issue snapshot</h2>
          <div className="grid">
            <div><strong>Key:</strong> {issue.key}</div>
            <div><strong>Summary:</strong> {issue.fields?.summary ?? "-"}</div>
            <div><strong>Status:</strong> {issue.fields?.status?.name ?? "-"}</div>
            <div><strong>Priority:</strong> {issue.fields?.priority?.name ?? "-"}</div>
            <div><strong>Assignee:</strong> {issue.fields?.assignee?.displayName ?? "-"}</div>
            <div><strong>Reporter:</strong> {issue.fields?.reporter?.displayName ?? "-"}</div>
            <div><strong>Updated:</strong> {issue.fields?.updated ? new Date(issue.fields.updated).toLocaleString() : "-"}</div>
          </div>
        </section>
      ) : null}

      {draft ? (
        <section className="panel">
          <h2>Generated implementation + PR draft</h2>
          <p><strong>Branch name:</strong> <code>{draft.branchName}</code></p>
          <p><strong>Summary:</strong> {draft.summary}</p>

          <h3>Implementation plan</h3>
          <ul>
            {draft.implementationPlan.map((step, index) => (
              <li key={`${step}-${index}`}>{step}</li>
            ))}
          </ul>

          <h3>Proposed code</h3>
          <pre>{draft.proposedCode}</pre>

          <h3>Suggested test plan</h3>
          <ul>
            {draft.testPlan.map((step, index) => (
              <li key={`${step}-${index}`}>{step}</li>
            ))}
          </ul>

          <h3>PR title</h3>
          <pre>{draft.prTitle}</pre>

          <h3>PR body</h3>
          <pre>{draft.prBody}</pre>
        </section>
      ) : null}
    </main>
  );
}
