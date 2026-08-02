require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({ email: 'deonmini051@gmail.com' });
  console.log('Number of matching documents:', users.length);
  users.forEach((u, i) => {
    console.log(`\nDocument ${i + 1}:`);
    console.log('  _id:', u._id.toString());
    console.log('  password:', u.password);
  });
  process.exit();
}

run();