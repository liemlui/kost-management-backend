const { query } = require('../../../db/pool');
const sql = require('../kost.sql');

async function listOverdueStaysHPlus7() {
  return query(
    sql.listOverdueStaysHPlus7,
    [],
    'kost.listOverdueStaysHPlus7'
  );
}

module.exports = {
  listOverdueStaysHPlus7,
};
