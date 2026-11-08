import React, { createContext, useContext, useEffect, useState } from 'react';
import type {
  LoginRequestDto,
  RegisterRequestDto,
  UserGetDto,
  WorkspaceGetDto,
  WorkspaceModuleGetDto,
} from '../types/api';
import { api } from '../services/api';

interface AuthContextType {
  user: UserGetDto | null;
  workspace: WorkspaceGetDto | null;
  workspaceSlug: string | null;
  workspaceModules: WorkspaceModuleGetDto[];
  token: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginRequestDto) => Promise<void>;
  register: (payload: RegisterRequestDto) => Promise<void>;
  logout: () => void;
  updateCurrentUser: (updatedUser: UserGetDto) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractSlugFromJwt(token: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.workspaceSlug || null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserGetDto | null>(() => {
    const saved = localStorage.getItem('sigea_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [workspace, setWorkspace] = useState<WorkspaceGetDto | null>(() => {
    const saved = localStorage.getItem('sigea_workspace');
    return saved ? JSON.parse(saved) : null;
  });

  const [workspaceModules, setWorkspaceModules] = useState<WorkspaceModuleGetDto[]>(() => {
    const saved = localStorage.getItem('sigea_workspace_modules');
    return saved ? JSON.parse(saved) : [];
  });

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('sigea_token')
  );

  useEffect(() => {
    if (token && user && !workspace) {
      api.workspaces
        .findAll()
        .then((list) => {
          const found = list.find((w) => w.id === user.workspaceId);
          if (found) {
            setWorkspace(found);
            localStorage.setItem('sigea_workspace', JSON.stringify(found));
          }
        })
        .catch(() => {});
    }
  }, [token, user, workspace]);

  useEffect(() => {
    if (token && user) {
      api.workspaceModules
        .findAll()
        .then((list) => {
          const filtered = list.filter((wm) => wm.workspaceId === user.workspaceId);
          setWorkspaceModules(filtered);
          localStorage.setItem('sigea_workspace_modules', JSON.stringify(filtered));
        })
        .catch(() => {});
    }
  }, [token, user]);

  const login = async (payload: LoginRequestDto) => {
    const res = await api.auth.login(payload);
    localStorage.setItem('sigea_token', res.token);
    localStorage.setItem('sigea_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);

    if (res.workspace) {
      setWorkspace(res.workspace);
      localStorage.setItem('sigea_workspace', JSON.stringify(res.workspace));
    } else {
      try {
        const workspaces = await api.workspaces.findAll();
        const ws = workspaces.find((w) => w.id === res.user.workspaceId) || null;
        if (ws) {
          setWorkspace(ws);
          localStorage.setItem('sigea_workspace', JSON.stringify(ws));
        }
      } catch {
        // ignora caso não consiga listar
      }
    }

    try {
      const wmList = await api.workspaceModules.findAll();
      const filtered = wmList.filter((wm) => wm.workspaceId === res.user.workspaceId);
      setWorkspaceModules(filtered);
      localStorage.setItem('sigea_workspace_modules', JSON.stringify(filtered));
    } catch {
      // ignora caso falhe
    }
  };

  const register = async (payload: RegisterRequestDto) => {
    const res = await api.auth.register(payload);
    localStorage.setItem('sigea_token', res.token);
    localStorage.setItem('sigea_user', JSON.stringify(res.user));
    localStorage.setItem('sigea_workspace', JSON.stringify(res.workspace));
    setToken(res.token);
    setUser(res.user);
    setWorkspace(res.workspace);

    try {
      const wmList = await api.workspaceModules.findAll();
      const filtered = wmList.filter((wm) => wm.workspaceId === res.user.workspaceId);
      setWorkspaceModules(filtered);
      localStorage.setItem('sigea_workspace_modules', JSON.stringify(filtered));
    } catch {
      // ignora caso falhe
    }
  };

  const logout = () => {
    localStorage.removeItem('sigea_token');
    localStorage.removeItem('sigea_user');
    localStorage.removeItem('sigea_workspace');
    localStorage.removeItem('sigea_workspace_modules');
    setToken(null);
    setUser(null);
    setWorkspace(null);
    setWorkspaceModules([]);
  };

  const updateCurrentUser = (updatedUser: UserGetDto) => {
    setUser(updatedUser);
    localStorage.setItem('sigea_user', JSON.stringify(updatedUser));
  };

  const workspaceSlug =
    workspace?.slug ||
    user?.workspaceSlug ||
    extractSlugFromJwt(token) ||
    null;

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        workspaceSlug,
        workspaceModules,
        token,
        isAuthenticated: Boolean(token && user),
        login,
        register,
        logout,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return ctx;
};
