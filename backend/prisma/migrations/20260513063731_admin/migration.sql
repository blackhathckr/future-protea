/*
  Warnings:

  - You are about to drop the column `team_code` on the `teams` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "teams_team_code_key";

-- AlterTable
ALTER TABLE "teams" DROP COLUMN "team_code";
