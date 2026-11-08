export type Role = 'ADMIN' | 'OWNER' | 'COMMON';

export interface ErrorResponse {
  httpCode: number;
  message: string;
  timestamp: string;
}

export interface WorkspaceGetDto {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceCreateDto {
  name: string;
  slug: string;
}

export interface WorkspaceUpdateDto {
  id: string;
  name: string;
  slug: string;
  active?: boolean;
}

export interface UserGetDto {
  id: string;
  workspaceId: string;
  workspaceSlug?: string;
  workspaceName?: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  cpf?: string;
  role: Role;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateDto {
  workspaceId: string;
  name: string;
  username: string;
  password: string;
  email: string;
  phone?: string;
  cpf?: string;
  role: Role;
}

export interface UserUpdateDto {
  id: string;
  name?: string;
  username?: string;
  password?: string;
  email?: string;
  phone?: string;
  cpf?: string;
  role?: Role;
  active?: boolean;
}

export interface UserProfileUpdateDto {
  name?: string;
  username?: string;
  password?: string;
  email?: string;
  phone?: string;
  cpf?: string;
}

export interface LoginRequestDto {
  login: string;
  password: string;
}

export interface LoginResponseDto {
  workspace: WorkspaceGetDto;
  user: UserGetDto;
  token: string;
  expiresIn: number;
}

export interface RegisterRequestDto {
  workspaceName: string;
  workspaceSlug: string;
  name: string;
  username: string;
  password: string;
  email: string;
  phone?: string;
  cpf?: string;
  moduleIds?: string[];
}

export interface RegisterResponseDto {
  workspace: WorkspaceGetDto;
  user: UserGetDto;
  token: string;
  expiresIn: number;
}

export interface EnvironmentGetDto {
  id: string;
  workspaceId: string;
  workspaceSlug?: string;
  name: string;
  description?: string;
  capacity?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentCreateDto {
  workspaceId: string;
  name: string;
  description?: string;
  capacity?: number;
}

export interface EnvironmentUpdateDto {
  id: string;
  name?: string;
  description?: string;
  capacity?: number;
  active?: boolean;
}

export interface EnvironmentRecommendationRequestDto {
  workspaceId: string;
  requiredResources?: string[];
  resourceWeights?: Record<string, number>;
  minCapacity?: number;
  startTime?: string;
  endTime?: string;
}

export interface EnvironmentRecommendationItemDto {
  environmentId: string;
  environmentName: string;
  description?: string;
  capacity?: number;
  matchScore: number;
  matchPercentage: number;
  matchedResources: string[];
  missingResources: string[];
  available: boolean;
  keyStatus: string;
  reason: string;
}

export interface EnvironmentResourceGetDto {
  id: string;
  workspaceId: string;
  environmentId?: string | null;
  environmentName?: string | null;
  name: string;
  quantity?: number | null;
  weight?: number;
  operational: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentResourceCreateDto {
  workspaceId: string;
  environmentId?: string | null;
  name: string;
  quantity?: number | null;
  weight?: number;
  operational?: boolean;
}

export interface EnvironmentResourceUpdateDto {
  id: string;
  environmentId?: string | null;
  name?: string;
  quantity?: number | null;
  weight?: number;
  operational?: boolean;
  active?: boolean;
}

export interface KeyGetDto {
  id: string;
  environmentId: string;
  code: string;
  available: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KeyCreateDto {
  environmentId: string;
  code: string;
}

export interface KeyUpdateDto {
  id: string;
  code?: string;
  available?: boolean;
  active?: boolean;
}

export interface ModuleGetDto {
  id: string;
  slug: string;
  name?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleCreateDto {
  slug: string;
  name?: string;
}

export interface ModuleUpdateDto {
  slug: string;
  name?: string;
  active: boolean;
}

export interface WorkspaceModuleGetDto {
  id: string;
  workspaceId: string;
  moduleId: string;
  moduleSlug: string;
  moduleName?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceModuleCreateDto {
  workspaceId: string;
  moduleId: string;
}

export interface WorkspaceModuleUpdateDto {
  id: string;
  active: boolean;
}

export type ReservationStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface ReservationGetDto {
  id: string;
  workspaceId: string;
  environmentId: string;
  environmentName: string;
  keyId: string;
  keyCode: string;
  keyAvailable: boolean;
  userId: string;
  userName: string;
  purpose?: string | null;
  startTime: string;
  endTime?: string | null;
  status: ReservationStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationCreateDto {
  workspaceId: string;
  environmentId: string;
  keyId: string;
  userId?: string;
  purpose?: string;
  startTime?: string;
  endTime?: string;
}

export interface ReservationUpdateDto {
  id: string;
  purpose?: string;
  startTime?: string;
  endTime?: string;
  status?: ReservationStatus;
  active?: boolean;
}

export type ReservationHistoryAction =
  | 'CREATED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'UPDATED'
  | 'DELETED';

export interface ReservationHistoryGetDto {
  id: string;
  workspaceId: string;
  reservationId?: string | null;
  environmentId: string;
  environmentName: string;
  keyId: string;
  keyCode: string;
  userId: string;
  userName: string;
  action: ReservationHistoryAction;
  purpose?: string | null;
  startTime: string;
  endTime?: string | null;
  status: ReservationStatus;
  notes?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}


