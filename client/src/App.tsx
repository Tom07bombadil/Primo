import { useMemo, useState } from "react";
import type { EvaluateResponse } from "@shared/schema";

const defaultRequest = {
  request: {
    memberId: "123456",
    patientName: "John Doe",
    diagnosisCodes: ["F84.0"],
    procedureCodes: ["97151"],
    serviceRequested: "ABA Therapy",
  },
  policy: {
    policyName: "ABA Therapy Coverage",
    policyVersion: "2026.03",
    criteria: [
      { id: "C1", description: "Confirmed diagnosis of Autism Spectrum Disorder", required: true, evidenceHints: ["autism", "asd", "f84.0"] },
      { id: "C2", description: "Treatment plan documented by provider", required: true, evidenceHints: ["treatment plan", "provider note"] },
      { id: "C3", description: "Less intensive therapies attempted before ABA request", required: true, evidenceHints: ["speech therapy", "occupational therapy", "previous treatments"] },
    ],
  },
  clinicalFacts: [
    { label: "Diagnosis", value: "Autism Spectrum Disorder confirmed in psychological evaluation.", sourceDocument: "psych_eval.pdf" },
    { label: "Plan", value: "Treatment plan documented by Dr. Smith for 20 hours/week ABA.", sourceDocument: "provider_note.pdf" },
  ],
};

export function App() {
  const [payloadText, setPayloadText] = useState(JSON.stringify(defaultRequest, null, 2));
  const [result, setResult] = useState<EvaluateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const recommendation = useMemo(() => {
    if (!result) {
      return "";
    }
    if (result.confidenceScore >= 90) {
      return "Auto decision recommended";
    }
    if (result.confidenceScore >= 70) {
      return "Review recommended";
    }
    return "Manual review required";
  }, [result]);

  const evaluate = async () => {
    try {
      setLoading(true);
      setError(null);
      const parsed = JSON.parse(payloadText);
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message ?? "Failed to evaluate request");
      }

      const body = (await response.json()) as EvaluateResponse;
      setResult(body);
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <h1>AI-Powered Prior Authorization Decision System</h1>
      <p className="subtitle">Paste or edit the request/policy/facts payload, then run the decision engine.</p>

      <section className="panel">
        <h2>Input Payload</h2>
        <textarea value={payloadText} onChange={(e) => setPayloadText(e.target.value)} rows={20} spellCheck={false} />
        <button onClick={evaluate} disabled={loading}>{loading ? "Evaluating..." : "Evaluate Prior Auth"}</button>
        {error ? <p className="error">{error}</p> : null}
      </section>

      {result ? (
        <section className="panel">
          <h2>Decision Output</h2>
          <div className="grid">
            <div><strong>Decision:</strong> {result.decision}</div>
            <div><strong>Confidence:</strong> {result.confidenceScore}% ({recommendation})</div>
            <div><strong>Policy:</strong> {result.policyName} v{result.policyVersion}</div>
            <div><strong>Audit Timestamp:</strong> {new Date(result.auditTrail.timestamp).toLocaleString()}</div>
          </div>
          <p><strong>Explanation:</strong> {result.explanation}</p>

          <h3>Criteria Evaluation</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Criterion</th>
                <th>Status</th>
                <th>Evidence Mapping</th>
              </tr>
            </thead>
            <tbody>
              {result.criteriaEvaluation.map((criterion) => (
                <tr key={criterion.criterionId}>
                  <td>{criterion.criterionId}</td>
                  <td>{criterion.description}</td>
                  <td>{criterion.status}</td>
                  <td>
                    {criterion.matchedEvidence.length > 0
                      ? criterion.matchedEvidence.map((fact) => `${fact.sourceDocument}: ${fact.label}`).join("; ")
                      : "No supporting evidence"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {result.missingCriteria.length > 0 ? (
            <>
              <h3>Missing Criteria</h3>
              <ul>
                {result.missingCriteria.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
