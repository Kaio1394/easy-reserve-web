import React from 'react';
import { ReservaFacilLogo } from './ReservaFacilLogo';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  CalendarCheck,
  History,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MonitorSpeaker,
  Settings,
  Shield,
  Users,
} from 'lucide-react';

export type ActiveTab =
  | 'overview'
  | 'reservations'
  | 'reservation_history'
  | 'environments'
  | 'resources'
  | 'keys'
  | 'users'
  | 'settings';

interface SeiLayoutProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  showUsersTab?: boolean;
  children: React.ReactNode;
}

export const SeiLayout: React.FC<SeiLayoutProps> = ({
  activeTab,
  onSelectTab,
  showUsersTab = true,
  children,
}) => {
  const { user, workspace, workspaceSlug, workspaceModules, logout } = useAuth();

  const unitName = workspace?.name || user?.workspaceName || 'Unidade Vinculada';
  const unitSlug = workspaceSlug || 'sem-slug';

  // Módulos padrão obrigatórios (MOD-01 a MOD-06) sempre ficam habilitados se não houver restrição explícita (active === false)
  const disabledSlugs = new Set(
    workspaceModules.filter((wm) => !wm.active).map((wm) => wm.moduleSlug)
  );

  const isModuleEnabled = (code: string) => {
    return !disabledSlugs.has(code);
  };

  const allNavItems: {
    id: ActiveTab;
    label: string;
    code: string;
    icon: React.ReactNode;
    visible: boolean;
  }[] = [
    {
      id: 'overview',
      label: 'Painel de Consulta',
      code: 'MOD-01',
      icon: <LayoutDashboard className="w-4 h-4" />,
      visible: isModuleEnabled('MOD-01'),
    },
    {
      id: 'environments',
      label: 'Ambientes & Espaços',
      code: 'MOD-02',
      icon: <Building2 className="w-4 h-4" />,
      visible: isModuleEnabled('MOD-02'),
    },
    {
      id: 'resources',
      label: 'Elementos & Recursos',
      code: 'MOD-03',
      icon: <MonitorSpeaker className="w-4 h-4" />,
      visible: isModuleEnabled('MOD-03'),
    },
    {
      id: 'keys',
      label: 'Controle de Chaves',
      code: 'MOD-04',
      icon: <KeyRound className="w-4 h-4" />,
      visible: isModuleEnabled('MOD-04'),
    },
    {
      id: 'users',
      label: 'Servidores & Usuários',
      code: 'MOD-05',
      icon: <Users className="w-4 h-4" />,
      visible: showUsersTab && isModuleEnabled('MOD-05'),
    },
    {
      id: 'reservations',
      label: 'Reserva de Ambientes',
      code: 'MOD-06',
      icon: <CalendarCheck className="w-4 h-4" />,
      visible: isModuleEnabled('MOD-06'),
    },
    {
      id: 'settings',
      label: 'Configurações',
      code: 'MOD-07',
      icon: <Settings className="w-4 h-4" />,
      visible: isModuleEnabled('MOD-07'),
    },
  ];

  const navItems = allNavItems.filter((i) => i.visible);

  return (
    <div className="min-h-screen flex flex-col bg-[#eef1f4] text-[#1f2933]">
      {/* Barra Superior Institucional SEI */}
      <header className="bg-[#003366] text-white border-b-2 border-[#002244] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ReservaFacilLogo className="w-9 h-9 drop-shadow-sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold tracking-tight">
                  RESERVA FÁCIL
                </span>
                <span className="hidden md:inline-block text-[10px] font-mono bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded border border-emerald-400/30 font-bold">
                  SLUG: {unitSlug}
                </span>
              </div>
              <p className="text-[11px] text-[#b3c7dd] flex items-center gap-1.5">
                <span>Unidade Gestora:</span>
                <strong className="text-white">{unitName}</strong>
                <span className="font-mono text-[10px] bg-[#002244] text-[#99badd] px-1.5 py-0.2 rounded">
                  /{unitSlug}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold">
                  {user?.name || user?.username}
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                    user?.role === 'OWNER'
                      ? 'bg-amber-400/20 text-amber-200 border-amber-300/40'
                      : user?.role === 'ADMIN'
                      ? 'bg-sky-400/20 text-sky-200 border-sky-300/40'
                      : 'bg-slate-400/20 text-slate-200 border-slate-300/40'
                  }`}
                >
                  {user?.role}
                </span>
              </div>
              <span className="text-[11px] text-[#b3c7dd]">{user?.email}</span>
            </div>

            <button
              onClick={logout}
              title="Encerrar Sessão"
              className="flex items-center gap-1.5 bg-[#002244] hover:bg-red-900/80 text-white border border-white/15 px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Corpo com Menu Lateral Estilo SEI + Área de Trabalho */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sidebar SEI */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden">
            <div className="bg-[#f8f9fa] px-3.5 py-2.5 border-b border-[#b8c2cc] flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#003366] uppercase tracking-wider">
                Menu de Operações
              </span>
              <Shield className="w-3.5 h-3.5 text-[#003366]" />
            </div>

            <nav className="divide-y divide-[#e2e8f0]">
              {navItems.map((item) => {
                const isReservationGroup =
                  item.id === 'reservations' &&
                  (activeTab === 'reservations' || activeTab === 'reservation_history');
                const active = activeTab === item.id || isReservationGroup;

                return (
                  <div key={item.id}>
                    <button
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left text-xs transition cursor-pointer ${
                        active
                          ? 'bg-[#003366] text-white font-bold'
                          : 'text-[#333] hover:bg-[#f1f5f9]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          active
                            ? 'bg-[#002244] text-[#b3c7dd]'
                            : 'bg-[#eef1f4] text-[#6c757d]'
                        }`}
                      >
                        {item.code}
                      </span>
                    </button>

                    {item.id === 'reservations' && (
                      <div className="bg-[#f8fafc] border-t border-[#e2e8f0] divide-y divide-[#eef1f4]">
                        <button
                          type="button"
                          onClick={() => onSelectTab('reservations')}
                          className={`w-full pl-8 pr-3.5 py-2 flex items-center justify-between text-left text-[11px] transition cursor-pointer ${
                            activeTab === 'reservations'
                              ? 'bg-[#e6eef7] text-[#003366] font-bold border-l-4 border-[#003366]'
                              : 'text-[#495057] hover:bg-[#f1f5f9]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <CalendarCheck className="w-3.5 h-3.5" />
                            <span>Reservas Ativas & Nova</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectTab('reservation_history')}
                          className={`w-full pl-8 pr-3.5 py-2 flex items-center justify-between text-left text-[11px] transition cursor-pointer ${
                            activeTab === 'reservation_history'
                              ? 'bg-[#e6eef7] text-[#003366] font-bold border-l-4 border-[#003366]'
                              : 'text-[#495057] hover:bg-[#f1f5f9]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <History className="w-3.5 h-3.5" />
                            <span>Histórico de Reservas</span>
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Card de Identificação da Unidade & Sessão */}
          <div className="bg-white border border-[#b8c2cc] rounded p-3.5 text-xs space-y-2">
            <div className="pb-1.5 border-b border-[#e2e8f0] font-bold text-[#003366] uppercase text-[11px]">
              Unidade & Credencial
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6c757d]">Workspace Slug:</span>
              <span className="font-mono font-bold text-white bg-[#003366] px-2 py-0.5 rounded text-[11px]">
                {unitSlug}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6c757d]">Unidade:</span>
              <span className="font-semibold text-right truncate max-w-[140px]" title={unitName}>
                {unitName}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#f1f5f9]">
              <span className="text-[#6c757d]">Operador:</span>
              <span className="font-semibold text-right">
                {user?.name || user?.username}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6c757d]">Nível de Acesso:</span>
              <span className="font-mono font-bold text-[#003366]">{user?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6c757d]">CPF:</span>
              <span className="font-mono">{user?.cpf || 'Não informado'}</span>
            </div>
          </div>
        </aside>

        {/* Área Principal */}
        <main className="lg:col-span-9">{children}</main>
      </div>

      {/* Rodapé Institucional */}
      <footer className="bg-white border-t border-[#b8c2cc] py-3 px-4 text-xs text-[#6c757d]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            RESERVA FÁCIL — Gestão de Espaços e Controle de Chaves
          </span>
          <span className="font-mono text-[11px]">
            WORKSPACE: {unitSlug} • PERFIL: {user?.role}
          </span>
        </div>
      </footer>
    </div>
  );
};
