# 03 — Folder Structure (backend-nest)

Recommended structure:

backend-nest/
  src/
    main.ts
    app.module.ts

    config/
      env.ts
      logger.ts

    db/
      pool.ts

    shared/
      parsers.ts
      flash.ts
      httpErrors.ts

    middlewares/
      requestLogger.middleware.ts

    modules/
      kost/
        kost.module.ts

        rooms/
          rooms.controller.ts
          rooms.service.ts (optional)
          rooms.repo.ts
          rooms.sql.ts

        roomTypes/
          roomTypes.controller.ts
          roomTypes.repo.ts
          roomTypes.sql.ts

        tenants/
        stays/
        inventory/
        billing/
        assets/

    views/
      kost/
        partials/
          header.ejs
          footer.ejs
          helpers.ejs
        rooms/
        room-types/
        tenants/
        stays/
        inventory/
        billing/
        assets/

    public/
      css/
      js/
      img/

## Notes
- Keep module boundaries clear.
- Shared utilities only in shared/.
- Avoid “utils dumping ground”.
