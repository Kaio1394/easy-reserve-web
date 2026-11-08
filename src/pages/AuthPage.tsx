import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReservaFacilLogo } from '../components/ReservaFacilLogo';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { ModuleGetDto } from '../types/api';
import {
  AlertCircle,
  Building2,
  CalendarCheck,
  CheckCircle2,
  CheckSquare,
  KeyRound,
  LayoutDashboard,
  Lock,
  MonitorSpeaker,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';

const MODULE_LABELS: Record<string, { label: string; description: string }> = {
  'MOD-01': {
    label: 'Painel de Consulta',
    description: 'Visão consolidada de espaços, recursos e indicadores da unidade',
  },
  'MOD-02': {
    label: 'Ambientes & Espaços',
    description: 'Cadastro e gestão de laboratórios, salas de aula e auditórios',
  },
  'MOD-03': {
    label: 'Elementos & Recursos',
    description: 'Inventário de equipamentos (cadeiras, projetores, ar-condicionado) e estado operacional',
  },
  'MOD-04': {
    label: 'Controle de Chaves',
    description: 'Controle de portaria, disponibilidade e empréstimo de chaves',
  },
  'MOD-05': {
    label: 'Servidores & Usuários',
    description: 'Credenciamento e gestão de operadores vinculados à unidade',
  },
  'MOD-06': {
    label: 'Reserva de Ambientes',
    description: 'Reserva de salas e laboratórios com vinculação obrigatória de chave em uso',
  },
  'MOD-07': {
    label: 'Configurações',
    description: 'Pesos de relevância dos recursos e parâmetros de recomendação de salas',
  },
};

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estado Login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Estado Cadastro (Workspace + Owner + Módulos)
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Módulos disponíveis no sistema (público: GET /api/v1/workspace-modules/available ou /api/v1/modules)
  const [availableModules, setAvailableModules] = useState<ModuleGetDto[]>([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);

  useEffect(() => {
    if (mode === 'register' && availableModules.length === 0) {
      setLoadingModules(true);
      api.workspaceModules
        .findAvailableModules()
        .catch(() => api.modules.findAll())
        .then((modules) => {
          setAvailableModules(modules);
          setSelectedModuleIds(modules.map((m) => m.id));
        })
        .catch(() => {
          setAvailableModules([]);
        })
        .finally(() => {
          setLoadingModules(false);
        });
    }
  }, [mode, availableModules.length]);

  const getModuleIcon = (slug: string) => {
    switch (slug) {
      case 'MOD-01':
        return <LayoutDashboard className="w-4 h-4" />;
      case 'MOD-02':
        return <Building2 className="w-4 h-4" />;
      case 'MOD-03':
        return <MonitorSpeaker className="w-4 h-4" />;
      case 'MOD-04':
        return <KeyRound className="w-4 h-4" />;
      case 'MOD-05':
        return <Users className="w-4 h-4" />;
      case 'MOD-06':
        return <CalendarCheck className="w-4 h-4" />;
      case 'MOD-07':
        return <Settings className="w-4 h-4" />;
      default:
        return <LayoutDashboard className="w-4 h-4" />;
    }
  };

  const handleWorkspaceNameChange = (value: string) => {
    setWorkspaceName(value);
    if (!workspaceSlug || workspaceSlug === slugify(workspaceName)) {
      setWorkspaceSlug(slugify(value));
    }
  };

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await login({
        login: loginIdentifier.trim(),
        password: loginPassword,
      });
      navigate('/painel');
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (availableModules.length > 0 && selectedModuleIds.length === 0) {
      setError('Selecione pelo menos um módulo operacional para associar à unidade.');
      return;
    }

    setLoading(true);

    try {
      await register({
        workspaceName: workspaceName.trim(),
        workspaceSlug: workspaceSlug.trim(),
        name: name.trim(),
        username: username.trim(),
        password,
        email: email.trim(),
        phone: phone.trim() || undefined,
        cpf: cpf.trim() || undefined,
        moduleIds: selectedModuleIds.length > 0 ? selectedModuleIds : undefined,
      });
      setSuccessMsg('Unidade Gestora, Módulos e Gestor OWNER registrados com sucesso!');
      navigate('/painel');
    } catch (err: any) {
      setError(err.message || 'Não foi possível concluir o credenciamento da unidade.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef1f4] flex flex-col justify-between">
      {/* Barra Superior */}
      <div className="bg-[#002244] text-[#b3c7dd] text-[11px] border-b border-[#001933]">
        <div className="max-w-5xl mx-auto px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Infraestrutura e Gestão de Espaços Físicos</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px]">
            <span className="text-emerald-400">● SISTEMA OPERACIONAL</span>
          </div>
        </div>
      </div>

      {/* Container Central SEI / RESERVA FÁCIL */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl">
          <div className="bg-white border border-[#b8c2cc] rounded shadow-sm overflow-hidden">
            {/* Header SEI Clássico */}
            <div className="bg-[#003366] text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#002244]">
              <div className="flex items-center gap-3">
                <ReservaFacilLogo className="w-11 h-11 drop-shadow-md" />
                <div>
                  <h1 className="text-sm font-bold tracking-tight">
                    RESERVA FÁCIL
                  </h1>
                  <p className="text-[12px] text-[#b3c7dd]">
                    Módulo Operacional de Agendamento de Ambientes e Controle de Chaves
                  </p>
                </div>
              </div>

              {/* Seletor Modo SEI */}
              <div className="flex items-center bg-[#002244] p-1 rounded text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className={`px-3 py-1 rounded text-[12px] transition cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white text-[#003366] font-bold'
                      : 'text-[#99badd] hover:text-white'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className={`px-3 py-1 rounded text-[12px] transition cursor-pointer ${
                    mode === 'register'
                      ? 'bg-white text-[#003366] font-bold'
                      : 'text-[#99badd] hover:text-white'
                  }`}
                >
                  Cadastrar Unidade (Workspace)
                </button>
              </div>
            </div>

            {/* Corpo do Painel */}
            <div className="p-6 sm:p-8">
              {error && (
                <div className="mb-5 bg-red-50 border-l-4 border-red-700 p-3 text-xs text-red-900 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Falha na Operação:</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {successMsg && (
                <div className="mb-5 bg-emerald-50 border-l-4 border-emerald-700 p-3 text-xs text-emerald-900 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Operação Confirmada:</span>
                    <span>{successMsg}</span>
                  </div>
                </div>
              )}

              {mode === 'login' ? (
                /* MODO LOGIN SEI (DIRETO) */
                <div>
                  <div className="mb-5 pb-2 border-b border-[#e2e8f0] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#003366] uppercase">
                      Autenticação de Usuário Cadastrado
                    </span>
                  </div>

                  <form className="space-y-4" onSubmit={handleLoginSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                      <label className="text-xs font-bold text-[#333] text-left md:text-right">
                        Usuário / E-mail:
                      </label>
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="Informe seu username ou e-mail institucional"
                          required
                          className="w-full bg-white border border-[#ced4da] rounded px-3 py-1.5 text-xs text-[#212529] focus:outline-none focus:border-[#003366]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                      <label className="text-xs font-bold text-[#333] text-left md:text-right">
                        Senha de Acesso:
                      </label>
                      <div className="md:col-span-2">
                        <input
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••••••"
                          required
                          className="w-full bg-white border border-[#ced4da] rounded px-3 py-1.5 text-xs text-[#212529] focus:outline-none focus:border-[#003366]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2 pt-2">
                      <div></div>
                      <div className="md:col-span-2 flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-6 py-2 bg-[#003366] hover:bg-[#002244] disabled:opacity-60 text-white font-bold rounded text-xs uppercase tracking-wider transition cursor-pointer"
                        >
                          {loading ? 'Autenticando...' : 'Confirmar Acesso'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('register');
                            setError(null);
                          }}
                          className="text-xs text-[#003366] hover:underline cursor-pointer"
                        >
                          Cadastrar Nova Unidade
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              ) : (
                /* MODO CADASTRO SEI (WORKSPACE + MÓDULOS + OWNER) */
                <div>
                  <div className="mb-5 pb-2 border-b border-[#e2e8f0] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#003366] uppercase">
                      Abertura de Unidade Gestora (Workspace), Módulos e Gestor (OWNER)
                    </span>
                    <span className="text-[11px] bg-[#003366] text-white px-2 py-0.5 rounded font-mono flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      ROLE: OWNER
                    </span>
                  </div>

                  <form className="space-y-3" onSubmit={handleRegisterSubmit}>
                    {/* Seção 1: Workspace */}
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                      <label className="text-xs font-bold text-[#333] text-left md:text-right">
                        Nome da Unidade (Workspace): *
                      </label>
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          value={workspaceName}
                          onChange={(e) => handleWorkspaceNameChange(e.target.value)}
                          placeholder="ex: Câmpus Central"
                          required
                          className="w-full bg-white border border-[#ced4da] rounded px-3 py-1.5 text-xs text-[#212529] focus:outline-none focus:border-[#003366]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                      <label className="text-xs font-bold text-[#333] text-left md:text-right">
                        Slug da Unidade: *
                      </label>
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          value={workspaceSlug}
                          onChange={(e) => setWorkspaceSlug(e.target.value)}
                          placeholder="ex: campus-central"
                          required
                          className="w-full bg-white border border-[#ced4da] rounded px-3 py-1.5 text-xs text-[#212529] font-mono focus:outline-none focus:border-[#003366]"
                        />
                      </div>
                    </div>

                    {/* Seção 2: Módulos Operacionais Padrão do Workspace (MOD-01 a MOD-05) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 items-start gap-2 pt-3 border-t border-[#f0f2f5]">
                      <div className="text-left md:text-right pt-1">
                        <label className="text-xs font-bold text-[#333] block">
                          Módulos da Unidade:
                        </label>
                        <span className="text-[11px] text-[#6c757d] block">
                          Módulos padrão obrigatórios associados automaticamente
                        </span>
                      </div>

                      <div className="md:col-span-2">
                        {loadingModules ? (
                          <div className="p-3 bg-[#f8f9fa] border border-[#ced4da] rounded text-xs text-[#6c757d]">
                            Carregando módulos padrão...
                          </div>
                        ) : availableModules.length === 0 ? (
                          <div className="p-3 bg-amber-50 border border-amber-300 rounded text-xs text-amber-900">
                            Nenhum módulo encontrado no sistema. Ao registrar, os módulos ativos serão vinculados automaticamente.
                          </div>
                        ) : (
                          <div className="border border-[#b8c2cc] rounded overflow-hidden divide-y divide-[#e2e8f0]">
                            <div className="bg-[#f8f9fa] px-3 py-1.5 flex items-center justify-between text-[11px]">
                              <span className="font-bold text-[#003366] uppercase tracking-wider">
                                Menu de Operações
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#003366] bg-[#e8eef5] px-2 py-0.5 rounded border border-[#b8c2cc]">
                                <Lock className="w-3 h-3" />
                                MÓDULOS PADRÃO
                              </span>
                            </div>

                            {availableModules.map((mod) => {
                              const meta = MODULE_LABELS[mod.slug];
                              const displayTitle = mod.name || meta?.label || mod.slug;
                              const displayDesc = meta?.description;

                              return (
                                <div
                                  key={mod.id}
                                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left text-xs bg-[#003366]/6 text-[#003366] font-semibold select-none cursor-default"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <CheckSquare className="w-4 h-4 text-[#003366] shrink-0" />
                                    <span className="text-[#003366]">
                                      {getModuleIcon(mod.slug)}
                                    </span>
                                    <div>
                                      <div className="text-xs font-bold text-[#1f2933]">
                                        {displayTitle}
                                      </div>
                                      {displayDesc && (
                                        <div className="text-[11px] font-normal text-[#6c757d]">
                                          {displayDesc}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded shrink-0 bg-[#003366] text-white font-bold">
                                    {mod.slug}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Seção 3: Gestor Owner */}
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2 pt-3 border-t border-[#f0f2f5]">
                      <label className="text-xs font-bold text-[#333] text-left md:text-right">
                        Nome Completo do Gestor: *
                      </label>
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="ex: Kaio Cândido Santiago"
                          required
                          className="w-full bg-white border border-[#ced4da] rounded px-3 py-1.5 text-xs text-[#212529] focus:outline-none focus:border-[#003366]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                      <label className="text-xs font-bold text-[#333] text-left md:text-right">
                        Usuário do Gestor (username): *
                      </label>
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="identificador.gestor"
                          required
                          className="w-full bg-white border border-[#ced4da] rounded px-3 py-1.5 text-xs text-[#212529] focus:outline-none focus:border-[#003366]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                      <label className="text-xs font-bold text-[#333] text-left md:text-right">
                        CPF do Gestor:
                      </label>
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          value={cpf}
                          onChange={(e) => setCpf(e.target.value)}
                          placeholder="000.000.000-00"
                          maxLength={20}
                          className="w-full bg-white border border-[#ced4da] rounded px-3 py-1.5 text-xs text-[#212529] font-mono focus:outline-none focus:border-[#003366]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                      <label className="text-xs font-bold text-[#333] text-left md:text-right">
                        E-mail Institucional: *
                      </label>
                      <div className="md:col-span-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="gestor@instituicao.edu.br"
                          required
                          className="w-full bg-white border border-[#ced4da] rounded px-3 py-1.5 text-xs text-[#212529] focus:outline-none focus:border-[#003366]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                      <label className="text-xs font-bold text-[#333] text-left md:text-right">
                        Telefone / Ramal:
                      </label>
                      <div className="md:col-span-2">
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(41) 3310-0000"
                          className="w-full bg-white border border-[#ced4da] rounded px-3 py-1.5 text-xs text-[#212529] focus:outline-none focus:border-[#003366]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                      <label className="text-xs font-bold text-[#333] text-left md:text-right">
                        Senha Inicial do Gestor: *
                      </label>
                      <div className="md:col-span-2">
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mínimo de 6 caracteres"
                          minLength={6}
                          required
                          className="w-full bg-white border border-[#ced4da] rounded px-3 py-1.5 text-xs text-[#212529] focus:outline-none focus:border-[#003366]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2 pt-3">
                      <div></div>
                      <div className="md:col-span-2 flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-6 py-2 bg-[#003366] hover:bg-[#002244] disabled:opacity-60 text-white font-bold rounded text-xs uppercase tracking-wider transition cursor-pointer"
                        >
                          {loading ? 'Registrando...' : 'Criar Unidade & Associar Módulos'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('login');
                            setError(null);
                          }}
                          className="text-xs text-[#555] hover:underline cursor-pointer"
                        >
                          Voltar ao Login
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-[#e2e8f0] text-[12px] text-[#6c757d] flex items-center justify-between">
                <span>Terminal: PORTARIA-CENTRAL-01</span>
                <span className="font-mono">STATUS: OPERACIONAL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
