-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "phone" VARCHAR(20),
    "photo_url" VARCHAR(500),
    "date_of_birth" DATE,
    "batting_style" VARCHAR(50),
    "bowling_style" VARCHAR(50),
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "team1_name" VARCHAR(255) NOT NULL,
    "team2_name" VARCHAR(255) NOT NULL,
    "venue" VARCHAR(255),
    "total_overs" INTEGER NOT NULL DEFAULT 20,
    "status" VARCHAR(20) NOT NULL DEFAULT 'upcoming',
    "toss_winner" VARCHAR(255),
    "toss_decision" VARCHAR(20),
    "winner" VARCHAR(255),
    "team1_score" INTEGER NOT NULL DEFAULT 0,
    "team1_wickets" INTEGER NOT NULL DEFAULT 0,
    "team1_overs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "team2_score" INTEGER NOT NULL DEFAULT 0,
    "team2_wickets" INTEGER NOT NULL DEFAULT 0,
    "team2_overs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "current_innings" INTEGER NOT NULL DEFAULT 1,
    "match_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "tournament_id" TEXT,
    "match_type" VARCHAR(20) NOT NULL DEFAULT 'T20',
    "balls_per_over" INTEGER NOT NULL DEFAULT 6,
    "umpire" VARCHAR(255),
    "player_of_match" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_players" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "team" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_scores" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "team" INTEGER,
    "runs_scored" INTEGER NOT NULL DEFAULT 0,
    "balls_faced" INTEGER NOT NULL DEFAULT 0,
    "fours" INTEGER NOT NULL DEFAULT 0,
    "sixes" INTEGER NOT NULL DEFAULT 0,
    "is_out" BOOLEAN NOT NULL DEFAULT false,
    "out_type" VARCHAR(50),
    "overs_bowled" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "runs_conceded" INTEGER NOT NULL DEFAULT 0,
    "wickets_taken" INTEGER NOT NULL DEFAULT 0,
    "maidens" INTEGER NOT NULL DEFAULT 0,
    "catches" INTEGER NOT NULL DEFAULT 0,
    "run_outs" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balls" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "innings" INTEGER NOT NULL,
    "over_number" INTEGER NOT NULL,
    "ball_number" INTEGER NOT NULL,
    "batsman_id" TEXT,
    "bowler_id" TEXT,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "is_wide" BOOLEAN NOT NULL DEFAULT false,
    "is_noball" BOOLEAN NOT NULL DEFAULT false,
    "is_bye" BOOLEAN NOT NULL DEFAULT false,
    "is_legbye" BOOLEAN NOT NULL DEFAULT false,
    "is_wicket" BOOLEAN NOT NULL DEFAULT false,
    "wicket_type" VARCHAR(50),
    "extras" INTEGER NOT NULL DEFAULT 0,
    "overthrows" INTEGER NOT NULL DEFAULT 0,
    "shot_direction" VARCHAR(30),
    "commentary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registered_players" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "player_id_code" VARCHAR(50),
    "date_of_birth" DATE,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "emergency_contact" VARCHAR(20),
    "emergency_contact_name" VARCHAR(255),
    "address" VARCHAR(500),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "country" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "blood_group" VARCHAR(10),
    "school_name" VARCHAR(255),
    "club_name" VARCHAR(255),
    "batting_style" VARCHAR(50),
    "bowling_style" VARCHAR(50),
    "playing_role" VARCHAR(50),
    "jersey_number" INTEGER,
    "photo_url" VARCHAR(500),
    "father_name" VARCHAR(255),
    "mother_name" VARCHAR(255),
    "guardian_name" VARCHAR(255),
    "nationality" VARCHAR(100),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registered_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "team_name" VARCHAR(255) NOT NULL,
    "team_type" VARCHAR(20) NOT NULL,
    "school_name" VARCHAR(255),
    "club_name" VARCHAR(255),
    "logo_url" VARCHAR(500),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_players" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "is_captain" BOOLEAN NOT NULL DEFAULT false,
    "is_wicket_keeper" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(20) NOT NULL DEFAULT 'T20',
    "overs" INTEGER NOT NULL DEFAULT 20,
    "start_date" DATE,
    "end_date" DATE,
    "venue" VARCHAR(255),
    "organizer" VARCHAR(255),
    "logo_url" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL DEFAULT 'upcoming',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_teams" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "group_name" VARCHAR(50),
    "played" INTEGER NOT NULL DEFAULT 0,
    "won" INTEGER NOT NULL DEFAULT 0,
    "lost" INTEGER NOT NULL DEFAULT 0,
    "no_result" INTEGER NOT NULL DEFAULT 0,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "runs_for" INTEGER NOT NULL DEFAULT 0,
    "overs_for" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "runs_against" INTEGER NOT NULL DEFAULT 0,
    "overs_against" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nrr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_fixtures" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "match_id" TEXT,
    "team1_name" VARCHAR(255) NOT NULL,
    "team2_name" VARCHAR(255) NOT NULL,
    "match_date" TIMESTAMP(3) NOT NULL,
    "venue" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'upcoming',
    "group_name" VARCHAR(50),
    "winner" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_fixtures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "match_players_match_id_player_id_key" ON "match_players"("match_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_scores_match_id_player_id_key" ON "player_scores"("match_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "registered_players_player_id_code_key" ON "registered_players"("player_id_code");

-- CreateIndex
CREATE UNIQUE INDEX "team_players_team_id_player_id_key" ON "team_players"("team_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_teams_tournament_id_team_id_key" ON "tournament_teams"("tournament_id", "team_id");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_scores" ADD CONSTRAINT "player_scores_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_scores" ADD CONSTRAINT "player_scores_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_batsman_id_fkey" FOREIGN KEY ("batsman_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_bowler_id_fkey" FOREIGN KEY ("bowler_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registered_players" ADD CONSTRAINT "registered_players_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_players" ADD CONSTRAINT "team_players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_players" ADD CONSTRAINT "team_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "registered_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_fixtures" ADD CONSTRAINT "tournament_fixtures_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_fixtures" ADD CONSTRAINT "tournament_fixtures_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
