const { stringify } = require('csv-stringify/sync');

function toCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const header = Object.keys(rows[0]);
  return stringify(rows, { header: true, columns: header });
}

module.exports = { toCsv };
