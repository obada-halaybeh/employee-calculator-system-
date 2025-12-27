const express = require('express');
const pool = require('../db');
const { hashPassword } = require('../utils/password');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.use(requireRole('Admin'));

router.get('/users', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, role, isActive, fullName, department, position, bankInfo FROM EmployeeUser ORDER BY id DESC'
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

router.post('/users', async (req, res, next) => {
  try {
    const { username, password, role, fullName, department, position, bankInfo, isActive = 1 } = req.body;
    if (!username || !password || !role || !fullName) {
      return res.status(400).json({ message: 'username, password, role, and fullName are required' });
    }
    const passwordHash = await hashPassword(password);
    const [result] = await pool.query(
      `INSERT INTO EmployeeUser (username, password, role, fullName, department, position, bankInfo, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, passwordHash, role, fullName, department || null, position || null, bankInfo || null, isActive ? 1 : 0]
    );
    return res.status(201).json({ id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Username already exists' });
    }
    return next(err);
  }
});

router.put('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      username,
      password,
      role,
      fullName,
      department,
      position,
      bankInfo,
      isActive
    } = req.body;

    const updates = [];
    const values = [];

    if (username) {
      updates.push('username = ?');
      values.push(username);
    }
    if (password) {
      const passwordHash = await hashPassword(password);
      updates.push('password = ?');
      values.push(passwordHash);
    }
    if (role) {
      updates.push('role = ?');
      values.push(role);
    }
    if (fullName) {
      updates.push('fullName = ?');
      values.push(fullName);
    }
    if (department !== undefined) {
      updates.push('department = ?');
      values.push(department || null);
    }
    if (position !== undefined) {
      updates.push('position = ?');
      values.push(position || null);
    }
    if (bankInfo !== undefined) {
      updates.push('bankInfo = ?');
      values.push(bankInfo || null);
    }
    if (isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(isActive ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    await pool.query(`UPDATE EmployeeUser SET ${updates.join(', ')} WHERE id = ?`, values);
    return res.json({ message: 'User updated' });
  } catch (err) {
    return next(err);
  }
});

router.patch('/users/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    if (isActive === undefined) {
      return res.status(400).json({ message: 'isActive is required' });
    }
    await pool.query('UPDATE EmployeeUser SET isActive = ? WHERE id = ?', [isActive ? 1 : 0, id]);
    return res.json({ message: 'Status updated' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
