/*
  Warnings:

  - Added the required column `duracaoReserva` to the `RegrasReserva` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `regrasreserva` ADD COLUMN `duracaoReserva` INTEGER NOT NULL;
