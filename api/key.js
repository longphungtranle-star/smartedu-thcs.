module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  const key = process.env.GEMINI_API_KEY || '';
  res.status(200).json({ key });
};
