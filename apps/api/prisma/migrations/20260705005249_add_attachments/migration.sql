-- CreateTable
CREATE TABLE `attachments` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `responseId` VARCHAR(191) NOT NULL,
    `nomeOriginal` VARCHAR(191) NOT NULL,
    `caminho` VARCHAR(191) NOT NULL,
    `mime` VARCHAR(191) NOT NULL,
    `tamanho` INTEGER NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `attachments_tenantId_idx`(`tenantId`),
    INDEX `attachments_responseId_idx`(`responseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `attachments` ADD CONSTRAINT `attachments_responseId_fkey` FOREIGN KEY (`responseId`) REFERENCES `ticket_responses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
