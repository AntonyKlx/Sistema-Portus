-- CreateTable
CREATE TABLE `BackupBanco` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Concluido',
    `nomeArquivo` VARCHAR(191) NULL,
    `caminho` VARCHAR(191) NULL,
    `tamanhoBytes` BIGINT NULL,
    `solicitadoPor` VARCHAR(191) NULL,
    `solicitadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `concluidoEm` DATETIME(3) NULL,
    `mensagemErro` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
