import type {
  EnvironmentCreateDto,
  EnvironmentGetDto,
  EnvironmentRecommendationItemDto,
  EnvironmentRecommendationRequestDto,
  EnvironmentResourceCreateDto,
  EnvironmentResourceGetDto,
  EnvironmentResourceUpdateDto,
  EnvironmentUpdateDto,
  KeyCreateDto,
  KeyGetDto,
  KeyUpdateDto,
  LoginRequestDto,
  LoginResponseDto,
  ModuleCreateDto,
  ModuleGetDto,
  ModuleUpdateDto,
  RegisterRequestDto,
  RegisterResponseDto,
  ReservationCreateDto,
  ReservationGetDto,
  ReservationHistoryGetDto,
  ReservationUpdateDto,
  UserCreateDto,
  UserGetDto,
  UserProfileUpdateDto,
  UserUpdateDto,
  WorkspaceGetDto,
  WorkspaceModuleCreateDto,
  WorkspaceModuleGetDto,
  WorkspaceModuleUpdateDto,
} from '../types/api';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://easy-reserve-api.72-60-158-216.sslip.io/api/v1'
    : 'http://localhost:9011/api/v1');

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('sigea_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      data?.message || `Erro na comunicação com o servidor (HTTP ${response.status})`;
    throw new Error(errorMessage);
  }

  return data as T;
}

export const api = {
  auth: {
    login: (payload: LoginRequestDto) =>
      request<LoginResponseDto>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    register: (payload: RegisterRequestDto) =>
      request<RegisterResponseDto>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  workspaces: {
    findAll: () => request<WorkspaceGetDto[]>('/workspaces'),
  },

  users: {
    findAll: () => request<UserGetDto[]>('/users'),
    create: (payload: UserCreateDto) =>
      request<UserGetDto>('/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (payload: UserUpdateDto) =>
      request<UserGetDto>('/users', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    updateProfile: (payload: UserProfileUpdateDto) =>
      request<UserGetDto>('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      request<void>('/users', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      }),
  },

  environments: {
    findAll: () => request<EnvironmentGetDto[]>('/environments'),
    recommend: (payload: EnvironmentRecommendationRequestDto) =>
      request<EnvironmentRecommendationItemDto[]>('/environments/recommend', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    create: (payload: EnvironmentCreateDto) =>
      request<EnvironmentGetDto>('/environments', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (payload: EnvironmentUpdateDto) =>
      request<EnvironmentGetDto>('/environments', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      request<void>('/environments', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      }),
  },

  environmentResources: {
    findAll: () => request<EnvironmentResourceGetDto[]>('/environment-resources'),
    create: (payload: EnvironmentResourceCreateDto) =>
      request<EnvironmentResourceGetDto>('/environment-resources', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (payload: EnvironmentResourceUpdateDto) =>
      request<EnvironmentResourceGetDto>('/environment-resources', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      request<void>('/environment-resources', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      }),
  },

  keys: {
    findAll: () => request<KeyGetDto[]>('/keys'),
    create: (payload: KeyCreateDto) =>
      request<KeyGetDto>('/keys', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (payload: KeyUpdateDto) =>
      request<KeyGetDto>('/keys', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      request<void>('/keys', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      }),
  },

  modules: {
    findAll: () => request<ModuleGetDto[]>('/modules'),
    create: (payload: ModuleCreateDto) =>
      request<ModuleGetDto>('/modules', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (payload: ModuleUpdateDto) =>
      request<ModuleGetDto>('/modules', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    delete: (slug: string) =>
      request<void>('/modules', {
        method: 'DELETE',
        body: JSON.stringify({ slug }),
      }),
  },

  workspaceModules: {
    findAll: () => request<WorkspaceModuleGetDto[]>('/workspace-modules'),
    findAvailableModules: () => request<ModuleGetDto[]>('/workspace-modules/available'),
    create: (payload: WorkspaceModuleCreateDto) =>
      request<WorkspaceModuleGetDto>('/workspace-modules', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (payload: WorkspaceModuleUpdateDto) =>
      request<WorkspaceModuleGetDto>('/workspace-modules', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      request<void>('/workspace-modules', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      }),
  },

  reservations: {
    findAll: () => request<ReservationGetDto[]>('/reservations'),
    create: (payload: ReservationCreateDto) =>
      request<ReservationGetDto>('/reservations', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (payload: ReservationUpdateDto) =>
      request<ReservationGetDto>('/reservations', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      request<void>('/reservations', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      }),
  },

  reservationHistories: {
    findAll: () => request<ReservationHistoryGetDto[]>('/reservation-histories'),
    findByEnvironmentId: (environmentId: string) =>
      request<ReservationHistoryGetDto[]>(`/reservation-histories/environment/${environmentId}`),
  },
};
