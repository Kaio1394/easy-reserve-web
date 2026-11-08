import React, { useState } from 'react';
import { api } from '../services/api';
import type {
  EnvironmentRecommendationItemDto,
  EnvironmentResourceGetDto,
} from '../types/api';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  Sliders,
  Sparkles,
  Users,
  X,
  XCircle,
} from 'lucide-react';

interface EnvironmentRecommendationAssistantProps {
  workspaceId: string;
  catalogResources: EnvironmentResourceGetDto[];
  onSelectEnvironment: (environmentId: string) => void;
  initialStartTime?: string;
  initialEndTime?: string;
}

const WEIGHT_PRESETS = [
  { label: 'Baixa (1)', value: 1, desc: 'Desejável' },
  { label: 'Média (3)', value: 3, desc: 'Importante' },
  { label: 'Alta (5)', value: 5, desc: 'Prioritária' },
  { label: 'Muito Alta (8)', value: 8, desc: 'Muito Relevante' },
  { label: 'Crítica (10)', value: 10, desc: 'Indispensável' },
];

export const EnvironmentRecommendationAssistant: React.FC<
  EnvironmentRecommendationAssistantProps
> = ({
  workspaceId,
  catalogResources,
  onSelectEnvironment,
  initialStartTime = '',
  initialEndTime = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [resourceWeights, setResourceWeights] = useState<Record<string, number>>({});
  const [customResourceName, setCustomResourceName] = useState('');

  const [minCapacity, setMinCapacity] = useState('');
  const [recStartTime, setRecStartTime] = useState(initialStartTime);
  const [recEndTime, setRecEndTime] = useState(initialEndTime);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<
    EnvironmentRecommendationItemDto[]
  >([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Alterna seleção de recurso (adiciona com peso padrão 5 ou remove)
  const toggleResource = (name: string) => {
    if (selectedResources.includes(name)) {
      setSelectedResources((prev) => prev.filter((r) => r !== name));
      setResourceWeights((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    } else {
      setSelectedResources((prev) => [...prev, name]);
      setResourceWeights((prev) => ({
        ...prev,
        [name]: prev[name] ?? 5,
      }));
    }
  };

  // Ajusta peso de um recurso específico
  const setWeightForResource = (name: string, weight: number) => {
    const val = Math.max(1, Math.min(10, weight));
    setResourceWeights((prev) => ({
      ...prev,
      [name]: val,
    }));
  };

  // Adiciona recurso personalizado
  const handleAddCustomResource = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customResourceName.trim();
    if (!trimmed) return;
    if (!selectedResources.includes(trimmed)) {
      setSelectedResources((prev) => [...prev, trimmed]);
      setResourceWeights((prev) => ({ ...prev, [trimmed]: 5 }));
    }
    setCustomResourceName('');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const results = await api.environments.recommend({
        workspaceId,
        requiredResources: selectedResources.length > 0 ? selectedResources : undefined,
        resourceWeights: Object.keys(resourceWeights).length > 0 ? resourceWeights : undefined,
        minCapacity: minCapacity ? Number(minCapacity) : undefined,
        startTime: recStartTime || undefined,
        endTime: recEndTime || undefined,
      });
      setRecommendations(results);
      setHasSearched(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar recomendações de ambientes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border-2 border-[#003366] rounded overflow-hidden shadow-xs mb-4">
      {/* Botão de Expansão / Header do Assistente */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#002244] hover:bg-[#001933] text-white px-4 py-3 flex items-center justify-between transition cursor-pointer"
      >
        <div className="flex items-center gap-2.5 text-left">
          <div className="w-7 h-7 rounded-full bg-amber-400 text-[#002244] flex items-center justify-center font-bold shadow-xs">
            <Sparkles className="w-4 h-4 fill-amber-400 text-[#002244]" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold tracking-wide flex items-center gap-2">
              Assistente Inteligente de Recomendação de Salas
              <span className="text-[10px] bg-amber-400/20 text-amber-200 border border-amber-400/30 px-2 py-0.2 rounded font-mono font-semibold">
                PESOS PERSONALIZADOS PELO USUÁRIO
              </span>
            </span>
            <p className="text-[11px] text-[#b3c7dd]">
              Escolha os recursos que precisa e defina o peso de importância de cada um para você
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#99badd]">
          <span>{isOpen ? 'Ocultar Assistente' : 'Abrir Assistente'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-5 space-y-4 bg-[#f8fafc]">
          <form onSubmit={handleSearch} className="space-y-4 bg-white border border-[#b8c2cc] rounded p-4">
            {/* Recursos Disponíveis no Catálogo */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#003366]">
                  1. Selecione os elementos e equipamentos necessários para sua atividade:
                </label>
                <span className="text-[10px] text-[#6c757d]">
                  Clique para marcar ou desmarcar
                </span>
              </div>

              {catalogResources.length === 0 ? (
                <p className="text-xs text-[#6c757d] italic">
                  Nenhum recurso cadastrado no catálogo da unidade.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {catalogResources.map((res) => {
                    const isSelected = selectedResources.includes(res.name);
                    const weightVal = resourceWeights[res.name] ?? 5;
                    return (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => toggleResource(res.name)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#003366] text-white border-[#003366] shadow-xs'
                            : 'bg-white text-[#334155] border-[#cbd5e1] hover:border-[#003366]'
                        }`}
                      >
                        <span>{res.name}</span>
                        {isSelected && (
                          <span className="text-[10px] font-mono font-bold bg-amber-400 text-[#002244] px-1.5 py-0.2 rounded">
                            Peso {weightVal}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Inclusão de Recurso Personalizado */}
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="text"
                  value={customResourceName}
                  onChange={(e) => setCustomResourceName(e.target.value)}
                  placeholder="Adicionar outro item não listado (ex: Microfone sem fio)..."
                  className="max-w-xs border border-[#ced4da] rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#003366]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomResource}
                  className="px-2.5 py-1 bg-[#eef1f4] hover:bg-[#e2e8f0] text-[#003366] font-semibold text-xs border border-[#ced4da] rounded flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

            {/* Configuração de Pesos Individuais dos Recursos Selecionados */}
            {selectedResources.length > 0 && (
              <div className="bg-[#f0f4f9] border border-[#c5daf3] rounded p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#003366]" />
                    <span className="text-xs font-bold text-[#003366] uppercase">
                      Defina o peso de importância de cada item para a sua reserva:
                    </span>
                  </div>
                  <span className="text-[10px] text-[#475569]">
                    1 = Baixa • 5 = Média/Alta • 10 = Indispensável
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                  {selectedResources.map((resName) => {
                    const currentWeight = resourceWeights[resName] ?? 5;

                    return (
                      <div
                        key={resName}
                        className="bg-white border border-[#ced4da] rounded p-2.5 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[#003366] truncate">{resName}</div>
                          <div className="text-[10px] text-[#6c757d] font-mono">
                            Peso configurado: <strong>{currentWeight} / 10</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Botões de presets rápidos */}
                          <div className="inline-flex rounded border border-[#ced4da] overflow-hidden">
                            {WEIGHT_PRESETS.map((preset) => (
                              <button
                                key={preset.value}
                                type="button"
                                onClick={() => setWeightForResource(resName, preset.value)}
                                title={preset.desc}
                                className={`px-2 py-0.5 text-[10px] font-bold font-mono transition cursor-pointer ${
                                  currentWeight === preset.value
                                    ? 'bg-[#003366] text-white'
                                    : 'bg-white hover:bg-[#eef1f4] text-[#475569]'
                                }`}
                              >
                                {preset.value}
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleResource(resName)}
                            title="Remover recurso"
                            className="p-1 text-[#94a3b8] hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Capacidade e Horários */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#f1f5f9]">
              <div>
                <label className="text-xs font-bold text-[#333] block mb-1">
                  2. Capacidade Mínima de Lugares (opcional):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={minCapacity}
                    onChange={(e) => setMinCapacity(e.target.value)}
                    placeholder="ex: 30 pessoas"
                    className="w-full bg-white border border-[#ced4da] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#003366]"
                  />
                  <Users className="w-3.5 h-3.5 text-[#94a3b8] absolute right-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#333] block mb-1">
                  Início Previsto (opcional):
                </label>
                <input
                  type="datetime-local"
                  value={recStartTime}
                  onChange={(e) => setRecStartTime(e.target.value)}
                  className="w-full bg-white border border-[#ced4da] rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-[#003366]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#333] block mb-1">
                  Término Previsto (opcional):
                </label>
                <input
                  type="datetime-local"
                  value={recEndTime}
                  onChange={(e) => setRecEndTime(e.target.value)}
                  className="w-full bg-white border border-[#ced4da] rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-[#003366]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#6c757d]">
                O algoritmo calcula a compatibilidade ponderada de cada sala com base exatamente nos pesos que você atribuiu acima.
              </span>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#003366] hover:bg-[#002244] disabled:opacity-60 text-white font-bold rounded text-xs transition cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{loading ? 'Analisando Ambientes...' : 'Calcular e Sugerir Salas'}</span>
              </button>
            </div>
          </form>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-700 p-3 text-xs text-red-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Lista de Resultados e Recomendações */}
          {hasSearched && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#003366] uppercase tracking-wide">
                  Ambientes Recomendados ({recommendations.length})
                </span>
                <span className="text-[11px] text-[#6c757d]">
                  Ordenado por disponibilidade e pontuação dos seus pesos
                </span>
              </div>

              {recommendations.length === 0 ? (
                <div className="p-5 text-center text-xs text-[#6c757d] bg-white border border-[#b8c2cc] rounded">
                  Nenhum ambiente encontrado para os critérios selecionados.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recommendations.map((rec, index) => {
                    const isTop1 = index === 0 && rec.available;
                    return (
                      <div
                        key={rec.environmentId}
                        className={`bg-white border rounded p-4 transition ${
                          isTop1
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                            : rec.available
                            ? 'border-[#b8c2cc]'
                            : 'border-red-200 bg-red-50/20 opacity-80'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {isTop1 && (
                              <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                                <Sparkles className="w-3 h-3" />
                                #1 MAIS RECOMENDADA
                              </span>
                            )}
                            <h4 className="text-xs sm:text-sm font-bold text-[#003366] flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-[#003366]" />
                              {rec.environmentName}
                            </h4>
                            {rec.capacity && (
                              <span className="text-[11px] font-mono text-[#6c757d] bg-[#f1f5f9] px-2 py-0.5 rounded border border-[#e2e8f0]">
                                {rec.capacity} lugares
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded font-mono border ${
                                rec.available
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-red-50 text-red-800 border-red-300'
                              }`}
                            >
                              {rec.available ? 'LIVRE / DISPONÍVEL' : 'INDISPONÍVEL / OCUPADA'}
                            </span>
                            <div className="text-right">
                              <span className="text-xs font-mono font-bold text-[#003366]">
                                {rec.matchPercentage}% de Compatibilidade
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Barra de Progresso de Compatibilidade */}
                        <div className="w-full bg-[#e2e8f0] rounded-full h-1.5 mb-2.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              rec.matchPercentage >= 80
                                ? 'bg-emerald-500'
                                : rec.matchPercentage >= 50
                                ? 'bg-[#003366]'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, rec.matchPercentage)}%` }}
                          />
                        </div>

                        <p className="text-[11px] text-[#475569] mb-2">{rec.reason}</p>

                        {/* Recursos presentes vs ausentes */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs">
                          {rec.matchedResources.map((m, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-medium"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {m}
                            </span>
                          ))}
                          {rec.missingResources.map((m, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded text-[10px]"
                            >
                              <XCircle className="w-3 h-3 text-slate-400" />
                              Falta: {m}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#f1f5f9]">
                          <span className="text-[10px] text-[#6c757d]">
                            Portaria: {rec.keyStatus}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectEnvironment(rec.environmentId);
                              setIsOpen(false);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded text-xs transition cursor-pointer"
                          >
                            <span>Selecionar este Ambiente</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
