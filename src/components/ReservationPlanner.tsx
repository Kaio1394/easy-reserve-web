import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Info,
  KeyRound,
  List,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  User,
  X,
} from 'lucide-react';
import type {
  EnvironmentGetDto,
  KeyGetDto,
  ReservationGetDto,
} from '../types/api';
import { api } from '../services/api';

export interface ReservationPlannerProps {
  environments: EnvironmentGetDto[];
  keys: KeyGetDto[];
  reservations: ReservationGetDto[];
  currentUser: {
    id: string;
    name?: string;
    workspaceId: string;
    role?: string;
  } | null;
  onRefresh: () => Promise<void> | void;
  showSuccess: (msg: string) => void;
  setError: (msg: string | null) => void;
  isAdminOrOwner?: boolean;
  initialEnvironmentId?: string;
}

type ViewMode = 'month' | 'week' | 'list';

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const WEEKDAY_NAMES = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Formata Date para input datetime-local: YYYY-MM-DDTHH:mm
function toDateTimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Cria Date a partir de string de data YYYY-MM-DD
function parseIsoDate(isoString: string): Date | null {
  if (!isoString) return null;
  const d = new Date(isoString);
  return isNaN(d.getTime()) ? null : d;
}

// Formata horário HH:mm
function formatTime(isoString?: string | null): string {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '--:--';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Formata data completa DD/MM/AAAA
function formatDatePtBr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// Formata data e hora DD/MM/AAAA às HH:mm
function formatDateTimePtBr(isoString?: string | null): string {
  if (!isoString) return '-';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} às ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Paleta visual consistente para diferenciar ambientes no Planner
const ENV_COLOR_PALETTES = [
  { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-900', badge: 'bg-blue-600 text-white' },
  { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-900', badge: 'bg-emerald-600 text-white' },
  { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-900', badge: 'bg-amber-600 text-white' },
  { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-900', badge: 'bg-purple-600 text-white' },
  { bg: 'bg-rose-50', border: 'border-rose-400', text: 'text-rose-900', badge: 'bg-rose-600 text-white' },
  { bg: 'bg-teal-50', border: 'border-teal-400', text: 'text-teal-900', badge: 'bg-teal-600 text-white' },
  { bg: 'bg-indigo-50', border: 'border-indigo-400', text: 'text-indigo-900', badge: 'bg-indigo-600 text-white' },
];

function getEnvironmentPalette(environmentId: string, environments: EnvironmentGetDto[]) {
  const index = environments.findIndex((e) => e.id === environmentId);
  const safeIndex = index >= 0 ? index % ENV_COLOR_PALETTES.length : 0;
  return ENV_COLOR_PALETTES[safeIndex];
}

export const ReservationPlanner: React.FC<ReservationPlannerProps> = ({
  environments,
  keys,
  reservations,
  currentUser,
  onRefresh,
  showSuccess,
  setError,
  isAdminOrOwner = false,
  initialEnvironmentId,
}) => {
  // Controle de Visualização
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Filtros
  const [filterEnvironmentId, setFilterEnvironmentId] = useState<string>(initialEnvironmentId || '');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  React.useEffect(() => {
    if (initialEnvironmentId) {
      setFilterEnvironmentId(initialEnvironmentId);
    }
  }, [initialEnvironmentId]);

  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDayForModal, setSelectedDayForModal] = useState<Date | null>(null);
  const [detailModalReservation, setDetailModalReservation] = useState<ReservationGetDto | null>(null);
  const [dayDetailsModalDate, setDayDetailsModalDate] = useState<Date | null>(null);

  // Estado do Formulário de Reserva
  const [formEnvId, setFormEnvId] = useState('');
  const [formKeyId, setFormKeyId] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formPurpose, setFormPurpose] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Status de chaves em uso no momento
  const isKeyInUseNow = (keyId: string) => {
    const now = new Date();
    return reservations.some((r) => {
      if (r.keyId !== keyId || r.status !== 'ACTIVE') return false;
      const start = new Date(r.startTime);
      const end = r.endTime ? new Date(r.endTime) : null;
      if (end) {
        return now >= start && now <= end;
      }
      return now >= start;
    });
  };

  // Chaves filtradas para o ambiente selecionado no formulário
  const formKeysForSelectedEnv = useMemo(() => {
    if (!formEnvId) return [];
    return keys.filter((k) => k.environmentId === formEnvId && k.active !== false);
  }, [formEnvId, keys]);

  // Se o ambiente mudar e a chave não pertencer a ele, seleciona a primeira chave disponível
  const handleFormEnvChange = (envId: string) => {
    setFormEnvId(envId);
    const availableKeys = keys.filter((k) => k.environmentId === envId && k.active !== false);
    if (availableKeys.length > 0) {
      setFormKeyId(availableKeys[0].id);
    } else {
      setFormKeyId('');
    }
  };

  // Abrir Modal de Reserva para um dia específico (ao clicar na data do Planner)
  const openCreateModalForDate = (day: Date) => {
    setSelectedDayForModal(day);
    setFormError(null);

    // Configura horários sugeridos: dia clicado às 08:00 até 10:00 (ou hora atual se for hoje)
    const now = new Date();
    const isToday =
      day.getFullYear() === now.getFullYear() &&
      day.getMonth() === now.getMonth() &&
      day.getDate() === now.getDate();

    const start = new Date(day);
    if (isToday) {
      const currentHour = now.getHours();
      start.setHours(currentHour + 1, 0, 0, 0);
    } else {
      start.setHours(8, 0, 0, 0);
    }

    const end = new Date(start);
    end.setHours(start.getHours() + 2);

    setFormStartTime(toDateTimeLocalValue(start));
    setFormEndTime(toDateTimeLocalValue(end));
    setFormPurpose('');

    // Preenche ambiente: se já houver filtro de ambiente ativo no planner, usa ele
    const initialEnvId = filterEnvironmentId || (environments.length > 0 ? environments[0].id : '');
    handleFormEnvChange(initialEnvId);

    setIsCreateModalOpen(true);
  };

  // Submissão do formulário de reserva
  const handleSaveReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setFormError('Usuário não autenticado.');
      return;
    }
    if (!formEnvId) {
      setFormError('Por favor, selecione o ambiente a ser reservado.');
      return;
    }
    if (!formKeyId) {
      setFormError('Selecione uma chave cadastrada para este ambiente.');
      return;
    }

    if (formStartTime && formEndTime) {
      const s = new Date(formStartTime);
      const ed = new Date(formEndTime);
      if (ed <= s) {
        setFormError('O horário de término deve ser posterior ao horário de início da reserva.');
        return;
      }
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      await api.reservations.create({
        workspaceId: currentUser.workspaceId,
        environmentId: formEnvId,
        keyId: formKeyId,
        userId: currentUser.id,
        purpose: formPurpose.trim() || undefined,
        startTime: formStartTime || undefined,
        endTime: formEndTime || undefined,
      });

      setIsCreateModalOpen(false);
      showSuccess('Reserva confirmada com sucesso no calendário!');
      await onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao realizar reserva.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Encerrar reserva / Devolver chave
  const handleCompleteReservation = async (reservation: ReservationGetDto) => {
    try {
      await api.reservations.update({
        id: reservation.id,
        status: 'COMPLETED',
      });
      setDetailModalReservation(null);
      showSuccess(`Reserva de ${reservation.environmentName} encerrada. Chave devolvida com sucesso!`);
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao encerrar reserva.');
    }
  };

  // Excluir reserva (somente Admin/Owner)
  const handleDeleteReservation = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta reserva?')) return;
    try {
      await api.reservations.delete(id);
      setDetailModalReservation(null);
      showSuccess('Reserva excluída com sucesso.');
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir reserva.');
    }
  };

  // Filtragem das reservas
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      // Filtro de ambiente
      if (filterEnvironmentId && r.environmentId !== filterEnvironmentId) {
        return false;
      }
      // Filtro de status
      if (filterStatus === 'ACTIVE' && r.status !== 'ACTIVE') return false;
      if (filterStatus === 'COMPLETED' && r.status !== 'COMPLETED') return false;
      // Filtro de texto
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const envMatch = r.environmentName?.toLowerCase().includes(query);
        const userMatch = r.userName?.toLowerCase().includes(query);
        const purpMatch = r.purpose?.toLowerCase().includes(query);
        const keyMatch = r.keyCode?.toLowerCase().includes(query);
        if (!envMatch && !userMatch && !purpMatch && !keyMatch) return false;
      }
      return true;
    });
  }, [reservations, filterEnvironmentId, filterStatus, searchTerm]);

  // Mapa de reservas por dia (chave YYYY-MM-DD)
  const reservationsByDayKey = useMemo(() => {
    const map = new Map<string, ReservationGetDto[]>();
    for (const r of filteredReservations) {
      const d = parseIsoDate(r.startTime);
      if (!d) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(r);
    }
    // Ordena por horário de início dentro de cada dia
    map.forEach((list) => {
      list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    });
    return map;
  }, [filteredReservations]);

  // Navegação de Datas
  const goToToday = () => setCurrentDate(new Date());

  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setMonth(next.getMonth() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    setCurrentDate(next);
  };

  // Título do Período Atual
  const headerPeriodTitle = useMemo(() => {
    if (viewMode === 'month' || viewMode === 'list') {
      return `${MONTH_NAMES[currentDate.getMonth()]} de ${currentDate.getFullYear()}`;
    }
    // Visão semanal: calcular primeiro e último dia da semana
    const dayOfWeek = currentDate.getDay();
    const firstDay = new Date(currentDate);
    firstDay.setDate(currentDate.getDate() - dayOfWeek);
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(firstDay.getDate())} de ${MONTH_NAMES[firstDay.getMonth()]} a ${pad(lastDay.getDate())} de ${MONTH_NAMES[lastDay.getMonth()]} de ${lastDay.getFullYear()}`;
  }, [currentDate, viewMode]);

  // Células do Calendário Mensal (Grid 7x5 ou 7x6)
  const monthCalendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Dom) a 6 (Sáb)
    const daysInMonth = lastDayOfMonth.getDate();

    // Dias do mês anterior para completar primeira semana
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    interface DayCell {
      date: Date;
      dateKey: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      reservations: ReservationGetDto[];
    }

    const cells: DayCell[] = [];
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Mês anterior
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(year, month - 1, dayNum);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      cells.push({
        date: d,
        dateKey: key,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: key === todayKey,
        reservations: reservationsByDayKey.get(key) || [],
      });
    }

    // Mês atual
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      cells.push({
        date: d,
        dateKey: key,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: key === todayKey,
        reservations: reservationsByDayKey.get(key) || [],
      });
    }

    // Dias do próximo mês para completar grade (múltiplo de 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const d = new Date(year, month + 1, dayNum);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      cells.push({
        date: d,
        dateKey: key,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: key === todayKey,
        reservations: reservationsByDayKey.get(key) || [],
      });
    }

    return cells;
  }, [currentDate, reservationsByDayKey]);

  // Dias da Semana (Modo 'week')
  const weekCalendarDays = useMemo(() => {
    const dayOfWeek = currentDate.getDay();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek);

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({
        date: d,
        dateKey: key,
        dayName: WEEKDAY_NAMES[i],
        dayNumber: d.getDate(),
        isToday: key === todayKey,
        reservations: reservationsByDayKey.get(key) || [],
      });
    }
    return days;
  }, [currentDate, reservationsByDayKey]);

  // Lista Cronológica de Reservas (Modo 'list')
  const chronologicalReservations = useMemo(() => {
    const list = [...filteredReservations];
    list.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    return list;
  }, [filteredReservations]);

  // Estatísticas Rápidas do Mês
  const stats = useMemo(() => {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayCount = (reservationsByDayKey.get(todayKey) || []).filter((r) => r.status === 'ACTIVE').length;
    const totalActive = reservations.filter((r) => r.status === 'ACTIVE').length;
    const totalMonth = reservations.filter((r) => {
      const d = parseIsoDate(r.startTime);
      return d && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    }).length;

    return { todayCount, totalActive, totalMonth };
  }, [reservations, reservationsByDayKey, currentDate]);

  return (
    <div className="space-y-4">
      {/* Barra de Controles e Filtros do Planner */}
      <div className="bg-white border border-[#b8c2cc] rounded shadow-xs p-4 space-y-3">
        {/* Top Header: Navegação de Mês + Alternador de Visualização */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border-b border-[#e2e8f0] pb-3">
          {/* Navegador de Data */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              type="button"
              title="Período anterior"
              className="p-1.5 rounded hover:bg-[#eef1f4] border border-[#ced4da] text-[#003366] transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              type="button"
              className="px-3 py-1 text-xs font-bold text-[#003366] bg-[#eef1f4] hover:bg-[#e2e8f0] border border-[#ced4da] rounded transition cursor-pointer"
            >
              Hoje
            </button>
            <button
              onClick={handleNext}
              type="button"
              title="Próximo período"
              className="p-1.5 rounded hover:bg-[#eef1f4] border border-[#ced4da] text-[#003366] transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <h2 className="text-sm sm:text-base font-bold text-[#003366] ml-2 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#003366]" />
              <span>{headerPeriodTitle}</span>
            </h2>
          </div>

          {/* Ações da Direita: Seleção de Modo de Visão e Botão Nova Reserva */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Indicador de Resumo Rápido */}
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono mr-2 bg-[#f8fafc] px-2.5 py-1 rounded border border-[#e2e8f0]">
              <span className="text-[#6c757d]">Hoje:</span>
              <span className="font-bold text-[#003366]">{stats.todayCount} ativas</span>
              <span className="text-[#ced4da]">|</span>
              <span className="text-[#6c757d]">Total no mês:</span>
              <span className="font-bold text-[#003366]">{stats.totalMonth}</span>
            </div>

            {/* Alternador de Modo de Visualização */}
            <div className="inline-flex rounded border border-[#ced4da] p-0.5 bg-[#f1f5f9]">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'month'
                    ? 'bg-[#003366] text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#003366]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Mês</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'week'
                    ? 'bg-[#003366] text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#003366]'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Semana</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'list'
                    ? 'bg-[#003366] text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#003366]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </button>
            </div>

            {/* Botão de Criação de Reserva Rápida */}
            <button
              type="button"
              onClick={() => openCreateModalForDate(new Date())}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded text-xs uppercase tracking-wider transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Reserva</span>
            </button>
          </div>
        </div>

        {/* Linha de Filtros: Ambiente, Situação e Busca */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
          {/* Filtro por Ambiente */}
          <div>
            <label className="text-[10px] font-bold text-[#6c757d] uppercase block mb-1">
              Filtrar por Ambiente:
            </label>
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 text-[#6c757d] absolute left-2.5 top-2.5 pointer-events-none" />
              <select
                value={filterEnvironmentId}
                onChange={(e) => setFilterEnvironmentId(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-[#ced4da] rounded text-xs bg-white text-[#1f2933] focus:outline-none focus:border-[#003366]"
              >
                <option value="">Todos os Ambientes ({environments.length})</option>
                {environments.map((env) => (
                  <option key={env.id} value={env.id}>
                    {env.name} {env.capacity ? `(${env.capacity} lug.)` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtro por Situação */}
          <div>
            <label className="text-[10px] font-bold text-[#6c757d] uppercase block mb-1">
              Situação da Reserva:
            </label>
            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-[#6c757d] absolute left-2.5 top-2.5 pointer-events-none" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full pl-8 pr-3 py-1.5 border border-[#ced4da] rounded text-xs bg-white text-[#1f2933] focus:outline-none focus:border-[#003366]"
              >
                <option value="ALL">Todas as Situações</option>
                <option value="ACTIVE">Somente Ativas / Reservadas</option>
                <option value="COMPLETED">Somente Finalizadas</option>
              </select>
            </div>
          </div>

          {/* Busca por Texto */}
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-[#6c757d] uppercase block mb-1">
              Buscar por Responsável, Sala ou Finalidade:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#6c757d] absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ex: João, Auditório, Reunião, Lab..."
                className="w-full pl-8 pr-3 py-1.5 border border-[#ced4da] rounded text-xs bg-white text-[#1f2933] focus:outline-none focus:border-[#003366]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-[#6c757d] hover:text-[#333]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dica visual de ação */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-[#eef4fb] border border-[#c5daf3] rounded text-xs text-[#003366]">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-[#003366]" />
          <span>
            <strong>Dica de Agendamento:</strong> Clique em qualquer data no calendário para abrir o formulário com a data já selecionada e reservar o ambiente.
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span> Ativa
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span> Finalizada
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODO 1: CALENDÁRIO MENSAL (PLANNER GRID) */}
      {/* ========================================================================= */}
      {viewMode === 'month' && (
        <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden shadow-xs">
          {/* Cabeçalho dos Dias da Semana */}
          <div className="grid grid-cols-7 bg-[#003366] text-white text-center border-b border-[#002244]">
            {WEEKDAY_SHORT.map((dayName, idx) => (
              <div
                key={dayName}
                className="py-2 text-[11px] font-bold uppercase tracking-wider border-r border-[#004080] last:border-r-0"
              >
                <span className="hidden sm:inline">{WEEKDAY_NAMES[idx]}</span>
                <span className="sm:hidden">{dayName}</span>
              </div>
            ))}
          </div>

          {/* Grade de Dias do Mês */}
          <div className="grid grid-cols-7 divide-x divide-y divide-[#e2e8f0] bg-[#f8fafc]">
            {monthCalendarDays.map((cell) => {
              const dayReservations = cell.reservations;
              const hasReservations = dayReservations.length > 0;

              return (
                <div
                  key={cell.dateKey}
                  onClick={() => openCreateModalForDate(cell.date)}
                  className={`min-h-[105px] sm:min-h-[125px] p-1.5 flex flex-col justify-between transition group cursor-pointer relative ${
                    cell.isCurrentMonth ? 'bg-white hover:bg-[#f0f4f9]' : 'bg-[#f8fafc] opacity-60 hover:opacity-100 hover:bg-[#f1f5f9]'
                  } ${cell.isToday ? 'ring-2 ring-inset ring-[#003366] bg-[#f5f9ff]' : ''}`}
                >
                  {/* Topo da Célula: Número do Dia + Indicador de Hoje + Botão Adicionar */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        cell.isToday
                          ? 'bg-[#003366] text-white shadow-xs'
                          : cell.isCurrentMonth
                          ? 'text-[#1f2933]'
                          : 'text-[#94a3b8]'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Botão sutil de + Reservar visível no hover */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCreateModalForDate(cell.date);
                      }}
                      title={`Reservar neste dia (${formatDatePtBr(cell.date)})`}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[#003366] hover:bg-[#e2e8f0] transition text-[10px] font-bold flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span className="hidden md:inline text-[10px]">Reservar</span>
                    </button>
                  </div>

                  {/* Corpo da Célula: Lista de Reservas do Dia */}
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {hasReservations && (
                      <>
                        {dayReservations.slice(0, 3).map((resv) => {
                          const palette = getEnvironmentPalette(resv.environmentId, environments);
                          const isActive = resv.status === 'ACTIVE';

                          return (
                            <div
                              key={resv.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailModalReservation(resv);
                              }}
                              title={`${resv.environmentName} • ${resv.userName} (${formatTime(resv.startTime)} - ${formatTime(resv.endTime)})\nFinalidade: ${resv.purpose || 'Não informada'}`}
                              className={`p-1 rounded border text-[10px] leading-tight transition cursor-pointer truncate shadow-2xs hover:scale-[1.02] ${
                                isActive
                                  ? `${palette.bg} ${palette.border} ${palette.text} hover:brightness-95`
                                  : 'bg-gray-100 border-gray-300 text-gray-600 line-through'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono font-bold truncate">
                                  {formatTime(resv.startTime)} - {formatTime(resv.endTime)}
                                </span>
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    isActive ? 'bg-emerald-600' : 'bg-gray-400'
                                  }`}
                                />
                              </div>
                              <div className="font-semibold truncate text-[10px]">
                                {resv.environmentName}
                              </div>
                              <div className="text-[9px] text-[#475569] truncate">
                                {resv.userName}
                              </div>
                            </div>
                          );
                        })}

                        {/* Indicador se houver mais de 3 reservas */}
                        {dayReservations.length > 3 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDayDetailsModalDate(cell.date);
                            }}
                            className="w-full text-center py-0.5 text-[10px] font-bold text-[#003366] bg-[#eef1f4] hover:bg-[#e2e8f0] rounded transition cursor-pointer"
                          >
                            +{dayReservations.length - 3} mais
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Espaço Vazio com Prompt para Agendamento */}
                  {!hasReservations && (
                    <div className="text-center py-2 text-[10px] text-[#cbd5e1] group-hover:text-[#94a3b8] transition">
                      Livre
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODO 2: VISÃO SEMANAL (WEEK VIEW) */}
      {/* ========================================================================= */}
      {viewMode === 'week' && (
        <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-[#b8c2cc]">
            {weekCalendarDays.map((day) => (
              <div key={day.dateKey} className="flex flex-col min-h-[350px]">
                {/* Cabeçalho do Dia */}
                <div
                  className={`p-2.5 text-center border-b border-[#b8c2cc] ${
                    day.isToday ? 'bg-[#003366] text-white' : 'bg-[#f1f5f9] text-[#1f2933]'
                  }`}
                >
                  <div className="text-xs font-bold uppercase">{day.dayName}</div>
                  <div className="text-lg font-mono font-bold">{day.dayNumber}</div>
                  <button
                    type="button"
                    onClick={() => openCreateModalForDate(day.date)}
                    className={`mt-1 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded transition ${
                      day.isToday
                        ? 'bg-white/20 hover:bg-white/30 text-white'
                        : 'bg-[#eef1f4] hover:bg-[#e2e8f0] text-[#003366]'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    <span>Reservar</span>
                  </button>
                </div>

                {/* Lista de Reservas do Dia */}
                <div
                  onClick={() => openCreateModalForDate(day.date)}
                  className="flex-1 p-2 space-y-2 bg-[#fcfcfd] hover:bg-[#f8fafc] transition cursor-pointer"
                >
                  {day.reservations.length === 0 ? (
                    <div className="text-center py-10 text-xs text-[#94a3b8]">
                      Nenhuma reserva agendada.
                      <div className="text-[10px] text-[#003366] font-semibold mt-1">
                        Clique para agendar
                      </div>
                    </div>
                  ) : (
                    day.reservations.map((resv) => {
                      const palette = getEnvironmentPalette(resv.environmentId, environments);
                      const isActive = resv.status === 'ACTIVE';

                      return (
                        <div
                          key={resv.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailModalReservation(resv);
                          }}
                          className={`p-2 rounded border text-xs transition cursor-pointer shadow-2xs hover:shadow-xs ${
                            isActive
                              ? `${palette.bg} ${palette.border} ${palette.text}`
                              : 'bg-gray-100 border-gray-300 text-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-mono font-bold text-[11px]">
                              {formatTime(resv.startTime)} - {formatTime(resv.endTime)}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                isActive ? 'bg-emerald-600 text-white' : 'bg-gray-500 text-white'
                              }`}
                            >
                              {isActive ? 'Ativa' : 'Fim'}
                            </span>
                          </div>
                          <div className="font-bold text-[#003366] truncate">{resv.environmentName}</div>
                          <div className="text-[11px] text-[#475569] truncate">
                            Resp: <strong>{resv.userName}</strong>
                          </div>
                          {resv.purpose && (
                            <div className="text-[10px] text-[#64748b] truncate mt-0.5 italic">
                              "{resv.purpose}"
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODO 3: VISÃO AGENDA / CRONOLÓGICA */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden shadow-xs">
          <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#b8c2cc] flex items-center justify-between">
            <span className="text-xs font-bold text-[#003366] uppercase">
              Agenda Cronológica de Reservas ({chronologicalReservations.length})
            </span>
            <button
              type="button"
              onClick={() => openCreateModalForDate(new Date())}
              className="inline-flex items-center gap-1.5 text-xs bg-[#003366] hover:bg-[#002244] text-white font-semibold px-2.5 py-1 rounded transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agendar Reserva</span>
            </button>
          </div>

          <div className="divide-y divide-[#e2e8f0]">
            {chronologicalReservations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6c757d]">
                Nenhuma reserva encontrada para os filtros selecionados neste período.
              </div>
            ) : (
              chronologicalReservations.map((resv) => {
                const palette = getEnvironmentPalette(resv.environmentId, environments);
                const isActive = resv.status === 'ACTIVE';

                return (
                  <div
                    key={resv.id}
                    onClick={() => setDetailModalReservation(resv)}
                    className="p-3.5 hover:bg-[#f8fafc] transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded border text-center min-w-[70px] ${palette.bg} ${palette.border}`}
                      >
                        <div className="text-[10px] font-bold text-[#64748b] uppercase">
                          {parseIsoDate(resv.startTime)?.toLocaleDateString('pt-BR', { weekday: 'short' })}
                        </div>
                        <div className="text-base font-mono font-bold text-[#003366]">
                          {parseIsoDate(resv.startTime)?.getDate()}
                        </div>
                        <div className="text-[10px] font-bold text-[#64748b]">
                          {parseIsoDate(resv.startTime)?.toLocaleDateString('pt-BR', { month: 'short' })}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#003366]">{resv.environmentName}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                              isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {isActive ? 'RESERVADO' : 'FINALIZADA'}
                          </span>
                        </div>

                        <div className="text-xs text-[#475569] flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-[#6c757d]" />
                            {formatTime(resv.startTime)} às {resv.endTime ? formatTime(resv.endTime) : 'aberto'}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-[#6c757d]" />
                            {resv.userName}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <KeyRound className="w-3.5 h-3.5 text-[#6c757d]" />
                            Chave: {resv.keyCode}
                          </span>
                        </div>

                        {resv.purpose && (
                          <div className="text-xs text-[#64748b] italic">
                            Atividade: "{resv.purpose}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailModalReservation(resv);
                        }}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-[#eef1f4] hover:bg-[#e2e8f0] text-[#003366] font-semibold border border-[#b8c2cc] rounded transition cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Detalhes</span>
                      </button>

                      {isActive && (currentUser?.id === resv.userId || isAdminOrOwner) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteReservation(resv);
                          }}
                          className="inline-flex items-center text-xs px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded transition cursor-pointer"
                        >
                          Devolver Chave
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: RESERVA INTELIGENTE AO CLICAR NA DATA */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white border-2 border-[#003366] rounded-md shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
            {/* Cabeçalho do Modal SEI */}
            <div className="bg-[#003366] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-[#99badd]" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                  Agendar Reserva de Ambiente
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Subtítulo indicando o dia clicado */}
            {selectedDayForModal && (
              <div className="bg-[#f0f4f9] border-b border-[#b8c2cc] px-4 py-2 flex items-center justify-between text-xs text-[#003366]">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Data selecionada:{' '}
                    <strong>{formatDatePtBr(selectedDayForModal)}</strong> (
                    {WEEKDAY_NAMES[selectedDayForModal.getDay()]})
                  </span>
                </div>
                <span className="text-[10px] text-[#6c757d] uppercase font-mono">
                  Horário editável abaixo
                </span>
              </div>
            )}

            {/* Mensagem de Erro interna */}
            {formError && (
              <div className="m-4 mb-0 bg-red-50 border-l-4 border-red-700 p-3 text-xs text-red-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Atenção ao agendamento:</span> {formError}
                </div>
              </div>
            )}

            {/* Formulário de Reserva */}
            <form onSubmit={handleSaveReservation} className="p-4 sm:p-5 space-y-3 overflow-y-auto">
              {/* Ambiente */}
              <div>
                <label className="text-xs font-bold text-[#333] block mb-1">
                  Ambiente / Espaço a ser Reservado: *
                </label>
                <select
                  value={formEnvId}
                  onChange={(e) => handleFormEnvChange(e.target.value)}
                  required
                  className="w-full border border-[#ced4da] rounded px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-[#003366]"
                >
                  <option value="">Selecione o ambiente...</option>
                  {environments.map((env) => (
                    <option key={env.id} value={env.id}>
                      {env.name} {env.capacity ? `(${env.capacity} lugares)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chave vinculada */}
              <div>
                <label className="text-xs font-bold text-[#333] block mb-1">
                  Chave a ser Retirada / Utilizada: *
                </label>
                {formKeysForSelectedEnv.length === 0 ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded text-xs text-amber-900">
                    Nenhuma chave cadastrada para este ambiente. Cadastre ou verifique no Controle de Chaves.
                  </div>
                ) : (
                  <select
                    value={formKeyId}
                    onChange={(e) => setFormKeyId(e.target.value)}
                    required
                    className="w-full border border-[#ced4da] rounded px-3 py-1.5 text-xs bg-white font-mono focus:outline-none focus:border-[#003366]"
                  >
                    {formKeysForSelectedEnv.map((k) => {
                      const inUse = isKeyInUseNow(k.id);
                      return (
                        <option key={k.id} value={k.id}>
                          Chave {k.code} — {inUse ? '(EM USO no momento • disponível para outros horários)' : '(DISPONÍVEL na portaria)'}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Horários Início e Fim */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-[#333] block mb-1">
                    Início da Reserva: *
                  </label>
                  <input
                    type="datetime-local"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    required
                    className="w-full border border-[#ced4da] rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-[#003366]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#333] block mb-1">
                    Previsão de Término / Devolução: *
                  </label>
                  <input
                    type="datetime-local"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    required
                    className="w-full border border-[#ced4da] rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-[#003366]"
                  />
                </div>
              </div>

              {/* Finalidade / Atividade */}
              <div>
                <label className="text-xs font-bold text-[#333] block mb-1">
                  Finalidade / Atividade:
                </label>
                <input
                  type="text"
                  value={formPurpose}
                  onChange={(e) => setFormPurpose(e.target.value)}
                  placeholder="ex: Aula Prática, Reunião de Departamento, Palestra, Estudo"
                  className="w-full border border-[#ced4da] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#003366]"
                />
              </div>

              {/* Rodapé e Botões de Ação */}
              <div className="pt-3 border-t border-[#e2e8f0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-1.5 rounded border border-[#ced4da] text-xs font-bold text-[#495057] hover:bg-[#eef1f4] transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || formKeysForSelectedEnv.length === 0}
                  className="inline-flex items-center gap-1.5 px-5 py-1.5 bg-[#003366] hover:bg-[#002244] disabled:opacity-50 text-white font-bold rounded text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Agendando...</span>
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>Confirmar Reserva</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DETALHES DE UMA RESERVA EXISTENTE */}
      {/* ========================================================================= */}
      {detailModalReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white border-2 border-[#003366] rounded-md shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-[#003366] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#99badd]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Detalhes da Reserva Agendada
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalReservation(null)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#6c757d] uppercase font-bold">Ambiente:</span>
                  <span className="font-bold text-[#003366] text-sm">
                    {detailModalReservation.environmentName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#6c757d] uppercase font-bold">Responsável:</span>
                  <span className="font-semibold text-[#1f2933]">
                    {detailModalReservation.userName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#6c757d] uppercase font-bold">Chave Vinculada:</span>
                  <span className="font-mono font-bold text-[#003366]">
                    Chave {detailModalReservation.keyCode}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#6c757d] uppercase font-bold">Situação:</span>
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                      detailModalReservation.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {detailModalReservation.status === 'ACTIVE' ? 'RESERVADO / ATIVA' : 'FINALIZADA'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div>
                  <span className="text-[10px] text-[#6c757d] uppercase font-bold block">
                    Período Agendado:
                  </span>
                  <div className="font-mono text-xs text-[#003366]">
                    De: {formatDateTimePtBr(detailModalReservation.startTime)}
                  </div>
                  <div className="font-mono text-xs text-[#6c757d]">
                    Até: {formatDateTimePtBr(detailModalReservation.endTime)}
                  </div>
                </div>

                {detailModalReservation.purpose && (
                  <div>
                    <span className="text-[10px] text-[#6c757d] uppercase font-bold block">
                      Finalidade / Justificativa:
                    </span>
                    <p className="p-2 bg-[#f8fafc] border border-[#e2e8f0] rounded text-xs italic">
                      "{detailModalReservation.purpose}"
                    </p>
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="pt-3 border-t border-[#e2e8f0] flex flex-wrap items-center justify-between gap-2">
                <div>
                  {isAdminOrOwner && (
                    <button
                      type="button"
                      onClick={() => handleDeleteReservation(detailModalReservation.id)}
                      className="inline-flex items-center gap-1 text-xs text-red-700 hover:text-red-900 font-bold px-2 py-1 rounded hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir Reserva</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailModalReservation(null)}
                    className="px-3 py-1.5 rounded border border-[#ced4da] text-xs font-bold text-[#495057] hover:bg-[#eef1f4] transition cursor-pointer"
                  >
                    Fechar
                  </button>

                  {detailModalReservation.status === 'ACTIVE' &&
                    (currentUser?.id === detailModalReservation.userId || isAdminOrOwner) && (
                      <button
                        type="button"
                        onClick={() => handleCompleteReservation(detailModalReservation)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-xs uppercase tracking-wider transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Devolver Chave</span>
                      </button>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: LISTAGEM COMPLETA DE RESERVAS DE UM DIA (QUANDO > 3 RESERVAS) */}
      {/* ========================================================================= */}
      {dayDetailsModalDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white border-2 border-[#003366] rounded-md shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-[#003366] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#99badd]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Todas as Reservas de {formatDatePtBr(dayDetailsModalDate)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDayDetailsModalDate(null)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2.5 overflow-y-auto">
              {(() => {
                const key = `${dayDetailsModalDate.getFullYear()}-${String(dayDetailsModalDate.getMonth() + 1).padStart(2, '0')}-${String(dayDetailsModalDate.getDate()).padStart(2, '0')}`;
                const list = reservationsByDayKey.get(key) || [];

                return list.map((resv) => {
                  const palette = getEnvironmentPalette(resv.environmentId, environments);
                  const isActive = resv.status === 'ACTIVE';

                  return (
                    <div
                      key={resv.id}
                      onClick={() => {
                        setDayDetailsModalDate(null);
                        setDetailModalReservation(resv);
                      }}
                      className={`p-3 rounded border text-xs transition cursor-pointer flex items-center justify-between gap-3 ${
                        isActive
                          ? `${palette.bg} ${palette.border} ${palette.text} hover:brightness-95`
                          : 'bg-gray-100 border-gray-300 text-gray-600'
                      }`}
                    >
                      <div>
                        <div className="font-mono font-bold text-xs text-[#003366]">
                          {formatTime(resv.startTime)} às {resv.endTime ? formatTime(resv.endTime) : 'aberto'}
                        </div>
                        <div className="font-bold text-xs">{resv.environmentName}</div>
                        <div className="text-[11px] text-[#475569]">
                          Responsável: <strong>{resv.userName}</strong> • Chave: {resv.keyCode}
                        </div>
                        {resv.purpose && (
                          <div className="text-[10px] text-[#64748b] italic">"{resv.purpose}"</div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                            isActive ? 'bg-emerald-600 text-white' : 'bg-gray-500 text-white'
                          }`}
                        >
                          {isActive ? 'ATIVA' : 'FIM'}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="p-3 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const d = dayDetailsModalDate;
                  setDayDetailsModalDate(null);
                  openCreateModalForDate(d);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded text-xs uppercase tracking-wider transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Reserva Neste Dia</span>
              </button>

              <button
                type="button"
                onClick={() => setDayDetailsModalDate(null)}
                className="px-3 py-1 rounded border border-[#ced4da] text-xs font-bold text-[#495057] hover:bg-[#eef1f4] transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
