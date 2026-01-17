import React, { useState } from 'react';
import { X, Save, Trash2, Copy, Download, Upload, Eye } from 'lucide-react';
import { Snapshot } from '../hooks/useSnapshots';
import { ScenarioType } from '../types';

interface SnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: Snapshot[];
  onSaveSnapshot: (name: string, description: string) => void;
  onLoadSnapshot: (snapshot: Snapshot) => void;
  onDeleteSnapshot: (id: string) => void;
  onRenameSnapshot: (id: string, newName: string, newDescription: string) => void;
  onDuplicateSnapshot: (id: string) => void;
  onExportSnapshot: (id: string) => string | null;
  onExportAll: () => string;
  onImport: (jsonString: string) => boolean;
  currentParamsMap: Record<ScenarioType, any>;
  currentScenario: ScenarioType;
}

const SCENARIO_LABEL: Record<ScenarioType, string> = {
  [ScenarioType.REALISTA]: 'Realista',
  [ScenarioType.PESSIMISTA]: 'Pessimista',
  [ScenarioType.OTIMISTA]: 'Otimista',
};

const SnapshotModal: React.FC<SnapshotModalProps> = ({
  isOpen,
  onClose,
  snapshots,
  onSaveSnapshot,
  onLoadSnapshot,
  onDeleteSnapshot,
  onRenameSnapshot,
  onDuplicateSnapshot,
  onExportSnapshot,
  onExportAll,
  onImport,
  currentParamsMap,
  currentScenario
}) => {
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [newSnapshotDesc, setNewSnapshotDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const handleSave = () => {
    if (newSnapshotName.trim()) {
      onSaveSnapshot(newSnapshotName.trim(), newSnapshotDesc.trim());
      setNewSnapshotName('');
      setNewSnapshotDesc('');
    }
  };

  const handleExport = (id: string) => {
    const json = onExportSnapshot(id);
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tkx-snapshot-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleExportAll = () => {
    const json = onExportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tkx-snapshots-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          const success = onImport(event.target.result);
          if (success) {
            alert('✅ Snapshots importados com sucesso!');
          } else {
            alert('❌ Erro ao importar arquivo JSON');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleRenameSubmit = (id: string) => {
    if (editName.trim()) {
      onRenameSnapshot(id, editName.trim(), editDesc.trim());
      setEditingId(null);
      setEditName('');
      setEditDesc('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/40 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700/40 p-6 flex justify-between items-center">
          <h2 className="text-xl font-black text-yellow-400 tracking-tight">Gerenciador de Snapshots</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Seção: Salvar Novo Snapshot */}
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-black text-green-400 uppercase tracking-[0.08em]">
              💾 Salvar Novo Snapshot
            </h3>
            <input
              type="text"
              placeholder="Nome do snapshot (ex: Cenário Base)"
              value={newSnapshotName}
              onChange={(e) => setNewSnapshotName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-yellow-400"
            />
            <textarea
              placeholder="Descrição (opcional)"
              value={newSnapshotDesc}
              onChange={(e) => setNewSnapshotDesc(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-yellow-400 h-16 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Salvar Snapshot
              </button>
              <button
                onClick={handleExportAll}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Exportar Tudo
              </button>
              <button
                onClick={handleImport}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={18} />
                Importar
              </button>
            </div>
          </div>

          {/* Seção: Lista de Snapshots */}
          <div className="space-y-2">
            <h3 className="text-sm font-black text-yellow-400 uppercase tracking-[0.08em]">
              📋 Snapshots Salvos ({snapshots.length})
            </h3>
            {snapshots.length === 0 ? (
              <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-6 text-center text-slate-400">
                <p>Nenhum snapshot salvo ainda. Crie seu primeiro snapshot acima!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-4 hover:border-slate-600/60 transition-all"
                  >
                    {editingId === snap.id ? (
                      // Modo edição
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-100 text-sm focus:outline-none focus:border-yellow-400"
                        />
                        <textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-100 text-sm focus:outline-none focus:border-yellow-400 h-12 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRenameSubmit(snap.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-1 rounded transition-colors"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white text-sm py-1 rounded transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Modo visualização
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-100">{snap.name}</h4>
                            {snap.description && (
                              <p className="text-xs text-slate-400 mt-1">{snap.description}</p>
                            )}
                            <p className="text-[10px] text-slate-500 mt-2">
                              {new Date(snap.timestamp).toLocaleString('pt-BR')} • Cenário: {SCENARIO_LABEL[snap.activeScenario]}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-slate-700/40">
                          <button
                            onClick={() => onLoadSnapshot(snap)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 rounded transition-colors flex items-center justify-center gap-1"
                          >
                            <Eye size={14} />
                            Carregar
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(snap.id);
                              setEditName(snap.name);
                              setEditDesc(snap.description);
                            }}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs py-1.5 rounded transition-colors"
                          >
                            Renomear
                          </button>
                          <button
                            onClick={() => onDuplicateSnapshot(snap.id)}
                            className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs py-1.5 rounded transition-colors flex items-center justify-center gap-1"
                          >
                            <Copy size={14} />
                            Duplicar
                          </button>
                          <button
                            onClick={() => handleExport(snap.id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 rounded transition-colors flex items-center justify-center gap-1"
                          >
                            <Download size={14} />
                            Baixar
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Tem certeza que deseja deletar este snapshot?')) {
                                onDeleteSnapshot(snap.id);
                              }
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1.5 rounded transition-colors flex items-center justify-center gap-1"
                          >
                            <Trash2 size={14} />
                            Deletar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gradient-to-t from-slate-900 to-slate-800 border-t border-slate-700/40 p-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SnapshotModal;
