const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

const TIME_LIMIT_MS = 5000;
const MEMORY_LIMIT_MB = 256;

// Docker images per language
const DOCKER_IMAGES = {
  cpp:    'gcc:latest',
  python: 'python:3.11-slim',
  java:   'eclipse-temurin:17-jdk-jammy'
};

// File extensions and filenames
const FILE_CONFIG = {
  cpp:    { filename: 'solution.cpp',  compile: true  },
  python: { filename: 'solution.py',   compile: false },
  java:   { filename: 'Solution.java', compile: true  } // overridden per-submission for java, see detectJavaClassName()
};

// Java reserved words can never legally be a class name — if one somehow
// ended up here (shouldn't happen given the regex below, but validate
// explicitly rather than trust the match blindly, since this string gets
// interpolated directly into shell commands).
const JAVA_RESERVED_WORDS = new Set([
  'abstract','assert','boolean','break','byte','case','catch','char','class',
  'const','continue','default','do','double','else','enum','extends','final',
  'finally','float','for','goto','if','implements','import','instanceof','int',
  'interface','long','native','new','package','private','protected','public',
  'return','short','static','strictfp','super','switch','synchronized','this',
  'throw','throws','transient','try','void','volatile','while','true','false','null'
]);

// A valid Java identifier: starts with a letter/_/$, followed by
// letters/digits/_/$, capped at a sane length. Re-checked explicitly (not
// just relied on via the extraction regex) so this function is safe to
// trust on its own if ever reused elsewhere.
function isValidJavaIdentifier(name) {
  return (
    typeof name === 'string' &&
    name.length > 0 &&
    name.length <= 100 &&
    /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) &&
    !JAVA_RESERVED_WORDS.has(name)
  );
}

// Java requires the filename to exactly match the public class name, so a
// hardcoded "Solution.java" only worked if the user happened to name their
// class Solution. This detects whatever the user actually named their
// public class, validates it's a real, safe identifier, and falls back to
// "Main" if none is found or the extracted name fails validation — so
// submissions using `public class Main`, `public class Foo`, etc. all
// compile correctly, matching how real judges (Codeforces, HackerRank)
// behave, without trusting unvalidated input into shell commands.
function detectJavaClassName(code) {
  const match = code.match(/public\s+class\s+([A-Za-z_$][A-Za-z0-9_$]*)/);
  const candidate = match ? match[1] : null;
  return candidate && isValidJavaIdentifier(candidate) ? candidate : 'Main';
}

// FIX: the container mounts /code read-only (so a submission can't tamper
// with the host filesystem it's mounted from), but that means g++/javac
// have nowhere to write compiled output if we ask them to write into /code.
// The previous version tried to compile straight into /code, which fails
// every time for cpp/java (Read-only file system) — only python ever
// actually worked. The fix: give the container a second tmpfs mount,
// /workdir, that IS writable and executable, copy the source there, and
// compile/run from there instead. /code stays read-only and is only used
// to read the original source + the test case input.
function buildCompileCommand(language, containerName, javaClassName) {
  switch (language) {
    case 'cpp':
      return `docker exec ${containerName} sh -c "cp /code/solution.cpp /workdir/solution.cpp && g++ -O2 -o /workdir/solution /workdir/solution.cpp" 2>&1`;
    case 'java':
      return `docker exec ${containerName} sh -c "cp /code/${javaClassName}.java /workdir/${javaClassName}.java && javac -d /workdir /workdir/${javaClassName}.java" 2>&1`;
    case 'python':
      return null; // no compile step
  }
}

function getRunCmd(language, javaClassName) {
  switch (language) {
    case 'cpp':    return '/workdir/solution';
    case 'java':   return `java -cp /workdir ${javaClassName}`;
    case 'python': return 'python3 /code/solution.py'; // interpreted directly off the read-only mount, no exec bit needed
  }
}

async function executeCode(language, code, input) {
  const jobId = uuidv4();
  const tmpDir = path.join(os.tmpdir(), `oj_${jobId}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  // For Java, the filename on disk must match whatever public class name
  // the user actually wrote — everything downstream (compile + run
  // commands) uses this detected name instead of a hardcoded "Solution".
  const javaClassName = language === 'java' ? detectJavaClassName(code) : null;
  const filename = language === 'java' ? `${javaClassName}.java` : FILE_CONFIG[language].filename;

  const codeFile = path.join(tmpDir, filename);
  const inputFile = path.join(tmpDir, 'input.txt');

  fs.writeFileSync(codeFile, code);
  fs.writeFileSync(inputFile, input);

  const containerName = `oj_${jobId}`;
  const image = DOCKER_IMAGES[language];

  try {
    // Start container with memory limit, mount code dir read-only, and a
    // separate writable+executable tmpfs for build output.
    execSync(
      `docker run -d --name ${containerName} \
        --memory="${MEMORY_LIMIT_MB}m" \
        --memory-swap="${MEMORY_LIMIT_MB}m" \
        --cpus="0.5" \
        --network none \
        --read-only \
        --tmpfs /tmp:rw,noexec,nosuid,size=64m \
        --tmpfs /workdir:rw,exec,nosuid,size=64m \
        -v ${tmpDir}:/code:ro \
        ${image} sleep 30`,
      { timeout: 15000 }
    );

    const compileCmd = buildCompileCommand(language, containerName, javaClassName);

    // Compile if needed
    if (compileCmd) {
      try {
        execSync(compileCmd, { timeout: 15000 });
      } catch (err) {
        return { verdict: 'Compilation Error', output: err.stdout?.toString() || err.message };
      }
    }

    // Run with input
    const start = Date.now();
    let output;
    try {
      output = execSync(
        `docker exec -i ${containerName} sh -c "timeout 5 ${getRunCmd(language, javaClassName)} < /code/input.txt"`,
        { timeout: TIME_LIMIT_MS + 2000, encoding: 'utf8' }
      );
    } catch (err) {
      const timeTaken = Date.now() - start;
      if (timeTaken >= TIME_LIMIT_MS) {
        return { verdict: 'Time Limit Exceeded', output: '', timeTaken };
      }
      return { verdict: 'Runtime Error', output: err.stderr?.toString() || err.message, timeTaken };
    }

    const timeTaken = Date.now() - start;
    return { verdict: null, output: output.trim(), timeTaken };

  } finally {
    // Always clean up container
    try { execSync(`docker rm -f ${containerName}`); } catch {}
    try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
  }
}

async function judgeSubmission(language, code, testCases) {
  for (let i = 0; i < testCases.length; i++) {
    const { input, output: expectedOutput } = testCases[i];
    const result = await executeCode(language, code, input);

    if (result.verdict) {
      return { verdict: result.verdict, output: result.output, timeTaken: result.timeTaken || 0 };
    }

    if (result.output.trim() !== expectedOutput.trim()) {
      return {
        verdict: 'Wrong Answer',
        output: `Test case ${i + 1}: Expected "${expectedOutput.trim()}", Got "${result.output.trim()}"`,
        timeTaken: result.timeTaken
      };
    }
  }
  return { verdict: 'Accepted', output: 'All test cases passed', timeTaken: 0 };
}

module.exports = { judgeSubmission, executeCode };