# Future Protea  System Architecture

**Application:** Future Protea Cricket Scoring & Analytics Platform
**Tagline:** *"Log Every Ball"*
**Version:** 1.0 · **Date:** 11 May 2026
**Audience:** Project Managers, Stakeholders, Engineering Team
**Companion:** Future Protea Solution Document v1.0 (Aligned to BRD v1.1)

---

## 1. Executive Summary

Future Protea is a mobile cricket scoring app for the South African grassroots cricket community schools, clubs, and amateur tournaments. One person (the **scorer**) taps every ball as it happens; thousands of **viewers** see the updated scorecard on their phone or browser within two seconds.

The platform is built around three goals:

1. **Run all day on a single charge**  a scorer should never need a power bank during an 8-hour match.
2. **Stay live for everyone**  up to 2,000 viewers across ~30 simultaneous matches on a tournament Saturday.
3. **Remember every player forever**  career statistics, unique Player IDs, and match history retained for 10–15 years.

To do this we use **Flutter** for the apps, **Node.js + PostgreSQL + Redis** for the backend, and host everything in **South Africa** for low latency. The system is intentionally simple one well-organised backend, one mobile codebase so it stays cheap to run and quick to evolve.

---

## 2. System Architecture Overview

The platform has three deployable pieces:

| Piece | Technology | What it does |
|---|---|---|
| **Mobile App** | Flutter (iOS + Android) | Scorer interface, viewer interface, player/team/tournament management |
| **Web Viewer** | React (browser) | Lets spectators watch live scores without installing the app |
| **Backend API** | Node.js + Express | Stores data, applies cricket rules, broadcasts live updates |

The backend is supported by two services:

- **PostgreSQL**  the permanent database (the system of record).
- **Redis**  an in-memory layer that holds the *live* match state and broadcasts updates to viewers.

The backend itself is a **modular monolith** — one application, internally divided into clean modules (Auth, Players, Teams, Matches, Scoring, Tournaments, Live-Score). This keeps development simple today and leaves a clear path to split modules into separate services later if traffic demands it.

---

## 3. Architecture Diagram

```
            ┌─────────────────────────────────────────────┐
            │              CLIENTS                        │
            │                                             │
            │   Scorer App     Viewer App    Web Viewer   │
            │   (Flutter)      (Flutter)    (browser)     │
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

1. The **scorer** taps a ball on their phone.
2. The **backend** saves it to PostgreSQL and publishes it to Redis.
3. **Redis** fans the update out to every viewer subscribed to that match.
4. **Viewers** see the score update on their screen — usually within half a second.

---

## 4. Key Components

### Mobile app (Flutter)
One codebase, three roles:
- **Scorer** the live-scoring screen (the most performance-critical part of the app).
- **Viewer (logged in)**  browses live and upcoming matches; opens any match for a live scorecard.
- **Guest**  view-only access via a shareable match link; no login required.

### Backend (Node.js + Express)
Organised as **Routes → Controllers → Services → Database**:

| Module | What it owns |
|---|---|
| **Auth** | Registration, login, JWT tokens, password hashing |
| **Player Registry** | Unique Player IDs (e.g. `GUCT-0158`), career profiles, photos |
| **Teams** | School/Club teams, rosters, captain/wicket-keeper flags |
| **Matches** | Match creation, toss, innings, completion, result |
| **Scoring** | Ball-by-ball events, extras, wickets, partnerships, run rates |
| **Tournaments** | Fixtures, points table, NRR, leaderboards |
| **Live Score** | Broadcasts every ball to all viewers in under 2 seconds |

### Data layer
- **PostgreSQL** holds everything permanent: users, players, every ball ever recorded, completed scorecards, tournament tables.
- **Redis** holds the *current* match state in memory and broadcasts updates to viewers.
- **Cloud Storage** holds binary files (player photos, team logos) so we don't bloat the database.

### Real-time layer
When the scorer enters a ball, the backend does two things in sequence:
1. **Saves** the ball to PostgreSQL (so it is never lost).
2. **Publishes** a small update message to Redis, which delivers it to every connected viewer.

The live stream uses a lightweight server-push channel over standard HTTPS — implemented today using Server-Sent Events, with WebSockets as a planned upgrade path if the app ever needs two-way real-time messaging (e.g. scorer-to-scorer collaboration). Functionally, both achieve the same goal stated in the Solution Document: a single persistent connection per viewer, no polling, minimal battery drain.

---

## 5. Technology Stack

| Layer | Technology | Why we chose it |
|---|---|---|
| **Mobile app** | Flutter | One codebase for iOS + Android, native performance, low battery use |
| **Web viewer** | React  (browser-based) | Lets spectators view live scores without installing the app |
| **Backend** | Node.js + Express | Fast, event-driven, ideal for many simultaneous connections |
| **Language** | TypeScript | Catches bugs at compile time before they reach users |
| **Database** | PostgreSQL 15 | Reliable, structured, supports 10–15 years of historical queries |
| **ORM (database access)** | Prisma | Type-safe queries, version-controlled schema migrations |
| **Cache / Pub-Sub** | Redis 7 | In-memory speed for live scores; broadcasts updates to all viewers |
| **Real-time channel** | Server push over HTTPS (SSE today; WebSockets as future option) | Lightweight persistent connection — one per viewer, no polling |
| **Auth** | JWT + bcrypt | Industry-standard stateless login |
| **File storage** | Blob Storage | Cloud storage for player photos and team logos |
| **Reverse proxy** | Nginx | Handles HTTPS, routing, and keep-alive for the live stream |
| **Containers** | Docker + docker-compose | One-command local setup; reproducible deployments |
| **Hosting** | South Africa region (AWS Cape Town / Azure SA / sponsor cloud) | Low latency for local users |
| **Design** | Figma | UI/UX wireframes and design system |

This stack matches the Solution Document v2.0 with two refinements based on what is built:

- **Web viewer:** the current implementation reuses Flutter Web rather than introducing a separate React stack. This saves a second codebase to maintain at MVP scale; we can revisit React for the web if SEO or load-time requirements demand it post-launch.
- **Real-time channel:** the current implementation uses SSE (Server-Sent Events). Because score updates only flow *one way* (server → viewer), SSE is lighter than WebSockets, rides on standard HTTPS, and needs no special proxy handling. The architecture is fully compatible with switching to WebSockets later — same Redis pub/sub backbone, same client behaviour.

---

## 6. Data Flow

### A. Standard request (e.g. create a match)

```
Scorer App  ──▶  Nginx  ──▶  Backend  ──▶  PostgreSQL
                                │
   ◀────────── response ────────┘
```

The scorer's app sends an HTTPS request with a JWT token, the backend validates it, writes to the database, and returns the result.

### B. Live scoring (the real-time path)

```
1. Scorer taps a ball
        │
        ▼
2. Backend SAVES the ball   ──▶  PostgreSQL  (permanent record)
        │
        ▼
3. Backend PUBLISHES update ──▶  Redis        (in-memory cache + fan-out)
        │
        ▼
4. Redis BROADCASTS to all subscribed viewers
        │
        ▼
5. Every viewer's screen updates  (typically within 500 ms)
```

**Target end-to-end time:** scorer tap → viewer screen in **under 2 seconds**.

### C. A viewer joining mid-match

When a viewer opens a match that's already in progress, the backend sends them the **latest cached score** immediately (from Redis), then subscribes them to live updates. They never see a blank screen.

---

## 7. Security

| Area | What we do |
|---|---|
| **Login** | Email + password; passwords hashed with bcrypt, never stored in plaintext |
| **Sessions** | JWT tokens issued at login; client sends them with every request |
| **Roles** | Three roles: Scorer (edits a match), Viewer (read-only), Guest (no login, public match links only) |
| **Transport** | All traffic over HTTPS / TLS 1.2+ |
| **Database** | Volume encryption on the cloud provider; parameterised queries via Prisma prevent SQL injection |
| **Files** | Player photos served via signed URLs with expiry, not public links |
| **Uploads** | File size and type checked before upload |
| **Rate limits** | Login, register, and forgot-password endpoints rate-limited at the proxy to block brute-force attempts |
| **Logging** | Structured audit logs; no passwords or tokens ever logged |

**Phase 2 additions:** Google / Apple social login, refresh-token rotation, move JWT storage on the device to OS-level secure storage (Keychain / Keystore).

---

## 8. Scalability & Performance

### MVP targets
- 1,000–2,000 concurrent users
- ~30 simultaneous matches on a tournament Saturday
- Score update reaches viewer in **under 2 seconds**
- Scorer runs the app for **8 hours** on a 2 GB Android phone without recharging

### How we get there

| Pressure point | How we handle it |
|---|---|
| Many viewers per match | Redis fans every update out in memory — the backend doesn't loop over connections |
| Database load | Live scores served from Redis; PostgreSQL only handles writes and historical queries |
| Polling overhead | None — one open connection per viewer, no repeated requests |
| Scorer battery | Native Flutter (no WebView), tiny update payloads (~200 bytes), dark mode for OLED screens |

### Growth roadmap (no rewrite at any stage)

| Stage | Concurrent users | What changes |
|---|---|---|
| **MVP** | 1K – 2K | Single server, one Postgres + Redis instance |
| **Growth** | 5K – 10K | Multiple backend instances behind a load balancer; Postgres read replicas |
| **Scale** | 10K – 25K | Split Live-Score into its own service; add PgBouncer; CDN for assets |
| **Enterprise** | 25K+ | Horizontal auto-scaling; Redis cluster; database sharding by tournament |

---

## 9. Integration Points

| External system | Direction | Purpose |
|---|---|---|
| **Cloud Storage** | Outbound | Hosts player photos, team and tournament logos |
| **Email provider** *(Phase 1.5)* | Outbound | Password-reset emails |
| **Push notifications** *(Phase 2)* | Outbound | "Match started", "Wicket fell" alerts via Firebase Cloud Messaging |
| **Google / Apple Sign-In** *(Phase 2)* | Inbound | Alternative to email/password login |
| **PDF export** | On device | Scorecard PDF generated locally by the Flutter app — no server cost |
| **Share links** | OS share sheet | Public, read-only match URLs that work in any browser |
| **Live stream endpoint** | Inbound (long-lived) | Viewer connects once and receives every ball as it happens |

---

## 10. Non-Functional Requirements

| Category | Target |
|---|---|
| **Live update latency** | Under 2 seconds end-to-end (typically under 500 ms) |
| **Battery life** | 8 hours continuous scoring on a 2 GB Android phone |
| **Update payload** | ~200 bytes per ball over the wire |
| **Concurrent users** | 1,000–2,000 at MVP; ~30 live matches in parallel |
| **Availability** | 99.5% at MVP, 99.9% after Growth stage |
| **Data loss** | Zero  every ball is saved before broadcast |
| **Recovery** | RTO ≤ 1 hour, RPO ≤ 15 minutes (point-in-time DB recovery) |
| **Platforms** | iOS 13+, Android 5.0+, modern browsers (Chrome, Safari, Firefox, Edge) |
| **Languages** | English at launch; Afrikaans + Zulu in Phase 2 |
| **Accessibility** | WCAG 2.1 AA in Phase 2 |
| **Cost** | Predictable monthly cloud spend no per-read/write fees |
| **Data retention** | 10–15 years of player and match history |

---

## 11. Risks & Mitigations

| # | Risk | Mitigation |
|---|------|------------|
| 1 | **Battery target missed** (the failure mode that sinks competitor apps) | Native Flutter, no WebView, no ads, tiny payloads, dark mode. Week 5 of the plan is a dedicated battery benchmark. Hard pass criterion before launch. |
| 2 | **Live stream drops** on flaky cellular at outdoor grounds | Client auto-reconnects; on reconnect, the backend sends the latest cached score so the viewer never sees stale data |
| 3 | **Redis fails** | The system degrades gracefully — scoring still writes to PostgreSQL; viewers fall back to fetching the latest score by polling once every few seconds |
| 4 | **Scorer mis-taps** a run or wicket | Undo last ball is built into the keypad; inline edit for batter/bowler; all balls are kept in history |
| 5 | **Tournament-day traffic spike** beyond MVP capacity | The Growth-stage scaling path is pre-designed — adding more backend servers needs no code changes |
| 6 | **Lost scorer phone** mid-match | The server is the source of truth — every ball is saved before broadcast, so the next scorer can pick up exactly where the previous one left off |
| 7 | **Stolen JWT token** | Short token lifetimes; HTTPS-only; refresh-token rotation in Phase 2 |
| 8 | **Vendor lock-in** (Storage) | File storage is abstracted behind a service — swappable to AWS S3 or Azure Blob without touching the rest of the code |

---

## 12. Glossary

| Term | Definition |
|---|---|
| **Ball-by-ball scoring** | Recording every single delivery in a match — runs, extras, wickets |
| **BRD** | Business Requirements Document — the official list of what the product must do |
| **Cache** | A fast, temporary copy of recent data so we don't hit the slower main database every time |
| **CRR / RRR** | Current Run Rate / Required Run Rate — cricket scoring metrics |
| **Fan-out** | Sending one message to many recipients at once (what Redis does for live scores) |
| **Flutter** | Google's framework for building one mobile codebase that runs on both iOS and Android |
| **JWT** | A signed login token the app sends with every request to prove who the user is |
| **Modular Monolith** | One application internally divided into clean modules — combines simplicity with future flexibility |
| **Nginx** | The web server that sits at the front, handles HTTPS, and forwards traffic to the backend |
| **NRR** | Net Run Rate — a tournament tie-breaker calculated from runs and overs |
| **ORM** | A tool that lets the backend code talk to the database in objects instead of raw SQL |
| **PostgreSQL** | The relational database that stores every player, match, and ball permanently |
| **Prisma** | The tool we use to define the database schema and read/write from it safely |
| **Pub/Sub** | "Publish/Subscribe" — a pattern where one event is broadcast to many listeners |
| **Redis** | An in-memory data store used for live match state and broadcasting updates |
| **REST API** | The standard request/response style used for normal app operations (login, create match, fetch scorecard) |
| **SSE** | Server-Sent Events — a lightweight one-way streaming channel from server to client; used here to push live scores |
| **System of Record** | The single authoritative copy of the data (for permanent data, that's PostgreSQL) |
| **TLS / HTTPS** | The encryption that makes web traffic secure |
| **WebSocket** | A two-way persistent connection between app and server; an alternative to SSE if two-way real-time messaging is needed |

---


