import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReportsController } from './reports.controller';
import { ReportJobService } from './report-job.service';
import { ReportProcessor } from './report.processor';
import { REPORTS_QUEUE } from './reports.constants';

@Module({
  imports: [BullModule.registerQueue({ name: REPORTS_QUEUE })],
  controllers: [ReportsController],
  providers: [ReportJobService, ReportProcessor],
})
export class ReportsModule {}
