-- CreateTable
CREATE TABLE `report_jobs` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDENTE', 'PROCESSANDO', 'CONCLUIDO', 'FALHOU') NOT NULL DEFAULT 'PENDENTE',
    `caminho` VARCHAR(191) NULL,
    `arquivoNome` VARCHAR(191) NULL,
    `criadoPor` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    INDEX `report_jobs_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
