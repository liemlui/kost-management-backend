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

  function show(el) {
    if (!el) return;
    el.style.display = "";
  }
  function hide(el) {
    if (!el) return;
    el.style.display = "none";
  }
  function enable(el) {
    if (!el) return;
    el.disabled = false;
  }
  function disable(el) {
    if (!el) return;
    el.disabled = true;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("stayForm");
    if (!form) return;

    // -------------------------
    // MAIN FIELDS (steps)
    // -------------------------
    var elTenant = document.getElementById("tenant_id");
    var elRoom = document.getElementById("room_id");
    var elCheckin = document.getElementById("check_in_at");

    var elTariffSection = document.getElementById("tariffSection");
    var elWaterSection = document.getElementById("waterSection");
    var elRentPeriodSection = document.getElementById("rentPeriodSection");
    var elElecModeSection = document.getElementById("elecModeSection");
    var elVariantSection = document.getElementById("variantSection");

    var elPeriod = document.getElementById("rent_period");

    // snapshot fields + override
    var elOverrideTariff = document.getElementById("override_tariff");
    var elTariff = document.getElementById("electricity_fixed_amount");

    var elOverrideWater = document.getElementById("override_water");
    var elWater = document.getElementById("water_fixed_amount");

    // deposit fields + override
    var elDeposit = document.getElementById("deposit_amount");
    var elOverrideDeposit = document.getElementById("override_deposit");
    var elDepositDefaultText = document.getElementById("depositDefaultText");

    // electricity mode (display select disabled + hidden)
    var elElecModeDisplay = document.getElementById("electricity_mode_display");
    var elElecModeHidden = document.getElementById("electricity_mode");

    // variant radios
    function getVariant() {
      var checked = qs('input[name="room_variant"]:checked', form);
      return checked && checked.value
        ? String(checked.value).toUpperCase()
        : "";
    }

    // pricing / totals sections
    var elPricingSection = document.getElementById("pricingSection");
    var elTotalSection = document.getElementById("totalSection");

    // preview fields
    var elBasePrev = document.getElementById("base_rent_preview");
    var elTotalPrev = document.getElementById("total_rent_preview");

    // additional toggle + fields
    var elAddToggle = document.getElementById("add_toggle");
    var elAdditionalFields = document.getElementById("additionalFields");
    var elAdditional = document.getElementById("additional_rent_amount");
    var elAdditionalReason = document.getElementById("additional_rent_reason");

    // discount toggle + fields
    var elDiscountToggle = document.getElementById("discount_toggle");
    var elDiscountFields = document.getElementById("discountFields");
    var elDiscount = document.getElementById("discount_amount");
    var elDiscountReason = document.getElementById("discount_reason");

    // buttons / modal
    var btnSave = document.getElementById("btnSave");
    var btnApprove = document.getElementById("btnApprove");
    var modalEl = document.getElementById("confirmModal");

    // -------------------------
    // DEFAULTS
    // -------------------------
    var DEFAULT_TARIFF = 2500;
    var DEFAULT_WATER = 5000;

    // -------------------------
    // DATA HELPERS
    // -------------------------
    function getSelectedRoomData() {
      var opt =
        elRoom && elRoom.options ? elRoom.options[elRoom.selectedIndex] : null;
      if (!opt || !opt.value) {
        return { base: 0, roomCode: "-", roomType: "-" };
      }
      return {
        base: num(opt.dataset.base || 0), // monthly_price
        roomCode: opt.dataset.roomCode || "-",
        roomType: opt.dataset.roomType || "-",
      };
    }

    function isTruthyValue(v) {
      return String(v || "").trim().length > 0;
    }

    function keysForStep8Valid() {
      // Step 1–8: tenant, room, checkin, tariff+water shown, rent_period, elec_mode derived, variant
      var hasTenant = isTruthyValue(elTenant && elTenant.value);
      var hasRoom = isTruthyValue(elRoom && elRoom.value);
      var hasCheckin = isTruthyValue(elCheckin && elCheckin.value);
      var hasPeriod = isTruthyValue(elPeriod && elPeriod.value);
      var variant = getVariant();
      var hasVariant = variant === "FAN" || variant === "AC";

      return hasTenant && hasRoom && hasCheckin && hasPeriod && hasVariant;
    }

    // -------------------------
    // STEP VISIBILITY (progressive disclosure)
    // -------------------------
    function syncStepVisibility() {
      var hasTenant = isTruthyValue(elTenant && elTenant.value);
      var hasRoom = isTruthyValue(elRoom && elRoom.value);
      var hasCheckin = isTruthyValue(elCheckin && elCheckin.value);
      var hasPeriod = isTruthyValue(elPeriod && elPeriod.value);
      var hasStep8 = keysForStep8Valid();

      // Step 2: room enabled after tenant
      if (elRoom) {
        if (hasTenant) enable(elRoom);
        else disable(elRoom);
      }

      // Step 3: checkin enabled after room
      if (elCheckin) {
        if (hasRoom) enable(elCheckin);
        else disable(elCheckin);
      }

      // Step 4–6 appear after checkin
      if (hasCheckin) {
        show(elTariffSection);
        show(elWaterSection);
        show(elRentPeriodSection);
      } else {
        hide(elTariffSection);
        hide(elWaterSection);
        hide(elRentPeriodSection);
      }

      // Step 7–8 appear after period
      if (hasPeriod) {
        show(elElecModeSection);
        show(elVariantSection);
      } else {
        hide(elElecModeSection);
        hide(elVariantSection);
      }

      // Step 9–10 appear only after step 1–8 valid
      if (hasStep8) {
        show(elPricingSection);
        show(elTotalSection);
      } else {
        hide(elPricingSection);
        hide(elTotalSection);
      }
    }

    // -------------------------
    // OVERRIDES (tariff / water)
    // -------------------------
    function applyTariffOverrideUI() {
      if (!elTariff) return;

      var overrideOn = !!(elOverrideTariff && elOverrideTariff.checked);

      if (!overrideOn) {
        // lock to default
        elTariff.value = String(DEFAULT_TARIFF);
        elTariff.readOnly = true;
      } else {
        elTariff.readOnly = false;
        // kalau kosong, isi default biar gak “blank”
        if (!isTruthyValue(elTariff.value))
          elTariff.value = String(DEFAULT_TARIFF);
      }
    }

    function applyWaterOverrideUI() {
      if (!elWater) return;

      var overrideOn = !!(elOverrideWater && elOverrideWater.checked);

      if (!overrideOn) {
        elWater.value = String(DEFAULT_WATER);
        elWater.readOnly = true;
      } else {
        elWater.readOnly = false;
        if (!isTruthyValue(elWater.value))
          elWater.value = String(DEFAULT_WATER);
      }
    }

    function applyDepositOverrideUI() {
      if (!elDeposit) return;

      var roomOpt =
        elRoom && elRoom.options ? elRoom.options[elRoom.selectedIndex] : null;

      var defaultDeposit =
        roomOpt && roomOpt.value ? num(roomOpt.dataset.deposit || 0) : 0;

      // tampilkan default text
      if (elDepositDefaultText) {
        elDepositDefaultText.textContent = defaultDeposit
          ? formatIDR(defaultDeposit)
          : "-";
      }

      var overrideOn = !!(elOverrideDeposit && elOverrideDeposit.checked);

      if (!overrideOn) {
        // lock ke default
        elDeposit.value = String(defaultDeposit || 0);
        elDeposit.readOnly = true;
      } else {
        elDeposit.readOnly = false;
        // kalau kosong, isi default biar gak blank
        if (!String(elDeposit.value || "").trim())
          elDeposit.value = String(defaultDeposit || 0);
      }
    }

    // -------------------------
    // DERIVED FIELDS
    // -------------------------
    function syncElectricityMode() {
      if (!elPeriod) return;
      var p = String(elPeriod.value || "");

      // Final rule:
      // MONTHLY -> METERED
      // DAILY/WEEKLY/TWO_WEEKS -> INCLUDED
      var mode = p === "MONTHLY" ? "METERED" : p ? "INCLUDED" : "";

      if (elElecModeHidden) elElecModeHidden.value = mode;
      if (elElecModeDisplay) elElecModeDisplay.value = mode;
    }

    // -------------------------
    // ADDITIONAL / DISCOUNT toggles
    // -------------------------
    function syncAdditionalUI() {
      if (!elAddToggle) return;
      var on = !!elAddToggle.checked;

      if (on) {
        show(elAdditionalFields);
        if (elAdditional) elAdditional.disabled = false;
        if (elAdditionalReason) elAdditionalReason.disabled = false;
      } else {
        hide(elAdditionalFields);
        // supaya tidak terkirim / tidak mempengaruhi total
        if (elAdditional) {
          elAdditional.value = "0";
          elAdditional.disabled = true;
        }
        if (elAdditionalReason) {
          elAdditionalReason.value = "";
          elAdditionalReason.disabled = true;
        }
      }
    }

    function syncDiscountUI() {
      if (!elDiscountToggle) return;
      var on = !!elDiscountToggle.checked;

      if (on) {
        show(elDiscountFields);
        if (elDiscount) elDiscount.disabled = false;
        if (elDiscountReason) elDiscountReason.disabled = false;
      } else {
        hide(elDiscountFields);
        if (elDiscount) {
          elDiscount.value = "0";
          elDiscount.disabled = true;
        }
        if (elDiscountReason) {
          elDiscountReason.value = "";
          elDiscountReason.disabled = true;
          elDiscountReason.required = false;
        }
      }
    }

    // -------------------------
    // DYNAMIC VALIDATION RULES
    // -------------------------
    function syncDiscountReasonRule() {
      if (!elDiscountReason || !elDiscount) return;
      var amount = num(elDiscount.value);
      elDiscountReason.required = amount > 0;
    }

    function syncTariffRule() {
      // FINAL rule:
      // AC => tariff wajib valid saat Save
      // MONTHLY + FAN => tariff kosong aman (tapi UI default tetap ada)
      if (!elTariff) return;

      var variant = getVariant();
      // Required only for AC
      elTariff.required = variant === "AC";
    }

    // -------------------------
    // COMPUTE BASE
    // -------------------------
    function computeBase(period, monthly, tariff, variant) {
      switch (period) {
        case "MONTHLY":
          return monthly + (variant === "AC" ? tariff * 120 : 0);

        case "DAILY":
          return (monthly / 30) * 4;

        case "WEEKLY":
          return monthly / 4 + tariff * (variant === "AC" ? 60 : 40);

        case "TWO_WEEKS":
          return monthly / 2 + tariff * (variant === "AC" ? 100 : 60);

        default:
          return 0;
      }
    }

    function getPricingContext() {
      var room = getSelectedRoomData();
      var period = elPeriod ? String(elPeriod.value || "") : "";
      var monthly = room.base;

      // Tariff snapshot always exists (default), but if user somehow clears it:
      var tariff = elTariff ? num(elTariff.value) : DEFAULT_TARIFF;
      var variant = getVariant();

      var base = computeBase(period, monthly, tariff, variant);
      return {
        room: room,
        period: period,
        monthly: monthly,
        tariff: tariff,
        variant: variant,
        base: base,
      };
    }

    // -------------------------
    // PRICING RECOMPUTE (Preview)
    // -------------------------
    function recomputePreview() {
      // apply UI + rules first
      applyTariffOverrideUI();
      applyWaterOverrideUI();
      applyDepositOverrideUI();
      syncElectricityMode();
      syncAdditionalUI();
      syncDiscountUI();

      syncDiscountReasonRule();
      syncTariffRule();

      // only compute/show values if step 1–8 valid
      if (!keysForStep8Valid()) {
        if (elBasePrev) elBasePrev.value = "0";
        if (elTotalPrev) elTotalPrev.value = "0";
        return;
      }

      var ctx = getPricingContext();
      var base = ctx.base;

      if (elBasePrev) elBasePrev.value = formatIDR(base);

      var additional =
        elAdditional && !elAdditional.disabled ? num(elAdditional.value) : 0;
      var discount =
        elDiscount && !elDiscount.disabled ? num(elDiscount.value) : 0;

      var total = base + additional - discount;
      if (total < 0) total = 0;

      if (elTotalPrev) elTotalPrev.value = formatIDR(total);
    }

    // -------------------------
    // SUMMARY (Modal)
    // -------------------------
    function fillSummary() {
      var ctx = getPricingContext();
      var room = ctx.room;
      var base = ctx.base;

      var tenantOpt =
        elTenant && elTenant.options
          ? elTenant.options[elTenant.selectedIndex]
          : null;
      var tenantName = tenantOpt && tenantOpt.value ? tenantOpt.text : "-";

      var additional =
        elAdditional && !elAdditional.disabled ? num(elAdditional.value) : 0;
      var discount =
        elDiscount && !elDiscount.disabled ? num(elDiscount.value) : 0;

      var total = base + additional - discount;
      if (total < 0) total = 0;

      var water = elWater ? num(elWater.value) : DEFAULT_WATER;
      var mode = elElecModeHidden ? elElecModeHidden.value || "-" : "-";

      function set(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
      }

      set("sum_tenant", tenantName);
      set("sum_room", room.roomCode + " — " + room.roomType);
      set("sum_checkin", elCheckin && elCheckin.value ? elCheckin.value : "-");
      set("sum_period", ctx.period || "-");
      set("sum_variant", ctx.variant || "-");

      set("sum_base", "Rp " + formatIDR(base));
      set("sum_additional", "Rp " + formatIDR(additional));
      set("sum_discount", "Rp " + formatIDR(discount));
      set("sum_total", "Rp " + formatIDR(total));

      set("sum_tariff", "Rp " + formatIDR(ctx.tariff));
      set("sum_water", "Rp " + formatIDR(water));
      set("sum_elec_mode", mode);

      set(
        "sum_additional_reason",
        elAdditionalReason &&
          !elAdditionalReason.disabled &&
          elAdditionalReason.value
          ? elAdditionalReason.value
          : "-",
      );
      set(
        "sum_discount_reason",
        elDiscountReason && !elDiscountReason.disabled && elDiscountReason.value
          ? elDiscountReason.value
          : "-",
      );
    }

    function showModal() {
      if (!modalEl) return;
      var modal =
        window.bootstrap && window.bootstrap.Modal
          ? window.bootstrap.Modal.getOrCreateInstance(modalEl)
          : null;
      if (modal) modal.show();
    }

    // -------------------------
    // RESET DOWNSTREAM (recommended)
    // -------------------------
    function resetAfterTenantChange() {
      if (elRoom) elRoom.value = "";
      if (elCheckin) elCheckin.value = "";
      if (elPeriod) elPeriod.value = "";
      // variant default FAN
      var fan = document.getElementById("room_variant_fan");
      if (fan) fan.checked = true;

      // pricing toggles reset
      if (elAddToggle) elAddToggle.checked = false;
      if (elDiscountToggle) elDiscountToggle.checked = false;

      // force UI sync
      syncStepVisibility();
      recomputePreview();
    }

    function resetAfterRoomChange() {
      if (elCheckin) elCheckin.value = "";
      if (elPeriod) elPeriod.value = "";
      var fan = document.getElementById("room_variant_fan");
      if (fan) fan.checked = true;

      if (elAddToggle) elAddToggle.checked = false;
      if (elDiscountToggle) elDiscountToggle.checked = false;

      syncStepVisibility();
      recomputePreview();
    }

    // -------------------------
    // EVENTS (the “B” checklist implemented)
    // -------------------------

    // A. Tenant change
    if (elTenant) {
      elTenant.addEventListener("change", function () {
        resetAfterTenantChange();
      });
    }

    // B. Room change
    if (elRoom) {
      elRoom.addEventListener("change", function () {
        resetAfterRoomChange();
        applyDepositOverrideUI();
        recomputePreview();
      });
    }

    // C. Check-in date change
    if (elCheckin) {
      elCheckin.addEventListener("change", function () {
        syncStepVisibility();
        recomputePreview();
      });
      elCheckin.addEventListener("input", function () {
        syncStepVisibility();
      });
    }

    // D. Override tariff
    if (elOverrideTariff) {
      elOverrideTariff.addEventListener("change", function () {
        applyTariffOverrideUI();
        recomputePreview();
      });
    }
    if (elTariff) {
      elTariff.addEventListener("input", function () {
        // recompute only makes sense if override ON (but safe anyway)
        recomputePreview();
      });
    }
    // E. Override deposit
    if (elOverrideDeposit) {
      elOverrideDeposit.addEventListener("change", function () {
        applyDepositOverrideUI();
      });
    }

    // E. Override water
    if (elOverrideWater) {
      elOverrideWater.addEventListener("change", function () {
        applyWaterOverrideUI();
        // water does not affect contract total, but keeps summary consistent
        recomputePreview();
      });
    }
    if (elWater) {
      elWater.addEventListener("input", function () {
        // update summary consistency
        recomputePreview();
      });
    }

    // F. Rent period change -> electricity mode + unlock variant
    if (elPeriod) {
      elPeriod.addEventListener("change", function () {
        syncElectricityMode();
        syncStepVisibility();
        recomputePreview();
      });
    }

    // G. Variant change
    form.addEventListener("change", function (e) {
      if (e && e.target && e.target.name === "room_variant") {
        syncTariffRule();
        syncStepVisibility();
        recomputePreview();
      }
    });

    // H. Additional toggle & amount/reason
    if (elAddToggle) {
      elAddToggle.addEventListener("change", function () {
        syncAdditionalUI();
        recomputePreview();
      });
    }
    if (elAdditional) elAdditional.addEventListener("input", recomputePreview);

    // I. Discount toggle & amount/reason
    if (elDiscountToggle) {
      elDiscountToggle.addEventListener("change", function () {
        syncDiscountUI();
        syncDiscountReasonRule();
        recomputePreview();
      });
    }
    if (elDiscount) {
      elDiscount.addEventListener("input", function () {
        syncDiscountReasonRule();
        recomputePreview();
      });
    }
    if (elDiscountReason) {
      elDiscountReason.addEventListener("input", syncDiscountReasonRule);
    }

    // J. Save click -> validate -> modal
    if (btnSave) {
      btnSave.addEventListener("click", function () {
        // Always re-sync before validating
        syncStepVisibility();
        syncElectricityMode();
        applyTariffOverrideUI();
        applyWaterOverrideUI();
        syncAdditionalUI();
        syncDiscountUI();
        syncDiscountReasonRule();
        syncTariffRule();

        // Ensure pricing gate: step 1–8 must be valid
        if (!keysForStep8Valid()) {
          form.classList.add("was-validated");
          return;
        }

        if (!form.checkValidity()) {
          form.classList.add("was-validated");
          return;
        }

        recomputePreview();
        fillSummary();
        showModal();
      });
    }

    // K. Approve -> submit
    if (btnApprove) {
      btnApprove.addEventListener("click", function () {
        syncElectricityMode();
        form.submit();
      });
    }

    // -------------------------
    // INITIAL RUN
    // -------------------------
    // Make sure defaults are applied even on first load
    if (elOverrideTariff && !elOverrideTariff.checked) {
      // default path
      if (elTariff && !isTruthyValue(elTariff.value))
        elTariff.value = String(DEFAULT_TARIFF);
    }
    if (elOverrideWater && !elOverrideWater.checked) {
      if (elWater && !isTruthyValue(elWater.value))
        elWater.value = String(DEFAULT_WATER);
    }

    applyTariffOverrideUI();
    applyWaterOverrideUI();
    applyDepositOverrideUI();
    syncAdditionalUI();
    syncDiscountUI();
    syncDiscountReasonRule();
    syncElectricityMode();
    syncStepVisibility();
    recomputePreview();
  });
})();
