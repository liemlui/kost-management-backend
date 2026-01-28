// pwe/backend/src/modules/kost/controllers/billing/billing.controller.js
const invoicesRepo = require("../../repos/billing/invoice.repo");
const genService = require("../../services/billing/generator.service");
const elecService = require("../../services/billing/electricity.service");
const invoiceService = require("../../services/billing/invoice.services");
const boardRepo = require("../../repos/billing/board.repo");
const issueService = require("../../services/billing/issue.service");
const { toIntOrNull, toNumOrNull } = require("../../../../shared/parsers");

async function list(req, res, next) {
  try {
    const past = toIntOrNull(req.query.past) ?? 2;
    const future = toIntOrNull(req.query.future) ?? 10;

    const result = await boardRepo.listBillingBoard(past, future);

    res.render("kost/billing/index", {
      title: "Billing",
      rows: result.rows,
      past,
      future,
    });
  } catch (e) {
    next(e);
  }
}

async function issueStay(req, res, next) {
  try {
    const stayId = Number(req.params.stayId);
    const inv = await issueService.issueForStay(stayId);

    if (!inv) {
      req.flash?.("error", "Cannot issue invoice (stay not active or invalid).");
      return res.redirect("/admin/kost/billing");
    }

    return res.redirect(`/admin/kost/billing/${inv.id}`);
  } catch (e) {
    next(e);
  }
}

async function detail(req, res, next) {
  try {
    const invoiceId = Number(req.params.id);
    const inv = await invoicesRepo.getInvoice(invoiceId);
    const items = await invoicesRepo.listInvoiceItems(invoiceId);
    const elec = await invoicesRepo.getInvoiceElectricity(invoiceId);

    if (inv.rowCount === 0) return res.status(404).send("Invoice not found");

    res.render("kost/billing/detail", {
      title: `Invoice #${invoiceId}`,
      invoice: inv.rows[0],
      items: items.rows,
      electricity: elec.rows[0] ?? null,
    });
  } catch (e) {
    next(e);
  }
}

async function generateDraft(req, res, next) {
  try {
    await genService.generateDraft();
    res.redirect("/admin/kost/billing");
  } catch (e) {
    next(e);
  }
}

async function captureMeter(req, res, next) {
  try {
    const invoiceId = Number(req.params.id);
    const roomId = Number(req.body.room_id);
    const startKwh = toNumOrNull(req.body.start_kwh);
    const endKwh = toNumOrNull(req.body.end_kwh);

    await elecService.captureMeter({
      invoiceId,
      roomId,
      startKwh,
      endKwh,
      actorId: null,
    });

    res.redirect(`/admin/kost/billing/${invoiceId}`);
  } catch (e) {
    next(e);
  }
}

async function issueInvoice(req, res, next) {
  try {
    const { id } = req.params;
    await invoiceService.issueInvoice(id);

    res.redirect(`/admin/kost/billing/${id}`);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  detail,
  generateDraft,
  captureMeter,
  issueInvoice,
  issueStay,
};
