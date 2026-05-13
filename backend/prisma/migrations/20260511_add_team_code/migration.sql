-- Add unique team_code column to teams (e.g. TEAM-0001).
-- Existing rows backfill with NULL; new rows get a generated code from the controller.
ALTER TABLE "teams" ADD COLUMN "team_code" VARCHAR(20);
CREATE UNIQUE INDEX "teams_team_code_key" ON "teams"("team_code");
