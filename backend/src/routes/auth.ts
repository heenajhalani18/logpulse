import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export function createAuthRouter() {
  const router = Router();

  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const validUsername = process.env.ADMIN_USERNAME;
      const validPasswordHash = process.env.ADMIN_PASSWORD_HASH;

      if (username !== validUsername) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const passwordMatches = await bcrypt.compare(password, validPasswordHash || '');
      if (!passwordMatches) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { username },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '8h' }
      );

      res.json({ token });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
