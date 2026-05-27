-- CreateTable
CREATE TABLE `Usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `tentativasIncorretas` INTEGER NOT NULL DEFAULT 0,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `perfilId` INTEGER NOT NULL,

    UNIQUE INDEX `Usuario_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PerfilAcesso` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `PerfilAcesso_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permissao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `perfilId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Porteiro` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,

    UNIQUE INDEX `Porteiro_usuarioId_key`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Morador` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `telefone` VARCHAR(191) NULL,
    `inadimplente` BOOLEAN NOT NULL DEFAULT false,
    `usuarioId` INTEGER NOT NULL,
    `unidadeId` INTEGER NOT NULL,

    UNIQUE INDEX `Morador_usuarioId_key`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Unidade` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bloco` VARCHAR(191) NOT NULL,
    `andar` INTEGER NOT NULL,
    `numero` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Encomenda` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `remetente` VARCHAR(191) NOT NULL,
    `codigoPacote` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Aguardando Retirada',
    `dataHoraChegada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dataHoraRetirada` DATETIME(3) NULL,
    `nomeRetirante` VARCHAR(191) NULL,
    `unidadeId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AreaComum` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,

    UNIQUE INDEX `AreaComum_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RegrasReserva` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `antecedenciaMinimaReserva` INTEGER NOT NULL,
    `antecedenciaMinCancelamento` INTEGER NOT NULL,
    `limiteReservasAtivas` INTEGER NOT NULL,
    `horarioPermitidoInicio` DATETIME(3) NOT NULL,
    `horarioPermitidoFim` DATETIME(3) NOT NULL,
    `areaComumId` INTEGER NOT NULL,

    UNIQUE INDEX `RegrasReserva_areaComumId_key`(`areaComumId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reserva` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dataHora` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pendente',
    `justificativa` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `moradorId` INTEGER NOT NULL,
    `areaComumId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LogAcesso` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dataHora` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `acaoExecutada` VARCHAR(191) NOT NULL,
    `usuarioId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_perfilId_fkey` FOREIGN KEY (`perfilId`) REFERENCES `PerfilAcesso`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Permissao` ADD CONSTRAINT `Permissao_perfilId_fkey` FOREIGN KEY (`perfilId`) REFERENCES `PerfilAcesso`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Porteiro` ADD CONSTRAINT `Porteiro_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Morador` ADD CONSTRAINT `Morador_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Morador` ADD CONSTRAINT `Morador_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `Unidade`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Encomenda` ADD CONSTRAINT `Encomenda_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `Unidade`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RegrasReserva` ADD CONSTRAINT `RegrasReserva_areaComumId_fkey` FOREIGN KEY (`areaComumId`) REFERENCES `AreaComum`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reserva` ADD CONSTRAINT `Reserva_moradorId_fkey` FOREIGN KEY (`moradorId`) REFERENCES `Morador`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reserva` ADD CONSTRAINT `Reserva_areaComumId_fkey` FOREIGN KEY (`areaComumId`) REFERENCES `AreaComum`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LogAcesso` ADD CONSTRAINT `LogAcesso_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
