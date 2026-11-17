const https = require('https');

module.exports = (req, res) => {
  const text = req.query.text || '';
  const lang = req.query.lang || 'vi';

  if (!text || typeof text !== 'string') {
    return res.status(400).send('Missing text parameter');
  }

  // Cắt ngắn nếu quá dài
  const cleanText = text.slice(0, 200).trim();
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  };

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  https.get(url, options, (stream) => {
    if (stream.statusCode === 200) {
      stream.pipe(res);
    } else {
      res.status(stream.statusCode || 500).send('TTS upstream error');
    }
  }).on('error', (err) => {
    res.status(500).send(err.message || 'Error fetching TTS');
  });
};
