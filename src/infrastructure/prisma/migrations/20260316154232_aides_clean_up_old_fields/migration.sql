/*
  Warnings:

  - You are about to drop the column `codes_departement` on the `Aide` table. All the data in the column will be lost.
  - You are about to drop the column `codes_postaux` on the `Aide` table. All the data in the column will be lost.
  - You are about to drop the column `codes_region` on the `Aide` table. All the data in the column will be lost.
  - You are about to drop the column `include_codes_commune` on the `Aide` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Aide" DROP COLUMN "codes_departement",
DROP COLUMN "codes_postaux",
DROP COLUMN "codes_region",
DROP COLUMN "include_codes_commune";
