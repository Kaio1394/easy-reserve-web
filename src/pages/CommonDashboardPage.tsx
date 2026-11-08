import React, { useCallback, useEffect, useState } from 'react';
import { type ActiveTab, SeiLayout } from '../components/SeiLayout';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type {
  EnvironmentGetDto,
  EnvironmentResourceGetDto,
  KeyGetDto,
  ReservationGetDto,
  ReservationHistoryGetDto,
} from '../types/api';
import {
  AlertCircle,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Eye,
  History,
  Info,
  KeyRound,
  MonitorSpeaker,
  RefreshCw,
  Settings,
  Sliders,
  Sparkles,
  X,
} from 'lucide-react';
import { EnvironmentRecommendationAssistant } from '../components/EnvironmentRecommendationAssistant';
import { ReservationPlanner } from '../components/ReservationPlanner';
import { UserProfileSettings } from '../components/UserProfileSettings';

/**
 * Página exclusiva para usuários com role COMMON.
 * Permite visualização de ambientes, recursos/equipamentos e chaves,
 * além de realizar a Reserva de Ambientes (MOD-06) informando a chave utilizada.
 */
export const CommonDashboardPage: React.FC = () => {
  const { user, workspaceSlug } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const [environments, setEnvironments] = useState<EnvironmentGetDto[]>([]);
  const [resources, setResources] = useState<EnvironmentResourceGetDto[]>([]);
  const [keys, setKeys] = useState<KeyGetDto[]>([]);
  const [reservations, setReservations] = useState<ReservationGetDto[]>([]);
  const [reservationHistories, setReservationHistories] = useState<ReservationHistoryGetDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal de Informações Detalhadas do Ambiente (somente leitura)
  const [infoEnvId, setInfoEnvId] = useState<string | null>(null);

  // Modal de Informações Detalhadas da Reserva / Histórico
  const [selectedReservationInfo, setSelectedReservationInfo] = useState<
    | { type: 'reservation'; data: ReservationGetDto }
    | { type: 'history'; data: ReservationHistoryGetDto }
    | null
  >(null);

  // Form Criar Reserva de Ambiente (MOD-06)
  const [reservationViewMode, setReservationViewMode] = useState<'planner' | 'form'>('planner');
  const [resvEnvId, setResvEnvId] = useState('');
  const [resvKeyId, setResvKeyId] = useState('');
  const [resvPurpose, setResvPurpose] = useState('');
  const [resvStartTime, setResvStartTime] = useState('');
  const [resvEndTime, setResvEndTime] = useState('');

  // Filtros do Submenu de Histórico de Reservas
  const [histFilterStartDate, setHistFilterStartDate] = useState('');
  const [histFilterEndDate, setHistFilterEndDate] = useState('');
  const [histFilterEnvId, setHistFilterEnvId] = useState('');
  const [histFilterAction, setHistFilterAction] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const [envList, resList, keyList, resvList, resvHistList] = await Promise.all([
        api.environments.findAll().catch(() => []),
        api.environmentResources.findAll().catch(() => []),
        api.keys.findAll().catch(() => []),
        api.reservations.findAll().catch(() => []),
        api.reservationHistories.findAll().catch(() => []),
      ]);

      const wsEnvs = envList.filter((e) => e.workspaceId === user.workspaceId);
      const wsEnvIds = new Set(wsEnvs.map((e) => e.id));
      const wsRes = resList.filter((r) => r.workspaceId === user.workspaceId);
      const wsKeys = keyList.filter((k) => wsEnvIds.has(k.environmentId));
      const wsResvs = resvList.filter((rv) => rv.workspaceId === user.workspaceId);
      const wsResvHists = resvHistList.filter((h) => h.workspaceId === user.workspaceId);

      setEnvironments(wsEnvs);
      setResources(wsRes);
      setKeys(wsKeys);
      setReservations(wsResvs);
      setReservationHistories(wsResvHists);

      if (wsEnvs.length > 0 && !resvEnvId) {
        setResvEnvId(wsEnvs[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao consultar informações da unidade.');
    } finally {
      setLoading(false);
    }
  }, [user, resvEnvId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Verifica se uma chave está EM USO no momento exato (somente se houver reserva ativa para o momento atual)
  const isKeyInUseNow = (keyId: string) => {
    const now = new Date();
    return reservations.some((rv) => {
      if (rv.keyId !== keyId || rv.status !== 'ACTIVE') return false;
      const start = rv.startTime ? new Date(rv.startTime) : null;
      const end = rv.endTime ? new Date(rv.endTime) : null;
      if (start && now < start) return false;
      if (end && now > end) return false;
      return true;
    });
  };

  // Chaves do ambiente selecionado (prioriza chaves livres no momento, mas permite selecionar em qualquer horário)
  const keysForSelectedEnv = keys
    .filter((k) => k.environmentId === resvEnvId)
    .sort((a, b) => Number(isKeyInUseNow(a.id)) - Number(isKeyInUseNow(b.id)));

  useEffect(() => {
    if (keysForSelectedEnv.length > 0) {
      const stillValid = keysForSelectedEnv.some((k) => k.id === resvKeyId);
      if (!stillValid) {
        setResvKeyId(keysForSelectedEnv[0].id);
      }
    } else {
      setResvKeyId('');
    }
  }, [resvEnvId, keys]);

  const showSuccess = (msg: string) => {
    setFeedback(msg);
    setError(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!resvEnvId) {
      setError('Selecione o ambiente que deseja reservar.');
      return;
    }
    if (!resvKeyId) {
      setError('Selecione qual chave será utilizada na reserva.');
      return;
    }
    setError(null);
    try {
      const created = await api.reservations.create({
        workspaceId: user.workspaceId,
        environmentId: resvEnvId,
        keyId: resvKeyId,
        userId: user.id,
        purpose: resvPurpose.trim() || undefined,
        startTime: resvStartTime || undefined,
        endTime: resvEndTime || undefined,
      });
      setResvPurpose('');
      setResvStartTime('');
      setResvEndTime('');
      showSuccess(
        `Reserva confirmada! A chave "${created.keyCode}" agora está com status EM USO.`
      );
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCompleteReservation = async (resv: ReservationGetDto) => {
    setError(null);
    try {
      await api.reservations.update({
        id: resv.id,
        status: 'COMPLETED',
      });
      showSuccess(
        `Reserva encerrada! A chave "${resv.keyCode}" foi devolvida e está DISPONÍVEL.`
      );
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const catalogResources = resources.filter((r) => !r.environmentId);
  const allocatedResources = resources.filter((r) => Boolean(r.environmentId));
  const borrowedKeysCount = keys.filter((k) => isKeyInUseNow(k.id)).length;
  const availableKeysCount = keys.length - borrowedKeysCount;
  const operationalResourcesCount = allocatedResources.filter(
    (r) => r.operational
  ).length;

  const getEnvName = (envId?: string | null) =>
    envId
      ? environments.find((e) => e.id === envId)?.name || envId.slice(0, 8)
      : 'Catálogo da Unidade';

  const selectedInfoEnv = infoEnvId
    ? environments.find((e) => e.id === infoEnvId) || null
    : null;
  const selectedInfoEnvResources = infoEnvId
    ? allocatedResources.filter((r) => r.environmentId === infoEnvId)
    : [];
  const selectedInfoEnvKeys = infoEnvId
    ? keys.filter((k) => k.environmentId === infoEnvId)
    : [];
  const selectedInfoEnvReservations = infoEnvId
    ? reservations.filter((rv) => rv.environmentId === infoEnvId)
    : [];

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toDateOnly = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso.slice(0, 10);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const filteredReservationHistories = reservationHistories.filter((hist) => {
    if (histFilterEnvId && hist.environmentId !== histFilterEnvId) {
      return false;
    }
    if (histFilterAction && hist.action !== histFilterAction) {
      return false;
    }
    const refDate = toDateOnly(hist.createdAt || hist.startTime);
    if (histFilterStartDate && refDate < histFilterStartDate) {
      return false;
    }
    if (histFilterEndDate && refDate > histFilterEndDate) {
      return false;
    }
    return true;
  });

  return (
    <SeiLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      showUsersTab={false}
    >
      {/* Cabeçalho do Portal */}
      <div className="mb-4 bg-white border border-[#b8c2cc] rounded px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#003366]" />
          <span className="text-xs font-bold text-[#003366] uppercase">
            {activeTab === 'reservations'
              ? 'Módulo de Reserva de Ambientes & Retirada de Chaves (MOD-06)'
              : activeTab === 'reservation_history'
              ? 'Histórico de Reservas e Consulta por Período / Data'
              : 'Portal de Consulta e Reserva do Servidor'}
          </span>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs bg-[#eef1f4] hover:bg-[#e2e8f0] text-[#003366] font-semibold px-2.5 py-1 rounded border border-[#b8c2cc] transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Consulta</span>
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
      {/* MODAL DE INFORMAÇÕES DO AMBIENTE E ELEMENTOS (SOMENTE LEITURA) */}
      {/* =================================================================== */}
      {selectedInfoEnv && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#b8c2cc] rounded shadow-xl w-full max-w-3xl overflow-hidden">
            <div className="bg-[#003366] text-white px-4 py-3 flex items-center justify-between border-b-2 border-[#002244]">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#99badd]" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide">
                    Ficha Técnica do Ambiente — {selectedInfoEnv.name}
                  </h3>
                  <p className="text-[11px] text-[#b3c7dd]">
                    Consulta de elementos/equipamentos e chaves vinculadas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInfoEnvId(null)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#f8f9fa] border border-[#ced4da] rounded p-3 text-xs">
                <div>
                  <span className="text-[#6c757d] block text-[11px]">Ambiente:</span>
                  <strong className="text-[#003366]">{selectedInfoEnv.name}</strong>
                </div>
                <div>
                  <span className="text-[#6c757d] block text-[11px]">Capacidade:</span>
                  <strong className="font-mono">
                    {selectedInfoEnv.capacity
                      ? `${selectedInfoEnv.capacity} lugares`
                      : 'Não informada'}
                  </strong>
                </div>
                <div>
                  <span className="text-[#6c757d] block text-[11px]">Descrição:</span>
                  <span>{selectedInfoEnv.description || '—'}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-[#003366]">Chaves na Portaria:</span>
                {selectedInfoEnvKeys.length === 0 ? (
                  <span className="text-[#6c757d] italic">Nenhuma chave vinculada</span>
                ) : (
                  selectedInfoEnvKeys.map((k) => (
                    <span
                      key={k.id}
                      className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold border ${
                        !isKeyInUseNow(k.id)
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      {k.code}: {!isKeyInUseNow(k.id) ? 'DISPONÍVEL' : 'EM USO'}
                    </span>
                  ))
                )}
              </div>

              <div className="border border-[#b8c2cc] rounded overflow-hidden">
                <div className="bg-[#f1f5f9] px-3.5 py-2 border-b border-[#b8c2cc]">
                  <span className="text-xs font-bold text-[#003366] uppercase">
                    Elementos Associados neste Ambiente ({selectedInfoEnvResources.length})
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-[#ced4da]">
                        <th className="py-2 px-3 font-bold">Elemento / Equipamento</th>
                        <th className="py-2 px-3 font-bold">Quantidade na Sala</th>
                        <th className="py-2 px-3 font-bold">Estado Operacional</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0]">
                      {selectedInfoEnvResources.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-[#6c757d]">
                            Nenhum elemento associado a este ambiente.
                          </td>
                        </tr>
                      ) : (
                        selectedInfoEnvResources.map((alloc) => (
                          <tr key={alloc.id} className="hover:bg-[#f8fafc]">
                            <td className="py-2 px-3 font-bold text-[#003366]">
                              {alloc.name}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold">
                              {alloc.quantity ?? 1}x
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold border ${
                                  alloc.operational
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : 'bg-red-50 text-red-800 border-red-300'
                                }`}
                              >
                                {alloc.operational ? 'SIM (OK)' : 'NÃO (DEFEITO)'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Lista de Reservas deste Ambiente (Dias e Horários) */}
              <div className="border border-[#b8c2cc] rounded overflow-hidden">
                <div className="bg-[#f1f5f9] px-3.5 py-2 border-b border-[#b8c2cc]">
                  <span className="text-xs font-bold text-[#003366] uppercase">
                    Reservas deste Ambiente — Dias e Horários ({selectedInfoEnvReservations.length})
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-[#ced4da]">
                        <th className="py-2 px-3 font-bold">Quem Reservou</th>
                        <th className="py-2 px-3 font-bold">Horário</th>
                        <th className="py-2 px-3 font-bold">Situação</th>
                        <th className="py-2 px-3 font-bold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0]">
                      {selectedInfoEnvReservations.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-[#6c757d]">
                            Nenhuma reserva registrada para este ambiente.
                          </td>
                        </tr>
                      ) : (
                        selectedInfoEnvReservations.map((rv) => (
                          <tr key={rv.id} className="hover:bg-[#f8fafc] align-middle">
                            <td className="py-2.5 px-3 font-bold text-[#003366] whitespace-nowrap">
                              {rv.userName}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                              <div className="font-semibold text-[#003366]">
                                Início: {formatDateTime(rv.startTime)}
                              </div>
                              <div className="text-[#6c757d]">
                                Fim: {rv.endTime ? formatDateTime(rv.endTime) : 'Em aberto'}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded font-mono text-[10px] font-bold whitespace-nowrap ${
                                  rv.status === 'ACTIVE'
                                    ? 'bg-[#003366] text-white'
                                    : 'bg-[#eef1f4] text-[#495057]'
                                }`}
                              >
                                {rv.status === 'ACTIVE' ? 'RESERVADO' : 'FINALIZADA'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedReservationInfo({ type: 'reservation', data: rv })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#eef1f4] hover:bg-[#e2e8f0] text-[#003366] font-semibold border border-[#b8c2cc] text-[11px] transition cursor-pointer"
                              >
                                <Info className="w-3.5 h-3.5" />
                                <span>Info</span>
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

            <div className="bg-[#f8f9fa] px-4 py-2.5 border-t border-[#b8c2cc] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setResvEnvId(selectedInfoEnv.id);
                  setInfoEnvId(null);
                  setActiveTab('reservations');
                }}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded cursor-pointer"
              >
                Reservar este Ambiente
              </button>
              <button
                type="button"
                onClick={() => setInfoEnvId(null)}
                className="px-4 py-1.5 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded cursor-pointer"
              >
                Fechar Janela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL DE INFORMAÇÕES DETALHADAS DA RESERVA / HISTÓRICO */}
      {/* =================================================================== */}
      {selectedReservationInfo && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#b8c2cc] rounded shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-[#003366] text-white px-4 py-3 flex items-center justify-between border-b-2 border-[#002244]">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#99badd]" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide">
                    {selectedReservationInfo.type === 'reservation'
                      ? 'Detalhes da Reserva de Ambiente'
                      : 'Detalhes do Registro de Histórico'}
                  </h3>
                  <p className="text-[11px] text-[#b3c7dd]">
                    {selectedReservationInfo.data.environmentName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReservationInfo(null)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#f8f9fa] border border-[#ced4da] rounded p-3.5">
                <div>
                  <span className="text-[#6c757d] block text-[11px]">Ambiente Reservado:</span>
                  <strong className="text-[#003366] text-sm">
                    {selectedReservationInfo.data.environmentName}
                  </strong>
                </div>
                <div>
                  <span className="text-[#6c757d] block text-[11px]">Quem Reservou (Solicitante):</span>
                  <strong className="text-[#333] text-sm">
                    {selectedReservationInfo.data.userName}
                  </strong>
                </div>
                <div>
                  <span className="text-[#6c757d] block text-[11px]">Chave Utilizada:</span>
                  <span
                    className={`mt-0.5 inline-flex items-center px-2.5 py-0.5 rounded font-mono text-[11px] font-bold border whitespace-nowrap ${
                      selectedReservationInfo.data.status === 'ACTIVE'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {selectedReservationInfo.data.keyCode} •{' '}
                    {selectedReservationInfo.data.status === 'ACTIVE' ? 'EM USO' : 'DEVOLVIDA'}
                  </span>
                </div>
                <div>
                  <span className="text-[#6c757d] block text-[11px]">Situação da Reserva:</span>
                  <span
                    className={`mt-0.5 inline-flex items-center px-2.5 py-0.5 rounded font-mono text-[11px] font-bold whitespace-nowrap ${
                      selectedReservationInfo.data.status === 'ACTIVE'
                        ? 'bg-[#003366] text-white'
                        : 'bg-[#eef1f4] text-[#495057]'
                    }`}
                  >
                    {selectedReservationInfo.data.status === 'ACTIVE'
                      ? 'RESERVADO (ATIVO)'
                      : 'FINALIZADA'}
                  </span>
                </div>
              </div>

              <div className="border border-[#ced4da] rounded p-3.5 space-y-2">
                <div className="pb-2 border-b border-[#e2e8f0] font-mono text-[11px]">
                  <span className="text-[#6c757d] block font-sans">
                    Horário da Solicitação de Reserva:
                  </span>
                  <strong className="text-[#003366]">
                    {formatDateTime(selectedReservationInfo.data.createdAt)}
                  </strong>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                  <div>
                    <span className="text-[#6c757d] block font-sans">Horário de Início:</span>
                    <strong className="text-[#003366]">
                      {formatDateTime(selectedReservationInfo.data.startTime)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#6c757d] block font-sans">
                      Horário de Término / Devolução:
                    </span>
                    <strong className="text-[#333]">
                      {selectedReservationInfo.data.endTime
                        ? formatDateTime(selectedReservationInfo.data.endTime)
                        : 'Em aberto'}
                    </strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#e2e8f0]">
                  <span className="text-[#6c757d] block text-[11px]">Finalidade / Atividade:</span>
                  <p className="font-semibold text-[#333] mt-0.5">
                    {selectedReservationInfo.data.purpose || 'Não informada'}
                  </p>
                </div>

                {selectedReservationInfo.type === 'history' && (
                  <div className="pt-2 border-t border-[#e2e8f0] space-y-1">
                    <div>
                      <span className="text-[#6c757d] block text-[11px]">
                        Registro de Auditoria / Movimentação:
                      </span>
                      <p className="text-[#003366] font-semibold mt-0.5">
                        {selectedReservationInfo.data.notes || '—'}
                      </p>
                    </div>
                    <div className="text-[11px] text-[#6c757d] font-mono">
                      Data do evento: {formatDateTime(selectedReservationInfo.data.createdAt)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#f8f9fa] px-4 py-2.5 border-t border-[#b8c2cc] flex items-center justify-end gap-2">
              {selectedReservationInfo.type === 'reservation' &&
                selectedReservationInfo.data.status === 'ACTIVE' &&
                selectedReservationInfo.data.userId === user?.id && (
                  <button
                    type="button"
                    onClick={async () => {
                      await handleCompleteReservation(selectedReservationInfo.data);
                      setSelectedReservationInfo(null);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded cursor-pointer"
                  >
                    Devolver Chave
                  </button>
                )}
              <button
                type="button"
                onClick={() => setSelectedReservationInfo(null)}
                className="px-4 py-1.5 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABA 1: VISÃO GERAL */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-[#b8c2cc] rounded p-4">
              <div className="flex items-center justify-between text-[#6c757d] text-xs mb-1">
                <span className="font-bold uppercase text-[11px]">
                  Ambientes da Unidade
                </span>
                <Building2 className="w-4 h-4 text-[#003366]" />
              </div>
              <div className="text-2xl font-bold text-[#003366] font-mono">
                {environments.length}
              </div>
              <div className="text-[11px] text-[#6c757d] mt-1">
                Salas e laboratórios cadastrados
              </div>
            </div>

            <div className="bg-white border border-[#b8c2cc] rounded p-4">
              <div className="flex items-center justify-between text-[#6c757d] text-xs mb-1">
                <span className="font-bold uppercase text-[11px]">
                  Elementos nas Salas OK
                </span>
                <MonitorSpeaker className="w-4 h-4 text-[#003366]" />
              </div>
              <div className="text-2xl font-bold text-[#003366] font-mono">
                {operationalResourcesCount}{' '}
                <span className="text-xs font-normal text-[#6c757d]">
                  / {allocatedResources.length}
                </span>
              </div>
              <div className="text-[11px] text-[#6c757d] mt-1">
                Itens e equipamentos dos ambientes
              </div>
            </div>

            <div className="bg-white border border-[#b8c2cc] rounded p-4">
              <div className="flex items-center justify-between text-[#6c757d] text-xs mb-1">
                <span className="font-bold uppercase text-[11px]">
                  Chaves Disponíveis
                </span>
                <KeyRound className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-2xl font-bold text-emerald-700 font-mono">
                {availableKeysCount}{' '}
                <span className="text-xs font-normal text-[#6c757d]">
                  / {keys.length}
                </span>
              </div>
              <div className="text-[11px] text-[#6c757d] mt-1">
                {borrowedKeysCount} chave(s) EM USO no momento
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
            <div className="bg-[#003366] text-white px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase">
                Quadro de Disponibilidade de Ambientes, Elementos e Chaves
              </span>
              <span className="text-[11px] font-mono text-[#b3c7dd]">
                Slug da Unidade: {workspaceSlug || 'ATUAL'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#b8c2cc] text-[#333]">
                    <th className="py-2.5 px-3 font-bold">Ambiente / Espaço</th>
                    <th className="py-2.5 px-3 font-bold">Capacidade</th>
                    <th className="py-2.5 px-3 font-bold">Elementos Associados</th>
                    <th className="py-2.5 px-3 font-bold">Situação das Chaves</th>
                    <th className="py-2.5 px-3 font-bold text-right">Reserva</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {environments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[#6c757d]">
                        Nenhum ambiente cadastrado nesta unidade.
                      </td>
                    </tr>
                  ) : (
                    environments.map((env) => {
                      const envKeys = keys.filter((k) => k.environmentId === env.id);
                      const envRes = allocatedResources.filter(
                        (r) => r.environmentId === env.id
                      );
                      return (
                        <tr key={env.id} className="hover:bg-[#f8fafc]">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-[#003366]">{env.name}</div>
                            {env.description && (
                              <div className="text-[11px] text-[#6c757d]">
                                {env.description}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {env.capacity ? `${env.capacity} lugares` : '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => setInfoEnvId(env.id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#eef1f4] hover:bg-[#e2e8f0] text-[#003366] font-semibold border border-[#b8c2cc] transition cursor-pointer"
                            >
                              <Info className="w-3.5 h-3.5" />
                              <span>Info ({envRes.length})</span>
                            </button>
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
                                      !isKeyInUseNow(k.id)
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                        : 'bg-amber-50 text-amber-800 border-amber-300'
                                    }`}
                                  >
                                    {k.code}: {!isKeyInUseNow(k.id) ? 'DISPONÍVEL' : 'EM USO'}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setResvEnvId(env.id);
                                setActiveTab('reservations');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#003366] hover:bg-[#002244] text-white font-semibold rounded text-xs cursor-pointer"
                            >
                              <CalendarCheck className="w-3.5 h-3.5" />
                              <span>Reservar</span>
                            </button>
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

      {/* ABA MOD-06: RESERVA DE AMBIENTES (ASSISTENTE + PLANNER / CALENDÁRIO) */}
      {activeTab === 'reservations' && (
        <div className="space-y-5">
          {user?.workspaceId && (
            <EnvironmentRecommendationAssistant
              workspaceId={user.workspaceId}
              catalogResources={catalogResources}
              onSelectEnvironment={(envId) => {
                setResvEnvId(envId);
                showSuccess('Ambiente selecionado a partir da recomendação!');
              }}
              initialStartTime={resvStartTime}
              initialEndTime={resvEndTime}
            />
          )}

          <ReservationPlanner
            environments={environments}
            keys={keys}
            reservations={reservations}
            currentUser={user}
            onRefresh={loadData}
            showSuccess={showSuccess}
            setError={setError}
            isAdminOrOwner={false}
            initialEnvironmentId={resvEnvId}
          />
        </div>
      )}

      {/* SUBMENU MOD-06: HISTÓRICO DE RESERVAS COM FILTRO POR DATA */}
      {activeTab === 'reservation_history' && (
        <div className="space-y-5">
          {/* Painel de Filtros por Data, Ambiente e Situação */}
          <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
            <div className="bg-[#003366] text-white px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#99badd]" />
                <span className="text-xs font-bold uppercase">
                  Filtrar Histórico de Reservas por Data / Período
                </span>
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end bg-[#f8f9fa]">
              <div>
                <label className="text-[11px] font-bold text-[#333] block mb-1">
                  Data Inicial:
                </label>
                <input
                  type="date"
                  value={histFilterStartDate}
                  onChange={(e) => setHistFilterStartDate(e.target.value)}
                  className="w-full bg-white border border-[#ced4da] rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-[#003366]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#333] block mb-1">
                  Data Final:
                </label>
                <input
                  type="date"
                  value={histFilterEndDate}
                  onChange={(e) => setHistFilterEndDate(e.target.value)}
                  className="w-full bg-white border border-[#ced4da] rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-[#003366]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#333] block mb-1">
                  Ambiente / Espaço:
                </label>
                <select
                  value={histFilterEnvId}
                  onChange={(e) => setHistFilterEnvId(e.target.value)}
                  className="w-full bg-white border border-[#ced4da] rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#003366]"
                >
                  <option value="">Todos os ambientes</option>
                  {environments.map((env) => (
                    <option key={env.id} value={env.id}>
                      {env.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#333] block mb-1">
                  Situação / Evento:
                </label>
                <select
                  value={histFilterAction}
                  onChange={(e) => setHistFilterAction(e.target.value)}
                  className="w-full bg-white border border-[#ced4da] rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#003366]"
                >
                  <option value="">Todas as situações</option>
                  <option value="CREATED">Reservado</option>
                  <option value="COMPLETED">Chave Devolvida</option>
                  <option value="CANCELLED">Cancelada</option>
                  <option value="DELETED">Excluída</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setHistFilterStartDate('');
                    setHistFilterEndDate('');
                    setHistFilterEnvId('');
                    setHistFilterAction('');
                  }}
                  className="w-full px-3 py-1.5 bg-white hover:bg-[#eef1f4] text-[#003366] font-semibold border border-[#b8c2cc] rounded text-xs transition cursor-pointer"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          </div>

          {/* Tabela de Histórico de Reservas (tb_reservation_histories) */}
          <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
            <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#b8c2cc] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#003366]" />
                <span className="text-xs font-bold text-[#003366] uppercase">
                  Histórico de Reservas ({filteredReservationHistories.length})
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f1f5f9] border-b border-[#b8c2cc]">
                    <th className="py-2.5 px-3 font-bold whitespace-nowrap">Ambiente</th>
                    <th className="py-2.5 px-3 font-bold whitespace-nowrap">Quem Reservou</th>
                    <th className="py-2.5 px-3 font-bold whitespace-nowrap">
                      Horário da Solicitação
                    </th>
                    <th className="py-2.5 px-3 font-bold whitespace-nowrap">Situação</th>
                    <th className="py-2.5 px-3 font-bold text-right whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {filteredReservationHistories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[#6c757d]">
                        Nenhum registro encontrado para os filtros informados.
                      </td>
                    </tr>
                  ) : (
                    filteredReservationHistories.map((hist) => {
                      const actionBadge =
                        hist.action === 'CREATED'
                          ? {
                              label: 'RESERVADO',
                              cls: 'bg-blue-50 text-blue-900 border-blue-300',
                            }
                          : hist.action === 'COMPLETED'
                          ? {
                              label: 'CHAVE DEVOLVIDA',
                              cls: 'bg-emerald-50 text-emerald-800 border-emerald-300',
                            }
                          : hist.action === 'CANCELLED'
                          ? {
                              label: 'CANCELADA',
                              cls: 'bg-amber-50 text-amber-800 border-amber-300',
                            }
                          : hist.action === 'DELETED'
                          ? {
                              label: 'EXCLUÍDA',
                              cls: 'bg-red-50 text-red-800 border-red-300',
                            }
                          : {
                              label: 'ATUALIZADA',
                              cls: 'bg-[#eef1f4] text-[#003366] border-[#b8c2cc]',
                            };

                      return (
                        <tr key={hist.id} className="hover:bg-[#f8fafc] align-middle">
                          <td className="py-2.5 px-3 font-bold text-[#003366] whitespace-nowrap">
                            {hist.environmentName}
                          </td>
                          <td className="py-2.5 px-3 font-semibold whitespace-nowrap">
                            {hist.userName}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-[#003366] whitespace-nowrap">
                            {formatDateTime(hist.createdAt)}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded font-mono text-[10px] font-bold border whitespace-nowrap ${actionBadge.cls}`}
                            >
                              {actionBadge.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedReservationInfo({ type: 'history', data: hist })
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#eef1f4] hover:bg-[#e2e8f0] text-[#003366] font-semibold border border-[#b8c2cc] text-[11px] transition cursor-pointer"
                            >
                              <Info className="w-3.5 h-3.5" />
                              <span>Info</span>
                            </button>
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

      {/* ABA 2: CONSULTA DE AMBIENTES */}
      {activeTab === 'environments' && (
        <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
          <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#b8c2cc]">
            <span className="text-xs font-bold text-[#003366] uppercase">
              Catálogo de Ambientes e Espaços da Unidade ({environments.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f1f5f9] border-b border-[#b8c2cc]">
                  <th className="py-2.5 px-3 font-bold">Nome do Ambiente</th>
                  <th className="py-2.5 px-3 font-bold">Descrição / Infraestrutura</th>
                  <th className="py-2.5 px-3 font-bold">Capacidade</th>
                  <th className="py-2.5 px-3 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {environments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#6c757d]">
                      Nenhum ambiente disponível para consulta.
                    </td>
                  </tr>
                ) : (
                  environments.map((env) => {
                    const envResCount = allocatedResources.filter(
                      (r) => r.environmentId === env.id
                    ).length;
                    return (
                      <tr key={env.id} className="hover:bg-[#f8fafc]">
                        <td className="py-2.5 px-3 font-bold text-[#003366]">
                          {env.name}
                        </td>
                        <td className="py-2.5 px-3">{env.description || '—'}</td>
                        <td className="py-2.5 px-3 font-mono">
                          {env.capacity ? `${env.capacity} lugares` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => setInfoEnvId(env.id)}
                            className="inline-flex items-center gap-1.5 bg-[#eef1f4] hover:bg-[#e2e8f0] text-[#003366] border border-[#b8c2cc] font-semibold px-2.5 py-1 rounded text-xs transition cursor-pointer"
                          >
                            <Info className="w-3.5 h-3.5" />
                            <span>Info ({envResCount})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setResvEnvId(env.id);
                              setActiveTab('reservations');
                            }}
                            className="inline-flex items-center gap-1.5 bg-[#003366] hover:bg-[#002244] text-white font-semibold px-2.5 py-1 rounded text-xs transition cursor-pointer"
                          >
                            <CalendarCheck className="w-3.5 h-3.5" />
                            <span>Reservar</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 3: CONSULTA DE ELEMENTOS & RECURSOS */}
      {activeTab === 'resources' && (
        <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
          <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#b8c2cc]">
            <span className="text-xs font-bold text-[#003366] uppercase">
              Elementos e Equipamentos Alocados nos Ambientes ({allocatedResources.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f1f5f9] border-b border-[#b8c2cc]">
                  <th className="py-2.5 px-3 font-bold">Elemento / Equipamento</th>
                  <th className="py-2.5 px-3 font-bold">Quantidade</th>
                  <th className="py-2.5 px-3 font-bold">Ambiente Associado</th>
                  <th className="py-2.5 px-3 font-bold">Estado Operacional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {allocatedResources.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#6c757d]">
                      Nenhum elemento/equipamento associado aos ambientes.
                    </td>
                  </tr>
                ) : (
                  allocatedResources.map((r) => (
                    <tr key={r.id} className="hover:bg-[#f8fafc]">
                      <td className="py-2.5 px-3 font-bold text-[#003366]">
                        {r.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        {r.quantity ?? 1}x
                      </td>
                      <td className="py-2.5 px-3">
                        {r.environmentName || getEnvName(r.environmentId)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold border ${
                            r.operational
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-red-50 text-red-800 border-red-300'
                          }`}
                        >
                          {r.operational ? 'OK / FUNCIONANDO' : 'DEFEITO / MANUTENÇÃO'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 4: CONSULTA DE CHAVES */}
      {activeTab === 'keys' && (
        <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
          <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#b8c2cc]">
            <span className="text-xs font-bold text-[#003366] uppercase">
              Situação das Chaves na Portaria ({keys.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f1f5f9] border-b border-[#b8c2cc]">
                  <th className="py-2.5 px-3 font-bold">Código da Chave</th>
                  <th className="py-2.5 px-3 font-bold">Ambiente Vinculado</th>
                  <th className="py-2.5 px-3 font-bold">Situação Atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {keys.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-[#6c757d]">
                      Nenhuma chave registrada na portaria.
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
                            !isKeyInUseNow(k.id)
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          {!isKeyInUseNow(k.id) ? 'DISPONÍVEL NA PORTARIA' : 'EM USO NO MOMENTO'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 5: CONFIGURAÇÕES DA CONTA & MEU PERFIL (MOD-07) */}
      {activeTab === 'settings' && (
        <UserProfileSettings />
      )}
    </SeiLayout>
  );
};
