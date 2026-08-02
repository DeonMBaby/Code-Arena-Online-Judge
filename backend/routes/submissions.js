const mongoose = require('mongoose');
const router = require('express').Router();
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const auth = require('../middleware/auth');
const { judgeSubmission } = require('../sandbox/executor');

router.post('/', auth, async (req, res) => {
  try {
    const { problemId, code, language } = req.body;

    if (!problemId || !code?.trim()) {
      return res.status(400).json({ message: 'Problem and source code are required' });
    }

    if (!['cpp', 'python', 'java'].includes(language)) {
      return res.status(400).json({ message: 'Unsupported language' });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const submission = await Submission.create({
      user: req.user.id,
      problem: problemId,
      code,
      language,
      verdict: 'Pending'
    });

    const result = await judgeSubmission(language, code, problem.testCases);

    submission.verdict = result.verdict;
    submission.output = result.output;
    submission.timeTaken = result.timeTaken;
    await submission.save();

    const populated = await submission.populate([
      { path: 'problem', select: 'name code difficulty' },
      { path: 'user', select: 'fullName email' }
    ]);

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const submissions = await Submission.find({ user: req.user.id })
      .populate('problem', 'name code difficulty')
      .sort({ submittedAt: -1 })
      .limit(50);

    const stats = await Submission.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          acceptedSubmissions: {
            $sum: { $cond: [{ $eq: ['$verdict', 'Accepted'] }, 1, 0] }
          },
          solvedProblems: {
            $addToSet: {
              $cond: [{ $eq: ['$verdict', 'Accepted'] }, '$problem', '$$REMOVE']
            }
          }
        }
      }
    ]);

    const summary = stats[0] || {
      totalSubmissions: 0,
      acceptedSubmissions: 0,
      solvedProblems: []
    };

    res.json({
      submissions,
      stats: {
        totalSubmissions: summary.totalSubmissions,
        acceptedSubmissions: summary.acceptedSubmissions,
        solvedProblems: summary.solvedProblems.length,
        accuracy: summary.totalSubmissions
          ? Math.round((summary.acceptedSubmissions / summary.totalSubmissions) * 100)
          : 0
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/problem/:problemId', auth, async (req, res) => {
  try {
    const submissions = await Submission.find({
      user: req.user.id,
      problem: req.params.problemId
    })
      .sort({ submittedAt: -1 })
      .limit(10);

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/recent', async (req, res) => {
  try {
    const submissions = await Submission.find()
      .populate('user', 'fullName')
      .populate('problem', 'name code difficulty')
      .sort({ submittedAt: -1 })
      .limit(20);

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
