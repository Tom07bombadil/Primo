import { useMemo, useState } from "react";
import type { EvaluateResponse } from "@shared/schema";

type CriterionForm = {
  id: string;
  description: string;
  required: boolean;
  evidenceHints: string;
};

type ClinicalFactForm = {
  label: string;
  value: string;
  sourceDocument: string;
};

const seedCriteria: CriterionForm[] = [
  {
    id: "C1",
    description: "Confirmed diagnosis of Autism Spectrum Disorder",
    required: true,
    evidenceHints: "autism, asd, f84.0",
  },
  {
    id: "C2",
    description: "Treatment plan documented by provider",
    required: true,
    evidenceHints: "treatment plan, provider note",
  },
  {
    id: "C3",
    description: "Less intensive therapies attempted before ABA request",
    required: true,
    evidenceHints: "speech therapy, occupational therapy, previous treatments",
  },
];

const seedFacts: ClinicalFactForm[] = [
  {
    label: "Diagnosis",
    value: "Autism Spectrum Disorder confirmed in psychological evaluation.",
    sourceDocument: "psych_eval.pdf",
  },
  {
    label: "Plan",
    value: "Treatment plan documented by Dr. Smith for 20 hours/week ABA.",
    sourceDocument: "provider_note.pdf",
  },
];

export function App() {
  const [memberId, setMemberId] = useState("123456");
  const [patientName, setPatientName] = useState("John Doe");
  const [diagnosisCodes, setDiagnosisCodes] = useState("F84.0");
  const [procedureCodes, setProcedureCodes] = useState("97151");
  const [serviceRequested, setServiceRequested] = useState("ABA Therapy");

  const [policyName, setPolicyName] = useState("ABA Therapy Coverage");
  const [policyVersion, setPolicyVersion] = useState("2026.03");
  const [criteria, setCriteria] = useState<CriterionForm[]>(seedCriteria);

  const [facts, setFacts] = useState<ClinicalFactForm[]>(seedFacts);
  const [result, setResult] = useState<EvaluateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const payload = useMemo(() => {
    return {
      request: {
        memberId,
        patientName,
        diagnosisCodes: diagnosisCodes.split(",").map((item) => item.trim()).filter(Boolean),
        procedureCodes: procedureCodes.split(",").map((item) => item.trim()).filter(Boolean),
        serviceRequested,
      },
      policy: {
        policyName,
        policyVersion,
        criteria: criteria
          .filter((criterion) => criterion.id.trim() && criterion.description.trim())
          .map((criterion) => ({
            id: criterion.id.trim(),
            description: criterion.description.trim(),
            required: criterion.required,
            evidenceHints: criterion.evidenceHints
              .split(",")
              .map((hint) => hint.trim())
              .filter(Boolean),
          })),
      },
      clinicalFacts: facts
        .filter((fact) => fact.label.trim() && fact.value.trim() && fact.sourceDocument.trim())
        .map((fact) => ({
          label: fact.label.trim(),
          value: fact.value.trim(),
          sourceDocument: fact.sourceDocument.trim(),
        })),
    };
  }, [
    memberId,
    patientName,
    diagnosisCodes,
    procedureCodes,
    serviceRequested,
    policyName,
    policyVersion,
    criteria,
    facts,
  ]);

  const recommendation = useMemo(() => {
    if (!result) return "";
    if (result.confidenceScore >= 90) return "Auto decision recommended";
    if (result.confidenceScore >= 70) return "Review recommended";
    return "Manual review required";
  }, [result]);

  const evaluate = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      if (payload.policy.criteria.length === 0) {
        throw new Error("Add at least one policy criterion before evaluating.");
      }

      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message ?? "Failed to evaluate request");
      }

      setResult(body as EvaluateResponse);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const updateCriterion = (index: number, field: keyof CriterionForm, value: string | boolean) => {
    setCriteria((current) => current.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const updateFact = (index: number, field: keyof ClinicalFactForm, value: string) => {
    setFacts((current) => current.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  return (
    <main className="container">
      <header className="hero">
        <h1>AI-Powered Prior Authorization Decision System</h1>
        <p>
          Enter prior-auth request details, policy criteria, and clinical evidence. The system evaluates criteria and returns an explainable
          decision.
        </p>
      </header>

      <section className="panel">
        <h2>1) Prior Authorization Request</h2>
        <div className="formGrid">
          <label>
            Member ID
            <input value={memberId} onChange={(e) => setMemberId(e.target.value)} />
          </label>
          <label>
            Patient Name
            <input value={patientName} onChange={(e) => setPatientName(e.target.value)} />
          </label>
          <label>
            Diagnosis Codes (comma-separated)
            <input value={diagnosisCodes} onChange={(e) => setDiagnosisCodes(e.target.value)} />
          </label>
          <label>
            Procedure Codes (comma-separated)
            <input value={procedureCodes} onChange={(e) => setProcedureCodes(e.target.value)} />
          </label>
          <label className="fullWidth">
            Service Requested
            <input value={serviceRequested} onChange={(e) => setServiceRequested(e.target.value)} />
          </label>
        </div>
      </section>

      <section className="panel">
        <h2>2) Policy Configuration</h2>
        <div className="formGrid">
          <label>
            Policy Name
            <input value={policyName} onChange={(e) => setPolicyName(e.target.value)} />
          </label>
          <label>
            Policy Version
            <input value={policyVersion} onChange={(e) => setPolicyVersion(e.target.value)} />
          </label>
        </div>

        <h3>Criteria</h3>
        {criteria.map((criterion, index) => (
          <div className="subPanel" key={`${criterion.id}-${index}`}>
            <div className="inlineFields">
              <label>
                ID
                <input value={criterion.id} onChange={(e) => updateCriterion(index, "id", e.target.value)} />
              </label>
              <label className="wide">
                Description
                <input value={criterion.description} onChange={(e) => updateCriterion(index, "description", e.target.value)} />
              </label>
              <label className="checkboxLabel">
                <input
                  type="checkbox"
                  checked={criterion.required}
                  onChange={(e) => updateCriterion(index, "required", e.target.checked)}
                />
                Required
              </label>
            </div>
            <label>
              Evidence Hints (comma-separated)
              <input value={criterion.evidenceHints} onChange={(e) => updateCriterion(index, "evidenceHints", e.target.value)} />
            </label>
          </div>
        ))}

        <button
          className="secondary"
          onClick={() => setCriteria((current) => [...current, { id: `C${current.length + 1}`, description: "", required: true, evidenceHints: "" }])}
        >
          + Add Criterion
        </button>
      </section>

      <section className="panel">
        <h2>3) Clinical Evidence</h2>
        {facts.map((fact, index) => (
          <div className="subPanel" key={`${fact.sourceDocument}-${index}`}>
            <div className="inlineFields">
              <label>
                Fact Label
                <input value={fact.label} onChange={(e) => updateFact(index, "label", e.target.value)} />
              </label>
              <label>
                Source Document
                <input value={fact.sourceDocument} onChange={(e) => updateFact(index, "sourceDocument", e.target.value)} />
              </label>
            </div>
            <label>
              Fact Value
              <textarea value={fact.value} rows={3} onChange={(e) => updateFact(index, "value", e.target.value)} />
            </label>
          </div>
        ))}

        <button className="secondary" onClick={() => setFacts((current) => [...current, { label: "", value: "", sourceDocument: "" }])}>
          + Add Clinical Fact
        </button>
      </section>

      <section className="panel">
        <h2>4) Run Decision</h2>
        <div className="actions">
          <button onClick={evaluate} disabled={loading}>
            {loading ? "Evaluating..." : "Evaluate Prior Authorization"}
          </button>
          {error ? <p className="error">{error}</p> : null}
        </div>

        <details>
          <summary>Preview request payload JSON</summary>
          <pre>{JSON.stringify(payload, null, 2)}</pre>
        </details>
      </section>

      {result ? (
        <section className="panel">
          <h2>Decision Report</h2>
          <div className="decisionGrid">
            <div>
              <strong>Decision</strong>
              <p>{result.decision}</p>
            </div>
            <div>
              <strong>Confidence</strong>
              <p>
                {result.confidenceScore}% ({recommendation})
              </p>
            </div>
            <div>
              <strong>Policy</strong>
              <p>
                {result.policyName} v{result.policyVersion}
              </p>
            </div>
            <div>
              <strong>Audit Timestamp</strong>
              <p>{new Date(result.auditTrail.timestamp).toLocaleString()}</p>
            </div>
          </div>

          <p>
            <strong>Explanation:</strong> {result.explanation}
          </p>

          <h3>Policy Criteria Evaluation</h3>
          <table>
            <thead>
              <tr>
                <th>Criterion ID</th>
                <th>Description</th>
                <th>Status</th>
                <th>Evidence Mapping</th>
                <th>Rationale</th>
              </tr>
            </thead>
            <tbody>
              {result.criteriaEvaluation.map((criterion) => (
                <tr key={criterion.criterionId}>
                  <td>{criterion.criterionId}</td>
                  <td>{criterion.description}</td>
                  <td>{criterion.status}</td>
                  <td>
                    {criterion.matchedEvidence.length
                      ? criterion.matchedEvidence.map((item) => `${item.sourceDocument}: ${item.label}`).join("; ")
                      : "No evidence mapped"}
                  </td>
                  <td>{criterion.rationale}</td>
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
