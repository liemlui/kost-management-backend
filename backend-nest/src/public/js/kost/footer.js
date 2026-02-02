// backend-nest/src/public/js/kost/footer.js

document.addEventListener("DOMContentLoaded", function () {
  // Auto-hide flash messages setelah 5 detik
  const alerts = document.querySelectorAll(".alert");
  alerts.forEach(function (alert) {
    setTimeout(function () {
      // bootstrap is available because bootstrap.bundle.min.js is loaded
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }, 5000);
  });
});
