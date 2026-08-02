const REQUIRED_ENV_VARS = ['MONGO_URI', 'EMAIL_USER', 'EMAIL_PASS', 'JWT_SECRET', 'CLIENT_URL'];

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => {
    const value = process.env[key];
    return !value || !String(value).trim();
  });

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

module.exports = validateEnv;
