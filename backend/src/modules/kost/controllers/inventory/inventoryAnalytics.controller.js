const repo = require("../../repos/inventory/inventoryAnalytics.repo");

function n(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

async function index(req, res, next) {
  try {
    const [stockRows, usageRows, topUsed] = await Promise.all([
      repo.stockByItem(),
      repo.usageLast30Days(),
      repo.topUsedLast30Days(),
    ]);

    const usageMap = new Map();
    usageRows.forEach(r => usageMap.set(Number(r.item_id), n(r.total_use_30d)));

    const analytics = stockRows.map(r => {
      const totalStock = n(r.total_qty_on_hand);
      const totalUse30d = usageMap.get(Number(r.id)) || 0;
      const avgDailyUse = totalUse30d / 30;

      const daysOfStock =
        avgDailyUse > 0 ? Math.floor(totalStock / avgDailyUse) : null;

      const reorderPoint = r.reorder_point == null ? null : n(r.reorder_point);
      const isLowStock =
        reorderPoint != null ? totalStock <= reorderPoint : false;

      // reorder suggestion: kalau low stock dan ada usage, sarankan reorder = max(reorder_qty, 14 hari kebutuhan)
      const reorderQty = r.reorder_qty == null ? null : n(r.reorder_qty);
      const suggestedQty =
        avgDailyUse > 0 ? Math.ceil(avgDailyUse * 14) : null;

      const suggestedReorderQty = isLowStock
        ? (reorderQty != null && suggestedQty != null
            ? Math.max(reorderQty, suggestedQty)
            : (reorderQty ?? suggestedQty))
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

    // reorder list: low stock dulu, lalu paling sedikit daysOfStock
    const reorderSuggestions = analytics
      .filter(x => x.isLowStock)
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
