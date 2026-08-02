import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function CreateProblem() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    code: '',
    difficulty: 'Medium',
    statement: '',
    testCases: [
      { input: '', output: '' },
      { input: '', output: '' }
    ]
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateTestCase = (index, key, value) => {
    setForm((current) => ({
      ...current,
      testCases: current.testCases.map((testCase, testIndex) =>
        testIndex === index ? { ...testCase, [key]: value } : testCase
      )
    }));
  };

  const addTestCase = () => {
    setForm((current) => ({
      ...current,
      testCases: [...current.testCases, { input: '', output: '' }]
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/problems', form);
      navigate(`/problems/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create problem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container narrow-container">
        <section className="section-banner">
          <div>
            <span className="eyebrow">Create Problem</span>
            <h1>Publish a challenge with inputs, outputs, and difficulty.</h1>
            <p className="section-copy">This is the starter authoring route. A full admin panel can grow on top of this later.</p>
          </div>
        </section>

        <section className="card section-card">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-grid">
            <label>
              <span>Problem name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Two Sum Variant" />
            </label>
            <label>
              <span>Problem code</span>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="P101" />
            </label>
            <label>
              <span>Difficulty</span>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </label>
            <label className="full-span">
              <span>Statement</span>
              <textarea rows="8" value={form.statement} onChange={(e) => setForm({ ...form, statement: e.target.value })} placeholder="Describe the task, constraints, and examples." />
            </label>
          </div>

          <div className="testcase-section">
            <div className="section-heading">
              <h3>Test cases</h3>
              <button className="btn btn-outline" onClick={addTestCase}>Add test case</button>
            </div>
            <div className="testcase-grid">
              {form.testCases.map((testCase, index) => (
                <div key={index} className="testcase-card">
                  <strong>Case {index + 1}</strong>
                  <textarea rows="4" value={testCase.input} onChange={(e) => updateTestCase(index, 'input', e.target.value)} placeholder="Input" />
                  <textarea rows="4" value={testCase.output} onChange={(e) => updateTestCase(index, 'output', e.target.value)} placeholder="Expected output" />
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Publishing...' : 'Publish problem'}
          </button>
        </section>
      </div>
    </div>
  );
}
