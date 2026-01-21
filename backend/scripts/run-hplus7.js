const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

const { runHPlus7OverdueCheck } = require("../src/modules/kost/services/overdue.service");

(async () => {
  try {
    const result = await runHPlus7OverdueCheck({ actor_id: 1 });
    console.log("H+7 Overdue Check Result:", result);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
