/*
  Warnings:

  - A unique constraint covering the columns `[team_code]` on the table `teams` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "match_players" ADD COLUMN     "is_playing" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "team_code" VARCHAR(20);

-- CreateIndex
CREATE UNIQUE INDEX "teams_team_code_key" ON "teams"("team_code");
