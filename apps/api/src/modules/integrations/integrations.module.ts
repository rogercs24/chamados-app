import { Module } from '@nestjs/common';
import { CnpjService } from './cnpj.service';
import { CepService } from './cep.service';

@Module({
  providers: [CnpjService, CepService],
  exports: [CnpjService, CepService],
})
export class IntegrationsModule {}
