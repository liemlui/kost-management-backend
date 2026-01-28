const repo = require("../../repos/inventory/inventoryMovements.repo");

const MOVEMENT_TYPES = ["PURCHASE", "USE", "TRANSFER", "ADJUST", "DISPOSAL", "REPAIR"];
const ADJUST_DIRECTIONS = ["IN", "OUT"];

function toIntOrNull(v) {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toNumOrNull(v) {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalize(body) {
  return {
    item_id: toIntOrNull(body.item_id),
    movement_type: (body.movement_type || "").trim(),
    qty: toNumOrNull(body.qty),
    unit_cost: toNumOrNull(body.unit_cost),
    from_location_id: toIntOrNull(body.from_location_id),
    to_location_id: toIntOrNull(body.to_location_id),
    adjust_direction: (body.adjust_direction || "").trim(), // IN/OUT (untuk ADJUST)
    condition_after: body.condition_after?.trim() || null,
    notes: body.notes?.trim() || null,
    source: "MANUAL",
    finance_txn_id: null,
  };
}

function validate(p) {
  const errors = [];

  if (!p.item_id) errors.push("Item wajib dipilih.");
  if (!MOVEMENT_TYPES.includes(p.movement_type)) errors.push("Movement type tidak valid.");
  if (!p.qty || p.qty <= 0) errors.push("Qty harus > 0.");

  // Rules per type
  if (p.movement_type === "PURCHASE") {
    if (!p.to_location_id) errors.push("To location wajib diisi untuk PURCHASE.");
    if (p.unit_cost === null || p.unit_cost <= 0) errors.push("Unit cost wajib (>0) untuk PURCHASE.");
  }

  if (p.movement_type === "USE" || p.movement_type === "DISPOSAL") {
    if (!p.from_location_id) errors.push("From location wajib diisi untuk USE/DISPOSAL.");
  }

  if (p.movement_type === "TRANSFER") {
    if (!p.from_location_id) errors.push("From location wajib diisi untuk TRANSFER.");
    if (!p.to_location_id) errors.push("To location wajib diisi untuk TRANSFER.");
    if (p.from_location_id && p.to_location_id && p.from_location_id === p.to_location_id) {
      errors.push("From dan To location tidak boleh sama.");
    }
  }

  if (p.movement_type === "ADJUST") {
    if (!ADJUST_DIRECTIONS.includes(p.adjust_direction)) errors.push("Adjust direction wajib (IN/OUT).");
    if (p.adjust_direction === "IN" && !p.to_location_id) errors.push("To location wajib untuk ADJUST IN.");
    if (p.adjust_direction === "OUT" && !p.from_location_id) errors.push("From location wajib untuk ADJUST OUT.");
  }

  if (p.movement_type === "REPAIR") {
    // v1: treat as TRANSFER to repair location (lebih rapi daripada log tanpa lokasi)
    if (!p.from_location_id) errors.push("From location wajib untuk REPAIR.");
    if (!p.to_location_id) errors.push("To location (repair) wajib untuk REPAIR.");
  }

  return errors;
}

function flagsForBalance(p) {
  // menentukan apakah perlu OUT/IN ke balances
  if (p.movement_type === "PURCHASE") return { _in: true, _out: false };
  if (p.movement_type === "USE") return { _in: false, _out: true };
  if (p.movement_type === "DISPOSAL") return { _in: false, _out: true };
  if (p.movement_type === "TRANSFER") return { _in: true, _out: true };
  if (p.movement_type === "REPAIR") return { _in: true, _out: true };
  if (p.movement_type === "ADJUST") {
    return p.adjust_direction === "IN" ? { _in: true, _out: false } : { _in: false, _out: true };
  }
  return { _in: false, _out: false };
}

async function index(req, res, next) {
  try {
    const filter = {
      item_id: req.query.item_id || null,
      movement_type: req.query.movement_type || null,
    };

    const [items, movements] = await Promise.all([
      repo.listActiveItems(),
      repo.listMovements(filter),
    ]);

    res.render("kost/inventory/movements/index", {
      title: "Inventory Movements",
      items,
      movements,
      movementTypes: MOVEMENT_TYPES,
      query: req.query,
    });
  } catch (err) {
    next(err);
  }
}

async function showNewForm(req, res, next) {
  try {
    const [items, locations] = await Promise.all([
      repo.listActiveItems(),
      repo.listActiveLocations(),
    ]);

    res.render("kost/inventory/movements/form", {
      title: "New Inventory Movement",
      items,
      locations,
      movementTypes: MOVEMENT_TYPES,
      adjustDirections: ADJUST_DIRECTIONS,
      form: {
        item_id: "",
        movement_type: "PURCHASE",
        qty: "",
        unit_cost: "",
        from_location_id: "",
        to_location_id: "",
        adjust_direction: "IN",
        condition_after: "",
        notes: "",
      },
      errors: [],
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const p = normalize(req.body);
    const errors = validate(p);

    const [items, locations] = await Promise.all([
      repo.listActiveItems(),
      repo.listActiveLocations(),
    ]);

    if (errors.length) {
      return res.status(400).render("kost/inventory/movements/form", {
        title: "New Inventory Movement",
        items,
        locations,
        movementTypes: MOVEMENT_TYPES,
        adjustDirections: ADJUST_DIRECTIONS,
        form: req.body,
        errors,
      });
    }

    const { _in, _out } = flagsForBalance(p);

    const txPayload = { ...p, _in, _out };

    await repo.createMovementTx(txPayload);

    return res.redirect("/admin/kost/inventory/movements");
  } catch (err) {
    if (err && err.status === 400) {
      try {
        const [items, locations] = await Promise.all([
          repo.listActiveItems(),
          repo.listActiveLocations(),
        ]);

        return res.status(400).render("kost/inventory/movements/form", {
          title: "New Inventory Movement",
          items,
          locations,
          movementTypes: MOVEMENT_TYPES,
          adjustDirections: ADJUST_DIRECTIONS,
          form: req.body,
          errors: [err.message],
        });
      } catch (e2) {
        return next(e2);
      }
    }

    return next(err);
  }
}


module.exports = {
  index,
  showNewForm,
  create,
};
