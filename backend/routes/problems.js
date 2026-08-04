const jwt = require('jsonwebtoken');
const router = require('express').Router();
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const auth = require('../middleware/auth');

// This route stays public (anyone can browse problems without logging in),
// but if a valid token IS present, we use it to figure out which of these
// problems the current user has already solved, so the frontend can show a
// "Solved" badge. Manually checking the token here (rather than using the
// `auth` middleware, which would reject the request entirely if no/invalid
// token is present) is what lets this stay optional instead of required.
async function getSolvedIdsForRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return new Set();
  }

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    const solved = await Submission.distinct('problem', {
      user: decoded.id,
      verdict: 'Accepted'
    });
    return new Set(solved.map((id) => id.toString()));
  } catch {
    // Invalid/expired token on a public route — just treat as logged out
    // rather than failing the whole request.
    return new Set();
  }
}

router.get('/', async (req, res) => {
  try {
    const { difficulty, search } = req.query;
    const query = {};

    if (difficulty && difficulty !== 'All') {
      query.difficulty = difficulty;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    // No longer populates createdBy — the creator's name is intentionally
    // not exposed on the problem list.
    const problems = await Problem.find(query)
      .select('-testCases')
      .sort({ createdAt: -1 });

    const solvedIds = await getSolvedIdsForRequest(req);

    const withSolvedFlag = problems.map((p) => ({
      ...p.toObject(),
      solved: solvedIds.has(p._id.toString())
    }));

    res.json(withSolvedFlag);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    // No longer populates createdBy — the creator's name is intentionally
    // not exposed on the problem detail page either.
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const submissionCount = await Submission.countDocuments({ problem: req.params.id });

    // Expose only the FIRST test case's output as a public "sample"
    // example. Every other test case's expected output stays hidden so
    // users can't just read answers off the API.
    const testCasesForClient = problem.testCases.map((tc, index) => ({
      input: tc.input,
      output: index === 0 ? tc.output : undefined
    }));

    const solvedIds = await getSolvedIdsForRequest(req);

    res.json({
      ...problem.toObject(),
      testCases: testCasesForClient,
      submissionCount,
      solved: solvedIds.has(problem._id.toString())
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, code, statement, difficulty, testCases } = req.body;
    if (!name || !code || !statement || !Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({ message: 'Name, code, statement, and test cases are required' });
    }

    const normalizedCode = code.trim().toUpperCase();
    const existing = await Problem.findOne({ code: normalizedCode });
    if (existing) {
      return res.status(400).json({ message: 'Problem code already exists' });
    }

    const cleanTestCases = testCases
      .map((testCase) => ({
        input: String(testCase.input ?? ''),
        output: String(testCase.output ?? '')
      }))
      .filter((testCase) => testCase.output.trim().length > 0);

    if (cleanTestCases.length === 0) {
      return res.status(400).json({ message: 'At least one valid test case is required' });
    }

    const problem = await Problem.create({
      name: name.trim(),
      code: normalizedCode,
      statement: statement.trim(),
      difficulty: difficulty || 'Medium',
      testCases: cleanTestCases,
      createdBy: req.user.id
    });

    res.status(201).json(problem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;