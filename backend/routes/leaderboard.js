const router = require('express').Router();
const Submission = require('../models/Submission');

router.get('/', async (req, res) => {
  try {
    const [recentSubmissions, topSolvers, overview] = await Promise.all([
      Submission.find()
        .populate('user', 'fullName')
        .populate('problem', 'name code difficulty')
        .sort({ submittedAt: -1 })
        .limit(12),
      Submission.aggregate([
        { $match: { verdict: 'Accepted' } },
        {
          $group: {
            _id: '$user',
            accepted: { $sum: 1 },
            solvedProblems: { $addToSet: '$problem' },
            lastAcceptedAt: { $max: '$submittedAt' }
          }
        },
        { $sort: { accepted: -1, lastAcceptedAt: 1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            accepted: 1,
            solvedCount: { $size: '$solvedProblems' },
            lastAcceptedAt: 1,
            user: {
              _id: '$user._id',
              fullName: '$user.fullName',
              email: '$user.email'
            }
          }
        }
      ]),
      Submission.aggregate([
        {
          $group: {
            _id: null,
            totalSubmissions: { $sum: 1 },
            acceptedSubmissions: {
              $sum: { $cond: [{ $eq: ['$verdict', 'Accepted'] }, 1, 0] }
            },
            activeUsers: { $addToSet: '$user' }
          }
        }
      ])
    ]);

    const summary = overview[0] || {
      totalSubmissions: 0,
      acceptedSubmissions: 0,
      activeUsers: []
    };

    res.json({
      overview: {
        totalSubmissions: summary.totalSubmissions,
        acceptedSubmissions: summary.acceptedSubmissions,
        activeUsers: summary.activeUsers.length,
        acceptanceRate: summary.totalSubmissions
          ? Math.round((summary.acceptedSubmissions / summary.totalSubmissions) * 100)
          : 0
      },
      recentSubmissions,
      topSolvers
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
