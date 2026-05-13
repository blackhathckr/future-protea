# Future Protea  System Architecture

**Application:** Future Protea Cricket Scoring & Analytics Platform
**Tagline:** *"Log Every Ball"*
**Version:** 2.0 · **Date:** 11 May 2026
**Audience:** Project Managers, Stakeholders, Engineering Team
**Companion:** Future Protea BRD v1.1 (final, April 2026), Solution Document v1.0, Roles & Responsibilities v1.0

---

## 1. Executive Summary

Future Protea is a free, mobile-first cricket scoring app for the South African grassroots cricket community: schools, clubs, and amateur tournaments. One person (the **scorer**) records every ball as it happens; thousands of **viewers** see the updated scorecard on their phone or browser within two seconds.

Per BRD §1, the platform is built around four core modules:

1. **Player Registration**  unique Player IDs that follow a cricketer through school and club levels.
2. **Team Management**  school and club teams with rosters and logos.
3. **Match Scoring**  ball-by-ball entry with the full Match Centre (5 tabs, 3-row keypad, More menu).
4. **Tournament Management**  fixtures, points tables, NRR, leaderboards.

The system is built around three goals:

1. **Run all day on a single charge**  a scorer should never need a power bank during an 8-hour match.
2. **Stay live for everyone**  ball-by-ball updates delivered to viewers within 2 seconds, across hundreds of concurrent live matches.
3. **Remember every player forever**  career statistics, unique Player IDs, and match history retained for 10 to 15 years.

To do this we use **Flutter** for the apps, **Node.js + PostgreSQL + Redis** for the backend, and host everything in **South Africa** for low latency. The system is intentionally simple, one well-organised backend, one mobile codebase, so it stays cheap to run and quick to evolve.

---

## 2. System Architecture Overview

The platform has three deployable pieces:

| Piece | Technology | What it does |
|---|---|---|
| **Mobile App** | Flutter (iOS 13+ / Android 6.0+) | Scorer interface, viewer interface, player/team/tournament management |
| **Web Viewer** | React (browser) | Lets spectators watch live scores without installing the app, on Chrome / Safari / Firefox / Edge |
| **Backend API** | Node.js + Express | Stores data, applies cricket rules, broadcasts live updates |

The backend is supported by two services:

- **PostgreSQL** the permanent database (the system of record).
- **Redis** an in-memory layer that holds the *live* match state and broadcasts updates to viewers.

The backend itself is a **modular monolith**: one application, internally divided into clean modules (Auth, Players, Teams, Matches, Scoring, Tournaments, Live-Score). This keeps development simple today and leaves a clear path to split modules into separate services later if traffic demands it.

---

## 3. Architecture Diagram

```
            ┌─────────────────────────────────────────────┐
            │              CLIENTS                        │
            │                                             │
            │   Scorer App     Viewer App    Web Viewer   │
            │   (Flutter)      (Flutter)    (browser)     │
            │   + local queue                             │
            └────────┬────────────┬────────────┬──────────┘
                     │            │            │
                     │   HTTPS (REST) + live stream
                     │            │            │
                     ▼            ▼            ▼
            ┌─────────────────────────────────────────────┐
            │         Nginx  reverse proxy + TLS         │
            └──────────────────────┬──────────────────────┘
                                   │
                                   ▼
            ┌─────────────────────────────────────────────┐
            │       Backend API (Node.js + Express)       │
            │                                             │
            │   Auth · Players · Teams · Matches ·        │
            │   Scoring · Tournaments · Live Score        │
            └──────────┬────────────────────────┬─────────┘
                       │                        │
                       ▼                        ▼
            ┌──────────────────┐      ┌──────────────────┐
            │  PostgreSQL      │      │  Redis           │
            │  (permanent      │      │  (live state +   │
            │   data)          │      │   pub/sub fan-out│
            └──────────────────┘      └──────────────────┘

            ┌──────────────────┐
            │    Blob Storage  │  (player photos, team logos)
            └──────────────────┘
```

**In plain words:**

1. The **scorer** taps a ball on their phone. The tap is recorded *locally first* so the scorer never waits.
2. The local queue **syncs** the ball to the backend over HTTPS.
3. The **backend** saves it to PostgreSQL and publishes it to Redis.
4. **Redis** fans the update out to every viewer subscribed to that match.
5. **Viewers** see the score update on their screen, usually within half a second.

---

## 4. Key Components

### 4.1 Mobile app (Flutter)

One Flutter codebase, three user-facing flows:

- **Scorer** the Match Centre (5 tabs: Scoring, Scorecard, Stats, Super Stars, Balls), the performance-critical part of the app.
- **Viewer (logged in)** browses live and upcoming matches; opens any match for a live scorecard.
- **Guest** view-only access via a shareable match link; no login required.

### 4.2 Offline queue & sync (Flutter)

This is the architectural answer to **BR-NF-06 (Data Integrity)**: scoring inputs must never be lost, even when the scorer's phone briefly drops cellular at the boundary fence.

```
Scorer tap ─▶ Local SQLite queue ─▶ Sync worker ─▶ Backend API
                  │                       │
                  │                       └─ retries on reconnect
                  ▼
            UI updates instantly
            (status badge: "synced" / "syncing" / "queued")
```

- Every ball is saved to a local SQLite queue on the device *before* the network request is even attempted.
- The UI updates from the local store, so the scorer never waits on the network.
- A background sync worker drains the queue in FIFO order. If a request fails, it is retried with exponential backoff.
- On reconnect, the queue is flushed in order so the scorecard rebuilds exactly the way the scorer entered it.
- A small status indicator in the Match Centre shows whether the last ball is `synced`, `syncing`, or `queued`.

### 4.3 Backend (Node.js + Express)

Organised as **Routes → Controllers → Services → Database**. The modules map directly to the BRD's functional requirements:

| Backend Module | BRD Section | Responsibility |
|---|---|---|
| **Auth** |  BR-AU-01 to BR-AU-07 | Registration (with T&C acceptance), login, guest access, password recovery, sessions, social login (Phase 2) |
| **Player Registry** |  BR-PL-01 to BR-PL-08 | Unique Player IDs (e.g. `GUCT-0158`), profiles, search, edit, career stats |
| **Team Management** |  BR-TM-01 to BR-TM-08 | School / Club teams, unique Team IDs, rosters, multi-team support |
| **Match Lifecycle** |  BR-MC-01 to BR-MC-08 | Match creation, format support (T20/T10/ODI/40-over/custom), toss, innings setup, optional tournament linkage, draft state |
| **Scoring Engine** |  BR-SC-01 to BR-SC-22, BR-MM-01 to BR-MM-09 | Ball-by-ball events, extras, all 10 wicket types, partnerships, fall of wickets, undo, end-over, More menu (abandon, end innings, penalty, retired hurt, D/L, change target, overs/format/wickets, settings), second innings, match result |
| **Scorecard & Data** |  BR-SD-01 to BR-SD-07 | Live scorecard, extras summary, post-match summary, PDF export, shareable URLs |
| **In-Match Analytics** |  BR-AN-01 to BR-AN-10 | Balls log, run rate chart, wagon wheel, top scorers, top bowlers, extras breakdown, Super Stars, Manhattan / Worm |
| **Tournament Management** |  BR-TO-01 to BR-TO-13 | Create / dashboard / detail / fixtures / points table (P/W/L/NR/NRR/Pts) / NRR auto-calc / knockout seeding / shareable links |
| **Live Score Broadcast** | (cross-cutting, BR-NF-03) | Sub-2-second push of every ball event to all viewers via Redis pub/sub |

### 4.4 Data layer

- **PostgreSQL** holds everything permanent: users, players, every ball ever recorded, completed scorecards, tournament tables. See the Database Design Document for the full schema.
- **Redis** holds the *current* match state in memory and broadcasts updates to viewers.
- **Cloud Storage** holds binary files (player photos, team logos) so we don't bloat the database.

### 4.5 Real-time layer

When the scorer enters a ball, the backend does two things in sequence:

1. **Saves** the ball to PostgreSQL (so it is never lost).
2. **Publishes** a small update message to Redis, which delivers it to every connected viewer.

The live stream uses a lightweight server-push channel over standard HTTPS, implemented today using Server-Sent Events, with WebSockets as a planned upgrade path if the app ever needs two-way real-time messaging (e.g. scorer-to-scorer collaboration). Functionally, both achieve the same goal stated in the Solution Document: a single persistent connection per viewer, no polling, minimal battery drain.

---

## 5. Technology Stack

| Layer | Technology | Why we chose it |
|---|---|---|
| **Mobile app** | Flutter | One codebase for iOS + Android, native performance, low battery use |
| **Local persistence on the scorer device** | SQLite (via `sqflite`) | Durable offline queue for BR-NF-06; survives app restarts |
| **Web viewer** | React (browser-based) | Lets spectators view live scores without installing the app |
| **Backend** | Node.js + Express | Fast, event-driven, ideal for many simultaneous connections |
| **Language** | TypeScript | Catches bugs at compile time before they reach users |
| **Database** | PostgreSQL 15 | Reliable, structured, supports 10 to 15 years of historical queries |
| **ORM (database access)** | Prisma | Type-safe queries, version-controlled schema migrations |
| **Cache / Pub-Sub** | Redis 7 | In-memory speed for live scores; broadcasts updates to all viewers |
| **Real-time channel** | Server push over HTTPS (SSE today; WebSockets as future option) | Lightweight persistent connection, one per viewer, no polling |
| **Auth** | JWT + bcrypt | Industry-standard stateless login |
| **File storage** | Blob Storage | Cloud storage for player photos and team logos |
| **Reverse proxy** | Nginx | Handles HTTPS, routing, and keep-alive for the live stream |
| **Containers** | Docker + docker-compose | One-command local setup; reproducible deployments |
| **Hosting** | South Africa region (AWS Cape Town / Azure SA / sponsor cloud) | Low latency for local users |
| **Design** | Figma | UI/UX wireframes and design system |

---

## 6. Data Flow

### 6.1 Standard request (e.g. create a match)

```
Scorer App  ──▶  Nginx  ──▶  Backend  ──▶  PostgreSQL
                                │
   ◀────────── response ────────┘
```

The scorer's app sends an HTTPS request with a JWT token, the backend validates it, writes to the database, and returns the result.

### 6.2 Live scoring (the real-time path)

```
1. Scorer taps a ball
        │
        ▼
2. App writes to local SQLite queue        (instant, no network)
        │
        ▼
3. Sync worker POSTs to backend
        │
        ▼
4. Backend SAVES the ball   ──▶  PostgreSQL  (permanent record)
        │
        ▼
5. Backend PUBLISHES update ──▶  Redis        (in-memory cache + fan-out)
        │
        ▼
6. Redis BROADCASTS to all subscribed viewers
        │
        ▼
7. Every viewer's screen updates  (typically within 500 ms)
```

**Target end-to-end time:** scorer tap → viewer screen in **under 2 seconds** (BR-NF-03).

### 6.3 A viewer joining mid-match

When a viewer opens a match that's already in progress, the backend sends them the **latest cached score** immediately (from Redis), then subscribes them to live updates. They never see a blank screen.

### 6.4 Reconnection after offline scoring

```
Scorer phone briefly offline
        │
        ▼
1. Each tap goes into local queue (badge: "queued: 3 balls")
        │
        ▼
2. Connection restored
        │
        ▼
3. Sync worker drains queue in FIFO order
        │
        ▼
4. Backend accepts each ball, server timestamp preserved, viewers catch up
        │
        ▼
5. Scorer UI badge clears to "synced"
```

---

## 7. Security

| Area | What we do | BRD ref |
|---|---|---|
| **Login** | Email + password; passwords hashed with bcrypt, never stored in plaintext | BR-AU-01, BR-AU-02 |
| **Sessions** | JWT tokens; client sends them with every request; session persists across app restarts | BR-AU-06 |
| **Roles** | Scorer (edits a match), Viewer (read-only), Guest (no login, public match links only), Tournament Organiser, Coach, Team Admin, Umpire | BRD §4 stakeholders |
| **Transport** | All traffic over HTTPS / TLS 1.2+ | BR-NF-07 |
| **At rest** | AES-256 volume encryption on PostgreSQL, Redis, and Blob Storage | BR-NF-07 |
| **Database** | Parameterised queries via Prisma prevent SQL injection by construction | |
| **Files** | Player photos served via signed URLs with expiry, not public links | |
| **Uploads** | File size and type checked before upload | |
| **Rate limits** | Login, register, and forgot-password endpoints rate-limited at the proxy | |
| **Logging** | Structured audit logs; no passwords or tokens ever logged | |
| **Role-based access** | Enforced in middleware; verified per BR-NF-07 | BR-NF-07 |
| **Terms & Conditions** | Acceptance timestamp captured at registration, required before account creation | BR-AU-01 |

**Phase 2 additions:** Google / Apple social login, refresh-token rotation, move JWT storage on the device to OS-level secure storage (Keychain / Keystore).

---

## 8. Scalability & Performance

### MVP targets (BRD §5.2, §7)

- 1,000 to 2,000 concurrent users; tournament Saturdays may run ~30 simultaneous matches.
- Score update reaches viewer in **under 2 seconds** (BR-NF-03).
- Scorer runs the app for **8 hours** on a 2 GB Android phone without recharging (BR-NF-11).
- System remains stable under simultaneous scoring of *hundreds* of concurrent matches (BR-NF-05, Should Have).

### How we get there

| Pressure point | How we handle it |
|---|---|
| Many viewers per match | Redis fans every update out in memory; the backend doesn't loop over connections |
| Database load | Live scores served from Redis; PostgreSQL only handles writes and historical queries |
| Polling overhead | None; one open connection per viewer, no repeated requests |
| Scorer battery | Native Flutter (no WebView), tiny update payloads (~200 bytes), dark mode for OLED screens |
| Connectivity drops at the ground | Local SQLite queue absorbs every tap; sync worker flushes on reconnect |

### Growth roadmap (no rewrite at any stage)

| Stage | Concurrent users | What changes |
|---|---|---|
| **MVP** | 1K to 2K | Single server, one Postgres + Redis instance |
| **Growth** | 5K to 10K | Multiple backend instances behind a load balancer; Postgres read replicas |
| **Scale** | 10K to 25K | Split Live-Score into its own service; add PgBouncer; CDN for assets |
| **Enterprise** | 25K+ | Horizontal auto-scaling; Redis cluster; database sharding by tournament |

---

## 9. Integration Points

| External system | Direction | Purpose |
|---|---|---|
| **Blob Storage** | Outbound | Hosts player photos, team and tournament logos |
| **Email provider** *(Phase 1.5)* | Outbound | Password-reset emails (BR-AU-04) |
| **Push notifications** *(Phase 2)* | Outbound | "Match started", "Wicket fell" alerts via Firebase Cloud Messaging |
| **Google / Apple Sign-In** *(Phase 2)* | Inbound | Alternative to email/password login (BR-AU-07) |
| **PDF export** | On device | Scorecard PDF generated locally by the Flutter app, no server cost (BR-SD-06) |
| **Share links** | OS share sheet | Public, read-only match URLs (BR-SD-07) and tournament URLs (BR-TO-13) |
| **Live stream endpoint** | Inbound (long-lived) | Viewer connects once and receives every ball as it happens (BR-NF-03) |

---

## 10. Non-Functional Requirements

Mapped one-to-one against BRD §7.

| ID | Requirement | How the architecture meets it |
|---|---|---|
| **BR-NF-01** | Free access | No paywalls, no premium tiers, no ads. Cost-controlled stack (Postgres + Redis + single Node instance) |
| **BR-NF-02** | Cross-platform | Flutter for iOS 13+ and Android 6.0+; responsive web for Chrome / Safari / Firefox / Edge |
| **BR-NF-03** | Real-time performance (< 2 s) | Redis pub/sub fan-out; single SSE connection per viewer; typical end-to-end under 500 ms |
| **BR-NF-04** | Uptime 99.5%+ with graceful degradation | Health checks; local queue keeps scoring working during backend outages; viewers fall back to polling if Redis is down |
| **BR-NF-05** | Scalability for hundreds of concurrent matches | Stateless backend; horizontal scaling path predesigned; Redis adapter for fan-out across instances |
| **BR-NF-06** | Data integrity, queued locally during connectivity drops | Local SQLite queue on every scorer device; FIFO sync on reconnect; server-side server timestamps |
| **BR-NF-07** | Data security (TLS in transit, AES-256 at rest, RBAC) | TLS 1.2+ everywhere; cloud volume encryption; role-based access in middleware |
| **BR-NF-08** | Usability (first-time scorer in 5 minutes) | Three-row keypad keeps the scoring interface flat; no training required |
| **BR-NF-09** | Accessibility (WCAG 2.1 AA on web; HIG / Material on mobile) | Phase 2 deliverable; Flutter `intl` already wired |
| **BR-NF-10** | Localisation (English at launch; Afrikaans + Zulu later) | i18n hooks present; translations added in Phase 2 |
| **BR-NF-11** | Device performance on 2 GB Android phones | Flutter AOT compilation; widget-level diffing; delta payloads; dark mode |

---

## 11. Risks & Mitigations

| # | Risk | Mitigation |
|---|------|------------|
| 1 | **Battery target missed** (the failure mode that sinks competitor apps) | Native Flutter, no WebView, no ads, tiny payloads, dark mode. Dedicated battery benchmark before launch. Hard pass criterion. |
| 2 | **Live stream drops** on flaky cellular at outdoor grounds | Client auto-reconnects; on reconnect, the backend sends the latest cached score so the viewer never sees stale data |
| 3 | **Scorer loses connectivity** mid-over | Local SQLite queue (BR-NF-06); FIFO sync on reconnect; UI status badge ("queued: 2 balls") |
| 4 | **Redis fails** | Scoring still writes to PostgreSQL; viewers fall back to fetching the latest score by polling once every few seconds |
| 5 | **Scorer mis-taps** a run or wicket | Undo last ball is built into the keypad (BR-SC-18); inline edit for batter/bowler (BR-SC-10, BR-SC-11); all balls retained in history |
| 6 | **Tournament-day traffic spike** beyond MVP capacity | Growth-stage scaling path is pre-designed; adding more backend servers needs no code changes |
| 7 | **Lost scorer phone** mid-match | The server is the source of truth; every ball is saved before broadcast, so the next scorer can pick up exactly where the previous one left off |
| 8 | **Stolen JWT token** | Short token lifetimes; HTTPS-only; refresh-token rotation in Phase 2 |
| 9 | **Vendor lock-in** (Blob Storage) | File storage is abstracted behind a service; swappable to AWS S3 or Azure Blob without touching the rest of the code |
| 10 | **Scope creep into MVP** | BRD MoSCoW priorities are the contract: only "Must Have" items ship in v1.0; advanced analytics, Duckworth-Lewis, social login are "Should" or "Could" |

---

## 12. Glossary

| Term | Definition |
|---|---|
| **Ball-by-ball scoring** | Recording every single delivery in a match (runs, extras, wickets) |
| **BRD** | Business Requirements Document, the official list of what the product must do |
| **Cache** | A fast, temporary copy of recent data so we don't hit the slower main database every time |
| **CRR / RRR** | Current Run Rate / Required Run Rate, cricket scoring metrics |
| **Fan-out** | Sending one message to many recipients at once (what Redis does for live scores) |
| **Flutter** | Google's framework for building one mobile codebase that runs on both iOS and Android |
| **JWT** | A signed login token the app sends with every request to prove who the user is |
| **Local queue** | The on-device SQLite store that holds unsynced scoring inputs while the phone is offline |
| **Modular Monolith** | One application internally divided into clean modules, combines simplicity with future flexibility |
| **MoSCoW** | A prioritisation framework: Must Have, Should Have, Could Have, Won't Have (this release) |
| **Nginx** | The web server that sits at the front, handles HTTPS, and forwards traffic to the backend |
| **NRR** | Net Run Rate, a tournament tie-breaker calculated from runs and overs |
| **ORM** | A tool that lets the backend code talk to the database in objects instead of raw SQL |
| **PostgreSQL** | The relational database that stores every player, match, and ball permanently |
| **Prisma** | The tool we use to define the database schema and read/write from it safely |
| **Pub/Sub** | "Publish/Subscribe", a pattern where one event is broadcast to many listeners |
| **Redis** | An in-memory data store used for live match state and broadcasting updates |
| **REST API** | The standard request/response style used for normal app operations |
| **SSE** | Server-Sent Events, a lightweight one-way streaming channel from server to client |
| **System of Record** | The single authoritative copy of the data (for permanent data, that's PostgreSQL) |
| **TLS / HTTPS** | The encryption that makes web traffic secure |
| **WebSocket** | A two-way persistent connection; an alternative to SSE if two-way messaging is needed |

---

