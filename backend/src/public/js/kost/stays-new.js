/* global document, window, bootstrap */
(function () {
  function num(v) {
    var n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  function formatIDR(n) {
    n = Math.round(num(n));
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  var form = document.getElementById("stayForm");
  if (!form) return;

  var elRoom = document.getElementById("room_id");
  var elTenant = document.getElementById("tenant_id") || qs('select[name="tenant_id"]', form);
  var elCheckin = document.getElementById("check_in_at");
  var elPeriod = document.getElementById("rent_period");

  var elBasePrev = document.getElementById("base_rent_preview");
  var elAdditional = document.getElementById("additional_rent_amount");
  var elAdditionalReason = document.getElementById("additional_rent_reason");
  var elDiscount = document.getElementById("discount_amount");
  var elDiscountReason = document.getElementById("discount_reason");
  var elTotalPrev = document.getElementById("total_rent_preview");

  var elAutoFill = document.getElementById("preset_autofill");
  var elPresetBadge = document.getElementById("preset_mode_badge");
  var elUseAC = document.getElementById("preset_use_ac");
  var elZone = document.getElementById("preset_zone");

  var btnSave = document.getElementById("btnSave");
  var btnApprove = document.getElementById("btnApprove");
  var modalEl = document.getElementById("confirmModal");

  function getSelectedRoomData() {
    var opt = elRoom && elRoom.options ? elRoom.options[elRoom.selectedIndex] : null;
    if (!opt || !opt.value) {
      return { base: 0, zone: "BACK", roomCode: "-", roomType: "-" };
    }
    return {
      base: num(opt.dataset.base || 0),
      zone: String(opt.dataset.zone || "BACK").toUpperCase(),
      roomCode: opt.dataset.roomCode || "-",
      roomType: opt.dataset.roomType || "-"
    };
  }

  function zoneAdj(zone) {
    switch (String(zone || "").toUpperCase()) {
      case "FRONT": return 150000;
      case "MIDDLE": return 50000;
      default: return 0;
    }
  }

  function computePresetAdditional() {
    var room = getSelectedRoomData();
    var z = (elZone && elZone.value) ? elZone.value : "AUTO";
    var zoneToUse = (z === "AUTO") ? room.zone : z;

    var preset = 0;
    if (elUseAC && elUseAC.checked) preset += 300000;
    preset += zoneAdj(zoneToUse);
    return preset;
  }

  function setMode(mode) {
    if (!elPresetBadge) return;
    if (mode === "MANUAL") {
      elPresetBadge.textContent = "MANUAL";
      elPresetBadge.className = "badge text-bg-warning";
    } else {
      elPresetBadge.textContent = "AUTO";
      elPresetBadge.className = "badge text-bg-secondary";
    }
  }

  function syncDiscountReasonRule() {
    if (!elDiscount || !elDiscountReason) return;
    var hasDiscount = num(elDiscount.value) > 0;
    elDiscountReason.required = hasDiscount;
  }

  function recomputePreview(opts) {
    opts = opts || {};
    var room = getSelectedRoomData();
    var base = room.base;

    if (elBasePrev) elBasePrev.value = formatIDR(base);

    if (opts.applyPreset && elAutoFill && elAutoFill.checked && elAdditional) {
      elAdditional.value = String(computePresetAdditional());
      setMode("AUTO");
    }

    var additional = elAdditional ? num(elAdditional.value) : 0;
    var discount = elDiscount ? num(elDiscount.value) : 0;

    var total = base + additional - discount;
    if (total < 0) total = 0;

    if (elTotalPrev) elTotalPrev.value = formatIDR(total);
  }

  function fillSummary() {
    var room = getSelectedRoomData();

    var tenantOpt = elTenant && elTenant.options ? elTenant.options[elTenant.selectedIndex] : null;
    var tenantName = (tenantOpt && tenantOpt.value) ? tenantOpt.text : "-";

    var base = room.base;
    var additional = elAdditional ? num(elAdditional.value) : 0;
    var discount = elDiscount ? num(elDiscount.value) : 0;

    var total = base + additional - discount;
    if (total < 0) total = 0;

    function set(id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text;
    }

    set("sum_tenant", tenantName);
    set("sum_room", room.roomCode + " — " + room.roomType);
    set("sum_checkin", (elCheckin && elCheckin.value) ? elCheckin.value : "-");
    set("sum_period", (elPeriod && elPeriod.value) ? elPeriod.value : "-");

    set("sum_base", "Rp " + formatIDR(base));
    set("sum_additional", "Rp " + formatIDR(additional));
    set("sum_discount", "Rp " + formatIDR(discount));
    set("sum_total", "Rp " + formatIDR(total));

    set("sum_additional_reason", (elAdditionalReason && elAdditionalReason.value) ? elAdditionalReason.value : "-");
    set("sum_discount_reason", (elDiscountReason && elDiscountReason.value) ? elDiscountReason.value : "-");
  }

  function showModal() {
    if (!modalEl) return;
    var modal = window.bootstrap && window.bootstrap.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(modalEl)
      : null;
    if (modal) modal.show();
  }

  // =========================
  // Events
  // =========================
  if (elRoom) elRoom.addEventListener("change", function () { recomputePreview({ applyPreset: true }); });
  if (elUseAC) elUseAC.addEventListener("change", function () { recomputePreview({ applyPreset: true }); });
  if (elZone) elZone.addEventListener("change", function () { recomputePreview({ applyPreset: true }); });

  // Additional: manual input -> lock to MANUAL
  if (elAdditional) {
    elAdditional.addEventListener("input", function () {
      if (elAutoFill) elAutoFill.checked = false;
      setMode("MANUAL");
      recomputePreview({ applyPreset: false });
    });
  }

  if (elAutoFill) {
    elAutoFill.addEventListener("change", function () {
      setMode(elAutoFill.checked ? "AUTO" : "MANUAL");
      recomputePreview({ applyPreset: true });
    });
  }

  if (elDiscount) {
    elDiscount.addEventListener("input", function () {
      syncDiscountReasonRule();
      recomputePreview({ applyPreset: false });
    });
  }

  if (elDiscountReason) {
    elDiscountReason.addEventListener("input", function () {
      // just to update validation state when discount toggles
      syncDiscountReasonRule();
    });
  }

  // Save -> validate first, then show modal
  if (btnSave) {
    btnSave.addEventListener("click", function () {
      syncDiscountReasonRule();

      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }

      recomputePreview({ applyPreset: false });
      fillSummary();
      showModal();
    });
  }

  if (btnApprove) {
    btnApprove.addEventListener("click", function () {
      form.submit();
    });
  }

  // initial
  setMode("AUTO");
  syncDiscountReasonRule();
  recomputePreview({ applyPreset: true });
})();
