// pwe/backend/src/modules/kost/sql/inventory/index.js

module.exports = {
    ...require("./inventoryItems.sql.js"),
    ...require("./inventoryMovements.sql.js"),
    ...require("./inventoryAnalytics.sql.js"),
    ...require("./inventoryLocations.sql.js"),
    ...require("./inventoryBalances.sql.js"),
};
