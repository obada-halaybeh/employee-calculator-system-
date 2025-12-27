require('dotenv').config();
const pool = require('./db');
const { hashPassword } = require('./utils/password');

async function seedAdmin() {
  const connection = await pool.getConnection();
  try {
    const [admins] = await connection.query(
      "SELECT id FROM EmployeeUser WHERE role = 'Admin' LIMIT 1"
    );
    if (admins.length) {
      // eslint-disable-next-line no-console
      console.log('Admin user already exists. Skipping seed.');
      return;
    }
    const passwordHash = await hashPassword('admin123');
    await connection.query(
      `INSERT INTO EmployeeUser (username, password, role, isActive, fullName, department, position, bankInfo)
       VALUES (?, ?, 'Admin', 1, 'System Admin', NULL, NULL, NULL)`,
      ['admin', passwordHash]
    );
    // eslint-disable-next-line no-console
    console.log('Default admin created: username=admin password=admin123');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Seed failed', err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

seedAdmin();
