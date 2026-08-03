const router = require('express').Router();
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const auth = require('../middleware/auth');

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

    const problems = await Problem.find(query)
      .select('-testCases')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });

    res.json(problems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)
      .populate('createdBy', 'fullName');

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const submissionCount = await Submission.countDocuments({ problem: req.params.id });

    // Expose only the FIRST test case's output as a public "sample" example.
    // Every other test case's expected output stays hidden so users can't
    // just read answers off the API — only its input is shown (if shown at all).
    const testCasesForClient = problem.testCases.map((tc, index) => ({
      input: tc.input,
      output: index === 0 ? tc.output : undefined
    }));

    res.json({
      ...problem.toObject(),
      testCases: testCasesForClient,
      submissionCount
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

    const populated = await problem.populate('createdBy', 'fullName');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
