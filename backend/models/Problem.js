const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input:  { type: String, required: true },
  output: { type: String, required: true }
});

const problemSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  code:       { type: String, required: true, unique: true }, // e.g. "P001"
  statement:  { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  testCases:  [testCaseSchema],
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Problem', problemSchema);
