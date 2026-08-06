import { useEffect, useRef, useState } from 'react';
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

public class Main {
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
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [mySubmissions, setMySubmissions] = useState([]);
  // Auto-scroll target: after Run or Submit resolves, we scroll this into
  // view so the verdict is immediately visible instead of requiring a
  // manual scroll down past the editor.
  const resultRef = useRef(null);

  useEffect(() => {
    api.get(`/problems/${id}`).then((response) => setProblem(response.data));
    if (user) {
      api.get(`/submissions/problem/${id}`).then((response) => setMySubmissions(response.data));
    }
  }, [id, user]);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const handleLanguageChange = (nextLanguage) => {
    setLanguage(nextLanguage);
    setCode(STARTERS[nextLanguage]);
  };

  const handleRun = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setRunning(true);
    setResult(null);
    try {
      const { data } = await api.post('/submissions/run', { problemId: id, code, language });
      setResult({
        isRun: true,
        verdict: data.verdict,
        output: data.output,
        expectedOutput: data.expectedOutput,
        timeTaken: data.timeTaken
      });
    } catch (err) {
      setResult({
        isRun: true,
        verdict: 'Error',
        output: err.response?.data?.message || 'Run failed'
      });
    } finally {
      setRunning(false);
    }
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
      setResult({ isRun: false, ...data });
      setMySubmissions((current) => [data, ...current].slice(0, 10));
    } catch (err) {
      setResult({
        isRun: false,
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
          <p className="section-copy">Created {new Date(problem.createdAt).toLocaleDateString()}</p>
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
            <div className="filter-row">
              <button className="btn btn-outline" onClick={handleRun} disabled={running || submitting}>
                {running ? 'Running...' : 'Run Code'}
              </button>
              <button className="btn btn-success" onClick={handleSubmit} disabled={submitting || running}>
                {submitting ? 'Judging...' : 'Submit solution'}
              </button>
            </div>
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

          <div className="result-panel" ref={resultRef}>
            {result ? (
              <>
                <div className="result-header">
                  <span className={`status-text status-${String(result.verdict).toLowerCase().replace(/\s+/g, '-')}`}>
                    {result.isRun ? `Run result: ${result.verdict}` : result.verdict}
                  </span>
                  {result.timeTaken ? <span className="muted">{result.timeTaken}ms</span> : null}
                </div>
                <pre>{result.output || 'No output'}</pre>
                {result.isRun && result.expectedOutput !== undefined && (
                  <>
                    <p style={{ marginTop: 12, marginBottom: 4, color: '#a9c9bb' }}><strong>Expected (sample):</strong></p>
                    <pre>{result.expectedOutput}</pre>
                  </>
                )}
              </>
            ) : (
              <div className="empty-state compact">Run against the sample input, or submit to see verdicts here.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
