const app = require('../server/src/index');
const connectDB = require('../server/src/utils/db');

// Vercel serverless function wrapper
module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
