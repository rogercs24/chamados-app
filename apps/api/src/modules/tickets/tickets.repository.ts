import { Inject, Injectable } from '@nestjs/common';
import { Attachment, Prisma, Ticket, TicketResponse } from '@prisma/client';
import { TENANT_PRISMA, TenantPrisma } from '../../infra/prisma/prisma.module';

export interface CreateAttachmentData {
  responseId: string;
  nomeOriginal: string;
  caminho: string;
  mime: string;
  tamanho: number;
}

export type CreateTicketData = {
  titulo: string;
  descricao: string;
  solicitanteId: string;
  clientId?: string;
};

@Injectable()
export class TicketsRepository {
  constructor(@Inject(TENANT_PRISMA) private readonly prisma: TenantPrisma) {}

  create(data: CreateTicketData): Promise<Ticket> {
    return this.prisma.ticket.create({
      data: data as unknown as Prisma.TicketCreateInput,
    });
  }

  async list(
    where: Prisma.TicketWhereInput,
    page: number,
    limit: number,
  ): Promise<{ data: Ticket[]; total: number }> {
    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ status: 'asc' }, { criadoEm: 'desc' }],
      }),
      this.prisma.ticket.count({ where }),
    ]);
    return { data, total };
  }

  findById(id: string): Promise<Ticket | null> {
    return this.prisma.ticket.findFirst({ where: { id } });
  }

  findByIdWithResponses(id: string): Promise<
    | (Ticket & {
        respostas: (TicketResponse & { anexos: Attachment[] })[];
      })
    | null
  > {
    return this.prisma.ticket.findFirst({
      where: { id },
      include: {
        respostas: {
          orderBy: { criadoEm: 'asc' },
          include: { anexos: true },
        },
      },
    }) as Promise<
      | (Ticket & { respostas: (TicketResponse & { anexos: Attachment[] })[] })
      | null
    >;
  }

  async update(
    id: string,
    data: Prisma.TicketUncheckedUpdateManyInput,
  ): Promise<Ticket | null> {
    await this.prisma.ticket.updateMany({ where: { id }, data });
    return this.findById(id);
  }

  createResponse(
    ticketId: string,
    autorId: string,
    texto: string,
  ): Promise<TicketResponse> {
    return this.prisma.ticketResponse.create({
      data: { ticketId, autorId, texto } as unknown as Prisma.TicketResponseCreateInput,
    });
  }

  createAttachment(data: CreateAttachmentData): Promise<Attachment> {
    return this.prisma.attachment.create({
      data: data as unknown as Prisma.AttachmentCreateInput,
    });
  }

  findAttachmentById(
    id: string,
  ): Promise<(Attachment & { response: { ticketId: string } }) | null> {
    return this.prisma.attachment.findFirst({
      where: { id },
      include: { response: { select: { ticketId: true } } },
    }) as Promise<(Attachment & { response: { ticketId: string } }) | null>;
  }
}
