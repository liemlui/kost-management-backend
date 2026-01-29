const inventoryRepo = require("../../repos/inventory/inventoryItems.repo");
const { toNumOrNull, toBool, toNullIfEmpty } = require("../../../../shared/parsers");

const ITEM_TYPES = ["CONSUMABLE", "SPARE_PART", "FIXED_ASSET"];

function normalizePayload(body) {
  return {
    sku: toNullIfEmpty(body.sku),
    name: body.name?.trim(), // keep behavior: can be undefined if not provided
    category: toNullIfEmpty(body.category),
    item_type: body.item_type,
    uom: (toNullIfEmpty(body.uom) || "PCS").trim(),
    reorder_point: toNumOrNull(body.reorder_point),
    reorder_qty: toNumOrNull(body.reorder_qty),
    // preserve behavior: default true if field absent
    is_active: body.is_active === undefined ? true : toBool(body.is_active),
  };
}

function validatePayload(p) {
  const errors = [];
  if (!p.name) errors.push("Nama item wajib diisi.");
  if (!ITEM_TYPES.includes(p.item_type)) errors.push("Item type tidak valid.");
  if (p.reorder_point !== null && p.reorder_point < 0)
    errors.push("Reorder point tidak boleh negatif.");
  if (p.reorder_qty !== null && p.reorder_qty <= 0)
    errors.push("Reorder qty harus > 0.");
  return errors;
}

async function index(req, res, next) {
  try {
    const items = await inventoryRepo.listItems();
    res.render("kost/inventory/items/index", {
      title: "Inventory Items",
      items,
    });
  } catch (err) {
    next(err);
  }
}

async function showNewForm(req, res) {
  res.render("kost/inventory/items/form", {
    title: "New Inventory Item",
    form: {},
    itemTypes: ITEM_TYPES,
    errors: [],
  });
}

async function create(req, res, next) {
  try {
    const payload = normalizePayload(req.body);
    const errors = validatePayload(payload);

    if (errors.length) {
      return res.status(400).render("kost/inventory/items/form", {
        title: "New Inventory Item",
        form: req.body,
        itemTypes: ITEM_TYPES,
        errors,
      });
    }

    await inventoryRepo.insertItem(payload);
    return res.redirect("/admin/kost/inventory/items");
  } catch (err) {
    next(err);
  }
}

async function showEditForm(req, res, next) {
  try {
    const item = await inventoryRepo.getById(req.params.id);
    if (!item) return res.status(404).send("Item not found");

    res.render("kost/inventory/items/form", {
      title: "Edit Inventory Item",
      form: item,
      itemTypes: ITEM_TYPES,
      errors: [],
    });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const payload = normalizePayload(req.body);
    const errors = validatePayload(payload);

    if (errors.length) {
      return res.status(400).render("kost/inventory/items/form", {
        title: "Edit Inventory Item",
        form: { ...req.body, id: req.params.id },
        itemTypes: ITEM_TYPES,
        errors,
      });
    }

    await inventoryRepo.updateItem(req.params.id, payload);
    return res.redirect("/admin/kost/inventory/items");
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await inventoryRepo.softDelete(req.params.id);
    return res.redirect("/admin/kost/inventory/items");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  index,
  showNewForm,
  create,
  showEditForm,
  update,
  remove,
};
