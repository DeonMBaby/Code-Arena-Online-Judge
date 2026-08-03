import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const STARTERS = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // your code here
    return 0;
}`,
  python: `# your code here
`,
  java: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // your code here
    }
}`
};

export default function ProblemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState(STARTERS.cpp);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [mySubmissions, setMySubmissions] = useState([]);

  useEffect(() => {
    api.get(`/problems/${id}`).then((response) => setProblem(response.data));
    if (user) {
      api.get(`/submissions/problem/${id}`).then((response) => setMySubmissions(response.data));
    }
  }, [id, user]);

  const handleLanguageChange = (nextLanguage) => {
    setLanguage(nextLanguage);
    setCode(STARTERS[nextLanguage]);
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    setResult(null);
    try {
      const { data } = await api.post('/submissions', { problemId: id, code, language });
      setResult(data);
      setMySubmissions((current) => [data, ...current].slice(0, 10));
    } catch (err) {
      setResult({
        verdict: 'Error',
        output: err.response?.data?.message || 'Submission failed'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!problem) {
    return <div className="page"><div className="container empty-state">Loading problem...</div></div>;
  }

  return (
    <div className="page problem-layout-page">
      <div className="problem-layout">
        <section className="problem-brief">
          <div className="problem-topline">
            <span className={`badge badge-${problem.difficulty?.toLowerCase()}`}>{problem.difficulty}</span>
            <span className="muted">{problem.code}</span>
            <span className="muted">{problem.submissionCount} submissions</span>
          </div>
          <h1>{problem.name}</h1>
          <p className="section-copy">Created {new Date(problem.createdAt).toLocaleDateString()}{problem.createdBy?.fullName ? ` by ${problem.createdBy.fullName}` : ''}</p>
          <article className="statement-card">
            <pre>{problem.statement}</pre>
          </article>


  {problem.testCases?.[0] && (
    <article className="statement-card">
    <h3 style={{ marginTop: 0 }}>Example</h3>
    <p style={{ marginBottom: 4 }}><strong>Input:</strong></p>
    <pre>{problem.testCases[0].input}</pre>
    {problem.testCases[0].output !== undefined && (
      <>
        <p style={{ marginBottom: 4 }}><strong>Output:</strong></p>
        <pre>{problem.testCases[0].output}</pre>
      </>
    )}
  </article>
)}

          <section className="history-card">
            <div className="section-heading">
              <h3>Your recent submissions</h3>
            </div>
            {mySubmissions.length === 0 ? (
              <div className="empty-state compact">No submissions for this problem yet.</div>
            ) : (
              <div className="submission-feed">
                {mySubmissions.map((submission) => (
                  <div key={submission._id} className="submission-item">
                    <strong>{submission.verdict}</strong>
                    <span>{submission.language.toUpperCase()}</span>
                    <span>{new Date(submission.submittedAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </section>

        <section className="editor-shell">
          <div className="editor-toolbar">
            <div className="filter-row">
              {['cpp', 'python', 'java'].map((option) => (
                <button
                  key={option}
                  className={`btn ${language === option ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleLanguageChange(option)}
                >
                  {option === 'cpp' ? 'C++' : option === 'python' ? 'Python' : 'Java'}
                </button>
              ))}
            </div>
            <button className="btn btn-success" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Judging...' : 'Submit solution'}
            </button>
          </div>

          <div className="editor-panel">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 18 }
              }}
            />
          </div>

          <div className="result-panel">
            {result ? (
              <>
                <div className="result-header">
                  <span className={`status-text status-${String(result.verdict).toLowerCase().replace(/\s+/g, '-')}`}>{result.verdict}</span>
                  {result.timeTaken ? <span className="muted">{result.timeTaken}ms</span> : null}
                </div>
                <pre>{result.output || 'No output'}</pre>
              </>
            ) : (
              <div className="empty-state compact">Submit code to see verdicts and execution output here.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
