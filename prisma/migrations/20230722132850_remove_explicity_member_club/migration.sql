/*
  Warnings:

  - You are about to drop the `MemberClubs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MemberClubs";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "_ClubToMember" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ClubToMember_A_fkey" FOREIGN KEY ("A") REFERENCES "Club" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ClubToMember_B_fkey" FOREIGN KEY ("B") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_ClubToMember_AB_unique" ON "_ClubToMember"("A", "B");

-- CreateIndex
CREATE INDEX "_ClubToMember_B_index" ON "_ClubToMember"("B");
