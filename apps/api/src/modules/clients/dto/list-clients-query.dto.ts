import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

/** Busca por razão social, nome fantasia ou CNPJ (campo `search`). */
export class ListClientsQueryDto extends PaginationQueryDto {}
