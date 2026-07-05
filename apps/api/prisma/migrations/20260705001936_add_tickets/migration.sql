-- CreateTable
CREATE TABLE `tickets` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NOT NULL,
    `solicitanteId` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NULL,
    `prioridade` ENUM('BAIXA', 'MEDIA', 'ALTA', 'URGENTE') NULL,
    `area` ENUM('TI', 'TRADE', 'OPERACOES', 'OUTROS') NULL,
    `status` ENUM('TRIAGEM', 'ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO', 'FECHADO') NOT NULL DEFAULT 'TRIAGEM',
    `primeiraRespostaEm` DATETIME(3) NULL,
    `fechadoEm` DATETIME(3) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    INDEX `tickets_tenantId_idx`(`tenantId`),
    INDEX `tickets_tenantId_status_idx`(`tenantId`, `status`),
    INDEX `tickets_tenantId_area_idx`(`tenantId`, `area`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ticket_responses` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `ticketId` VARCHAR(191) NOT NULL,
    `autorId` VARCHAR(191) NOT NULL,
    `texto` TEXT NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ticket_responses_tenantId_idx`(`tenantId`),
    INDEX `ticket_responses_ticketId_idx`(`ticketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ticket_responses` ADD CONSTRAINT `ticket_responses_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
