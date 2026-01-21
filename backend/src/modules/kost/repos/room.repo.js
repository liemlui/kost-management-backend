const { query } = require('../../../db/pool');
const sql = require('../kost.sql');

async function blockRoom(roomId) {
  return query(
    sql.blockRoom,
    [roomId],
    'kost.blockRoom'
  );
}

async function unblockRoom(roomId) {
  return query(
    sql.unblockRoom,
    [roomId],
    'kost.unblockRoom'
  );
}
async function getRoomById(roomId) {
  return query(sql.getRoomById, [roomId], "kost.getRoomById");
}


module.exports = {
  blockRoom,
  unblockRoom,
    getRoomById,
};
