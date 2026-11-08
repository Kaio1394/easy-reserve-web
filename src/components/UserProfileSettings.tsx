import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  Save,
  Shield,
  User,
  UserCheck,
} from 'lucide-react';

export const UserProfileSettings: React.FC = () => {
  const { user, workspace, updateCurrentUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [cpf, setCpf] = useState(user?.cpf || '');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password && password.length < 6) {
      setErrorMsg('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password && password !== confirmPassword) {
      setErrorMsg('A confirmação da nova senha não confere.');
      return;
    }

    setLoading(true);

    try {
      const updated = await api.users.updateProfile({
        name: name.trim() || undefined,
        username: username.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        cpf: cpf.trim() || undefined,
        password: password || undefined,
      });

      updateCurrentUser(updated);
      setPassword('');
      setConfirmPassword('');
      setSuccessMsg('Seu perfil foi atualizado com sucesso!');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atualizar dados do perfil.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'OWNER':
        return { label: 'PROPRIETÁRIO / DIRETORIA (OWNER)', cls: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'ADMIN':
        return { label: 'ADMINISTRADOR DA UNIDADE (ADMIN)', cls: 'bg-blue-100 text-[#003366] border-blue-300' };
      default:
        return { label: 'SERVIDOR / USUÁRIO (COMMON)', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Cabeçalho do Card */}
      <div className="bg-white border border-[#b8c2cc] rounded overflow-hidden shadow-xs">
        <div className="bg-[#003366] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-[#99badd]" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Configurações da Conta & Meu Perfil (MOD-07)
              </h2>
              <p className="text-[11px] text-[#b3c7dd]">
                Gerencie seus dados cadastrais, e-mail institucional e senha de acesso.
              </p>
            </div>
          </div>
        </div>

        {/* Resumo do Usuário Logado */}
        <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#003366] text-white flex items-center justify-center font-bold text-base shadow-xs uppercase">
              {user?.name ? user.name.slice(0, 2) : 'US'}
            </div>
            <div>
              <div className="text-sm font-bold text-[#003366]">{user?.name || 'Servidor'}</div>
              <div className="text-xs text-[#6c757d] font-mono">@{user?.username || 'usuario'}</div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5 text-xs">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold border ${roleInfo.cls}`}>
              <Shield className="w-3 h-3 mr-1" />
              {roleInfo.label}
            </span>
            <span className="text-[#6c757d] flex items-center gap-1 font-semibold text-[11px]">
              <Building2 className="w-3.5 h-3.5 text-[#003366]" />
              {workspace?.name || user?.workspaceName || 'Unidade Vinculada'}
            </span>
          </div>
        </div>

        {/* Alertas */}
        {errorMsg && (
          <div className="m-4 mb-0 bg-red-50 border-l-4 border-red-700 p-3 text-xs text-red-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Atenção:</span> {errorMsg}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="m-4 mb-0 bg-emerald-50 border-l-4 border-emerald-600 p-3 text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* Formulário de Edição */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[#003366] uppercase mb-3 pb-1 border-b border-[#e2e8f0]">
              Dados Cadastrais
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#333] block mb-1">
                  Nome Completo: *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-[#6c757d] absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-8 pr-3 py-1.5 border border-[#ced4da] rounded text-xs focus:outline-none focus:border-[#003366]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#333] block mb-1">
                  Nome de Usuário (Login): *
                </label>
                <div className="relative">
                  <span className="text-[#6c757d] absolute left-2.5 top-2 pointer-events-none font-mono text-xs">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full pl-7 pr-3 py-1.5 border border-[#ced4da] rounded text-xs font-mono focus:outline-none focus:border-[#003366]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#333] block mb-1">
                  E-mail Institucional: *
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[#6c757d] absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-8 pr-3 py-1.5 border border-[#ced4da] rounded text-xs focus:outline-none focus:border-[#003366]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#333] block mb-1">
                  Telefone / Ramal / WhatsApp:
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-[#6c757d] absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full pl-8 pr-3 py-1.5 border border-[#ced4da] rounded text-xs font-mono focus:outline-none focus:border-[#003366]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#333] block mb-1">
                  CPF (Cadastro de Pessoa Física):
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-1.5 border border-[#ced4da] rounded text-xs font-mono focus:outline-none focus:border-[#003366]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#333] block mb-1">
                  Unidade / Lotação:
                </label>
                <input
                  type="text"
                  value={workspace?.name || user?.workspaceName || 'Unidade Principal'}
                  disabled
                  className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded text-xs bg-[#f1f5f9] text-[#64748b] cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-xs font-bold text-[#003366] uppercase mb-1 pb-1 border-b border-[#e2e8f0] flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-[#003366]" />
              <span>Segurança & Alteração de Senha</span>
            </h3>
            <p className="text-[11px] text-[#6c757d] mb-3">
              Deixe os campos abaixo em branco caso não queira alterar sua senha atual.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#333] block mb-1">
                  Nova Senha:
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-[#6c757d] absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-8 pr-3 py-1.5 border border-[#ced4da] rounded text-xs focus:outline-none focus:border-[#003366]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#333] block mb-1">
                  Confirmar Nova Senha:
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-[#6c757d] absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full pl-8 pr-3 py-1.5 border border-[#ced4da] rounded text-xs focus:outline-none focus:border-[#003366]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="pt-4 border-t border-[#e2e8f0] flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-6 py-2 bg-[#003366] hover:bg-[#002244] disabled:opacity-50 text-white font-bold rounded text-xs uppercase tracking-wider transition shadow-xs cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando Alterações...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Alterações do Perfil</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
