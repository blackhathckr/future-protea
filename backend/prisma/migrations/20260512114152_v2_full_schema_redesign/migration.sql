/*
  Warnings:

  - A unique constraint covering the columns `[match_id,client_ball_id]` on the table `balls` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "balls" DROP CONSTRAINT "balls_batsman_id_fkey";

-- DropForeignKey
ALTER TABLE "balls" DROP CONSTRAINT "balls_bowler_id_fkey";

-- DropForeignKey
ALTER TABLE "match_players" DROP CONSTRAINT "match_players_player_id_fkey";

-- DropForeignKey
ALTER TABLE "player_scores" DROP CONSTRAINT "player_scores_player_id_fkey";

-- AlterTable
ALTER TABLE "balls" ADD COLUMN     "client_ball_id" VARCHAR(50),
ADD COLUMN     "fielder_id" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "non_striker_id" TEXT,
ADD COLUMN     "superseded_by_ball_id" TEXT;

-- AlterTable
ALTER TABLE "match_players" ADD COLUMN     "is_captain" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_wicket_keeper" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "player_of_match_id" TEXT,
ADD COLUMN     "result_margin" INTEGER,
ADD COLUMN     "result_type" VARCHAR(20),
ADD COLUMN     "team1_id" TEXT,
ADD COLUMN     "team2_id" TEXT,
ADD COLUMN     "winner_team_id" TEXT;

-- AlterTable
ALTER TABLE "player_scores" ADD COLUMN     "dismissed_by_id" TEXT,
ADD COLUMN     "fielder_id" TEXT;

-- AlterTable
ALTER TABLE "registered_players" ADD COLUMN     "is_minor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "linked_user_id" TEXT;

-- AlterTable
ALTER TABLE "tournament_fixtures" ADD COLUMN     "stage_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password_reset_expires_at" TIMESTAMP(3),
ADD COLUMN     "password_reset_token" VARCHAR(255),
ADD COLUMN     "privacy_accepted_at" TIMESTAMP(3),
ADD COLUMN     "terms_accepted_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" VARCHAR(30) NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_by" TEXT,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "consent_type" VARCHAR(30) NOT NULL,
    "granted_by_name" VARCHAR(255) NOT NULL,
    "granted_by_relationship" VARCHAR(50) NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidence_url" VARCHAR(500),
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_innings" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "innings_number" INTEGER NOT NULL,
    "batting_team_id" TEXT,
    "bowling_team_id" TEXT,
    "striker_id" TEXT,
    "non_striker_id" TEXT,
    "current_bowler_id" TEXT,
    "target_runs" INTEGER,
    "total_runs" INTEGER NOT NULL DEFAULT 0,
    "total_wickets" INTEGER NOT NULL DEFAULT 0,
    "total_overs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_balls" INTEGER NOT NULL DEFAULT 0,
    "extras_wides" INTEGER NOT NULL DEFAULT 0,
    "extras_noballs" INTEGER NOT NULL DEFAULT 0,
    "extras_byes" INTEGER NOT NULL DEFAULT 0,
    "extras_legbyes" INTEGER NOT NULL DEFAULT 0,
    "extras_penalties" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "match_innings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_officials" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "official_id" TEXT,
    "official_name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(30) NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_officials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partnerships" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "innings_id" TEXT NOT NULL,
    "wicket_number" INTEGER NOT NULL,
    "batsman1_id" TEXT NOT NULL,
    "batsman2_id" TEXT NOT NULL,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "balls" INTEGER NOT NULL DEFAULT 0,
    "fours" INTEGER NOT NULL DEFAULT 0,
    "sixes" INTEGER NOT NULL DEFAULT 0,
    "batsman1_runs" INTEGER NOT NULL DEFAULT 0,
    "batsman2_runs" INTEGER NOT NULL DEFAULT 0,
    "started_at_score" INTEGER NOT NULL DEFAULT 0,
    "ended_at_score" INTEGER,
    "started_over" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ended_over" DOUBLE PRECISION,
    "unbroken" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "partnerships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fall_of_wickets" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "innings_id" TEXT NOT NULL,
    "wicket_number" INTEGER NOT NULL,
    "batsman_id" TEXT NOT NULL,
    "dismissal_type" VARCHAR(30) NOT NULL,
    "bowler_id" TEXT,
    "fielder_id" TEXT,
    "runs_at_fall" INTEGER NOT NULL,
    "overs_at_fall" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "fall_of_wickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_stages" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "stage_name" VARCHAR(50) NOT NULL,
    "stage_order" INTEGER NOT NULL,
    "seedRule" TEXT,

    CONSTRAINT "tournament_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "action" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(50) NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_key" ON "user_roles"("user_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "match_innings_match_id_innings_number_key" ON "match_innings"("match_id", "innings_number");

-- CreateIndex
CREATE UNIQUE INDEX "partnerships_match_id_innings_id_wicket_number_key" ON "partnerships"("match_id", "innings_id", "wicket_number");

-- CreateIndex
CREATE UNIQUE INDEX "fall_of_wickets_match_id_innings_id_wicket_number_key" ON "fall_of_wickets"("match_id", "innings_id", "wicket_number");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_stages_tournament_id_stage_order_key" ON "tournament_stages"("tournament_id", "stage_order");

-- CreateIndex
CREATE UNIQUE INDEX "balls_match_id_client_ball_id_key" ON "balls"("match_id", "client_ball_id");

-- DataMigration: remove rows that reference users.id not present in registered_players
-- (identity split cleanup — dev database only)
DELETE FROM "match_players"
  WHERE "player_id" NOT IN (SELECT "id" FROM "registered_players");

DELETE FROM "player_scores"
  WHERE "player_id" NOT IN (SELECT "id" FROM "registered_players");

UPDATE "balls" SET "batsman_id" = NULL
  WHERE "batsman_id" IS NOT NULL
    AND "batsman_id" NOT IN (SELECT "id" FROM "registered_players");

UPDATE "balls" SET "bowler_id" = NULL
  WHERE "bowler_id" IS NOT NULL
    AND "bowler_id" NOT IN (SELECT "id" FROM "registered_players");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registered_players" ADD CONSTRAINT "registered_players_linked_user_id_fkey" FOREIGN KEY ("linked_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "registered_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_team1_id_fkey" FOREIGN KEY ("team1_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_team2_id_fkey" FOREIGN KEY ("team2_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_team_id_fkey" FOREIGN KEY ("winner_team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_player_of_match_id_fkey" FOREIGN KEY ("player_of_match_id") REFERENCES "registered_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_innings" ADD CONSTRAINT "match_innings_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_innings" ADD CONSTRAINT "match_innings_batting_team_id_fkey" FOREIGN KEY ("batting_team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_innings" ADD CONSTRAINT "match_innings_bowling_team_id_fkey" FOREIGN KEY ("bowling_team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_innings" ADD CONSTRAINT "match_innings_striker_id_fkey" FOREIGN KEY ("striker_id") REFERENCES "registered_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_innings" ADD CONSTRAINT "match_innings_non_striker_id_fkey" FOREIGN KEY ("non_striker_id") REFERENCES "registered_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_innings" ADD CONSTRAINT "match_innings_current_bowler_id_fkey" FOREIGN KEY ("current_bowler_id") REFERENCES "registered_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_officials" ADD CONSTRAINT "match_officials_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_officials" ADD CONSTRAINT "match_officials_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "registered_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_scores" ADD CONSTRAINT "player_scores_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "registered_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_scores" ADD CONSTRAINT "player_scores_dismissed_by_id_fkey" FOREIGN KEY ("dismissed_by_id") REFERENCES "registered_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_scores" ADD CONSTRAINT "player_scores_fielder_id_fkey" FOREIGN KEY ("fielder_id") REFERENCES "registered_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_batsman_id_fkey" FOREIGN KEY ("batsman_id") REFERENCES "registered_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_bowler_id_fkey" FOREIGN KEY ("bowler_id") REFERENCES "registered_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_non_striker_id_fkey" FOREIGN KEY ("non_striker_id") REFERENCES "registered_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_fielder_id_fkey" FOREIGN KEY ("fielder_id") REFERENCES "registered_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_superseded_by_ball_id_fkey" FOREIGN KEY ("superseded_by_ball_id") REFERENCES "balls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnerships" ADD CONSTRAINT "partnerships_innings_id_fkey" FOREIGN KEY ("innings_id") REFERENCES "match_innings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnerships" ADD CONSTRAINT "partnerships_batsman1_id_fkey" FOREIGN KEY ("batsman1_id") REFERENCES "registered_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnerships" ADD CONSTRAINT "partnerships_batsman2_id_fkey" FOREIGN KEY ("batsman2_id") REFERENCES "registered_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fall_of_wickets" ADD CONSTRAINT "fall_of_wickets_batsman_id_fkey" FOREIGN KEY ("batsman_id") REFERENCES "registered_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fall_of_wickets" ADD CONSTRAINT "fall_of_wickets_bowler_id_fkey" FOREIGN KEY ("bowler_id") REFERENCES "registered_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fall_of_wickets" ADD CONSTRAINT "fall_of_wickets_fielder_id_fkey" FOREIGN KEY ("fielder_id") REFERENCES "registered_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fall_of_wickets" ADD CONSTRAINT "fall_of_wickets_innings_id_fkey" FOREIGN KEY ("innings_id") REFERENCES "match_innings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_fixtures" ADD CONSTRAINT "tournament_fixtures_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "tournament_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_stages" ADD CONSTRAINT "tournament_stages_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
