import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ImportsController } from './imports.controller';
import { ImportJobService } from './import-job.service';
import { ImportProcessor } from './import.processor';
import { IMPORTS_QUEUE } from './imports.constants';

@Module({
  imports: [BullModule.registerQueue({ name: IMPORTS_QUEUE })],
  controllers: [ImportsController],
  providers: [ImportJobService, ImportProcessor],
})
export class ImportsModule {}
