export interface PaginationMeta {
  limit: number;
  current_page: number;
  total_pages: number;
  total_items: number;
  has_next: boolean;
  has_prev: boolean;
  order_by?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface BackendPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export function normalizePagination(p: BackendPagination): PaginationMeta {
  return {
    current_page: p.page,
    total_pages: p.totalPages,
    total_items: p.total,
    has_next: p.hasNext,
    has_prev: p.hasPrevious,
    limit: p.limit,
  };
}

export interface ApiError {
  code: string; // código HTTP (400, 404, 500)
  message: string; // mensaje legible
  details?: any; // información extra (ej. validaciones)
  timestamp?: string; // opcional, cuándo ocurrió
  requestId?: string; // opcional, trazabilidad
}

export interface ApiResponse<T> {
  success?: boolean;
  status: 'success' | 'error'; // estado de la respuesta
  code: string; // código HTTP
  message: string; // mensaje descriptivo
  data?: T; // datos (solo si success)
  meta?: PaginationMeta; // metadatos de paginación
  error?: ApiError; // información de error (solo si error)
}
