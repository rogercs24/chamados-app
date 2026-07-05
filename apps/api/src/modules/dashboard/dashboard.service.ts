import { Injectable } from '@nestjs/common';
import { Prisma, StatusChamado } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { Granularidade, SerieQueryDto } from './dto/serie-query.dto';

const FORMATO_MYSQL: Record<Granularidade, string> = {
  [Granularidade.DAY]: '%Y-%m-%d',
  [Granularidade.WEEK]: '%x-W%v',
  [Granularidade.MONTH]: '%Y-%m',
  [Granularidade.YEAR]: '%Y',
};

/**
 * Agregações do dashboard. Todas com tenantId EXPLÍCITO (não dependem da
 * extension): analytics é read-only e o escopo fica evidente na consulta.
 */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(tenantId: string) {
    const [porStatusRaw, total, tempoResposta, tempoResolucao] =
      await Promise.all([
        this.prisma.ticket.groupBy({
          by: ['status'],
          where: { tenantId },
          _count: { _all: true },
        }),
        this.prisma.ticket.count({ where: { tenantId } }),
        this.prisma.$queryRaw<{ media: number | null }[]>(
          Prisma.sql`SELECT AVG(TIMESTAMPDIFF(SECOND, criadoEm, primeiraRespostaEm)) AS media
                     FROM tickets WHERE tenantId = ${tenantId} AND primeiraRespostaEm IS NOT NULL`,
        ),
        this.prisma.$queryRaw<{ media: number | null }[]>(
          Prisma.sql`SELECT AVG(TIMESTAMPDIFF(SECOND, criadoEm, fechadoEm)) AS media
                     FROM tickets WHERE tenantId = ${tenantId} AND fechadoEm IS NOT NULL`,
        ),
      ]);

    const porStatus = Object.fromEntries(
      Object.values(StatusChamado).map((s) => [s, 0]),
    ) as Record<StatusChamado, number>;
    for (const linha of porStatusRaw) {
      porStatus[linha.status] = linha._count._all;
    }

    return {
      total,
      porStatus,
      tempoMedioRespostaSegundos: this.numero(tempoResposta[0]?.media),
      tempoMedioResolucaoSegundos: this.numero(tempoResolucao[0]?.media),
    };
  }

  async porArea(tenantId: string) {
    const rows = await this.prisma.ticket.groupBy({
      by: ['area'],
      where: { tenantId, area: { not: null } },
      _count: { _all: true },
    });
    return rows.map((r) => ({ area: r.area, total: r._count._all }));
  }

  async serie(tenantId: string, query: SerieQueryDto) {
    const ate = query.ate ? new Date(query.ate) : new Date();
    const de = query.de
      ? new Date(query.de)
      : new Date(ate.getTime() - 365 * 24 * 60 * 60 * 1000);
    const formato = FORMATO_MYSQL[query.granularidade];

    const rows = await this.prisma.$queryRaw<
      { periodo: string; total: bigint }[]
    >(
      Prisma.sql`SELECT DATE_FORMAT(criadoEm, ${formato}) AS periodo, COUNT(*) AS total
                 FROM tickets
                 WHERE tenantId = ${tenantId} AND criadoEm BETWEEN ${de} AND ${ate}
                 GROUP BY periodo ORDER BY periodo`,
    );

    return {
      granularidade: query.granularidade,
      de,
      ate,
      pontos: rows.map((r) => ({ periodo: r.periodo, total: Number(r.total) })),
    };
  }

  private numero(v: number | null | undefined): number | null {
    return v == null ? null : Math.round(Number(v));
  }
}
