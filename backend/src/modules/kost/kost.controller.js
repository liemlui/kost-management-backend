const stayService = require('./services/stay.service');

async function createStay(req, res, next) {
  try {
    await stayService.createStay(req.body);
    res.redirect('/admin/kost/stays');
  } catch (err) {
    next(err);
  }
}

async function endStay(req, res, next) {
  try {
    await stayService.endStay(req.params.id);
    res.redirect('/admin/kost/stays');
  } catch (err) {
    next(err);
  }
}
async function forcedCheckout(req, res, next) {
  try {
    await stayService.forcedCheckout({
      stay_id: req.params.id,
      actor_id: req.user.id, // atau admin_id dari session
      reason: req.body.reason,
    });

    res.redirect('/admin/kost/stays');
  } catch (err) {
    next(err);
  }
}
async function unblockRoom(req, res, next) {
  try {
    await roomService.unblockRoom({
      room_id: req.params.id,
      actor_id: req.user.id,
      reason: req.body.reason,
    });
    res.redirect('/admin/kost/rooms');
  } catch (err) {
    next(err);
  }
}


module.exports = {
  createStay,
  endStay,
  forcedCheckout,
  unblockRoom,
};
