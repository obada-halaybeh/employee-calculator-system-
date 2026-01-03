require('dotenv').config();
const pool = require('../db');
const { hashPassword } = require('../utils/password');

async function seedEmployees(total = 1000) {
  if (pool.ready) {
    await pool.ready;
  }

  const connection = await pool.getConnection();
  try {
    const passwordHash = await hashPassword('employee123');
    const values = [];
    for (let i = 1; i <= total; i += 1) {
      const username = `employee${String(i).padStart(4, '0')}`;
      const fullName = `Employee ${i}`;
      const department = `Dept ${((i - 1) % 10) + 1}`;
      const position = `Staff ${(i % 5) + 1}`;
      values.push([
        username,
        passwordHash,
        'Employee',
        1,
        fullName,
        department,
        position,
        null
      ]);
    }

    const placeholders = values.map(() => '(?,?,?,?,?,?,?,?)').join(',');
    const flatValues = values.flat();
    const [result] = await connection.query(
      `INSERT IGNORE INTO EmployeeUser (username, password, role, isActive, fullName, department, position, bankInfo)
       VALUES ${placeholders}`,
      flatValues
    );

    // eslint-disable-next-line no-console
    console.log(`Seed complete. Attempted: ${total}, Inserted: ${result.affectedRows}, Skipped (existing): ${total - result.affectedRows}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Employee seeding failed', err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

seedEmployees().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
