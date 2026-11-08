import React, { useCallback, useEffect, useState } from 'react';
import { type ActiveTab, SeiLayout } from '../components/SeiLayout';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type {
  EnvironmentGetDto,
  KeyGetDto,
  Role,
  UserGetDto,
} from '../types/api';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  KeyRound,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, workspace } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const [environments, setEnvironments] = useState<EnvironmentGetDto[]>([]);
  const [keys, setKeys] = useState<KeyGetDto[]>([]);
  const [users, setUsers] = useState<UserGetDto[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form Ambientes
  const [envName, setEnvName] = useState('');
  const [envDescription, setEnvDescription] = useState('');
  const [envCapacity, setEnvCapacity] = useState('');

  // Form Chaves
  const [keyEnvId, setKeyEnvId] = useState('');
  const [keyCode, setKeyCode] = useState('');

  // Form Usuários
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCpf, setNewCpf] = useState('');
  const [newRole, setNewRole] = useState<Role>('COMMON');

  const loadAllData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const [envList, keyList, userList] = await Promise.all([
        api.environments.findAll().catch(() => []),
        api.keys.findAll().catch(() => []),
        api.users.findAll().catch(() => []),
      ]);

      const wsEnvs = envList.filter((e) => e.workspaceId === user.workspaceId);
      const wsEnvIds = new Set(wsEnvs.map((e) => e.id));
      const wsKeys = keyList.filter((k) => wsEnvIds.has(k.environmentId));
      const wsUsers = userList.filter((u) => u.workspaceId === user.workspaceId);

      setEnvironments(wsEnvs);
      setKeys(wsKeys);
      setUsers(wsUsers);

      if (wsEnvs.length > 0 && !keyEnvId) {
        setKeyEnvId(wsEnvs[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados operacionais.');
    } finally {
      setLoading(false);
    }
  }, [user, keyEnvId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const showSuccess = (msg: string) => {
    setFeedback(msg);
    setError(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  // --- Handlers Ambientes ---
  const handleCreateEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    try {
      await api.environments.create({
        workspaceId: user.workspaceId,
        name: envName.trim(),
        description: envDescription.trim() || undefined,
        capacity: envCapacity ? Number(envCapacity) : undefined,
      });
      setEnvName('');
      setEnvDescription('');
      setEnvCapacity('');
      showSuccess('Ambiente físico cadastrado com sucesso.');
      await loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteEnvironment = async (id: string) => {
    setError(null);
    try {
      await api.environments.delete(id);
      showSuccess('Ambiente removido com sucesso.');
      await loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- Handlers Chaves ---
  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyEnvId) {
      setError('Selecione um ambiente antes de cadastrar a chave.');
      return;
    }
    setError(null);
    try {
      await api.keys.create({
        environmentId: keyEnvId,
        code: keyCode.trim(),
      });
      setKeyCode('');
      showSuccess('Chave patrimonial cadastrada na portaria.');
      await loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleKeyAvailability = async (keyItem: KeyGetDto) => {
    setError(null);
    try {
      await api.keys.update({
        id: keyItem.id,
        code: keyItem.code,
        available: !keyItem.available,
        active: keyItem.active,
      });
      showSuccess(
        `Status da chave ${keyItem.code} atualizado para ${
          !keyItem.available ? 'DISPONÍVEL NA PORTARIA' : 'EM USO / RETIRADA'
        }.`
      );
      await loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteKey = async (id: string) => {
    setError(null);
    try {
      await api.keys.delete(id);
      showSuccess('Chave removida do cadastro.');
      await loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- Handlers Usuários ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    try {
      await api.users.create({
        workspaceId: user.workspaceId,
        name: newUsername.trim(),
        username: newUsername.trim(),
        email: newEmail.trim(),
        password: newPassword,
        phone: newPhone.trim() || undefined,
        cpf: newCpf.trim() || undefined,
        role: newRole,
      });
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewPhone('');
      setNewCpf('');
      setNewRole('COMMON');
      showSuccess('Servidor / Usuário credenciado na unidade.');
      await loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    setError(null);
    try {
      await api.users.delete(id);
      showSuccess('Usuário removido da unidade.');
      await loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const availableKeysCount = keys.filter((k) => k.available).length;
  const borrowedKeysCount = keys.length - availableKeysCount;

  const getEnvName = (envId: string) =>
    environments.find((e) => e.id === envId)?.name || envId.slice(0, 8);

  return (
    <SeiLayout activeTab={activeTab} onSelectTab={setActiveTab}>
      {/* Barra de Status da Operação */}
      <div className="mb-4 bg-white border border-[#b8c2cc] rounded px-4 py-2.5 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-[#003366] uppercase">
            {activeTab === 'overview' && 'Resumo Geral da Unidade Gestora'}
            {activeTab === 'environments' && 'Cadastro e Controle de Ambientes Físicos'}
            {activeTab === 'keys' && 'Portaria — Controle de Empréstimo e Guarda de Chaves'}
            {activeTab === 'users' && 'Credenciamento Funcional de Servidores e Operadores'}
          </span>
        </div>

        <button
          onClick={loadAllData}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs bg-[#eef1f4] hover:bg-[#e2e8f0] text-[#003366] font-semibold px-2.5 py-1 rounded border border-[#b8c2cc] transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Dados</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-700 p-3 text-xs text-red-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {feedback && (
        <div className="mb-4 bg-emerald-50 border-l-4 border-emerald-700 p-3 text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* ABA 1: PAINEL OPERACIONAL (OVERVIEW) */}
      {/* =================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-[#b8c2cc] rounded p-4">
              <div className="flex items-center justify-between text-[#6c757d] text-xs mb-1">
                <span className="font-bold uppercase text-[11px]">Ambientes Ativos</span>
                <Building2 className="w-4 h-4 text-[#003366]" />
              </div>
              <div className="text-2xl font-bold text-[#003366] font-mono">
                {environments.length}
              </div>
              <div className="text-[11px] text-[#6c757d] mt-1">
                Salas, laboratórios e auditórios
              </div>
            </div>

            <div className="bg-white border border-[#b8c2cc] rounded p-4">
              <div className="flex items-center justify-between text-[#6c757d] text-xs mb-1">
                <span className="font-bold uppercase text-[11px]">Chaves no Quadro</span>
                <KeyRound className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-2xl font-bold text-emerald-700 font-mono">
                {availableKeysCount}{' '}
                <span className="text-xs font-normal text-[#6c757d]">
                  / {keys.length}
                </span>
              </div>
              <div className="text-[11px] text-[#6c757d] mt-1">
                {borrowedKeysCount} chave(s) retirada(s) no momento
              </div>
            </div>

            <div className="bg-white border border-[#b8c2cc] rounded p-4">
              <div className="flex items-center justify-between text-[#6c757d] text-xs mb-1">
                <span className="font-bold uppercase text-[11px]">Usuários da Unidade</span>
                <Users className="w-4 h-4 text-[#003366]" />
              </div>
              <div className="text-2xl font-bold text-[#003366] font-mono">
                {users.length}
              </div>
              <div className="text-[11px] text-[#6c757d] mt-1">
                Gestores e operadores credenciados
              </div>
            </div>
          </div>

          {/* Quadro Rápido de Chaves e Ambientes */}
          <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
            <div className="bg-[#003366] text-white px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase">
                Quadro Geral de Ambientes e Disponibilidade de Chaves
              </span>
              <span className="text-[11px] font-mono text-[#b3c7dd]">
                Unidade: {workspace?.slug || 'ATUAL'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#b8c2cc] text-[#333]">
                    <th className="py-2.5 px-3 font-bold">Ambiente / Espaço</th>
                    <th className="py-2.5 px-3 font-bold">Descrição</th>
                    <th className="py-2.5 px-3 font-bold">Capacidade</th>
                    <th className="py-2.5 px-3 font-bold">Chaves Vinculadas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {environments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-[#6c757d]">
                        Nenhum ambiente cadastrado nesta unidade. Acesse o menu{' '}
                        <button
                          onClick={() => setActiveTab('environments')}
                          className="text-[#003366] font-bold underline cursor-pointer"
                        >
                          Ambientes & Espaços
                        </button>{' '}
                        para adicionar o primeiro.
                      </td>
                    </tr>
                  ) : (
                    environments.map((env) => {
                      const envKeys = keys.filter((k) => k.environmentId === env.id);
                      return (
                        <tr key={env.id} className="hover:bg-[#f8fafc]">
                          <td className="py-2.5 px-3 font-bold text-[#003366]">
                            {env.name}
                          </td>
                          <td className="py-2.5 px-3 text-[#495057]">
                            {env.description || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {env.capacity ? `${env.capacity} lugares` : '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            {envKeys.length === 0 ? (
                              <span className="text-[#6c757d] italic">Sem chave</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {envKeys.map((k) => (
                                  <span
                                    key={k.id}
                                    className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold border ${
                                      k.available
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                        : 'bg-amber-50 text-amber-800 border-amber-300'
                                    }`}
                                  >
                                    {k.code}: {k.available ? 'DISPONÍVEL' : 'RETIRADA'}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ABA 2: AMBIENTES & ESPAÇOS (tb_environments) */}
      {/* =================================================================== */}
      {activeTab === 'environments' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
            <div className="bg-[#003366] text-white px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase">
                Novo Ambiente / Laboratório / Sala
              </span>
            </div>

            <form onSubmit={handleCreateEnvironment} className="p-5 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                <label className="text-xs font-bold text-[#333] md:text-right">
                  Identificação do Ambiente: *
                </label>
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={envName}
                    onChange={(e) => setEnvName(e.target.value)}
                    placeholder="ex: Bloco A - Laboratório de Redes (A-204)"
                    required
                    className="w-full border border-[#ced4da] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#003366]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                <label className="text-xs font-bold text-[#333] md:text-right">
                  Descrição / Recursos:
                </label>
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={envDescription}
                    onChange={(e) => setEnvDescription(e.target.value)}
                    placeholder="ex: 30 bancadas, projetor multimídia, ar-condicionado"
                    className="w-full border border-[#ced4da] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#003366]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                <label className="text-xs font-bold text-[#333] md:text-right">
                  Capacidade Máxima:
                </label>
                <div className="md:col-span-2 flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={envCapacity}
                    onChange={(e) => setEnvCapacity(e.target.value)}
                    placeholder="ex: 40"
                    className="w-40 border border-[#ced4da] rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#003366]"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-1.5 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registrar Ambiente</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
            <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#b8c2cc] flex items-center justify-between">
              <span className="text-xs font-bold text-[#003366] uppercase">
                Relação de Ambientes Cadastrados ({environments.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f1f5f9] border-b border-[#b8c2cc]">
                    <th className="py-2.5 px-3 font-bold">Nome</th>
                    <th className="py-2.5 px-3 font-bold">Descrição</th>
                    <th className="py-2.5 px-3 font-bold">Capacidade</th>
                    <th className="py-2.5 px-3 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {environments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-[#6c757d]">
                        Nenhum ambiente registrado até o momento.
                      </td>
                    </tr>
                  ) : (
                    environments.map((env) => (
                      <tr key={env.id} className="hover:bg-[#f8fafc]">
                        <td className="py-2.5 px-3 font-bold text-[#003366]">
                          {env.name}
                        </td>
                        <td className="py-2.5 px-3">{env.description || '—'}</td>
                        <td className="py-2.5 px-3 font-mono">
                          {env.capacity || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleDeleteEnvironment(env.id)}
                            className="inline-flex items-center gap-1 text-red-700 hover:text-red-900 font-semibold px-2 py-1 rounded hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ABA 3: CONTROLE DE CHAVES (tb_keys) */}
      {/* =================================================================== */}
      {activeTab === 'keys' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
            <div className="bg-[#003366] text-white px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase">
                Vincular Nova Chave Física a um Ambiente
              </span>
            </div>

            <form onSubmit={handleCreateKey} className="p-5 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                <label className="text-xs font-bold text-[#333] md:text-right">
                  Ambiente Vinculado: *
                </label>
                <div className="md:col-span-2">
                  <select
                    value={keyEnvId}
                    onChange={(e) => setKeyEnvId(e.target.value)}
                    required
                    className="w-full border border-[#ced4da] rounded px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-[#003366]"
                  >
                    <option value="">Selecione um ambiente...</option>
                    {environments.map((env) => (
                      <option key={env.id} value={env.id}>
                        {env.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                <label className="text-xs font-bold text-[#333] md:text-right">
                  Código / Tag da Chave: *
                </label>
                <div className="md:col-span-2 flex items-center gap-3">
                  <input
                    type="text"
                    value={keyCode}
                    onChange={(e) => setKeyCode(e.target.value)}
                    placeholder="ex: CH-A204-01"
                    required
                    className="w-56 border border-[#ced4da] rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#003366]"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-1.5 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cadastrar Chave</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
            <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#b8c2cc] flex items-center justify-between">
              <span className="text-xs font-bold text-[#003366] uppercase">
                Claviculário da Portaria ({keys.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f1f5f9] border-b border-[#b8c2cc]">
                    <th className="py-2.5 px-3 font-bold">Código</th>
                    <th className="py-2.5 px-3 font-bold">Ambiente</th>
                    <th className="py-2.5 px-3 font-bold">Situação na Portaria</th>
                    <th className="py-2.5 px-3 font-bold text-right">Operação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {keys.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-[#6c757d]">
                        Nenhuma chave cadastrada para os ambientes desta unidade.
                      </td>
                    </tr>
                  ) : (
                    keys.map((k) => (
                      <tr key={k.id} className="hover:bg-[#f8fafc]">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#003366]">
                          {k.code}
                        </td>
                        <td className="py-2.5 px-3 font-semibold">
                          {getEnvName(k.environmentId)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold border ${
                              k.available
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {k.available ? 'DISPONÍVEL NO QUADRO' : 'EM USO / RETIRADA'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-2">
                          <button
                            onClick={() => handleToggleKeyAvailability(k)}
                            className="px-2.5 py-1 bg-[#003366] hover:bg-[#002244] text-white rounded text-[11px] font-semibold transition cursor-pointer"
                          >
                            {k.available ? 'Registrar Retirada' : 'Registrar Devolução'}
                          </button>
                          <button
                            onClick={() => handleDeleteKey(k.id)}
                            className="inline-flex items-center text-red-700 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50 cursor-pointer"
                            title="Excluir Chave"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ABA 4: SERVIDORES & USUÁRIOS (tb_users) */}
      {/* =================================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
            <div className="bg-[#003366] text-white px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase">
                Credenciar Novo Servidor / Operador na Unidade
              </span>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                <label className="text-xs font-bold text-[#333] md:text-right">
                  Identificador (username): *
                </label>
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="ex: servidor.portaria"
                    required
                    className="w-full border border-[#ced4da] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#003366]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                <label className="text-xs font-bold text-[#333] md:text-right">
                  E-mail Institucional: *
                </label>
                <div className="md:col-span-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="servidor@instituicao.edu.br"
                    required
                    className="w-full border border-[#ced4da] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#003366]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                <label className="text-xs font-bold text-[#333] md:text-right">
                  CPF & Telefone:
                </label>
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newCpf}
                    onChange={(e) => setNewCpf(e.target.value)}
                    placeholder="CPF (000.000.000-00)"
                    className="border border-[#ced4da] rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#003366]"
                  />
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Telefone / Ramal"
                    className="border border-[#ced4da] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#003366]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                <label className="text-xs font-bold text-[#333] md:text-right">
                  Senha & Perfil (Role): *
                </label>
                <div className="md:col-span-2 flex flex-wrap items-center gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                    className="flex-1 min-w-[160px] border border-[#ced4da] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#003366]"
                  />
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as Role)}
                    className="border border-[#ced4da] rounded px-3 py-1.5 text-xs bg-white font-mono focus:outline-none focus:border-[#003366]"
                  >
                    <option value="COMMON">COMMON (Servidor/Operador)</option>
                    <option value="ADMIN">ADMIN (Administrador)</option>
                    <option value="OWNER">OWNER (Gestor da Unidade)</option>
                  </select>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-1.5 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Credenciar</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
            <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#b8c2cc]">
              <span className="text-xs font-bold text-[#003366] uppercase">
                Usuários Vinculados à Unidade ({users.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f1f5f9] border-b border-[#b8c2cc]">
                    <th className="py-2.5 px-3 font-bold">Usuário</th>
                    <th className="py-2.5 px-3 font-bold">E-mail</th>
                    <th className="py-2.5 px-3 font-bold">CPF</th>
                    <th className="py-2.5 px-3 font-bold">Perfil</th>
                    <th className="py-2.5 px-3 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#f8fafc]">
                      <td className="py-2.5 px-3 font-bold text-[#003366]">
                        {u.username}
                      </td>
                      <td className="py-2.5 px-3">{u.email}</td>
                      <td className="py-2.5 px-3 font-mono">{u.cpf || '—'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-[#eef1f4] text-[#003366] font-mono font-bold text-[11px]">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {u.id !== user?.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="inline-flex items-center gap-1 text-red-700 hover:text-red-900 font-semibold px-2 py-1 rounded hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remover</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </SeiLayout>
  );
};
