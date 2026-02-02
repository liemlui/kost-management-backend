/* public/js/kost/inventory/movements-form.js */
/* CSP-safe: no inline script */

(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function show(el) {
    if (!el) return;
    el.classList.remove("d-none");
  }

  function hide(el) {
    if (!el) return;
    el.classList.add("d-none");
  }

  function setRequired(input, yes) {
    if (!input) return;
    if (yes) input.setAttribute("required", "required");
    else input.removeAttribute("required");
  }

  function setDisabled(input, yes) {
    if (!input) return;
    input.disabled = !!yes;
  }

  function clearValue(input) {
    if (!input) return;
    // for <select> and <input>
    input.value = "";
  }

  function updateUI() {
    var typeEl = byId("movement_type");
    if (!typeEl) return;

    var movementType = String(typeEl.value || "").trim().toUpperCase();

    var unitCostWrap = byId("unitCostWrap");
    var adjustDirWrap = byId("adjustDirWrap");
    var fromWrap = byId("fromWrap");
    var toWrap = byId("toWrap");

    var unitCostInput = document.querySelector('input[name="unit_cost"]');
    var adjustDirSelect = byId("adjust_direction");
    var fromSelect = byId("from_location_id");
    var toSelect = byId("to_location_id");

    // Default: hide all optional blocks
    hide(unitCostWrap);
    hide(adjustDirWrap);
    hide(fromWrap);
    hide(toWrap);

    // Default: relax requirements
    setRequired(unitCostInput, false);
    setDisabled(adjustDirSelect, true);

    // Clear irrelevant values on type change (safe + anti salah submit)
    // Note: we DO NOT clear qty/item because always needed.
    if (movementType !== "PURCHASE") clearValue(unitCostInput);
    if (movementType !== "ADJUST") clearValue(adjustDirSelect);

    // Type-based rules
    if (movementType === "PURCHASE") {
      show(toWrap);
      show(unitCostWrap);
      setRequired(unitCostInput, true);

      // From not used
      clearValue(fromSelect);
    } else if (movementType === "USE" || movementType === "DISPOSAL") {
      show(fromWrap);

      // To not used
      clearValue(toSelect);
      clearValue(unitCostInput);
    } else if (movementType === "TRANSFER" || movementType === "REPAIR") {
      show(fromWrap);
      show(toWrap);
      clearValue(unitCostInput);
    } else if (movementType === "ADJUST") {
      show(adjustDirWrap);
      setDisabled(adjustDirSelect, false);

      var dir = String((adjustDirSelect && adjustDirSelect.value) || "").trim().toUpperCase();
      if (dir !== "IN" && dir !== "OUT") dir = "IN";
      if (adjustDirSelect) adjustDirSelect.value = dir;

      if (dir === "IN") {
        show(toWrap);
        clearValue(fromSelect);
      } else {
        show(fromWrap);
        clearValue(toSelect);
      }

      clearValue(unitCostInput);
    } else {
      // unknown type: show nothing extra
      clearValue(fromSelect);
      clearValue(toSelect);
      clearValue(unitCostInput);
    }
  }

  function init() {
    var typeEl = byId("movement_type");
    var dirEl = byId("adjust_direction");
    if (!typeEl) return;

    typeEl.addEventListener("change", updateUI);
    if (dirEl) dirEl.addEventListener("change", updateUI);

    // initial render (for default selected + validation rerender)
    updateUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
