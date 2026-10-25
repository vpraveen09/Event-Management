const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const attempts = new Map();

function keyFor(req) {
  const username = (req.body?.username || "").toLowerCase();
  return `${req.ip}:${username}`;
}

function loginRateLimit(req, res, next) {
  const key = keyFor(req);
  const now = Date.now();
  const entry = attempts.get(key);

  if (entry && now - entry.firstAttempt < WINDOW_MS && entry.count >= MAX_ATTEMPTS) {
    const retryAfterMin = Math.ceil((WINDOW_MS - (now - entry.firstAttempt)) / 60000);
    return res.status(429).json({ error: `Too many login attempts. Try again in ${retryAfterMin} minute(s).` });
  }

  res.on("finish", () => {
    if (res.statusCode === 401) {
      const current = attempts.get(key);
      if (current && now - current.firstAttempt < WINDOW_MS) {
        current.count += 1;
      } else {
        attempts.set(key, { count: 1, firstAttempt: now });
      }
    } else if (res.statusCode === 200) {
      attempts.delete(key);
    }
  });

  next();
}

module.exports = { loginRateLimit };
