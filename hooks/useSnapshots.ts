import { useState, useEffect } from 'react';
import { ScenarioType, SimulationParams } from '../types';

export interface Snapshot {
  id: string;
  name: string;
  description: string;
  timestamp: number;
  paramsMap: Record<ScenarioType, SimulationParams>;
  activeScenario: ScenarioType;
}

const SNAPSHOTS_STORAGE_KEY = 'tkx_snapshots';
const MAX_SNAPSHOTS = 10; // Limita a 10 versões salvas

export const useSnapshots = () => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>(() => {
    const saved = localStorage.getItem(SNAPSHOTS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Erro ao carregar snapshots:', e);
        return [];
      }
    }
    return [];
  });

  // Salva lista de snapshots no localStorage automaticamente
  useEffect(() => {
    localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(snapshots));
  }, [snapshots]);

  // Criar novo snapshot
  const saveSnapshot = (
    name: string,
    paramsMap: Record<ScenarioType, SimulationParams>,
    activeScenario: ScenarioType,
    description: string = ''
  ) => {
    const newSnapshot: Snapshot = {
      id: `snapshot_${Date.now()}`,
      name,
      description,
      timestamp: Date.now(),
      paramsMap,
      activeScenario
    };

    // Adiciona no início (mais recente primeiro)
    const updated = [newSnapshot, ...snapshots].slice(0, MAX_SNAPSHOTS);
    setSnapshots(updated);
    return newSnapshot;
  };

  // Deletar snapshot
  const deleteSnapshot = (id: string) => {
    setSnapshots(prev => prev.filter(s => s.id !== id));
  };

  // Renomear snapshot
  const renameSnapshot = (id: string, newName: string, newDescription: string = '') => {
    setSnapshots(prev =>
      prev.map(s =>
        s.id === id ? { ...s, name: newName, description: newDescription } : s
      )
    );
  };

  // Exportar todos os snapshots como JSON
  const exportSnapshots = () => {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      snapshots
    };
    return JSON.stringify(data, null, 2);
  };

  // Exportar snapshot único como JSON
  const exportSingleSnapshot = (id: string) => {
    const snapshot = snapshots.find(s => s.id === id);
    if (!snapshot) return null;
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      snapshot
    };
    return JSON.stringify(data, null, 2);
  };

  // Importar snapshots de JSON
  const importSnapshots = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.snapshots && Array.isArray(data.snapshots)) {
        // Adiciona snapshots importados, limitando ao máximo
        const merged = [...data.snapshots, ...snapshots].slice(0, MAX_SNAPSHOTS);
        setSnapshots(merged);
        return true;
      } else if (data.snapshot) {
        // Snapshot único
        const merged = [data.snapshot, ...snapshots].slice(0, MAX_SNAPSHOTS);
        setSnapshots(merged);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Erro ao importar snapshots:', e);
      return false;
    }
  };

  // Obter snapshot por ID
  const getSnapshot = (id: string) => snapshots.find(s => s.id === id);

  // Listar snapshots ordenados por data (mais recente primeiro)
  const listSnapshots = () => [...snapshots].sort((a, b) => b.timestamp - a.timestamp);

  // Duplicar snapshot existente
  const duplicateSnapshot = (id: string) => {
    const original = snapshots.find(s => s.id === id);
    if (!original) return null;

    const duplicated: Snapshot = {
      ...original,
      id: `snapshot_${Date.now()}`,
      name: `${original.name} (cópia)`,
      timestamp: Date.now()
    };

    const updated = [duplicated, ...snapshots].slice(0, MAX_SNAPSHOTS);
    setSnapshots(updated);
    return duplicated;
  };

  // Limpar todos os snapshots
  const clearAllSnapshots = () => {
    setSnapshots([]);
  };

  return {
    snapshots,
    saveSnapshot,
    deleteSnapshot,
    renameSnapshot,
    exportSnapshots,
    exportSingleSnapshot,
    importSnapshots,
    getSnapshot,
    listSnapshots,
    duplicateSnapshot,
    clearAllSnapshots
  };
};
