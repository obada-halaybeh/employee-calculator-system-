const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { comparePassword } = require('../utils/password');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'username and password are required' });
    }

    const [rows] = await pool.query(
      'SELECT id, username, password, role, isActive, fullName FROM EmployeeUser WHERE username = ? LIMIT 1',
      [username]
    );

    const user = rows[0];
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = { id: user.id, username: user.username, role: user.role, fullName: user.fullName };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });
    return res.json({ token, user: payload });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
