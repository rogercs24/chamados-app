import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { FaqService } from './faq.service';
import { ConsultarFaqDto } from './dto/consultar-faq.dto';

@ApiTags('faq')
@Controller('faq')
export class FaqController {
  constructor(private readonly faq: FaqService) {}

  @ApiOperation({ summary: 'Busca no FAQ por termo' })
  @Get()
  buscar(@Query('termo') termo?: string) {
    return this.faq.buscar(termo);
  }

  @ApiOperation({
    summary: 'Registra consulta ao FAQ e devolve um faqToken (uso único)',
  })
  @Post('consultar')
  async consultar(
    @Body() dto: ConsultarFaqDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const faqToken = await this.faq.registrarConsulta(
      user.tenantId,
      user.id,
      dto.termo,
    );
    return { faqToken, itens: this.faq.buscar(dto.termo) };
  }
}
