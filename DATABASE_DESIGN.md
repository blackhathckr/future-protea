# Future Protea  Database Design Document

**Application:** Future Protea Cricket Scoring & Analytics Platform
**Database:** PostgreSQL 15
**Schema Owner:** Backend Team
**Version:** 2.0 · **Date:** 11 May 2026
**Audience:** Project Managers, Stakeholders, Engineering Team
**Companion:** Future Protea BRD v1.1 (final, April 2026), System Architecture v2.0, Solution Document v1.0, Roles & Responsibilities v1.0

---

## 1. Executive Summary

The Future Protea database is the long-term memory of the platform. It stores every account, every player, every team, every match, every ball, and every tournament so that career statistics, points tables, and scorecards remain accurate and queryable for **10 to 15 years**.

This document maps every functional requirement (BR-AU, BR-PL, BR-TM, BR-MC, BR-SC, BR-MM, BR-SD, BR-AN, BR-TO) and every non-functional requirement (BR-NF-01 to BR-NF-11) from the BRD v1.1 (final) to the database tables that support it. The database is built on **PostgreSQL 15** and managed through **Prisma**, which keeps the schema versioned in code and applies changes safely.

In plain English, the schema is organised into six domains:

1. **Identity & Access** who can log in and what they are allowed to do.
2. **Player Registry** career-long player records with unique Player IDs (BR-PL-02).
3. **Teams** schools and clubs, with rosters and captains.
4. **Matches & Scoring** the matches, innings, ball-by-ball events, partnerships, fall of wickets.
5. **Tournaments** fixtures, stages (league, semis, finals), points tables, leaderboards.
6. **Operations & Compliance** audit logs, POPIA consent for minors, push tokens, offline-sync metadata.

The schema is optimised for two very different workloads:

- **Live scoring** writes (one ball a second, every ball appended; BR-NF-03).
- **Analytical reads** for career stats, scorecards, points tables (read-heavy, cacheable).

It is also designed to absorb **offline scoring** from the Flutter client per BR-NF-06: each ball carries a client-side identifier so the backend can deduplicate retries from the local queue.

---

## 2. Design Principles

| Principle | What it means |
|---|---|
| **One source of truth** | Each fact is stored once. Career averages are computed from `balls` + `player_scores`, never duplicated. |
| **Append-only history** | Every ball ever bowled is kept forever. Corrections become new rows; the original ball is retained for audit. |
| **CUID2 identifiers** | All primary keys use collision-resistant URL-safe IDs. Used directly as public share tokens for matches and tournaments (BR-SD-07, BR-TO-13). |
| **Soft links where it matters** | If a tournament is deleted, its matches survive (they just lose the tournament link). |
| **Hard cascades for child data** | If a match is deleted, every ball and roster entry for that match goes with it. |
| **Snake_case in the database, camelCase in code** | Prisma maps between the two automatically. |
| **No raw secrets, no PII in logs** | Passwords are bcrypt-hashed before insert; logs never contain credentials or contact info. |
| **Phase-gated columns** | Phase 2 columns (DLS targets, draft state, ball colour, multi-stage knockouts) are marked clearly so they can be added without disrupting Phase 1. |
| **Idempotent ball writes** | Each ball carries a client-side `client_ball_id` so offline retries (BR-NF-06) cannot create duplicates. |
| **BRD-traceable** | Every BRD functional and non-functional requirement maps to a specific table or column (see Section 5). |

---

## 3. Entity-Relationship Diagram

```
                          ┌──────────────────┐
                          │      users       │ (accounts)
                          └────┬─────────────┘
                               │
                  ┌────────────┼────────────┬─────────────┬──────────────┐
                  │            │            │             │              │
                  ▼            ▼            ▼             ▼              ▼
          ┌──────────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐ ┌───────────┐
          │ user_roles   │ │  teams  │ │ matches │ │ tournaments │ │registered │
          │ (multi-role) │ └────┬────┘ └────┬────┘ └──────┬──────┘ │ players   │
          └──────────────┘      │           │             │        └─────┬─────┘
                                ▼           │             │              │
                       ┌──────────────┐     │             │              │
                       │ team_players │◀────┼─────────────┼──────────────┘
                       └──────────────┘     │             │
                                            │             │
                  ┌─────────────────────────┼─────────────┴───────────────────┐
                  │                         │                                 │
                  ▼                         ▼                                 ▼
        ┌──────────────────┐      ┌─────────────────┐               ┌────────────────────┐
        │ match_innings    │      │ match_players   │               │ tournament_teams   │
        │ match_officials  │      │ player_scores   │               │ tournament_fixtures│
        └────────┬─────────┘      └─────────────────┘               │ tournament_stages  │
                 │                                                  └────────────────────┘
                 ▼
        ┌──────────────────┐
        │      balls       │
        │  partnerships    │
        │ fall_of_wickets  │
        │ dls_adjustments  │
        └──────────────────┘

         OPERATIONS / COMPLIANCE
         ┌────────────────┐ ┌────────────────┐ ┌──────────────────┐
         │  audit_log     │ │ device_tokens  │ │ consent_records  │
         │                │ │ (Phase 2)      │ │ (POPIA / minors) │
         └────────────────┘ └────────────────┘ └──────────────────┘
```

---

## 4. Data Dictionary

Every table the platform needs is grouped below by domain. Full column types and constraints live in [backend/prisma/schema.prisma](backend/prisma/schema.prisma). Columns marked **NEW** are additions on top of what exists in code today; columns / tables marked *Phase 2* are scheduled for after MVP launch.

### 4.1 Identity & Access

#### `users`  Accounts that can log in
Satisfies BR-AU-01, BR-AU-02, BR-AU-04, BR-AU-05, BR-AU-06.

| Column | Type | Notes |
|---|---|---|
| `id` | CUID | Primary key |
| `name` | varchar(255) | Display name; used for personalised greeting (BR-AU-05) |
| `email` | varchar(255) | **Unique**; login identifier (BR-AU-02) |
| `password` | varchar(255) | bcrypt hash, never plaintext |
| `phone` | varchar(20) | Optional |
| `photo_url` | varchar(500) | Profile photo |
| `date_of_birth` | date | Used for POPIA minor checks |
| `batting_style` / `bowling_style` | varchar(50) | If the user is also a player |
| `approved` | boolean | For admin-moderated registration flows |
| `terms_accepted_at` **NEW** | timestamp | T&C acceptance timestamp (BR-AU-01) |
| `privacy_accepted_at` **NEW** | timestamp | Privacy Policy acceptance (BR-AU-01) |
| `password_reset_token` **NEW** | varchar(255) (nullable) | For Forgot Password flow (BR-AU-04) |
| `password_reset_expires_at` **NEW** | timestamp | Reset link expiry |
| `created_at`, `last_login` | timestamp | Audit |

#### `user_roles`  Multi-role assignment **NEW**
A user can hold several roles at once: a scorer can also be a coach; a player can also be a team admin. Aligned to BRD §4 stakeholders.

| Column | Type | Notes |
|---|---|---|
| `user_id` | FK → `users.id` | Cascade delete |
| `role` | varchar(30) | One of: `scorer`, `player`, `team_admin`, `tournament_organiser`, `coach`, `umpire`, `spectator`, `school_admin`, `club_admin`, `admin` |
| `granted_at` | timestamp | When the role was given |
| `granted_by` | FK → `users.id` | Who granted it (nullable for self-registration) |

**Unique constraint:** `(user_id, role)`.

---

### 4.2 Player Registry

#### `registered_players`  Career-long player registry
Satisfies BR-PL-01, BR-PL-02, BR-PL-03, BR-PL-04, BR-PL-05, BR-PL-08.

| Column | Type | Notes |
|---|---|---|
| `id` | CUID | Primary key |
| `player_id_code` | varchar(50) | **Unique** human-readable ID, e.g. `GUCT-0158` (BR-PL-02) |
| `name`, `date_of_birth` | | Required at registration (BR-PL-01) |
| `email`, `phone`, `emergency_contact*` | | Contact info |
| `address`, `city`, `state`, `country`, `postal_code` | | Address |
| `height`, `weight`, `blood_group` | | Physical stats |
| `school_name`, `club_name` | | Affiliation (BR-PL-01) |
| `batting_style`, `bowling_style`, `playing_role`, `jersey_number` | | Cricket details |
| `photo_url` | | Optional profile photo (BR-PL-01) |
| `father_name`, `mother_name`, `guardian_name`, `nationality` | | Family / legal info |
| `is_minor` | boolean (computed) **NEW** | Derived from `date_of_birth` < 18; drives parental consent |
| `linked_user_id` | FK → `users.id` (nullable) **NEW** | Optional link if the player has registered themselves |
| `created_by` | FK → `users.id` | Who registered this player |

> **Career stats** (BR-PL-06: matches, runs, average, strike rate, highest score, 50s, 100s, wickets, economy, best figures) are computed at read time from `balls` + `player_scores` rather than stored as separate columns; this keeps the values authoritative and avoids drift after edits or undos.
>
> **Player match history** (BR-PL-07) is computed from `match_players` joined with `matches`.

#### `consent_records`  POPIA / parental consent **NEW (Phase 1.5)**
Required for players under 18.

| Column | Type | Notes |
|---|---|---|
| `id` | CUID | Primary key |
| `player_id` | FK → `registered_players.id` | Cascade delete |
| `consent_type` | varchar(30) | `parental_registration`, `photo_publication`, `data_retention` |
| `granted_by_name` | varchar(255) | Parent or guardian name |
| `granted_by_relationship` | varchar(50) | `father`, `mother`, `guardian` |
| `granted_at` | timestamp | When consent was given |
| `evidence_url` | varchar(500) | Optional scanned form |
| `revoked_at` | timestamp (nullable) | If consent is later withdrawn |

---

### 4.3 Teams

#### `teams`  School and club teams
Satisfies BR-TM-01, BR-TM-02, BR-TM-03, BR-TM-06, BR-TM-08.

| Column | Type | Notes |
|---|---|---|
| `id` | CUID | Primary key. Also the Team ID shown in the UI, e.g. `GUCT-1024` (BR-TM-02) |
| `team_name` | varchar(255) | Display name |
| `team_type` | varchar(20) | `school` or `club` (BR-TM-03) |
| `school_name`, `club_name` | | Affiliation |
| `logo_url` | | Optional team logo (BR-TM-01) |
| `created_by` | FK → `users.id` | Team admin / coach |

#### `team_players`  Team rosters
Satisfies BR-TM-04, BR-TM-05.

| Column | Type | Notes |
|---|---|---|
| `team_id` | FK → `teams.id` | Cascade delete |
| `player_id` | FK → `registered_players.id` | Cascade delete |
| `is_captain`, `is_wicket_keeper` | boolean | Role flags |

**Unique constraint:** `(team_id, player_id)`.

> **Team statistics** (BR-TM-07 Should Have): aggregated read-time from `matches` + `player_scores`.

---

### 4.4 Matches & Scoring

#### `matches`  The games themselves
Satisfies BR-MC-01 to BR-MC-08, BR-SC-21, BR-SC-22, BR-SD-05, BR-SD-07.

| Column | Type | Notes |
|---|---|---|
| `id` | CUID | Primary key. Also the public share token (BR-SD-07) |
| `team1_name`, `team2_name` | varchar(255) | The two sides |
| `team1_id`, `team2_id` | FK → `teams.id` (nullable) **NEW** | Strong references when teams are registered |
| `venue` | | Ground |
| `total_overs` | int | Match overs (BR-MC-02) |
| `balls_per_over` | int | 6 default; 7-ball / 8-ball modes supported (BR-MC-03, Should Have) |
| `match_type` | varchar(20) | `T20`, `T10`, `ODI`, `40-over`, `custom` (BR-MC-02) |
| `status` | varchar(20) | `draft` (BR-MC-07, Should Have) → `upcoming` → `live` → `completed` / `abandoned` |
| `toss_winner`, `toss_decision` | | Recorded at start (BR-MC-04) |
| `team1_score`, `team1_wickets`, `team1_overs` | | Innings 1 running totals |
| `team2_score`, `team2_wickets`, `team2_overs` | | Innings 2 running totals |
| `current_innings` | int | 1 or 2 |
| `ball_colour` | varchar(20) **Phase 2** | `red`, `white`, `pink` (BR-MM-09, Could Have) |
| `playing_conditions` | text **Phase 2** | Free-form notes (BR-MM-09) |
| `dls_active` | boolean **Phase 2** | True if DLS applied (BR-MM-06, Should Have) |
| `result_type` | varchar(20) **NEW** | `by_runs`, `by_wickets`, `tie`, `no_result`, `abandoned` (BR-SC-22) |
| `result_margin` | int (nullable) **NEW** | The margin (runs or wickets) (BR-SC-22) |
| `winner_team_id` | FK → `teams.id` (nullable) **NEW** | Strong reference to winning side |
| `player_of_match_id` | FK → `registered_players.id` (nullable) **NEW** | Strong reference (BR-SD-05) |
| `match_date` | timestamp | Scheduled start (BR-MC-01) |
| `created_by` | FK → `users.id` | The scorer |
| `tournament_id` | FK → `tournaments.id` (nullable) | Optional linkage (BR-MC-08) |

#### `match_innings`  Explicit innings tracking **NEW**
Required by BR-MC-05, BR-MC-06, BR-SC-21, BR-SD-04. Each match has up to two innings.

| Column | Type | Notes |
|---|---|---|
| `id` | CUID | Primary key |
| `match_id` | FK → `matches.id` | Cascade delete |
| `innings_number` | int | 1 or 2 |
| `batting_team_id` | FK → `teams.id` | Who is batting |
| `bowling_team_id` | FK → `teams.id` | Who is bowling |
| `striker_id`, `non_striker_id` | FK → `registered_players.id` | Current pair at the crease (BR-MC-05) |
| `current_bowler_id` | FK → `registered_players.id` | Bowler of the current over |
| `target_runs` | int (nullable) | Set for the second innings (BR-SC-21) |
| `total_runs`, `total_wickets`, `total_overs`, `total_balls` | | Running totals |
| `extras_wides`, `extras_noballs`, `extras_byes`, `extras_legbyes`, `extras_penalties` | int **NEW** | Aggregated extras by type, used in the scorecard (BR-SD-04) |
| `status` | varchar(20) | `in_progress`, `completed`, `declared` (Phase 2), `all_out`, `target_chased` |
| `started_at`, `ended_at` | timestamp | Innings clock |

**Unique constraint:** `(match_id, innings_number)`.

#### `match_players`  Match-day squads

| Column | Type | Notes |
|---|---|---|
| `match_id` | FK → `matches.id` | Cascade delete |
| `player_id` | FK → `registered_players.id` | Cascade delete |
| `team` | int | 1 or 2 |
| `is_captain`, `is_wicket_keeper` | boolean **NEW** | Per-match leadership |
| `status` | varchar(20) | `pending`, `playing`, `confirmed` |

**Unique constraint:** `(match_id, player_id)`.

#### `match_officials`  Umpires and scorers **NEW**
Replaces the legacy `matches.umpire` varchar with a proper relation (BR-MC-05).

| Column | Type | Notes |
|---|---|---|
| `match_id` | FK → `matches.id` | Cascade delete |
| `official_id` | FK → `users.id` (nullable) | If umpire is a registered user |
| `official_name` | varchar(255) | Always populated, even for guest umpires |
| `role` | varchar(30) | `umpire_main`, `umpire_leg`, `third_umpire`, `match_referee` |
| `assigned_at` | timestamp | When the scorer added them |

#### `player_scores`  Per-match per-player aggregates
Satisfies BR-SD-01 (live scorecard with batting and bowling figures).

| Column | Type | Notes |
|---|---|---|
| `match_id`, `player_id`, `team` | FKs | Cascade delete |
| **Batting** | | |
| `runs_scored`, `balls_faced`, `fours`, `sixes` | int | Batting figures (R / B / 4s / 6s) |
| `is_out`, `out_type` | | Dismissal info |
| `dismissed_by_id`, `fielder_id` **NEW** | FK → `registered_players.id` | Bowler / fielder credited |
| **Bowling** | | |
| `overs_bowled`, `runs_conceded`, `wickets_taken`, `maidens` | | Bowling figures (O / M / R / W) |
| **Fielding** | | |
| `catches`, `run_outs` | int | Fielding contributions |

**Unique constraint:** `(match_id, player_id)`.

#### `balls`  Every delivery ever bowled
Satisfies BR-SC-12 to BR-SC-20, BR-AN-01b (Balls tab delivery log).

| Column | Type | Notes |
|---|---|---|
| `id` | CUID | Primary key |
| `client_ball_id` **NEW** | varchar(50) | Idempotency key from the Flutter local queue (BR-NF-06) |
| `match_id` | FK → `matches.id` | Cascade delete |
| `innings` | int | 1 or 2 |
| `over_number`, `ball_number` | int | Position |
| `batsman_id`, `bowler_id` | FK → `registered_players.id` | Who was on strike / bowling |
| `non_striker_id` **NEW** | FK | The non-striker at the time |
| `runs` | int | Runs scored off the bat (BR-SC-12); supports 4-5-6-7 via BR-SC-16 |
| `is_wide`, `is_noball`, `is_bye`, `is_legbye` | bool | Extras flags (BR-SC-13) |
| `extras`, `overthrows` | int | Extra runs |
| `is_wicket`, `wicket_type` | | Dismissal record (BR-SC-17), see wicket-type list below |
| `fielder_id` **NEW** | FK | Catcher / run-out fielder |
| `shot_direction` | varchar(30) | For wagon-wheel analytics (BR-AN-03) |
| `commentary` | text | Optional text |
| `is_active` **NEW** | boolean | False if undone (BR-SC-18); kept for audit |
| `superseded_by_ball_id` **NEW** | FK → `balls.id` | Points to the replacement ball after a correction |
| `created_at` | timestamp | Authoritative event time |

**Unique constraint:** `(match_id, client_ball_id)`  prevents duplicate writes when the local queue retries.

**Wicket types** (`wicket_type`), enumerated per BR-SC-17:

`bowled`, `caught`, `lbw`, `run_out`, `stumped`, `hit_wicket`, `retired_out`, `obstructing_field`, `handled_ball`, `timed_out`.

(`retired_hurt` is recorded but treated as a non-dismissal, per BR-MM-05.)

#### `partnerships`  Batting partnerships **NEW**
Satisfies BR-SC-04 (partnership display, Must) and BR-SD-03 (detailed partnership tracker, Should).

| Column | Type | Notes |
|---|---|---|
| `id` | CUID | Primary key |
| `match_id`, `innings_id` | FKs | Cascade delete |
| `wicket_number` | int | 1 for opening partnership, 2 for second, etc. |
| `batsman1_id`, `batsman2_id` | FK → `registered_players.id` | The pair |
| `runs`, `balls`, `fours`, `sixes` | int | Partnership totals |
| `batsman1_runs`, `batsman2_runs` | int | Individual contributions |
| `started_at_score`, `ended_at_score` | int | Score when partnership started / ended |
| `started_over`, `ended_over` | float | Over progress |
| `unbroken` | boolean | True if still at the crease at innings end |

#### `fall_of_wickets`  Wicket-by-wicket history **NEW**
Satisfies BR-SD-02 (fall of wickets: score, over, method).

| Column | Type | Notes |
|---|---|---|
| `id` | CUID | Primary key |
| `match_id`, `innings_id` | FKs | Cascade delete |
| `wicket_number` | int | 1, 2, 3 ... 10 |
| `batsman_id` | FK → `registered_players.id` | Who got out |
| `dismissal_type` | varchar(30) | One of the BR-SC-17 wicket types |
| `bowler_id`, `fielder_id` | FKs (nullable) | Credits |
| `runs_at_fall`, `overs_at_fall` | | Team score at the moment of the wicket |

#### `dls_adjustments`  Duckworth-Lewis-Stern targets **Phase 2**
Satisfies BR-MM-06 (Should Have).

| Column | Type | Notes |
|---|---|---|
| `id` | CUID | Primary key |
| `match_id`, `innings_id` | FKs | Cascade delete |
| `original_target` | int | Pre-interruption target |
| `revised_target` | int | Post-interruption target |
| `revised_overs` | float | New overs available |
| `par_score` | int (nullable) | DLS par at moment of interruption |
| `interruption_at_over` | float | When play stopped |
| `applied_by` | FK → `users.id` | Scorer who applied the revision |
| `applied_at` | timestamp | |
| `reason` | text | Free-form note |

---

### 4.5 Tournaments

#### `tournaments`
Satisfies BR-TO-01, BR-TO-02, BR-TO-03, BR-TO-04, BR-TO-05, BR-TO-12, BR-TO-13.

| Column | Type | Notes |
|---|---|---|
| `id` | CUID | Primary key. Also the public share token (BR-TO-13) |
| `name`, `type`, `overs` | | Tournament identity (BR-TO-01) |
| `start_date`, `end_date`, `venue`, `organizer` | | Logistics |
| `logo_url` | | Optional branding (BR-TO-01) |
| `status` | varchar(20) | `upcoming`, `in_progress`, `completed` (BR-TO-04) |
| `created_by` | FK → `users.id` | Tournament admin |

#### `tournament_teams`  Points-table rows
Satisfies BR-TO-07, BR-TO-09, BR-TO-08.

| Column | Type | Notes |
|---|---|---|
| `tournament_id`, `team_id` | FKs | Cascade delete |
| `group_name` | varchar(50) | For multi-group tournaments, e.g. `Group A`, `Group B` (BR-TO-08) |
| `played`, `won`, `lost`, `no_result`, `points` | | Standings (P/W/L/NR/Pts) |
| `runs_for`, `overs_for`, `runs_against`, `overs_against`, `nrr` | | NRR calculation inputs (BR-TO-09) |

**Unique constraint:** `(tournament_id, team_id)`.

#### `tournament_fixtures`  Scheduled matches
Satisfies BR-TO-06.

| Column | Type | Notes |
|---|---|---|
| `tournament_id` | FK | Cascade delete |
| `match_id` | FK → `matches.id` (nullable) | Set when the match record is created |
| `team1_name`, `team2_name` | | Even if teams are unresolved at scheduling time |
| `match_date`, `venue` | | Schedule |
| `group_name`, `stage_id` **NEW** | | Group + stage references |
| `status` | varchar(20) | `upcoming`, `live`, `completed`, `abandoned` |
| `winner` | | Result label |

#### `tournament_stages`  League / Group / Semi / Final **NEW (Phase 2)**
Satisfies BR-TO-10 (knockout / semi-final auto seeding, Should Have).

| Column | Type | Notes |
|---|---|---|
| `id` | CUID | Primary key |
| `tournament_id` | FK | Cascade delete |
| `stage_name` | varchar(50) | `league`, `quarter_final`, `semi_final`, `final` |
| `stage_order` | int | Display order |
| `seed_rule` | text | How fixtures are seeded from prior stage |

---

### 4.6 Operations & Compliance

#### `audit_log`  Critical changes **NEW (Phase 1.5)**
Captures sensitive events: ball undos (BR-SC-18), match abandons (BR-MM-02), player profile edits (BR-PL-05), role grants, consent records.

| Column | Type | Notes |
|---|---|---|
| `id` | CUID | Primary key |
| `actor_user_id` | FK → `users.id` (nullable) | Who did it |
| `action` | varchar(50) | `ball_undo`, `match_abandon`, `player_edit`, `role_grant`, `consent_record` ... |
| `entity_type` | varchar(50) | `match`, `ball`, `player`, `user` ... |
| `entity_id` | varchar(50) | The affected row |
| `before`, `after` | jsonb | Field-level diff |
| `created_at` | timestamp | When |
| `ip_address` | varchar(45) | Source IP |

#### `device_tokens`  Push notifications **Phase 2**

| Column | Type | Notes |
|---|---|---|
| `user_id` | FK → `users.id` | Cascade delete |
| `token` | varchar(255) | FCM device token |
| `platform` | varchar(20) | `ios`, `android`, `web` |
| `last_seen_at` | timestamp | Refreshed on each app launch |

---

## 5. BRD Coverage Matrix

Every BRD functional and non-functional requirement maps to the tables below. Priority is shown using the BRD's MoSCoW convention.

### 5.1 Functional Requirements (§6)

| BR-ID | Requirement | Priority | Tables / columns |
|---|---|---|---|
| **BR-AU-01** | User Registration (name, email, password, DOB, T&C) | Must | `users` + `terms_accepted_at`, `privacy_accepted_at` |
| **BR-AU-02** | Email / Password Login | Must | `users.email`, `users.password` |
| **BR-AU-03** | Guest Access | Must | No DB row needed; public endpoints keyed by `matches.id` / `tournaments.id` |
| **BR-AU-04** | Password Recovery | Must | `users.password_reset_token`, `users.password_reset_expires_at` |
| **BR-AU-05** | Personalised Greeting | Should | `users.name` |
| **BR-AU-06** | Session Persistence | Must | JWT (no DB row); client stores token |
| **BR-AU-07** | Social Login | Could | `users` (new auth-provider columns to be added in Phase 2) |
| **BR-PL-01** | Player Registration | Must | `registered_players` |
| **BR-PL-02** | Unique Player ID | Must | `registered_players.player_id_code` (unique) |
| **BR-PL-03** | Player Profile View | Must | `registered_players` + computed `team_players` |
| **BR-PL-04** | Player List & Search | Must | `registered_players` + name / school indexes |
| **BR-PL-05** | Edit Player | Must | `registered_players` (UPDATE) + `audit_log` |
| **BR-PL-06** | Career Statistics | Must | Computed from `balls` + `player_scores` |
| **BR-PL-07** | Player Match History | Should | `match_players` + `matches` |
| **BR-PL-08** | Player Search by ID | Must | `registered_players.player_id_code` lookup |
| **BR-TM-01** | Team Registration | Must | `teams` |
| **BR-TM-02** | Unique Team ID | Must | `teams.id` (CUID, shown as `GUCT-1024`) |
| **BR-TM-03** | School / Club Toggle | Must | `teams.team_type` |
| **BR-TM-04** | Team Roster Management | Must | `team_players` |
| **BR-TM-05** | Add Player to Team | Must | `team_players` (INSERT) by name or `player_id_code` |
| **BR-TM-06** | Team Profile View | Must | `teams` + `team_players` |
| **BR-TM-07** | Team Statistics | Should | Computed from `matches` + `player_scores` |
| **BR-TM-08** | Multiple Teams per User | Should | `teams.created_by` (no upper bound) |
| **BR-MC-01** | Create Match | Must | `matches` |
| **BR-MC-02** | Match Type Support | Must | `matches.match_type`, `matches.total_overs` |
| **BR-MC-03** | Balls Per Over (6/7/8) | Should | `matches.balls_per_over` |
| **BR-MC-04** | Toss Recording | Must | `matches.toss_winner`, `matches.toss_decision` |
| **BR-MC-05** | Innings Setup | Must | `match_innings` + `match_officials` |
| **BR-MC-06** | Batting / Bowling Toggle | Must | `match_innings.batting_team_id`, `bowling_team_id` |
| **BR-MC-07** | Save Match Draft | Should | `matches.status = 'draft'` |
| **BR-MC-08** | Tournament Linkage | Must | `matches.tournament_id` |
| **BR-SC-01..07** | Score header, info bar, share | Must / Should | `match_innings` + `matches.id` for share URL |
| **BR-SC-08..11** | Batsman / Bowler panels with inline edit | Must | `match_innings.striker_id`, `non_striker_id`, `current_bowler_id` + `player_scores` |
| **BR-SC-12..16** | Scoring keypad (rows 1, 2, 3) + extended runs | Must / Should | `balls.runs`, `balls.is_wide`, `is_noball`, `is_bye`, `is_legbye`, `overthrows` |
| **BR-SC-17** | Out button + 10 wicket types | Must | `balls.is_wicket`, `balls.wicket_type` |
| **BR-SC-18** | Undo Last Ball | Must | `balls.is_active`, `balls.superseded_by_ball_id` + `audit_log` |
| **BR-SC-19** | Automated Calculations | Must | `match_innings` running totals + `player_scores` recompute on every ball |
| **BR-SC-20** | End Over | Must | `match_innings.current_bowler_id` swap, `striker_id` rotation |
| **BR-SC-21** | Second Innings Transition | Must | `match_innings` (innings_number=2) with `target_runs` |
| **BR-SC-22** | Match Result | Must | `matches.result_type`, `result_margin`, `winner_team_id` |
| **BR-MM-01..02** | More Panel, Abandon | Must | `matches.status = 'abandoned'` + `audit_log` |
| **BR-MM-03** | End Innings (manual / declare) | Must | `match_innings.status = 'declared'` or `'completed'` |
| **BR-MM-04** | Penalty Runs (5) | Must | `balls` row with `extras = 5` and a `penalty` flag (or `playing_team` credit) |
| **BR-MM-05** | Retired Hurt | Must | `balls.wicket_type = 'retired_hurt'` (non-dismissal) |
| **BR-MM-06** | Duckworth-Lewis (DLS) | Should | `dls_adjustments` (Phase 2) + `matches.dls_active` |
| **BR-MM-07** | Change Target | Should | `match_innings.target_runs` (UPDATE) |
| **BR-MM-08** | Overs / Format / Wickets | Should | `matches.total_overs`, `match_type` mid-match updates |
| **BR-MM-09** | Match Settings (ball colour, conditions) | Could | `matches.ball_colour`, `playing_conditions` |
| **BR-SD-01** | Live Scorecard View | Must | `player_scores` + `match_innings` |
| **BR-SD-02** | Fall of Wickets | Must | `fall_of_wickets` |
| **BR-SD-03** | Partnership Tracker | Should | `partnerships` |
| **BR-SD-04** | Extras Summary by Type | Must | `match_innings.extras_wides`, `noballs`, `byes`, `legbyes`, `penalties` |
| **BR-SD-05** | Post-Match Summary | Must | `matches.result_type`, `winner_team_id`, `player_of_match_id` |
| **BR-SD-06** | PDF Scorecard Export | Must | Client-side render from scorecard reads; no DB impact |
| **BR-SD-07** | Shareable Match Link | Must | `matches.id` used as the public share token |
| **BR-AN-01** | 5-Tab Match Centre | Must | UI only; reads from `match_innings`, `player_scores`, `balls` |
| **BR-AN-01b** | Balls Tab Delivery Log | Must | `balls` chronological scan, `is_active = true` |
| **BR-AN-02** | Run Rate Chart | Must | Aggregated from `balls` per over |
| **BR-AN-03** | Wagon Wheel | Must | `balls.shot_direction` |
| **BR-AN-04** | Top Scorers Panel | Must | `player_scores` ORDER BY `runs_scored` DESC |
| **BR-AN-05** | Top Bowlers Panel | Must | `player_scores` ORDER BY `wickets_taken` DESC |
| **BR-AN-06** | Extras Breakdown | Must | `match_innings.extras_*` |
| **BR-AN-07** | Super Stars Leaderboard | Should | Composite computed from `player_scores` |
| **BR-AN-08** | Boundary Tracker (4s / 6s) | Should | `player_scores.fours`, `sixes` + `balls` |
| **BR-AN-09** | Manhattan Chart | Could | Aggregated from `balls` per over |
| **BR-AN-10** | Worm Chart | Could | Cumulative `balls.runs` per over for both innings |
| **BR-TO-01** | Create Tournament | Must | `tournaments` |
| **BR-TO-02** | Tournament Dashboard | Must | `tournaments` filtered by `status` |
| **BR-TO-03** | View & Filter Tournaments | Must | `tournaments` indexes on `status` |
| **BR-TO-04** | Tournament Status Badges | Must | `tournaments.status` |
| **BR-TO-05** | Tournament Detail Page | Must | `tournaments` + `tournament_fixtures` + `tournament_teams` |
| **BR-TO-06** | Fixtures Management | Must | `tournament_fixtures` |
| **BR-TO-07** | Points Table | Must | `tournament_teams` |
| **BR-TO-08** | Group Stage Management | Should | `tournament_teams.group_name` |
| **BR-TO-09** | NRR Calculation | Must | `tournament_teams.runs_for`, `overs_for`, `runs_against`, `overs_against`, `nrr` |
| **BR-TO-10** | Knockout / Semi-final Support | Should | `tournament_stages` + `tournament_fixtures.stage_id` |
| **BR-TO-11** | Tournament Statistics | Must | Aggregated from `player_scores` across the tournament's matches |
| **BR-TO-12** | Edit Tournament | Should | `tournaments` (UPDATE) + `audit_log` |
| **BR-TO-13** | Shareable Tournament Link | Should | `tournaments.id` used as the public share token |

### 5.2 Non-Functional Requirements (§7)

| BR-NF | Requirement | DB-layer impact |
|---|---|---|
| **BR-NF-01** | Free Access | None at DB layer; no billing tables |
| **BR-NF-02** | Cross-Platform | None; clients shape data, DB serves all |
| **BR-NF-03** | Real-Time Performance (< 2 s) | Redis caches live state; DB only on the write path |
| **BR-NF-04** | Uptime 99.5% + graceful degradation | Nightly backups; WAL archiving |
| **BR-NF-05** | Scalability (hundreds of concurrent matches) | Indexes by `match_id`; partitioning of `balls` by `match_id` if needed at Scale stage |
| **BR-NF-06** | Data Integrity / queued locally | `balls.client_ball_id` idempotency key prevents duplicate writes on retry |
| **BR-NF-07** | Data Security (TLS + AES-256 + RBAC) | Volume encryption; `user_roles` enforced in middleware |
| **BR-NF-08** | Usability | None at DB layer |
| **BR-NF-09** | Accessibility | None at DB layer |
| **BR-NF-10** | Localisation | UI string tables (Phase 2); no impact on this schema |
| **BR-NF-11** | Device Performance (2 GB Android) | Small delta payloads; DB writes happen server-side |

### 5.3 Stakeholders → Tables

| Stakeholder (BRD §4) | Reads from | Writes to |
|---|---|---|
| **Cricket Players (Batters & Bowlers)** | Own profile, own stats, match history | `registered_players` (own row) |
| **Scorers / Team Administrators** | All match-related tables | `matches`, `match_innings`, `match_players`, `match_officials`, `balls`, `player_scores`, `partnerships`, `fall_of_wickets`, `dls_adjustments` |
| **School / University Cricket Administrators** | School-affiliated teams and players | `teams` (school type), `team_players` |
| **CSA / Club Managers** | Club rosters, fixtures, season-level stats | `teams` (club type), `tournaments`, `tournament_teams` |
| **Tournament Organisers** | Fixtures, points table, leaderboards | `tournaments`, `tournament_teams`, `tournament_fixtures`, `tournament_stages` |
| **Umpires** | Their own match assignments | `match_officials` (entered by the scorer) |
| **Spectators / Parents / Fans** | Public match URL, public tournament URL | (read-only, no auth) |
| **Coaches** | Career stats, scorecards, analytics tabs | (read-only) |
| **Product & Engineering Team** | All (admin tooling) | `users`, `user_roles`, `audit_log` |

---

## 6. Relationships at a Glance

| From | To | Type | Delete behaviour |
|---|---|---|---|
| `users` → `user_roles` | one-to-many | CASCADE |
| `users` → `matches` (creator) | one-to-many | SET NULL |
| `users` → `registered_players` (creator) | one-to-many | SET NULL |
| `users` → `teams` / `tournaments` (creator) | one-to-many | SET NULL |
| `registered_players` → `consent_records` | one-to-many | CASCADE |
| `teams` ↔ `registered_players` via `team_players` | many-to-many | CASCADE both sides |
| `matches` → `match_innings` | one-to-many (max 2 in MVP) | CASCADE |
| `match_innings` → `balls` | one-to-many | CASCADE |
| `match_innings` → `partnerships` | one-to-many | CASCADE |
| `match_innings` → `fall_of_wickets` | one-to-many (max 10) | CASCADE |
| `matches` ↔ `registered_players` via `match_players` | many-to-many | CASCADE both sides |
| `matches` → `match_officials` | one-to-many | CASCADE |
| `matches` → `player_scores` | one-to-many | CASCADE |
| `tournaments` → `matches` | one-to-many | SET NULL (match survives) |
| `tournaments` → `tournament_teams` / `tournament_fixtures` / `tournament_stages` | one-to-many | CASCADE |
| `users` → `audit_log` (actor) | one-to-many | SET NULL |

**Rule of thumb**

- *Child events* (balls, scores, rosters, fixtures, standings, partnerships, falls of wickets) cascade with their parent.
- *Reference links* (who created what; which tournament a match belongs to) are nullified so the historical record survives.

---

## 7. Keys, Indexes & Constraints

### Primary keys
Every table has a CUID-based `id` primary key (automatically indexed).

### Unique constraints
| Table | Columns | Why |
|---|---|---|
| `users` | `email` | Login uniqueness |
| `user_roles` | `(user_id, role)` | No duplicate role grants |
| `registered_players` | `player_id_code` | One Player ID per person (BR-PL-02) |
| `team_players` | `(team_id, player_id)` | No duplicate roster entries |
| `match_players` | `(match_id, player_id)` | No duplicate match-day entries |
| `match_innings` | `(match_id, innings_number)` | Exactly one row per innings |
| `player_scores` | `(match_id, player_id)` | One score row per player per match |
| `balls` | `(match_id, client_ball_id)` | Idempotent retries from local queue (BR-NF-06) |
| `partnerships` | `(match_id, innings_id, wicket_number)` | One partnership per wicket |
| `fall_of_wickets` | `(match_id, innings_id, wicket_number)` | One fall record per wicket |
| `tournament_teams` | `(tournament_id, team_id)` | A team appears once per tournament |
| `tournament_stages` | `(tournament_id, stage_order)` | Ordered stages |

### Recommended secondary indexes
| Table | Columns | Speeds up |
|---|---|---|
| `balls` | `(match_id, innings, over_number, ball_number)` | Replay scorecard in order |
| `balls` | `(match_id, is_active)` | Filter undone balls |
| `balls` | `batsman_id` | Career batting analytics |
| `balls` | `bowler_id` | Career bowling analytics |
| `matches` | `status` | Dashboard listings |
| `matches` | `tournament_id` | Tournament fixtures view |
| `matches` | `match_date` | Date-range filters |
| `match_players` | `player_id` | Match history per player (BR-PL-07) |
| `player_scores` | `player_id` | Career statistics (BR-PL-06) |
| `tournament_teams` | `(tournament_id, points DESC, nrr DESC)` | Points-table sort (BR-TO-07) |
| `audit_log` | `(entity_type, entity_id)` | Lookup history per entity |
| `audit_log` | `created_at DESC` | Recent activity feeds |

---

## 8. Data Lifecycle & Retention

| Data class | Lifecycle | Retention |
|---|---|---|
| **Live match state** | Held in Redis during play; mirrored to PostgreSQL on every ball | Redis: 1-hour TTL; PostgreSQL: forever |
| **Completed match scorecards** | Frozen on match completion | 10 to 15 years |
| **Ball-by-ball history** | Append-only; corrections are new rows; originals retained (`is_active = false`) | 10 to 15 years |
| **Player profiles** | Updated by admin / scorer; minors require parental consent on file | Retained until explicit deletion request |
| **Consent records** | Append-only; revocations recorded as `revoked_at` | 10 years (POPIA) |
| **User accounts** | Active while user uses the app | Deleted on user request; player rows they created survive (FK set to NULL) |
| **Audit log** | Append-only | 2 years rolling; older entries archived |
| **Logs (application)** | Rotated weekly | 90 days |
| **Backups** | Nightly full + continuous WAL archiving | 30 days point-in-time recovery |

---

## 9. Live Scoring  How Redis & PostgreSQL Cooperate

For the most performance-critical path (a scorer tapping a ball), the database is used like this:

```
Scorer taps a ball
        │
        ▼
0. Flutter app writes to local SQLite queue          (instant, offline-safe)
        │
        ▼
1. Sync worker POSTs the ball event (with client_ball_id) to the backend
        │
        ▼
2. INSERT into `balls`                                (idempotent on client_ball_id)
3. UPDATE `match_innings` running totals
4. UPSERT `player_scores` for batter / bowler
5. INSERT `fall_of_wickets` if wicket fell
6. UPDATE / INSERT `partnerships`
7. PUBLISH update to Redis                            (fan-out to viewers)
        │
        ▼
Every viewer's screen updates within 2 seconds (BR-NF-03)
```

PostgreSQL is always the authoritative store. Redis is a fast pipe that broadcasts what PostgreSQL has already accepted. If Redis is unavailable, scoring continues; viewers fall back to polling for the latest score.

**Undo last ball (BR-SC-18)**

1. Mark the last `balls` row `is_active = false`.
2. Recompute and update `match_innings` running totals, `player_scores`, `partnerships`, `fall_of_wickets`.
3. Record the action in `audit_log`.
4. Publish a `ball_undone` event over Redis.

---

## 10. Schema Migrations & Versioning

- The schema is defined in [backend/prisma/schema.prisma](backend/prisma/schema.prisma) and version-controlled in git.
- Every change is captured as a Prisma migration in [backend/prisma/migrations/](backend/prisma/migrations/), with a timestamp and SQL.
- Migrations are applied automatically in CI with `prisma migrate deploy`. Never by hand on production.
- A migration that drops or renames a column is preceded by an *additive* migration so the application can deploy first, the schema second, preventing downtime.
- **Migrating to this design**: the new tables (`user_roles`, `match_innings`, `match_officials`, `partnerships`, `fall_of_wickets`, `consent_records`, `audit_log`, `tournament_stages`) and new columns (`client_ball_id`, `is_active`, `terms_accepted_at`, etc.) are introduced *additively*. Legacy columns (`users.role`, `matches.umpire`) stay in place until backfill is complete.

---

## 11. Backups & Recovery

| Layer | Mechanism | Frequency | Recovery target |
|---|---|---|---|
| PostgreSQL  full backup | Cloud-managed snapshot | Nightly | RTO ≤ 1 hour |
| PostgreSQL  WAL archive | Continuous write-ahead log shipping | Continuous | RPO ≤ 15 minutes |
| Redis | Append-only file (AOF) on disk | Continuous | Recoverable from disk; cold-start from PostgreSQL otherwise |
| Blob Storage (photos / logos) | Provider-managed durability | n/a | 99.999999999% durability SLA |

Restore drills are run quarterly post-launch to validate the RTO / RPO targets.

---

## 12. Security & POPIA Compliance

Mapped to BR-NF-07 (TLS in transit, AES-256 at rest, RBAC).

| Control | How it's enforced |
|---|---|
| **Encryption in transit** | TLS 1.2+ between app, backend, database |
| **Encryption at rest** | AES-256 provider-level volume encryption (AWS EBS / Azure Disk) |
| **SQL injection** | Eliminated by construction; Prisma parameterises every query |
| **Sensitive fields** | Passwords stored as bcrypt hashes; emergency contacts and family info treated as PII |
| **Role-based access** | Enforced by `user_roles` + middleware; a spectator cannot reach scoring endpoints (BR-NF-07) |
| **T&C / Privacy acceptance** | `users.terms_accepted_at` + `privacy_accepted_at` required at registration (BR-AU-01) |
| **Minors (under 18)** | `registered_players.is_minor` triggers parental-consent flow; no public profile until `consent_records` row exists |
| **POPIA  right to erasure** | Account deletion removes `users` row; player rows they created are kept but anonymised |
| **POPIA  right to access** | A user can request a data export of every row keyed to them |
| **Photo publication** | Each photo upload requires a `consent_records` row of type `photo_publication` for minors |
| **Audit trail** | `audit_log` captures every sensitive change (ball corrections, role grants, profile edits) |
| **Connection pooling** | Prisma pool today; PgBouncer at Growth stage |
| **Least privilege** | Application uses a non-superuser PostgreSQL role limited to app tables only |

---

## 13. Glossary

| Term | Definition |
|---|---|
| **Append-only** | Once written, rows are never edited or deleted in place; corrections are new rows |
| **bcrypt** | An adaptive password-hashing algorithm; slow on purpose, to resist brute force |
| **Cascade delete** | When you delete a parent row, its children are deleted with it |
| **CUID2** | Collision-resistant unique identifier; like a UUID, shorter and URL-safe |
| **DLS** | Duckworth-Lewis-Stern method; cricket's standard target-adjustment formula for rain-interrupted matches |
| **ERD** | Entity-Relationship Diagram; a picture of how tables relate to each other |
| **Fall of Wickets** | The score and over at which each wicket falls in an innings |
| **Foreign key (FK)** | A column that points to a row in another table |
| **Idempotency key** | A client-side ID (`client_ball_id`) that lets the server safely accept a retry of the same write |
| **MoSCoW** | A prioritisation framework: Must Have, Should Have, Could Have, Won't Have (this release) |
| **NRR** | Net Run Rate; tournament tie-breaker calculated from runs and overs |
| **Partnership** | The stand between two batters between two wickets |
| **POPIA** | Protection of Personal Information Act; South Africa's data protection law |
| **Prisma** | The tool we use to define the schema in code and run migrations safely |
| **RBAC** | Role-Based Access Control; permissions tied to roles, not individuals |
| **RTO / RPO** | Recovery Time Objective / Recovery Point Objective |
| **Schema migration** | A versioned change to the database structure, applied automatically and recorded in git |
| **Strike rotation** | When the batters swap ends between balls or overs |
| **WAL** | Write-Ahead Log; PostgreSQL's continuous change log, used for point-in-time recovery |

---

*End of document. For how the database fits into the wider system, see the System Architecture Document v2.0. For the full requirement list with MoSCoW priorities, see the BRD v1.1. For the user roles each table serves, see the Roles & Responsibilities document.*
