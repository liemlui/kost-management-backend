document.addEventListener("DOMContentLoaded", () => {
  const modalEl = document.getElementById("checkoutConfirmModal");
  if (!modalEl) return;

  const summaryEl = document.getElementById("checkoutSummary");
  const formEl = document.getElementById("checkoutForm");

  modalEl.addEventListener("show.bs.modal", (ev) => {
    const btn = ev.relatedTarget;
    if (!btn) return;

    const stayId = btn.getAttribute("data-stay-id");
    const tenant = btn.getAttribute("data-tenant");
    const room = btn.getAttribute("data-room");

    formEl.action = `/admin/kost/stays/${stayId}/checkout`;
    summaryEl.textContent = `Tenant: ${tenant} — Room: ${room} (Stay ID: ${stayId})`;
  });
});
