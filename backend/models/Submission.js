const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problem:     { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  code:        { type: String, required: true },
  language:    { type: String, enum: ['cpp', 'python', 'java'], required: true },
  verdict:     { type: String, enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error', 'Pending'], default: 'Pending' },
  output:      { type: String },
  timeTaken:   { type: Number }, // ms
  submittedAt: { type: Date, default: Date.now }
});

submissionSchema.index({ user: 1, submittedAt: -1 });
submissionSchema.index({ problem: 1, submittedAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
