// modules/kost/sql/ops/audit.sql.js
module.exports = {
  insertAuditLog: `
    INSERT INTO kost.audit_log
      (actor_id, action, entity_type, entity_id, before_json, after_json)
    VALUES
      ($1, $2, $3, $4, $5, $6);
  `,
};
