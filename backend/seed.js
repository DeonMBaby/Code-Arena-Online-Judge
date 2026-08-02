const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Problem = require('./models/Problem');

dotenv.config();

// FIX: this was hardcoded to localhost, which only works when running the
// seed script directly on your host machine. If you run it inside the
// backend Docker container (e.g. `docker compose exec backend npm run
// seed`), "localhost" refers to the container itself, not the mongodb
// service — so it needs to use the same MONGO_URI env var as server.js.
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/onlinejudge');

const problems = [
  {
    name: 'Hello World',
    code: 'P001',
    difficulty: 'Easy',
    statement: `Print "Hello, World!" to the output.

Input: None
Output: Hello, World!

Example:
Output: Hello, World!`,
    testCases: [
      { input: '\n', output: 'Hello, World!' } // FIX: '' failed the schema's `required` check on input
    ]
  },
  {
    name: 'Sum of Two Numbers',
    code: 'P002',
    difficulty: 'Easy',
    statement: `Given two integers A and B, print their sum.

Input: Two space-separated integers A and B on a single line.
Output: A single integer — the sum of A and B.

Constraints: -10^9 <= A, B <= 10^9

Example:
Input: 3 5
Output: 8`,
    testCases: [
      { input: '3 5', output: '8' },
      { input: '-1 1', output: '0' },
      { input: '1000000000 -1000000000', output: '0' }
    ]
  },
  {
    name: 'Reverse a String',
    code: 'P003',
    difficulty: 'Easy',
    statement: `Given a string S, print it reversed.

Input: A single string S (no spaces).
Output: The reversed string.

Example:
Input: hello
Output: olleh`,
    testCases: [
      { input: 'hello', output: 'olleh' },
      { input: 'abcde', output: 'edcba' },
      { input: 'a', output: 'a' }
    ]
  },
  {
    name: 'FizzBuzz',
    code: 'P004',
    difficulty: 'Easy',
    statement: `Given a number N, print numbers from 1 to N.
For multiples of 3 print "Fizz", for multiples of 5 print "Buzz", for multiples of both print "FizzBuzz".

Input: A single integer N.
Output: N lines.

Example:
Input: 5
Output:
1
2
Fizz
4
Buzz`,
    testCases: [
      { input: '5', output: '1\n2\nFizz\n4\nBuzz' },
      { input: '15', output: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz' }
    ]
  },
  {
    name: 'Check Prime',
    code: 'P005',
    difficulty: 'Medium',
    statement: `Given a number N, print "YES" if it is prime, otherwise "NO".

Input: A single integer N.
Output: YES or NO.

Constraints: 1 <= N <= 10^6

Example:
Input: 7
Output: YES

Input: 4
Output: NO`,
    testCases: [
      { input: '7', output: 'YES' },
      { input: '4', output: 'NO' },
      { input: '1', output: 'NO' },
      { input: '2', output: 'YES' },
      { input: '97', output: 'YES' }
    ]
  }
];

async function seed() {
  await Problem.deleteMany({});
  await Problem.insertMany(problems);
  console.log('✅ Seeded', problems.length, 'problems');
  mongoose.disconnect();
}

seed().catch(console.error);
