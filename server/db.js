const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 8888,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "123",
  database: process.env.DB_NAME || "ems2",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

async function ensureDatabaseExists() {
  // Create the database if it is missing (uses a standalone connection without selecting a DB)
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
  await connection.end();
}

async function createTables(pool) {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS EmployeeUser (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('Admin', 'HRStaff', 'Employee') NOT NULL,
        isActive TINYINT(1) NOT NULL DEFAULT 1,
        fullName VARCHAR(255) NOT NULL,
        department VARCHAR(255),
        position VARCHAR(255),
        bankInfo TEXT
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS SalaryDetails (
        employeeId INT PRIMARY KEY,
        basicPay DECIMAL(10,2) NOT NULL,
        housingAllowance DECIMAL(10,2) NOT NULL DEFAULT 0,
        transportAllowance DECIMAL(10,2) NOT NULL DEFAULT 0,
        taxDeductionRate DECIMAL(5,2) NOT NULL DEFAULT 0,
        insuranceDeductionRate DECIMAL(5,2) NOT NULL DEFAULT 0,
        CONSTRAINT fk_salary_employee FOREIGN KEY (employeeId) REFERENCES EmployeeUser(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS PayPeriod (
        periodId INT AUTO_INCREMENT PRIMARY KEY,
        startDate DATE NOT NULL,
        endDate DATE NOT NULL,
        status ENUM('OPEN', 'PROCESSING', 'CLOSED') NOT NULL DEFAULT 'OPEN',
        UNIQUE KEY uniq_payperiod (startDate, endDate)
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS Payslip (
        payslipId INT AUTO_INCREMENT PRIMARY KEY,
        employeeId INT NOT NULL,
        periodId INT NOT NULL,
        grossPay DECIMAL(10,2) NOT NULL,
        totalAllowances DECIMAL(10,2) NOT NULL DEFAULT 0,
        totalDeductions DECIMAL(10,2) NOT NULL DEFAULT 0,
        netSalary DECIMAL(10,2) NOT NULL,
        generationDate DATE NOT NULL,
        UNIQUE KEY uniq_employee_period (employeeId, periodId),
        KEY idx_payslip_period (periodId),
        CONSTRAINT fk_payslip_employee FOREIGN KEY (employeeId) REFERENCES EmployeeUser(id) ON DELETE CASCADE,
        CONSTRAINT fk_payslip_period FOREIGN KEY (periodId) REFERENCES PayPeriod(periodId) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS AdvanceRequest (
        requestId INT AUTO_INCREMENT PRIMARY KEY,
        employeeId INT NOT NULL,
        requestDate DATE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        reason TEXT,
        status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
        KEY idx_advance_employee (employeeId),
        CONSTRAINT fk_advance_employee FOREIGN KEY (employeeId) REFERENCES EmployeeUser(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS Report (
        reportId INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(30) NOT NULL,
        content TEXT NOT NULL,
        generatedById INT NOT NULL,
        periodId INT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_report_user FOREIGN KEY (generatedById) REFERENCES EmployeeUser(id) ON DELETE CASCADE,
        CONSTRAINT fk_report_period FOREIGN KEY (periodId) REFERENCES PayPeriod(periodId) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);
  } finally {
    connection.release();
  }
}

const pool = mysql.createPool(dbConfig);

// Promise clients can await to ensure the database and tables exist
pool.ready = (async () => {
  await ensureDatabaseExists();
  await createTables(pool);
})().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Database initialization failed', err);
  throw err;
});

module.exports = pool;
