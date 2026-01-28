// modules/kost/controllers/inventory/inventoryBalances.controller.js
const balancesRepo = require("../../repos/inventory/inventoryBalances.repo");
const itemsRepo = require("../../repos/inventory/inventoryItems.repo");
const locationsRepo = require("../../repos/inventory/inventoryLocations.repo");

async function index(req, res, next) {
  try {
    const filters = {
      item_id: req.query.item_id || null,
      location_id: req.query.location_id || null,
      only_low: req.query.only_low || null,
      only_zero: req.query.only_zero || null,
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
