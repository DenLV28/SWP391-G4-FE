# Staff–Parking Lot Assignment & Data-Level Authorization

> Technical analysis and implementation guide for the "Nhân viên phụ trách" feature:
> an Admin assigns a staff member to a specific parking lot; the staff member can
> then view real-time status and operate **only** that lot, with strict data-level
> isolation.

## 1. Business Analysis (Agile Artifacts)

**Epic:** As a parking operator, we need each parking lot to be operated by
explicitly assigned staff, with strict data isolation, so that operational
responsibility is clear and staff cannot see or affect lots outside their scope.

### Roles & visibility boundary

| Capability | Admin | Manager | Staff (assigned Lot A) |
|---|---|---|---|
| Assign/revoke staff ↔ lot | ✅ | ✅ (own lots) | ❌ |
| View any lot's data | ✅ | ✅ (lot selector) | ❌ — Lot A only |
| Manage slots/bookings of Lot A | ✅ | ✅ | ✅ |
| Manage slots/bookings of Lot B | ✅ | ✅ | ❌ (server rejects) |
| See other lots' directory names | ✅ | ✅ | Allowed — but no operational data |

### User Stories & Acceptance Criteria

**US-01 — Admin assigns staff to a parking lot**

> As an **Administrator**, I want to select a staff member and assign them to a
> specific parking lot, so that each lot has a clearly responsible operator.

1. Given I am logged in as Admin, when I open a lot's detail, then I see an
   assignment control listing only users whose role is `STAFF`.
2. When I confirm an assignment, then the mapping `(staff, lot)` is persisted
   with `assigned_by` and `assigned_at`, and is visible immediately.
3. Given the staff is already assigned elsewhere and the business rule is
   "one lot per staff", then the old assignment is replaced (with confirmation).
4. Given I am not an Admin, when I call the assignment API directly, then the
   server responds **403 Forbidden** — hiding the button in the UI is not enough.

**US-02 — Admin revokes / reassigns**

> As an **Administrator**, I want to revoke or change a staff member's lot
> assignment, so that staffing changes take effect immediately.

- Revocation takes effect on the staff's **next request** (no stale cached
  authority); an audit row records who revoked and when.

**US-03 — Staff views only their assigned lot**

> As a **Staff member**, I want my dashboard to show real-time slot status,
> bookings, and activity **only for my assigned lot**.

1. Given I am assigned to Lot A, when I open the dashboard, then every widget
   (floor map, booking queue, activity log, notification bell) contains only
   Lot A data.
2. Given I request `GET /api/lots/{B}/slots` for a lot I am not assigned to
   (crafted request), then the server returns **403** (or 404 if the org
   prefers non-disclosure) and zero rows — never a partial payload.
3. Given I have no assignment yet, then I see an empty state — **not** a
   fallback to all lots.
4. Real-time pushes (SSE/WebSocket) are also scoped: I never receive events of
   other lots.

**US-04 — Staff manages operations within scope**

> As a **Staff member**, I want to change slot statuses and process bookings of
> my assigned lot.

- Any mutating call (`PATCH slot`, `confirm booking`, `force-clear`) validates
  that the **target resource's `lot_id`** is in my assignment set — resolved on
  the server from the resource itself, never from a client-sent lot id.

**US-05 — Manager/Admin retains global view**

> As a **Manager**, I want a lot selector to switch between all lots and view
> each independently.

- Selector lists all lots; statistics recompute per selection; no restriction
  applies to Manager/Admin queries.

## 2. System Design & Database Schema

```sql
CREATE TABLE roles (
  role_id     INT IDENTITY PRIMARY KEY,
  role_name   NVARCHAR(30) NOT NULL UNIQUE   -- ADMIN, MANAGER, STAFF, DRIVER
);

CREATE TABLE users (
  user_id     INT IDENTITY PRIMARY KEY,
  full_name   NVARCHAR(100) NOT NULL,
  email       NVARCHAR(150) NOT NULL UNIQUE,
  password_hash NVARCHAR(200) NOT NULL,
  role_id     INT NOT NULL REFERENCES roles(role_id),
  status      NVARCHAR(20) NOT NULL DEFAULT 'Active'
);

CREATE TABLE parking_lots (
  lot_id      INT IDENTITY PRIMARY KEY,
  name        NVARCHAR(100) NOT NULL UNIQUE,
  address     NVARCHAR(200) NOT NULL,
  status      NVARCHAR(20) NOT NULL DEFAULT 'Active'
);

-- The heart of the feature: the explicit grant of authority
CREATE TABLE staff_lot_assignments (
  assignment_id INT IDENTITY PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(user_id),
  lot_id      INT NOT NULL REFERENCES parking_lots(lot_id),
  assigned_by INT NOT NULL REFERENCES users(user_id),
  assigned_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_staff_lot UNIQUE (user_id, lot_id)
  -- If the rule is "one lot per staff": UNIQUE (user_id) instead
);

-- Every lot-scoped resource CARRIES its lot_id (single source of truth)
CREATE TABLE parking_slots (
  slot_id     INT IDENTITY PRIMARY KEY,
  lot_id      INT NOT NULL REFERENCES parking_lots(lot_id),
  slot_code   NVARCHAR(20) NOT NULL,
  status      NVARCHAR(20) NOT NULL DEFAULT 'Available',
  CONSTRAINT UQ_lot_slot UNIQUE (lot_id, slot_code)   -- A01 exists once PER LOT
);

CREATE TABLE bookings (
  booking_id  INT IDENTITY PRIMARY KEY,
  lot_id      INT NOT NULL REFERENCES parking_lots(lot_id),
  slot_id     INT NULL REFERENCES parking_slots(slot_id),
  driver_id   INT NOT NULL REFERENCES users(user_id),
  license_plate NVARCHAR(20) NOT NULL,
  status      NVARCHAR(20) NOT NULL DEFAULT 'Pending'
);
```

### Authorization architecture

```
Request ──▶ AuthN (JWT → user_id, role)
        ──▶ AuthZ layer:  allowedLots(user) = SELECT lot_id FROM staff_lot_assignments
        ──▶ Guard:        requested lot_id ∈ allowedLots ?  → else 403
        ──▶ Query layer:  ... WHERE lot_id IN (:allowedLots)   ← defense in depth
```

Three independent walls (defense in depth):

1. **Relational integrity** — every slot/booking row must carry a valid
   `lot_id`; there is no "unscoped" data to leak. `UNIQUE(lot_id, slot_code)`
   makes lot inventories fully independent.
2. **Endpoint guard** — the requested `lotId` (path variable, never a
   client-trusted body field) is checked against `staff_lot_assignments` on
   **every request**, so revocation is instant.
3. **Query-level scoping** — repository queries for STAFF always append
   `WHERE lot_id IN (allowed)`. Even if a developer forgets a guard on a new
   endpoint, the query returns zero foreign rows.

The identity of "which lot" is always resolved **server-side from the
resource** (e.g. from the slot being modified → its `lot_id`), never from what
the client claims.

## 3. Backend Implementation (Java / Spring Boot)

### REST API surface

```
# Admin
POST   /api/admin/lots/{lotId}/staff            body: { "staffId": 12 }   → 201
DELETE /api/admin/lots/{lotId}/staff/{staffId}                            → 204

# Staff (scoped)
GET    /api/staff/my-lots                        → lots assigned to caller
GET    /api/lots/{lotId}/slots                   → 200 only if assigned (or MANAGER/ADMIN)
GET    /api/lots/{lotId}/bookings?status=Pending
PATCH  /api/lots/{lotId}/slots/{slotId}          body: { "status": "Available" }
POST   /api/lots/{lotId}/bookings/{id}/confirm
```

### Permission evaluator — the single reusable check

```java
@Component("lotAccess")
@RequiredArgsConstructor
public class LotAccessEvaluator {
    private final StaffLotAssignmentRepository assignments;

    /** ADMIN/MANAGER: global. STAFF: only explicitly granted lots. */
    public boolean canAccess(Long lotId, Authentication auth) {
        AppUser user = (AppUser) auth.getPrincipal();
        if (user.hasRole("ADMIN") || user.hasRole("MANAGER")) return true;
        return assignments.existsByUserIdAndLotId(user.getId(), lotId);
    }
}
```

```java
public interface StaffLotAssignmentRepository extends JpaRepository<StaffLotAssignment, Long> {
    boolean existsByUserIdAndLotId(Long userId, Long lotId);

    @Query("select a.lotId from StaffLotAssignment a where a.userId = :userId")
    List<Long> findLotIdsByUserId(Long userId);
}
```

### Wall 1 — declarative guard on every lot-scoped endpoint

```java
@RestController
@RequestMapping("/api/lots/{lotId}")
@RequiredArgsConstructor
public class LotOperationsController {
    private final SlotService slotService;

    @GetMapping("/slots")
    @PreAuthorize("@lotAccess.canAccess(#lotId, authentication)")
    public List<SlotDto> getSlots(@PathVariable Long lotId) {
        return slotService.getSlots(lotId);
    }

    @PatchMapping("/slots/{slotId}")
    @PreAuthorize("@lotAccess.canAccess(#lotId, authentication)")
    public SlotDto updateSlot(@PathVariable Long lotId, @PathVariable Long slotId,
                              @RequestBody UpdateSlotRequest req) {
        return slotService.updateStatus(lotId, slotId, req.status());
    }
}
```

```java
// Admin-only assignment endpoint
@PostMapping("/api/admin/lots/{lotId}/staff")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<Void> assign(@PathVariable Long lotId, @RequestBody AssignRequest req,
                                   @AuthenticationPrincipal AppUser admin) {
    assignmentService.assign(req.staffId(), lotId, admin.getId());
    return ResponseEntity.status(HttpStatus.CREATED).build();
}
```

### Wall 2 — service re-validates the resource's lot

```java
@Service
@RequiredArgsConstructor
public class SlotService {
    private final SlotRepository slots;

    public SlotDto updateStatus(Long lotId, Long slotId, SlotStatus status) {
        Slot slot = slots.findById(slotId)
            .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));
        // The slot's OWN lot_id must match the authorized path segment —
        // blocks "authorized lot A in the URL, victim slot from lot B in the body".
        if (!slot.getLotId().equals(lotId)) {
            throw new AccessDeniedException("Slot does not belong to this parking lot");
        }
        slot.setStatus(status);
        return SlotDto.from(slots.save(slot));
    }
}
```

### Wall 3 — query-level scoping for list endpoints

```java
public List<BookingDto> getBookingsForCaller(AppUser caller, BookingFilter filter) {
    if (caller.hasRole("STAFF")) {
        List<Long> allowed = assignments.findLotIdsByUserId(caller.getId());
        if (allowed.isEmpty()) return List.of();          // unassigned staff sees NOTHING
        return bookings.findByLotIdInAndStatus(allowed, filter.status());
    }
    return bookings.findByStatus(filter.status());        // ADMIN / MANAGER: global
}
```

### Key principles

- The UI never enforces security — it only **reflects** it.
- The grant lives in one table (`staff_lot_assignments`), so revocation is
  instant and auditable.
- 403 guards + resource-ownership checks + query scoping fail independently —
  one missed line of code does not become a data leak.

## Appendix — mapping to the current SWP391 codebase

The running Node.js prototype implements the same feature with simplifications:

| Design element | Current implementation |
|---|---|
| `staff_lot_assignments` table | `users.assigned_parking_lot` column (one lot per staff) |
| `parking_slots.lot_id` | `parking_slots.parking_lot` (name-keyed) |
| `bookings.lot_id` | `reservations.parking_lot` |
| Assignment UI (Admin) | Manager → Quản lý Bãi xe → "Nhân viên phụ trách" dropdown |
| Guard + query scoping | Client-side filtering at the portal root (`StaffDashboard`); server exposes `?lot=` filters |

The Java design above is the production-grade version of the same model: to
harden the prototype, introduce JWT authentication, replace the client-side
filter with the three server-side walls, and normalize lot identity from name
strings to `lot_id` foreign keys.
