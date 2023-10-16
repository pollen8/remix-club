/*
  Warnings:

  - You are about to drop the `_MemberToTeam` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `sportId` to the `Club` table without a default value. This is not possible if the table is not empty.
  - Added the required column `affiliationNumber` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `membershipTypeId` to the `Member` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "_MemberToTeam_B_index";

-- DropIndex
DROP INDEX "_MemberToTeam_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_MemberToTeam";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "SportsBodyMembershipTypes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sportId" TEXT NOT NULL,
    CONSTRAINT "SportsBodyMembershipTypes_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PreferredTeam" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PreferredTeam_A_fkey" FOREIGN KEY ("A") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PreferredTeam_B_fkey" FOREIGN KEY ("B") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_TeamMember" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_TeamMember_A_fkey" FOREIGN KEY ("A") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TeamMember_B_fkey" FOREIGN KEY ("B") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Club" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sportId" TEXT NOT NULL,
    CONSTRAINT "Club_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Club_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Club" ("createdAt", "createdById", "description", "id", "name", "updatedAt") SELECT "createdAt", "createdById", "description", "id", "name", "updatedAt" FROM "Club";
DROP TABLE "Club";
ALTER TABLE "new_Club" RENAME TO "Club";
CREATE UNIQUE INDEX "Club_id_key" ON "Club"("id");
CREATE TABLE "new_Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "emergencyContactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "membershipTypeId" TEXT NOT NULL,
    "affiliationNumber" TEXT NOT NULL,
    CONSTRAINT "Member_membershipTypeId_fkey" FOREIGN KEY ("membershipTypeId") REFERENCES "ClubMembershipTypes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Member" ("address", "email", "emergencyContactName", "firstName", "gender", "id", "lastName", "mobile") SELECT "address", "email", "emergencyContactName", "firstName", "gender", "id", "lastName", "mobile" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
CREATE UNIQUE INDEX "Member_id_key" ON "Member"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "SportsBodyMembershipTypes_id_key" ON "SportsBodyMembershipTypes"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Sport_id_key" ON "Sport"("id");

-- CreateIndex
CREATE UNIQUE INDEX "_PreferredTeam_AB_unique" ON "_PreferredTeam"("A", "B");

-- CreateIndex
CREATE INDEX "_PreferredTeam_B_index" ON "_PreferredTeam"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TeamMember_AB_unique" ON "_TeamMember"("A", "B");

-- CreateIndex
CREATE INDEX "_TeamMember_B_index" ON "_TeamMember"("B");
