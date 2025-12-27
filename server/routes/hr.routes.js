const express = require('express');
const pool = require('../db');
const requireRole = require('../middleware/requireRole');
const { toCsv } = require('../utils/csv');

const router = express.Router();

router.use(requireRole('HRStaff'));

// Employees (Employee role only)
router.get('/employees', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, username, fullName, department, position, bankInfo, isActive
       FROM EmployeeUser
       WHERE role = 'Employee'
       ORDER BY id DESC`
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

router.put('/employees/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, department, position, bankInfo, isActive } = req.body;
    const updates = [];
    const values = [];

    if (fullName !== undefined) {
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
    const [result] = await pool.query(
      `UPDATE EmployeeUser SET ${updates.join(', ')}
       WHERE id = ? AND role = 'Employee'`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    return res.json({ message: 'Employee updated' });
  } catch (err) {
    return next(err);
  }
});

// Salary details
router.get('/salary/:employeeId', async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const [rows] = await pool.query(
      `SELECT employeeId, basicPay, housingAllowance, transportAllowance,
              taxDeductionRate, insuranceDeductionRate
       FROM SalaryDetails WHERE employeeId = ?`,
      [employeeId]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Salary details not found' });
    }
    return res.json(rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.post('/salary/:employeeId', async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const {
      basicPay,
      housingAllowance = 0,
      transportAllowance = 0,
      taxDeductionRate = 0,
      insuranceDeductionRate = 0
    } = req.body;

    if (basicPay === undefined) {
      return res.status(400).json({ message: 'basicPay is required' });
    }

    const [existing] = await pool.query('SELECT employeeId FROM SalaryDetails WHERE employeeId = ?', [employeeId]);
    if (existing.length) {
      return res.status(409).json({ message: 'Salary details already exist' });
    }

    await pool.query(
      `INSERT INTO SalaryDetails
       (employeeId, basicPay, housingAllowance, transportAllowance, taxDeductionRate, insuranceDeductionRate)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [employeeId, basicPay, housingAllowance, transportAllowance, taxDeductionRate, insuranceDeductionRate]
    );
    return res.status(201).json({ message: 'Salary details created' });
  } catch (err) {
    return next(err);
  }
});

router.put('/salary/:employeeId', async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const {
      basicPay,
      housingAllowance,
      transportAllowance,
      taxDeductionRate,
      insuranceDeductionRate
    } = req.body;

    const updates = [];
    const values = [];

    if (basicPay !== undefined) {
      updates.push('basicPay = ?');
      values.push(basicPay);
    }
    if (housingAllowance !== undefined) {
      updates.push('housingAllowance = ?');
      values.push(housingAllowance);
    }
    if (transportAllowance !== undefined) {
      updates.push('transportAllowance = ?');
      values.push(transportAllowance);
    }
    if (taxDeductionRate !== undefined) {
      updates.push('taxDeductionRate = ?');
      values.push(taxDeductionRate);
    }
    if (insuranceDeductionRate !== undefined) {
      updates.push('insuranceDeductionRate = ?');
      values.push(insuranceDeductionRate);
    }

    if (!updates.length) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(employeeId);
    const [result] = await pool.query(
      `UPDATE SalaryDetails SET ${updates.join(', ')} WHERE employeeId = ?`,
      values
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Salary details not found' });
    }
    return res.json({ message: 'Salary details updated' });
  } catch (err) {
    return next(err);
  }
});

// Pay periods
router.get('/payperiods', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT periodId, startDate, endDate, status FROM PayPeriod ORDER BY startDate DESC'
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

router.post('/payperiods', async (req, res, next) => {
  try {
    const { startDate, endDate, status = 'OPEN' } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }
    const [result] = await pool.query(
      'INSERT INTO PayPeriod (startDate, endDate, status) VALUES (?, ?, ?)',
      [startDate, endDate, status]
    );
    return res.status(201).json({ periodId: result.insertId });
  } catch (err) {
    return next(err);
  }
});

router.patch('/payperiods/:periodId/status', async (req, res, next) => {
  try {
    const { periodId } = req.params;
    const { status } = req.body;
    const allowed = ['OPEN', 'PROCESSING', 'CLOSED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const [result] = await pool.query('UPDATE PayPeriod SET status = ? WHERE periodId = ?', [status, periodId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pay period not found' });
    }
    return res.json({ message: 'Status updated' });
  } catch (err) {
    return next(err);
  }
});

// Payslip generation
router.post('/payslips/generate', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { employeeId, periodId } = req.body;
    if (!employeeId || !periodId) {
      connection.release();
      return res.status(400).json({ message: 'employeeId and periodId are required' });
    }

    const [[salary]] = await connection.query(
      `SELECT basicPay, housingAllowance, transportAllowance, taxDeductionRate, insuranceDeductionRate
       FROM SalaryDetails WHERE employeeId = ?`,
      [employeeId]
    );
    if (!salary) {
      connection.release();
      return res.status(400).json({ message: 'Salary details missing for employee' });
    }

    const grossPay = Number(salary.basicPay);
    const totalAllowances = Number(salary.housingAllowance) + Number(salary.transportAllowance);
    const taxableAmount = grossPay + totalAllowances;
    const taxDeduction = taxableAmount * (Number(salary.taxDeductionRate) / 100);
    const insuranceDeduction = taxableAmount * (Number(salary.insuranceDeductionRate) / 100);
    const totalDeductions = taxDeduction + insuranceDeduction;
    const netSalary = taxableAmount - totalDeductions;

    await connection.query(
      `INSERT INTO Payslip
       (employeeId, periodId, grossPay, totalAllowances, totalDeductions, netSalary, generationDate, status)
       VALUES (?, ?, ?, ?, ?, ?, CURDATE(), 'DRAFT')
       ON DUPLICATE KEY UPDATE
         grossPay = VALUES(grossPay),
         totalAllowances = VALUES(totalAllowances),
         totalDeductions = VALUES(totalDeductions),
         netSalary = VALUES(netSalary),
         generationDate = VALUES(generationDate),
         status = 'DRAFT'`,
      [employeeId, periodId, grossPay, totalAllowances, totalDeductions, netSalary]
    );

    connection.release();
    return res.status(201).json({
      employeeId,
      periodId,
      grossPay,
      totalAllowances,
      totalDeductions,
      netSalary,
      status: 'DRAFT'
    });
  } catch (err) {
    connection.release();
    return next(err);
  }
});

router.get('/payslips', async (req, res, next) => {
  try {
    const { periodId } = req.query;
    const conditions = [];
    const values = [];
    if (periodId) {
      conditions.push('p.periodId = ?');
      values.push(periodId);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT p.payslipId, p.employeeId, e.fullName, e.department, p.periodId,
              p.grossPay, p.totalAllowances, p.totalDeductions, p.netSalary,
              p.status, p.generationDate
       FROM Payslip p
       JOIN EmployeeUser e ON e.id = p.employeeId
       ${where}
       ORDER BY p.generationDate DESC`,
      values
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

// Advance requests
router.get('/advance/pending', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.requestId, a.requestDate, a.amount, a.reason, a.status, a.employeeId,
              e.fullName, e.department
       FROM AdvanceRequest a
       JOIN EmployeeUser e ON e.id = a.employeeId
       WHERE a.status = 'PENDING'
       ORDER BY a.requestDate DESC`
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

router.patch('/advance/:requestId', async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Status must be APPROVED or REJECTED' });
    }
    const [result] = await pool.query(
      'UPDATE AdvanceRequest SET status = ? WHERE requestId = ?',
      [status, requestId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }
    return res.json({ message: 'Advance request updated' });
  } catch (err) {
    return next(err);
  }
});

// Reports
router.post('/reports/custom', async (req, res, next) => {
  try {
    const {
      type,
      periodId,
      startDate,
      endDate,
      employeeId,
      department,
      payslipStatus,
      advanceStatus
    } = req.body || {};

    const payslipCond = [];
    const payslipVals = [];
    if (periodId) { payslipCond.push('p.periodId = ?'); payslipVals.push(periodId); }
    if (startDate) { payslipCond.push('pp.startDate >= ?'); payslipVals.push(startDate); }
    if (endDate) { payslipCond.push('pp.endDate <= ?'); payslipVals.push(endDate); }
    if (employeeId) { payslipCond.push('p.employeeId = ?'); payslipVals.push(employeeId); }
    if (department) { payslipCond.push('eu.department = ?'); payslipVals.push(department); }
    if (payslipStatus) { payslipCond.push('p.status = ?'); payslipVals.push(payslipStatus); }

    const payslipWhere = payslipCond.length ? `WHERE ${payslipCond.join(' AND ')}` : '';
    const [payslips] = await pool.query(
      `SELECT p.payslipId, p.employeeId, eu.fullName, eu.department, p.periodId,
              p.grossPay, p.totalAllowances, p.totalDeductions, p.netSalary, p.status, p.generationDate
       FROM Payslip p
       JOIN EmployeeUser eu ON eu.id = p.employeeId
       JOIN PayPeriod pp ON pp.periodId = p.periodId
       ${payslipWhere}`,
      payslipVals
    );

    const advanceCond = [];
    const advanceVals = [];
    if (startDate) { advanceCond.push('a.requestDate >= ?'); advanceVals.push(startDate); }
    if (endDate) { advanceCond.push('a.requestDate <= ?'); advanceVals.push(endDate); }
    if (employeeId) { advanceCond.push('a.employeeId = ?'); advanceVals.push(employeeId); }
    if (department) { advanceCond.push('eu.department = ?'); advanceVals.push(department); }
    if (advanceStatus) { advanceCond.push('a.status = ?'); advanceVals.push(advanceStatus); }

    const advanceWhere = advanceCond.length ? `WHERE ${advanceCond.join(' AND ')}` : '';
    const [advances] = await pool.query(
      `SELECT a.requestId, a.employeeId, eu.fullName, eu.department, a.amount, a.status, a.requestDate
       FROM AdvanceRequest a
       JOIN EmployeeUser eu ON eu.id = a.employeeId
       ${advanceWhere}`,
      advanceVals
    );

    const summary = {
      totalEmployees: new Set(payslips.map((p) => p.employeeId)).size,
      totalNetSalary: payslips.reduce((sum, p) => sum + Number(p.netSalary || 0), 0),
      totalDeductions: payslips.reduce((sum, p) => sum + Number(p.totalDeductions || 0), 0),
      totalAdvanceAmount: advances.reduce((sum, a) => sum + Number(a.amount || 0), 0)
    };

    const result = {};
    if (!type || type === 'payslip') result.payslips = payslips;
    if (!type || type === 'advance') result.advances = advances;
    result.summary = summary;

    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

router.post('/reports/export', async (req, res, next) => {
  try {
    const { periodId, startDate, endDate, employeeId, department, payslipStatus } = req.body || {};
    const cond = [];
    const vals = [];
    if (periodId) { cond.push('p.periodId = ?'); vals.push(periodId); }
    if (startDate) { cond.push('pp.startDate >= ?'); vals.push(startDate); }
    if (endDate) { cond.push('pp.endDate <= ?'); vals.push(endDate); }
    if (employeeId) { cond.push('p.employeeId = ?'); vals.push(employeeId); }
    if (department) { cond.push('eu.department = ?'); vals.push(department); }
    if (payslipStatus) { cond.push('p.status = ?'); vals.push(payslipStatus); }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT p.payslipId, p.employeeId, eu.fullName, eu.department, p.periodId,
              p.grossPay, p.totalAllowances, p.totalDeductions, p.netSalary, p.status, p.generationDate
       FROM Payslip p
       JOIN EmployeeUser eu ON eu.id = p.employeeId
       JOIN PayPeriod pp ON pp.periodId = p.periodId
       ${where}`,
      vals
    );

    const csv = toCsv(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=\"payslips.csv\"');
    return res.send(csv);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
