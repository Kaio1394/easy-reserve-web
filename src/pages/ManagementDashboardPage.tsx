import React, { useCallback, useEffect, useState } from 'react';
import { EnvironmentRecommendationAssistant } from '../components/EnvironmentRecommendationAssistant';
import { ReservationPlanner } from '../components/ReservationPlanner';
import { UserProfileSettings } from '../components/UserProfileSettings';
import { type ActiveTab, SeiLayout } from '../components/SeiLayout';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type {
  EnvironmentGetDto,
  EnvironmentResourceGetDto,
  KeyGetDto,
  ReservationGetDto,
  ReservationHistoryGetDto,
  Role,
  UserGetDto,
} from '../types/api';
import {
  AlertCircle,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Edit3,
  History,
  Info,
  KeyRound,
  Link2,
  Lock,
  MonitorSpeaker,
  Plus,
  RefreshCw,
  Settings,
  Sliders,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';

/**
 * PÃ¡gina de GestÃ£o Administrativa para usuÃ¡rios ADMIN e OWNER.
 * - ADMIN: pode criar, editar e excluir Ambientes, Elementos/Recursos e Chaves, mas NÃƒO pode adicionar, editar ou excluir UsuÃ¡rios.
 * - OWNER: pode tudo (Ambientes, Elementos/Recursos, Chaves e tambÃ©m adicionar, editar e excluir UsuÃ¡rios).
 */
export const ManagementDashboardPage: React.FC = () => {
  const { user, workspaceSlug } = useAuth();
  const isOwner = user?.role === 'OWNER';

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const [environments, setEnvironments] = useState<EnvironmentGetDto[]>([]);
  const [resources, setResources] = useState<EnvironmentResourceGetDto[]>([]);
  const [keys, setKeys] = useState<KeyGetDto[]>([]);
  const [reservations, setReservations] = useState<ReservationGetDto[]>([]);
  const [reservationHistories, setReservationHistories] = useState<ReservationHistoryGetDto[]>([]);
  const [users, setUsers] = useState<UserGetDto[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal de InformaÃ§Ãµes Detalhadas do Ambiente (com seus elementos e chaves)
  const [infoEnvId, setInfoEnvId] = useState<string | null>(null);

  // Modal de InformaÃ§Ãµes Detalhadas da Reserva / HistÃ³rico
  const [selectedReservationInfo, setSelectedReservationInfo] = useState<
    | { type: 'reservation'; data: ReservationGetDto }
    | { type: 'history'; data: ReservationHistoryGetDto }
    | null
  >(null);

  // Form Criar/Editar Ambiente
  const [editingEnvId, setEditingEnvId] = useState<string | null>(null);
  const [envName, setEnvName] = useState('');
  const [envDescription, setEnvDescription] = useState('');
  const [envCapacity, setEnvCapacity] = useState('');

  // Form Cadastrar/Editar Elemento no CatÃ¡logo (MOD-03 â€” SEM quantidade, pois quantidade Ã© por ambiente)
  const [editingCatalogResId, setEditingCatalogResId] = useState<string | null>(null);
  const [catalogResName, setCatalogResName] = useState('');

  // Form Associar Elemento do CatÃ¡logo a um Ambiente (define a Quantidade dentro da sala e se estÃ¡ OK)
  const [editingAllocId, setEditingAllocId] = useState<string | null>(null);
  const [allocEnvId, setAllocEnvId] = useState<string>('');
  const [allocResourceName, setAllocResourceName] = useState<string>('');
  const [allocQuantity, setAllocQuantity] = useState<string>('1');
  const [allocOperational, setAllocOperational] = useState<boolean>(true);

  // Form Criar Chave
  const [keyEnvId, setKeyEnvId] = useState('');
  const [keyCode, setKeyCode] = useState('');

  // Form Criar Reserva de Ambiente (MOD-06)
  const [reservationViewMode, setReservationViewMode] = useState<'planner' | 'form'>('planner');
  const [resvEnvId, setResvEnvId] = useState('');
  const [resvKeyId, setResvKeyId] = useState('');
  const [resvPurpose, setResvPurpose] = useState('');
  const [resvStartTime, setResvStartTime] = useState('');
  const [resvEndTime, setResvEndTime] = useState('');

  // Filtros do Submenu de HistÃ³rico de Reservas
  const [histFilterStartDate, setHistFilterStartDate] = useState('');
  const [histFilterEndDate, setHistFilterEndDate] = useState('');
  const [histFilterEnvId, setHistFilterEnvId] = useState('');
  const [histFilterAction, setHistFilterAction] = useState('');

  // Form Criar/Editar UsuÃ¡rio (Exclusivo OWNER)
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
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
      const [envList, resList, keyList, resvList, resvHistList, userList] = await Promise.all([
        api.environments.findAll().catch(() => []),
        api.environmentResources.findAll().catch(() => []),
        api.keys.findAll().catch(() => []),
        api.reservations.findAll().catch(() => []),
        api.reservationHistories.findAll().catch(() => []),
        api.users.findAll().catch(() => []),
      ]);

      const wsEnvs = envList.filter((e) => e.workspaceId === user.workspaceId);
      const wsEnvIds = new Set(wsEnvs.map((e) => e.id));
      const wsRes = resList.filter((r) => r.workspaceId === user.workspaceId);
      const wsKeys = keyList.filter((k) => wsEnvIds.has(k.environmentId));
      const wsResvs = resvList.filter((rv) => rv.workspaceId === user.workspaceId);
      const wsResvHists = resvHistList.filter((h) => h.workspaceId === user.workspaceId);
      const wsUsers = userList.filter((u) => u.workspaceId === user.workspaceId);

      setEnvironments(wsEnvs);
      setResources(wsRes);
      setKeys(wsKeys);
      setReservations(wsResvs);
      setReservationHistories(wsResvHists);
      setUsers(wsUsers);

      if (wsEnvs.length > 0 && !keyEnvId) {
        setKeyEnvId(wsEnvs[0].id);
      }
      if (wsEnvs.length > 0 && !allocEnvId) {
        setAllocEnvId(wsEnvs[0].id);
      }
      if (wsEnvs.length > 0 && !resvEnvId) {
        setResvEnvId(wsEnvs[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados operacionais.');
    } finally {
      setLoading(false);
    }
  }, [user, keyEnvId, allocEnvId, resvEnvId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Separa os itens de CatÃ¡logo (environmentId == null) e as AlocaÃ§Ãµes em Ambientes (environmentId != null)
  const catalogResources = resources.filter((r) => !r.environmentId);
  const allocatedResources = resources.filter((r) => Boolean(r.environmentId));

  // Lista Ãºnica de nomes de elementos disponÃ­veis no catÃ¡logo para seleÃ§Ã£o ao associar a uma sala
  const catalogNames = Array.from(
    new Set(resources.map((r) => r.name.trim()).filter(Boolean))
  );

  useEffect(() => {
    if (catalogNames.length > 0 && !allocResourceName) {
      setAllocResourceName(catalogNames[0]);
    }
  }, [catalogNames, allocResourceName]);

  const showSuccess = (msg: string) => {
    setFeedback(msg);
    setError(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  // --- Handlers Ambientes (ADMIN & OWNER) ---
  const handleSaveEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    try {
      if (editingEnvId) {
        await api.environments.update({
          id: editingEnvId,
          name: envName.trim(),
          description: envDescription.trim() || undefined,
          capacity: envCapacity ? Number(envCapacity) : undefined,
        });
        showSuccess('Ambiente atualizado com sucesso.');
      } else {
        await api.environments.create({
          workspaceId: user.workspaceId,
          name: envName.trim(),
          description: envDescription.trim() || undefined,
          capacity: envCapacity ? Number(envCapacity) : undefined,
        });
        showSuccess('Ambiente fÃ­sico cadastrado com sucesso.');
      }
      resetEnvForm();
      await loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startEditEnvironment = (env: EnvironmentGetDto) => {
    setEditingEnvId(env.id);
    setEnvName(env.name);
    setEnvDescription(env.description || '');
    setEnvCapacity(env.capacity ? String(env.capacity) : '');
  };

  const resetEnvForm = () => {
    setEditingEnvId(null);
    setEnvName('');
    setEnvDescription('');
    setEnvCapacity('');
  };

  const handleDeleteEnvironment = async (id: string) => {
    setError(null);
    try {
      await api.environments.delete(id);
      if (infoEnvId === id) {
        setInfoEnvId(null);
      }
      showSuccess('Ambiente removido com sucesso.');
      await loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- Handlers CatÃ¡logo de Elementos & Recursos (SEM quantidade e SEM ambiente) ---
  const handleSaveCatalogResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const trimmedName = catalogResName.trim();
    if (!trimmedName) return;

    setError(null);
    try {
      if (editingCatalogResId) {
        const currentItem = resources.find((r) => r.id === editingCatalogResId);
        await api.environmentResources.update({
          id: editingCatalogResId,
          environmentId: null,
          name: trimmedName,
          quantity: null,
          operational: true,
        });
        if (currentItem && currentItem.name !== trimmedName) {
          const sameNameAllocs = allocatedResources.filter(
            (a) => a.name === currentItem.name
          );
          await Promise.all(
            sameNameAllocs.map((alloc) =>
              api.environmentResources.update({
                id: alloc.id,
                environmentId: alloc.environmentId,
                name: trimmedName,
                quantity: alloc.quantity || 1,
                operational: alloc.operational,
                active: alloc.active,
              })
            )
          );
        }
        showSuccess('Elemento do catÃ¡logo atualizado com sucesso.');
      } else {
        const alreadyExists = catalogResources.some(
          (r) => r.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (alreadyExists) {
          setError(`O elemento "${trimmedName}" jÃ¡ estÃ¡ cadastrado no catÃ¡logo.`);
          return;
        }
        await api.environmentResources.create({
          workspaceId: user.workspaceId,
          environmentId: null,
          name: trimmedName,
          quantity: null,
          operational: true,
        });
        showSuccess(
          `Elemento "${trimmedName}" cadastrado! Agora vocÃª pode associÃ¡-lo aos ambientes informando a quantidade em cada sala.`
        );
      }
      setEditingCatalogResId(null);
      setCatalogResName('');
      await loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startEditCatalogResource = (r: EnvironmentResourceGetDto) => {
    setEditingCatalogResId(r.id);
    setCatalogResName(r.name);
  };

  const resetCatalogForm = () => {
    setEditingCatalogResId(null);
    setCatalogResName('');
  };

  // --- Handlers AssociaÃ§Ã£o de Elemento ao Ambiente (COM quantidade na sala e Estado OK/Defeito) ---
  const handleSaveRoomAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!allocEnvId) {
      setError('Selecione o ambiente (sala/laboratÃ³rio) para associar o elemento.');
      return;
    }
    if (!allocResourceName.trim()) {
      setError('Selecione um elemento do catÃ¡logo.');
      return;
    }

    const qty = Math.max(1, Number(allocQuantity) || 1);
    setError(null);

    try {
      if (editingAllocId) {
        await api.environmentResources.update({
          id: editingAllocId,
          environmentId: allocEnvId,
          name: allocResourceName.trim(),
          quantity: qty,
          operational: allocOperational,
        });
        showSuccess('AssociaÃ§Ã£o do elemento na sala atualizada com sucesso.');
      } else {
        const existingInRoom = allocatedResources.find(
          (r) =>
            r.environmentId === allocEnvId &&
            r.name.toLowerCase() === allocResourceName.trim().toLowerCase()
        );

        if (existingInRoom) {
          await api.environmentResources.update({
            id: existingInRoom.id,
            environmentId: allocEnvId,
            name: existingInRoom.name,
            quantity: qty,
            operational: allocOperational,
            active: existingInRoom.active,
          });
          showSuccess(
            `Quantidade de "${existingInRoom.name}" na sala atualizada para ${qty} unidade(s).`
          );
        } else {
          await api.environmentResources.create({
            workspaceId: user.workspaceId,
            environmentId: allocEnvId,
            name: allocResourceName.trim(),
            quantity: qty,
            operational: allocOperational,
          });
          showSuccess(
            `${qty}x "${allocResourceName.trim()}" associado(s) ao ambiente com sucesso.`
          );
        }
      }
      resetAllocForm();
      await loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startEditAllocation = (r: EnvironmentResourceGetDto) => {
    setEditingAllocId(r.id);
    setAllocEnvId(r.environmentId || '');
    setAllocResourceName(r.name);
    setAllocQuantity(String(r.quantity || 1));
    setAllocOperational(r.operational);
  };

  const resetAllocForm = () => {
    setEditingAllocId(null);
    setAllocQuantity('1');
    setAllocOperational(true);
  };

  const handleUpdateAllocationQuantity = async (
    resItem: EnvironmentResourceGetDto,
    newQty: number
  ) => {
    if (newQty < 1) return;
    setError(null);
    try {
      await api.environmentResources.update({
        id: resItem.id,
        environmentId: resItem.environmentId || null,
        name: resItem.name,
        quantity: newQty,
        operational: resItem.operational,
        active: resItem.active,
      });
      await loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleResourceOperational = async (resItem: EnvironmentResourceGetDto) => {
    setError(null);
    try {
      await api.environmentResources.update({
        id: resItem.id,
        environmentId: resItem.environmentId || null,
        name: resItem.name,
        quantity: resItem.quantity ?? 1,
        operational: !resItem.operational,
        active: resItem.active,
      });
      showSuccess(
        `Estado de "${resItem.name}" alterado para ${
          !resItem.operational ? 'OK / FUNCIONANDO' : 'DEFEITO / MANUTENÃ‡ÃƒO'
        }.`
      );
      await loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteResource = async (id: string, isAllocation = false) => {
    setError(null);
    try {
      await api.environmentResources.delete(id);
      showSuccess(
        isAllocation
          ? 'Elemento desvinculado da sala.'
          : 'Elemento removido do catÃ¡logo.'
      );
      await loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };


  // --- Handlers Chaves (ADMIN & OWNER) ---
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
          !keyItem.available ? 'DISPONÃVEL NA PORTARIA' : 'EM USO / RETIRADA'
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

  // Verifica se uma chave estÃ¡ EM USO no momento exato (somente se houver reserva ativa para o momento atual)
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

  // Chaves do ambiente selecionado (prioriza chaves livres no momento, mas permite selecionar em qualquer horÃ¡rio)
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

  // --- Handlers Reserva de Ambientes (MOD-06) ---
  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!resvEnvId) {
      setError('Selecione o ambiente que deseja reservar.');
      return;
    }
    if (!resvKeyId) {
      setError('Selecione qual chave serÃ¡ utilizada na reserva.');
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
        `Reserva confirmada! A chave "${created.keyCode}" agora estÃ¡ com status EM USO.`
      );
      await loadAllData();
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
        `Reserva encerrada! A chave "${resv.keyCode}" foi devolvida e estÃ¡ DISPONÃVEL no quadro.`
      );
      await loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteReservation = async (id: string) => {
    setError(null);
    try {
      await api.reservations.delete(id);
      showSuccess('Registro de reserva removido.');
      await loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- Handlers UsuÃ¡rios (Exclusivo OWNER) ---
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isOwner) return;
    setError(null);
    try {
      if (editingUserId) {
        await api.users.update({
          id: editingUserId,
          name: newName.trim(),
          username: newUsername.trim(),
          email: newEmail.trim(),
          password: newPassword.trim() ? newPassword : undefined,
          phone: newPhone.trim() || undefined,
          cpf: newCpf.trim() || undefined,
          role: newRole,
        });
        showSuccess('Dados do servidor atualizados com sucesso.');
      } else {
        await api.users.create({
          workspaceId: user.workspaceId,
          name: newName.trim(),
          username: newUsername.trim(),
          email: newEmail.trim(),
          password: newPassword,
          phone: newPhone.trim() || undefined,
          cpf: newCpf.trim() || undefined,
          role: newRole,
        });
        showSuccess('Servidor / UsuÃ¡rio credenciado na unidade.');
      }
      resetUserForm();
      await loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startEditUser = (u: UserGetDto) => {
    setEditingUserId(u.id);
    setNewName(u.name || '');
    setNewUsername(u.username);
    setNewEmail(u.email);
    setNewPassword('');
    setNewPhone(u.phone || '');
    setNewCpf(u.cpf || '');
    setNewRole(u.role);
  };

  const resetUserForm = () => {
    setEditingUserId(null);
    setNewName('');
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
    setNewPhone('');
    setNewCpf('');
    setNewRole('COMMON');
  };

  const handleDeleteUser = async (id: string) => {
    if (!isOwner) return;
    setError(null);
    try {
      await api.users.delete(id);
      showSuccess('UsuÃ¡rio removido da unidade.');
      await loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const borrowedKeysCount = keys.filter((k) => isKeyInUseNow(k.id)).length;
  const availableKeysCount = keys.length - borrowedKeysCount;
  const operationalAllocationsCount = allocatedResources.filter(
    (r) => r.operational
  ).length;

  const getEnvName = (envId?: string | null) =>
    envId
      ? environments.find((e) => e.id === envId)?.name || envId.slice(0, 8)
      : 'CatÃ¡logo da Unidade';

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
    if (!iso) return 'â€”';
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
    <SeiLayout activeTab={activeTab} onSelectTab={setActiveTab} showUsersTab={true}>
      {/* Barra de Status da OperaÃ§Ã£o */}
      <div className="mb-4 bg-white border border-[#b8c2cc] rounded px-4 py-2.5 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-[#003366] uppercase">
            {activeTab === 'overview' && 'Resumo Geral da Unidade Gestora'}
            {activeTab === 'reservations' &&
              'Reserva de Ambientes e EspaÃ§os com Controle de Chave em Uso'}
            {activeTab === 'reservation_history' &&
              'HistÃ³rico de Reservas e Consulta por PerÃ­odo / Data'}
            {activeTab === 'environments' &&
              'GestÃ£o de Ambientes FÃ­sicos e AssociaÃ§Ã£o de Elementos (ADMIN / OWNER)'}
            {activeTab === 'resources' &&
              'CatÃ¡logo de Elementos & Recursos da Unidade (ADMIN / OWNER)'}
            {activeTab === 'keys' && 'Portaria â€” Controle de EmprÃ©stimo e Guarda de Chaves'}
            {activeTab === 'users' &&
              (isOwner
                ? 'Credenciamento Funcional de Servidores (Exclusivo OWNER)'
                : 'RelaÃ§Ã£o de Servidores da Unidade (Somente Leitura para ADMIN)')}
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
      {/* MODAL DE INFORMAÃ‡Ã•ES DO AMBIENTE E ELEMENTOS ALOCADOS */}
      {/* =================================================================== */}
      {selectedInfoEnv && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#b8c2cc] rounded shadow-xl w-full max-w-3xl overflow-hidden">
            {/* CabeÃ§alho do Modal SEI */}
            <div className="bg-[#003366] text-white px-4 py-3 flex items-center justify-between border-b-2 border-[#002244]">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#99badd]" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide">
                    Ficha TÃ©cnica do Ambiente â€” {selectedInfoEnv.name}
                  </h3>
                  <p className="text-[11px] text-[#b3c7dd]">
                    Elementos/Recursos associados, quantidades e estado operacional
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

            {/* Corpo do Modal */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Resumo do Ambiente */}
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
                      : 'NÃ£o informada'}
                  </strong>
                </div>
                <div>
                  <span className="text-[#6c757d] block text-[11px]">DescriÃ§Ã£o:</span>
                  <span>{selectedInfoEnv.description || 'â€”'}</span>
                </div>
              </div>

              {/* Chaves Vinculadas */}
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
                      {k.code}: {!isKeyInUseNow(k.id) ? 'DISPONÃVEL' : 'EM USO'}
                    </span>
                  ))
                )}
              </div>

              {/* Lista de Elementos Associados na Sala */}
              <div className="border border-[#b8c2cc] rounded overflow-hidden">
                <div className="bg-[#f1f5f9] px-3.5 py-2 border-b border-[#b8c2cc] flex items-center justify-between">
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
                        <th className="py-2 px-3 font-bold">EstÃ¡ OK?</th>
                        <th className="py-2 px-3 font-bold text-right">AÃ§Ãµes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0]">
                      {selectedInfoEnvResources.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-[#6c757d]">
                            Nenhum elemento associado a este ambiente.
                          </td>
                        </tr>
                      ) : (
                        selectedInfoEnvResources.map((alloc) => (
                          <tr key={alloc.id} className="hover:bg-[#f8fafc]">
                            <td className="py-2 px-3 font-bold text-[#003366]">
                              {alloc.name}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min={1}
                                value={alloc.quantity ?? 1}
                                onChange={(e) =>
                                  handleUpdateAllocationQuantity(
                                    alloc,
                                    Number(e.target.value)
                                  )
                                }
                                className="w-20 border border-[#ced4da] rounded px-2 py-0.5 text-xs font-mono font-bold focus:outline-none focus:border-[#003366]"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <button
                                type="button"
                                onClick={() => handleToggleResourceOperational(alloc)}
                                title="Clique para alternar entre OK e Defeito"
                                className={`px-2.5 py-0.5 rounded font-mono text-[11px] font-bold border transition cursor-pointer ${
                                  alloc.operational
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100'
                                }`}
                              >
                                {alloc.operational ? 'SIM (OK)' : 'NÃƒO (DEFEITO)'}
                              </button>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteResource(alloc.id, true)}
                                className="inline-flex items-center gap-1 text-red-700 hover:text-red-900 font-semibold px-2 py-1 rounded hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remover da Sala</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Lista de Reservas deste Ambiente (Dias e HorÃ¡rios) */}
              <div className="border border-[#b8c2cc] rounded overflow-hidden">
                <div className="bg-[#f1f5f9] px-3.5 py-2 border-b border-[#b8c2cc] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#003366] uppercase">
                    Reservas deste Ambiente â€” Dias e HorÃ¡rios ({selectedInfoEnvReservations.length})
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-[#ced4da]">
                        <th className="py-2 px-3 font-bold">Quem Reservou</th>
                        <th className="py-2 px-3 font-bold">HorÃ¡rio</th>
                        <th className="py-2 px-3 font-bold">SituaÃ§Ã£o</th>
                        <th className="py-2 px-3 font-bold text-right">AÃ§Ãµes</th>
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
                                InÃ­cio: {formatDateTime(rv.startTime)}
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
                              <div className="inline-flex items-center justify-end gap-1.5">
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
                                {rv.status === 'ACTIVE' && (
                                  <button
                                    type="button"
                                    onClick={() => handleCompleteReservation(rv)}
                                    className="inline-flex items-center px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-bold whitespace-nowrap cursor-pointer"
                                  >
                                    Devolver Chave
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RodapÃ© do Modal */}
            <div className="bg-[#f8f9fa] px-4 py-2.5 border-t border-[#b8c2cc] flex items-center justify-end">
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
      {/* MODAL DE INFORMAÃ‡Ã•ES DETALHADAS DA RESERVA / HISTÃ“RICO */}
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
                      : 'Detalhes do Registro de HistÃ³rico'}
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
                    {selectedReservationInfo.data.keyCode} â€¢{' '}
                    {selectedReservationInfo.data.status === 'ACTIVE' ? 'EM USO' : 'DEVOLVIDA'}
                  </span>
                </div>
                <div>
                  <span className="text-[#6c757d] block text-[11px]">SituaÃ§Ã£o da Reserva:</span>
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
                    HorÃ¡rio da SolicitaÃ§Ã£o de Reserva:
                  </span>
                  <strong className="text-[#003366]">
                    {formatDateTime(selectedReservationInfo.data.createdAt)}
                  </strong>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                  <div>
                    <span className="text-[#6c757d] block font-sans">HorÃ¡rio de InÃ­cio:</span>
                    <strong className="text-[#003366]">
                      {formatDateTime(selectedReservationInfo.data.startTime)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#6c757d] block font-sans">
                      HorÃ¡rio de TÃ©rmino / DevoluÃ§Ã£o:
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
                    {selectedReservationInfo.data.purpose || 'NÃ£o informada'}
                  </p>
                </div>

                {selectedReservationInfo.type === 'history' && (
                  <div className="pt-2 border-t border-[#e2e8f0] space-y-1">
                    <div>
                      <span className="text-[#6c757d] block text-[11px]">
                        Registro de Auditoria / MovimentaÃ§Ã£o:
                      </span>
                      <p className="text-[#003366] font-semibold mt-0.5">
                        {selectedReservationInfo.data.notes || 'â€”'}
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
                selectedReservationInfo.data.status === 'ACTIVE' && (
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

      {/* =================================================================== */}
      {/* ABA 1: PAINEL OPERACIONAL (OVERVIEW) */}
      {/* =================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#b8c2cc] rounded p-4">
              <div className="flex items-center justify-between text-[#6c757d] text-xs mb-1">
                <span className="font-bold uppercase text-[11px]">Ambientes Ativos</span>
                <Building2 className="w-4 h-4 text-[#003366]" />
              </div>
              <div className="text-2xl font-bold text-[#003366] font-mono">
                {environments.length}
              </div>
              <div className="text-[11px] text-[#6c757d] mt-1">
                Salas, laboratÃ³rios e auditÃ³rios
              </div>
            </div>

            <div className="bg-white border border-[#b8c2cc] rounded p-4">
              <div className="flex items-center justify-between text-[#6c757d] text-xs mb-1">
                <span className="font-bold uppercase text-[11px]">Elementos nas Salas</span>
                <MonitorSpeaker className="w-4 h-4 text-[#003366]" />
              </div>
              <div className="text-2xl font-bold text-[#003366] font-mono">
                {operationalAllocationsCount}{' '}
                <span className="text-xs font-normal text-[#6c757d]">
                  / {allocatedResources.length} OK
                </span>
              </div>
              <div className="text-[11px] text-[#6c757d] mt-1">
                {catalogNames.length} tipo(s) cadastrado(s) no catÃ¡logo
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
                <span className="font-bold uppercase text-[11px]">UsuÃ¡rios da Unidade</span>
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

          <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
            <div className="bg-[#003366] text-white px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase">
                Quadro Geral de Ambientes, Elementos Associados e Chaves
              </span>
              <span className="text-[11px] font-mono text-[#b3c7dd]">
                Slug da Unidade: {workspaceSlug || 'ATUAL'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#b8c2cc] text-[#333]">
                    <th className="py-2.5 px-3 font-bold">Ambiente / EspaÃ§o</th>
                    <th className="py-2.5 px-3 font-bold">Capacidade</th>
                    <th className="py-2.5 px-3 font-bold">Elementos na Sala</th>
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
                          Ambientes & EspaÃ§os
                        </button>{' '}
                        para adicionar o primeiro.
                      </td>
                    </tr>
                  ) : (
                    environments.map((env) => {
                      const envKeys = keys.filter((k) => k.environmentId === env.id);
                      const envRes = allocatedResources.filter(
                        (r) => r.environmentId === env.id
                      );
                      const defectiveCount = envRes.filter((r) => !r.operational).length;
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
                            {env.capacity ? `${env.capacity} lugares` : 'â€”'}
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => setInfoEnvId(env.id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#eef1f4] hover:bg-[#e2e8f0] text-[#003366] font-semibold border border-[#b8c2cc] transition cursor-pointer"
                            >
                              <Info className="w-3.5 h-3.5" />
                              <span>
                                {envRes.length === 0
                                  ? 'Sem elementos (Ver info)'
                                  : `Ver ${envRes.length} elemento(s)`}
                              </span>
                              {defectiveCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded bg-red-700 text-white font-mono text-[10px]">
                                  {defectiveCount} defeito
                                </span>
                              )}
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
                                      k.available
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                        : 'bg-amber-50 text-amber-800 border-amber-300'
                                    }`}
                                  >
                                    {k.code}: {k.available ? 'DISPONÃVEL' : 'RETIRADA'}
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
      {/* ABA 2: AMBIENTES & ESPAÃ‡OS + ASSOCIAÃ‡ÃƒO DE ELEMENTOS (QTD NA SALA) */}
      {/* =================================================================== */}
      {activeTab === 'environments' && (
        <div className="space-y-5">
          {/* Painel 1: Cadastrar/Editar Ambiente */}
          <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
            <div className="bg-[#003366] text-white px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase">
                {editingEnvId
                  ? 'Editar Ambiente Selecionado'
                  : '1. Cadastrar Novo Ambiente / LaboratÃ³rio / Sala'}
              </span>
            </div>

            <form onSubmit={handleSaveEnvironment} className="p-5 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                <label className="text-xs font-bold text-[#333] md:text-right">
                  IdentificaÃ§Ã£o do Ambiente: *
                </label>
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={envName}
                    onChange={(e) => setEnvName(e.target.value)}
                    placeholder="ex: Bloco A - LaboratÃ³rio de Redes (A-204)"
                    required
                    className="w-full border border-[#ced4da] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#003366]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                <label className="text-xs font-bold text-[#333] md:text-right">
                  DescriÃ§Ã£o:
                </label>
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={envDescription}
                    onChange={(e) => setEnvDescription(e.target.value)}
                    placeholder="ex: LaboratÃ³rio de informÃ¡tica do 2Âº andar"
                    className="w-full border border-[#ced4da] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#003366]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                <label className="text-xs font-bold text-[#333] md:text-right">
                  Capacidade MÃ¡xima:
                </label>
                <div className="md:col-span-2 flex flex-wrap items-center gap-3">
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
                    <span>{editingEnvId ? 'Salvar AlteraÃ§Ãµes' : 'Registrar Ambiente'}</span>
                  </button>
                  {editingEnvId && (
                    <button
                      type="button"
                      onClick={resetEnvForm}
                      className="flex items-center gap-1 px-3 py-1.5 border border-[#ced4da] rounded text-xs text-[#495057] hover:bg-[#f1f5f9] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancelar</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Painel 2: Associar Elemento Cadastrado ao Ambiente (Definindo Quantidade dentro da Sala) */}
          <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
            <div className="bg-[#002244] text-white px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#99badd]" />
                <span className="text-xs font-bold uppercase">
                  {editingAllocId
                    ? 'Editar Quantidade / Estado do Elemento na Sala'
                    : '2. Associar Elemento ao Ambiente (Definir Quantidade na Sala)'}
                </span>
              </div>
            </div>

            {catalogNames.length === 0 ? (
              <div className="p-4 text-xs text-[#495057] bg-[#f8f9fa] flex items-center justify-between">
                <span>
                  Nenhum elemento cadastrado no catÃ¡logo ainda. Cadastre primeiro os elementos (ex.: Ar-Condicionado XPTO, Cadeira, Projetor) na aba{' '}
                  <strong>Elementos & Recursos</strong>.
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('resources')}
                  className="px-3 py-1.5 bg-[#003366] text-white font-bold rounded text-xs cursor-pointer shrink-0"
                >
                  Ir para Elementos & Recursos
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveRoomAllocation} className="p-5 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                  <label className="text-xs font-bold text-[#333] md:text-right">
                    Ambiente (Sala): *
                  </label>
                  <div className="md:col-span-2">
                    <select
                      value={allocEnvId}
                      onChange={(e) => setAllocEnvId(e.target.value)}
                      required
                      className="w-full border border-[#ced4da] rounded px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-[#003366]"
                    >
                      <option value="">Selecione o ambiente...</option>
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
                    Elemento Cadastrado: *
                  </label>
                  <div className="md:col-span-2">
                    <select
                      value={allocResourceName}
                      onChange={(e) => setAllocResourceName(e.target.value)}
                      required
                      className="w-full border border-[#ced4da] rounded px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-[#003366]"
                    >
                      {catalogNames.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                  <label className="text-xs font-bold text-[#333] md:text-right">
                    Quantidade na Sala & Estado: *
                  </label>
                  <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      value={allocQuantity}
                      onChange={(e) => setAllocQuantity(e.target.value)}
                      placeholder="Qtd na sala"
                      required
                      className="w-28 border border-[#ced4da] rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#003366]"
                    />

                    <select
                      value={allocOperational ? 'true' : 'false'}
                      onChange={(e) => setAllocOperational(e.target.value === 'true')}
                      className="border border-[#ced4da] rounded px-3 py-1.5 text-xs bg-white font-semibold focus:outline-none focus:border-[#003366]"
                    >
                      <option value="true">EstÃ¡ OK / Funcionando</option>
                      <option value="false">Com Defeito / ManutenÃ§Ã£o</option>
                    </select>

                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-5 py-1.5 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>
                        {editingAllocId ? 'Atualizar na Sala' : 'Associar Ã  Sala'}
                      </span>
                    </button>

                    {editingAllocId && (
                      <button
                        type="button"
                        onClick={resetAllocForm}
                        className="flex items-center gap-1 px-3 py-1.5 border border-[#ced4da] rounded text-xs text-[#495057] hover:bg-[#f1f5f9] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    )}
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Tabela de Ambientes com BotÃ£o de Info para abrir a Janela de Elementos */}
          <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
            <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#b8c2cc] flex items-center justify-between">
              <span className="text-xs font-bold text-[#003366] uppercase">
                RelaÃ§Ã£o de Ambientes Cadastrados ({environments.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f1f5f9] border-b border-[#b8c2cc]">
                    <th className="py-2.5 px-3 font-bold">Ambiente</th>
                    <th className="py-2.5 px-3 font-bold">DescriÃ§Ã£o</th>
                    <th className="py-2.5 px-3 font-bold">Capacidade</th>
                    <th className="py-2.5 px-3 font-bold text-right">AÃ§Ãµes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {environments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-[#6c757d]">
                        Nenhum ambiente registrado atÃ© o momento.
                      </td>
                    </tr>
                  ) : (
                    environments.map((env) => {
                      const envAllocations = allocatedResources.filter(
                        (r) => r.environmentId === env.id
                      );
                      const defectiveCount = envAllocations.filter(
                        (r) => !r.operational
                      ).length;

                      return (
                        <tr key={env.id} className="hover:bg-[#f8fafc]">
                          <td className="py-2.5 px-3 font-bold text-[#003366]">
                            {env.name}
                          </td>
                          <td className="py-2.5 px-3 text-[#495057]">
                            {env.description || 'â€”'}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {env.capacity || 'â€”'}
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => setInfoEnvId(env.id)}
                              className="inline-flex items-center gap-1.5 bg-[#003366] hover:bg-[#002244] text-white font-semibold px-2.5 py-1 rounded text-xs transition cursor-pointer"
                              title="Ver informaÃ§Ãµes e elementos associados ao ambiente"
                            >
                              <Info className="w-3.5 h-3.5" />
                              <span>Info ({envAllocations.length})</span>
                              {defectiveCount > 0 && (
                                <span className="px-1.5 py-0.1 rounded bg-red-500 text-white font-mono text-[10px]">
                                  !
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => startEditEnvironment(env)}
                              className="inline-flex items-center gap-1 text-[#003366] hover:underline font-semibold px-2 py-1 rounded hover:bg-[#eef1f4] cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => handleDeleteEnvironment(env.id)}
                              className="inline-flex items-center gap-1 text-red-700 hover:text-red-900 font-semibold px-2 py-1 rounded hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Excluir</span>
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

      {/* =================================================================== */}
      {/* ABA 3: ELEMENTOS & RECURSOS (CATÃLOGO SEM QUANTIDADE) */}
      {/* =================================================================== */}
      {activeTab === 'resources' && (
        <div className="space-y-5">
          {/* Painel 1: Cadastrar Elemento no CatÃ¡logo (SEM quantidade!) */}
          <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
            <div className="bg-[#003366] text-white px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase">
                {editingCatalogResId
                  ? 'Editar Nome do Elemento / Recurso'
                  : 'Cadastrar Novo Elemento / Equipamento no CatÃ¡logo'}
              </span>
            </div>

            <form onSubmit={handleSaveCatalogResource} className="p-5 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                <label className="text-xs font-bold text-[#333] md:text-right">
                  Nome / Marca do Elemento: *
                </label>
                <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={catalogResName}
                    onChange={(e) => setCatalogResName(e.target.value)}
                    placeholder="ex: Ar-Condicionado Split XPTO, Cadeira UniversitÃ¡ria, Projetor Epson"
                    required
                    className="flex-1 min-w-[240px] border border-[#ced4da] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#003366]"
                  />

                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-1.5 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {editingCatalogResId ? 'Salvar AlteraÃ§Ã£o' : 'Cadastrar Elemento'}
                    </span>
                  </button>

                  {editingCatalogResId && (
                    <button
                      type="button"
                      onClick={resetCatalogForm}
                      className="flex items-center gap-1 px-3 py-1.5 border border-[#ced4da] rounded text-xs text-[#495057] hover:bg-[#f1f5f9] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancelar</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div></div>
                <p className="md:col-span-2 text-[11px] text-[#6c757d]">
                  Cadastre aqui o tipo/modelo do equipamento (sem quantidade). A quantidade Ã© definida na hora de associar o elemento dentro de cada ambiente/sala.
                </p>
              </div>
            </form>
          </div>

          {/* Tabela do CatÃ¡logo de Elementos */}
          <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
            <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#b8c2cc] flex items-center justify-between">
              <span className="text-xs font-bold text-[#003366] uppercase">
                CatÃ¡logo de Elementos Cadastrados ({catalogResources.length})
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('environments')}
                className="text-xs text-[#003366] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Associar Elementos Ã s Salas em Ambientes & EspaÃ§os â†’</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f1f5f9] border-b border-[#b8c2cc]">
                    <th className="py-2.5 px-3 font-bold">Elemento / Equipamento</th>
                    <th className="py-2.5 px-3 font-bold">Ambientes Associados</th>
                    <th className="py-2.5 px-3 font-bold text-right">AÃ§Ãµes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {catalogResources.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-[#6c757d]">
                        Nenhum elemento cadastrado no catÃ¡logo atÃ© o momento.
                      </td>
                    </tr>
                  ) : (
                    catalogResources.map((r) => {
                      const roomUsages = allocatedResources.filter(
                        (a) => a.name.toLowerCase() === r.name.toLowerCase()
                      );
                      return (
                        <tr key={r.id} className="hover:bg-[#f8fafc]">
                          <td className="py-2.5 px-3 font-bold text-[#003366]">
                            {r.name}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[#495057]">
                            {roomUsages.length === 0
                              ? 'NÃ£o associado a nenhuma sala'
                              : `Associado em ${roomUsages.length} ambiente(s)`}
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-2">
                            <button
                              onClick={() => startEditCatalogResource(r)}
                              className="inline-flex items-center gap-1 text-[#003366] hover:underline font-semibold px-2 py-1 rounded hover:bg-[#eef1f4] cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Editar Nome</span>
                            </button>
                            <button
                              onClick={() => handleDeleteResource(r.id, false)}
                              className="inline-flex items-center gap-1 text-red-700 hover:text-red-900 font-semibold px-2 py-1 rounded hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Excluir</span>
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

      {/* =================================================================== */}
      {/* ABA 4: CONTROLE DE CHAVES (Permitido para ADMIN e OWNER) */}
      {/* =================================================================== */}
      {activeTab === 'keys' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
            <div className="bg-[#003366] text-white px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase">
                Vincular Nova Chave FÃ­sica a um Ambiente
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
                  CÃ³digo / Tag da Chave: *
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
                ClaviculÃ¡rio da Portaria ({keys.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f1f5f9] border-b border-[#b8c2cc]">
                    <th className="py-2.5 px-3 font-bold">CÃ³digo</th>
                    <th className="py-2.5 px-3 font-bold">Ambiente</th>
                    <th className="py-2.5 px-3 font-bold">SituaÃ§Ã£o na Portaria</th>
                    <th className="py-2.5 px-3 font-bold text-right">OperaÃ§Ã£o</th>
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
                              !isKeyInUseNow(k.id)
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {!isKeyInUseNow(k.id) ? 'DISPONÃVEL NO QUADRO' : 'EM USO NO MOMENTO'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-2">
                          <button
                            onClick={() => handleToggleKeyAvailability(k)}
                            className="px-2.5 py-1 bg-[#003366] hover:bg-[#002244] text-white rounded text-[11px] font-semibold transition cursor-pointer"
                          >
                            {k.available ? 'Registrar Retirada' : 'Registrar DevoluÃ§Ã£o'}
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
      {/* ABA MOD-06: RESERVA DE AMBIENTES (COM CHAVE EM USO) */}
      {/* =================================================================== */}
      {activeTab === 'reservations' && (
        <div className="space-y-5">
          {/* Assistente Inteligente de RecomendaÃ§Ã£o de Salas */}
          {user?.workspaceId && (
            <EnvironmentRecommendationAssistant
              workspaceId={user.workspaceId}
              catalogResources={catalogResources}
              onSelectEnvironment={(envId) => {
                setResvEnvId(envId);
                showSuccess('Ambiente selecionado a partir da recomendaÃ§Ã£o!');
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
            onRefresh={loadAllData}
            showSuccess={showSuccess}
            setError={setError}
            isAdminOrOwner={true}
            initialEnvironmentId={resvEnvId}
          />
        </div>
      )}

      {/* =================================================================== */}
      {/* SUBMENU MOD-06: HISTÃ“RICO DE RESERVAS COM FILTRO POR DATA */}
      {/* =================================================================== */}
      {activeTab === 'reservation_history' && (
        <div className="space-y-5">
          {/* Painel de Filtros por Data, Ambiente e SituaÃ§Ã£o */}
          <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
            <div className="bg-[#003366] text-white px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#99badd]" />
                <span className="text-xs font-bold uppercase">
                  Filtrar HistÃ³rico de Reservas por Data / PerÃ­odo
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
                  Ambiente / EspaÃ§o:
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
                  SituaÃ§Ã£o / Evento:
                </label>
                <select
                  value={histFilterAction}
                  onChange={(e) => setHistFilterAction(e.target.value)}
                  className="w-full bg-white border border-[#ced4da] rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#003366]"
                >
                  <option value="">Todas as situaÃ§Ãµes</option>
                  <option value="CREATED">Reservado</option>
                  <option value="COMPLETED">Chave Devolvida</option>
                  <option value="CANCELLED">Cancelada</option>
                  <option value="DELETED">ExcluÃ­da</option>
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

          {/* Tabela de HistÃ³rico de Reservas (tb_reservation_histories) */}
          <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
            <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#b8c2cc] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#003366]" />
                <span className="text-xs font-bold text-[#003366] uppercase">
                  HistÃ³rico de Reservas ({filteredReservationHistories.length})
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
                      HorÃ¡rio da SolicitaÃ§Ã£o
                    </th>
                    <th className="py-2.5 px-3 font-bold whitespace-nowrap">SituaÃ§Ã£o</th>
                    <th className="py-2.5 px-3 font-bold text-right whitespace-nowrap">AÃ§Ãµes</th>
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
                              label: 'EXCLUÃDA',
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

      {/* =================================================================== */}
      {/* ABA 5: SERVIDORES & USUÃRIOS (CRUD exclusivo para OWNER; Leitura para ADMIN) */}
      {/* =================================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-5">
          {!isOwner ? (
            <div className="bg-amber-50 border-l-4 border-amber-600 p-3.5 text-xs text-amber-900 flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>PermissÃ£o Restrita ao Gestor (OWNER):</strong> Como{' '}
                <code className="font-mono font-bold">ADMIN</code>, vocÃª pode gerenciar Ambientes, Elementos e Chaves, mas o credenciamento, ediÃ§Ã£o e exclusÃ£o de usuÃ¡rios sÃ£o exclusivos do perfil{' '}
                <code className="font-mono font-bold">OWNER</code>.
              </span>
            </div>
          ) : (
            <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
              <div className="bg-[#003366] text-white px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs font-bold uppercase">
                  {editingUserId
                    ? 'Editar Servidor / UsuÃ¡rio da Unidade'
                    : 'Credenciar Novo Servidor / Operador na Unidade'}
                </span>
              </div>

              <form onSubmit={handleSaveUser} className="p-5 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                  <label className="text-xs font-bold text-[#333] md:text-right">
                    Nome Completo: *
                  </label>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="ex: Kaio CÃ¢ndido Santiago"
                      required
                      className="w-full border border-[#ced4da] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#003366]"
                    />
                  </div>
                </div>

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
                    Senha & Perfil (Role): {editingUserId ? '' : '*'}
                  </label>
                  <div className="md:col-span-2 flex flex-wrap items-center gap-2">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={
                        editingUserId
                          ? 'Deixe em branco para manter a senha'
                          : 'MÃ­nimo de 6 caracteres'
                      }
                      minLength={6}
                      required={!editingUserId}
                      className="flex-1 min-w-[160px] border border-[#ced4da] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#003366]"
                    />
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as Role)}
                      className="border border-[#ced4da] rounded px-3 py-1.5 text-xs bg-white font-mono focus:outline-none focus:border-[#003366]"
                    >
                      <option value="COMMON">COMMON (Servidor/Consulta)</option>
                      <option value="ADMIN">ADMIN (Gestor de EspaÃ§os/Chaves)</option>
                      <option value="OWNER">OWNER (Gestor Total da Unidade)</option>
                    </select>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-5 py-1.5 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{editingUserId ? 'Salvar' : 'Credenciar'}</span>
                    </button>
                    {editingUserId && (
                      <button
                        type="button"
                        onClick={resetUserForm}
                        className="flex items-center gap-1 px-3 py-1.5 border border-[#ced4da] rounded text-xs text-[#495057] hover:bg-[#f1f5f9] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
            <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#b8c2cc]">
              <span className="text-xs font-bold text-[#003366] uppercase">
                UsuÃ¡rios Vinculados Ã  Unidade ({users.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f1f5f9] border-b border-[#b8c2cc]">
                    <th className="py-2.5 px-3 font-bold">Nome Completo</th>
                    <th className="py-2.5 px-3 font-bold">UsuÃ¡rio</th>
                    <th className="py-2.5 px-3 font-bold">E-mail</th>
                    <th className="py-2.5 px-3 font-bold">CPF</th>
                    <th className="py-2.5 px-3 font-bold">Perfil</th>
                    {isOwner && (
                      <th className="py-2.5 px-3 font-bold text-right">AÃ§Ãµes</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#f8fafc]">
                      <td className="py-2.5 px-3 font-bold text-[#003366]">
                        {u.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        {u.username}
                      </td>
                      <td className="py-2.5 px-3">{u.email}</td>
                      <td className="py-2.5 px-3 font-mono">{u.cpf || 'â€”'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-[#eef1f4] text-[#003366] font-mono font-bold text-[11px]">
                          {u.role}
                        </span>
                      </td>
                      {isOwner && (
                        <td className="py-2.5 px-3 text-right space-x-2">
                          <button
                            onClick={() => startEditUser(u)}
                            className="inline-flex items-center gap-1 text-[#003366] hover:underline font-semibold px-2 py-1 rounded hover:bg-[#eef1f4] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
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
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ABA MOD-07: CONFIGURAÇÕES DA CONTA & MEU PERFIL */}
      {/* =================================================================== */}
      {activeTab === 'settings' && (
        <UserProfileSettings />
      )}
    </SeiLayout>
  );
};
