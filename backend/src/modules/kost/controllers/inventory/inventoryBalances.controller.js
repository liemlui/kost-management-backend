const balancesRepo = require("../../repos/inventory/inventoryBalances.repo");
const itemsRepo = require("../../repos/inventory/inventoryItems.repo");
const locationsRepo = require("../../repos/inventory/inventoryLocations.repo");
const { toSelectIntOrNull, toBool } = require("../../../../shared/parsers");

async function index(req, res, next) {
  try {
    const filters = {
      item_id: toSelectIntOrNull(req.query.item_id),
      location_id: toSelectIntOrNull(req.query.location_id),
      only_low: toBool(req.query.only_low),
      only_zero: toBool(req.query.only_zero),
    };

    const [items, locations, balances] = await Promise.all([
      itemsRepo.listItems(),
      locationsRepo.listLocations(),
      balancesRepo.listBalances(filters),
    ]);

    res.render("kost/inventory/balances/index", {
      title: "Inventory Balances",
      items,
      locations,
      balances,
      filters,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { index };
