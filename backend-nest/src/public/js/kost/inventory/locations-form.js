/* global document */
(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function selectedRoomCode(roomEl) {
    if (!roomEl) return "";
    var opt = roomEl.options[roomEl.selectedIndex];
    return opt ? (opt.text || "").trim() : "";
  }

  function init() {
    var typeEl = $("location_type");
    var roomWrap = $("roomWrap");
    var roomEl = $("room_id");
    var nameWrap = $("nameWrap");
    var nameEl = $("loc_name");
    var nameHelp = $("nameHelp");

    if (!typeEl || !roomWrap || !nameWrap || !nameEl || !nameHelp) return;

    function sync() {
      var t = (typeEl.value || "").toUpperCase();

      // default: hide everything
      nameWrap.style.display = "none";
      roomWrap.style.display = "none";
      nameEl.readOnly = false;
      nameHelp.textContent = "";

      if (!t) {
        nameEl.value = "";
        if (roomEl) roomEl.value = "";
        return;
      }

      if (t === "GENERAL") {
        nameWrap.style.display = "";
        nameEl.readOnly = false;
        nameHelp.textContent = "Isi nama bebas (contoh: Gudang Utama, Gudang Lt 2).";
        if (roomEl) roomEl.value = "";
        return;
      }

      if (t === "ROOM") {
        roomWrap.style.display = "";
        nameWrap.style.display = "";
        nameEl.readOnly = true;
        nameHelp.textContent = "Nama lokasi otomatis mengikuti kode kamar.";

        var code = selectedRoomCode(roomEl);
        if (code && code !== "- pilih room -") nameEl.value = code;
        else nameEl.value = "";
      }
    }

    typeEl.addEventListener("change", sync);
    if (roomEl) roomEl.addEventListener("change", sync);

    sync();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
