export interface PaginationMeta {
  limit: number; // cantidad por página
  current_page: number; // página actual
  total_pages: number; // total de páginas
  total_items: number; // total de registros
  has_next: boolean; // hay página siguiente
  has_prev: boolean; // hay página anterior
  order_by?: string; // campo de ordenamiento
  sortDirection?: 'ASC' | 'DESC'; // dirección de orden
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
