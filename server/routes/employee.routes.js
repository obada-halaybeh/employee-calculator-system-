const express = require('express');
const pool = require('../db');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.use(requireRole('Employee'));

router.get('/me', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT id, username, role, fullName, department, position, bankInfo, isActive
       FROM EmployeeUser WHERE id = ?`,
      [userId]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.get('/payslips', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT p.payslipId, p.periodId, pp.startDate, pp.endDate,
              p.grossPay, p.totalAllowances, p.totalDeductions, p.netSalary,
              p.generationDate
       FROM Payslip p
       JOIN PayPeriod pp ON pp.periodId = p.periodId
       WHERE p.employeeId = ?
       ORDER BY p.generationDate DESC`,
      [userId]
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

router.get('/payslips/:payslipId', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { payslipId } = req.params;
    const [rows] = await pool.query(
      `SELECT p.payslipId, p.periodId, pp.startDate, pp.endDate,
              p.grossPay, p.totalAllowances, p.totalDeductions, p.netSalary,
              p.generationDate
       FROM Payslip p
       JOIN PayPeriod pp ON pp.periodId = p.periodId
       WHERE p.payslipId = ? AND p.employeeId = ?`,
      [payslipId, userId]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Payslip not found' });
    }
    return res.json(rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.post('/advance', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount, reason } = req.body;
    if (!amount) {
      return res.status(400).json({ message: 'amount is required' });
    }
    const [result] = await pool.query(
      `INSERT INTO AdvanceRequest (employeeId, requestDate, amount, reason, status)
       VALUES (?, CURDATE(), ?, ?, 'PENDING')`,
      [userId, amount, reason || null]
    );
    return res.status(201).json({ requestId: result.insertId, status: 'PENDING' });
  } catch (err) {
    return next(err);
  }
});

router.get('/advance', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT requestId, requestDate, amount, reason, status
       FROM AdvanceRequest
       WHERE employeeId = ?
       ORDER BY requestDate DESC`,
      [userId]
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

router.delete('/advance/:requestId', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;
    const [result] = await pool.query(
      `DELETE FROM AdvanceRequest
       WHERE requestId = ? AND employeeId = ? AND status = 'PENDING'`,
      [requestId, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pending request not found' });
    }
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
