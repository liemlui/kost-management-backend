const repo = require("../../repos/inventory/inventoryAnalytics.repo");
const { toNumOrZero } = require("../../../../shared/parsers");

async function index(req, res, next) {
  try {
    const [stockRows, usageRows, topUsed] = await Promise.all([
      repo.stockByItem(),
      repo.usageLast30Days(),
      repo.topUsedLast30Days(),
    ]);

    const usageMap = new Map();
    usageRows.forEach((r) => usageMap.set(Number(r.item_id), toNumOrZero(r.total_use_30d)));

    const analytics = stockRows.map((r) => {
      const totalStock = toNumOrZero(r.total_qty_on_hand);
      const totalUse30d = usageMap.get(Number(r.id)) || 0;
      const avgDailyUse = totalUse30d / 30;

      const daysOfStock = avgDailyUse > 0 ? Math.floor(totalStock / avgDailyUse) : null;

      const reorderPoint = r.reorder_point == null ? null : toNumOrZero(r.reorder_point);
      const isLowStock = reorderPoint != null ? totalStock <= reorderPoint : false;

      const reorderQty = r.reorder_qty == null ? null : toNumOrZero(r.reorder_qty);
      const suggestedQty = avgDailyUse > 0 ? Math.ceil(avgDailyUse * 14) : null;

      const suggestedReorderQty = isLowStock
        ? (reorderQty != null && suggestedQty != null
          ? Math.max(reorderQty, suggestedQty)
          : reorderQty ?? suggestedQty)
        : null;

      return {
        ...r,
        totalStock,
        totalUse30d,
        avgDailyUse,
        daysOfStock,
        isLowStock,
        suggestedReorderQty,
      };
    });

    const reorderSuggestions = analytics
      .filter((x) => x.isLowStock)
      .sort((a, b) => (a.daysOfStock ?? 999999) - (b.daysOfStock ?? 999999));

    res.render("kost/inventory/analytics/index", {
      title: "Inventory Analytics",
      topUsed,
      reorderSuggestions,
      analytics,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { index };
