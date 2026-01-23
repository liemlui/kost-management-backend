/* global document */
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
  var elTotalPrev = document.getElementById("total_rent_preview");

  var elUseAC = document.getElementById("preset_use_ac");
  var elZone = document.getElementById("preset_zone");
  var elAutoFill = document.getElementById("preset_autofill");
  var btnApplyPreset = document.getElementById("btn_apply_preset");

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

  function recomputePreview(opts) {
    opts = opts || {};
    var room = getSelectedRoomData();
    var base = room.base;

    if (elBasePrev) elBasePrev.value = formatIDR(base);

    if (opts.applyPreset && elAutoFill && elAutoFill.checked && elAdditional) {
      elAdditional.value = computePresetAdditional();
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

    var discReasonInput = qs('input[name="discount_reason"]', form);
    set("sum_discount_reason", discReasonInput && discReasonInput.value ? discReasonInput.value : "-");
  }

  // events
  if (elRoom) elRoom.addEventListener("change", function () { recomputePreview({ applyPreset: true }); });
  if (elUseAC) elUseAC.addEventListener("change", function () { recomputePreview({ applyPreset: true }); });
  if (elZone) elZone.addEventListener("change", function () { recomputePreview({ applyPreset: true }); });

  if (btnApplyPreset) btnApplyPreset.addEventListener("click", function () {
    if (elAdditional) elAdditional.value = computePresetAdditional();
    recomputePreview({ applyPreset: false });
  });

  if (elAdditional) elAdditional.addEventListener("input", function () { recomputePreview({ applyPreset: false }); });
  if (elDiscount) elDiscount.addEventListener("input", function () { recomputePreview({ applyPreset: false }); });

  // ✅ isi summary setiap modal akan tampil
  if (modalEl) {
    modalEl.addEventListener("show.bs.modal", function () {
      if (!elTenant.value || !elRoom.value || !elCheckin.value) return;
      recomputePreview({ applyPreset: false });
      fillSummary();
    });
  }

  if (btnApprove) btnApprove.addEventListener("click", function () {
    form.submit();
  });

  // initial
  recomputePreview({ applyPreset: true });
})();
