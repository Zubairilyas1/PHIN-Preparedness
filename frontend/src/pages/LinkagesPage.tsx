import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../api';
import { FormField } from '../components/FormField';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Select } from '../components/Select';
import { Plus, Edit, Trash2, Loader2, Search, ChevronUp, ChevronDown as ChevronDownIcon, MoreHorizontal, GitBranch, Link2, Target, Network, Layout, Grid, Eye, Settings, Filter, Shield, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const linkageSchema = z.object({
  source_entity_type: z.string().min(1, 'Source entity type is required'),
  source_entity_id: z.string().min(1, 'Source entity ID is required'),
  target_entity_type: z.string().min(1, 'Target entity type is required'),
  target_entity_id: z.string().min(1, 'Target entity ID is required'),
  relationship_type: z.string().min(1, 'Relationship type is required'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  confidence: z.enum(['confirmed', 'probable', 'suspected']).optional(),
  notes: z.string().optional(),
});

type LinkageForm = z.infer<typeof linkageSchema>;

interface Linkage {
  id: number;
  source_entity_type: string;
  source_entity_id: string;
  target_entity_type: string;
  target_entity_id: string;
  relationship_type: string;
  start_date: string | null;
  end_date: string | null;
  confidence: string | null;
  notes: string | null;
  created_at: string;
}

const ENTITY_COLORS: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  person: { color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-900/30', icon: <Target className="w-3.5 h-3.5" /> },
  location: { color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-900/30', icon: <Link2 className="w-3.5 h-3.5" /> },
  event: { color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/30', icon: <GitBranch className="w-3.5 h-3.5" /> },
  specimen: { color: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-50 dark:bg-teal-900/30', icon: <Network className="w-3.5 h-3.5" /> },
  organization: { color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-50 dark:bg-indigo-900/30', icon: <Layout className="w-3.5 h-3.5" /> },
};

const CONFIDENCE_CONFIG: Record<string, { label: string; style: string }> = {
  confirmed: { label: 'Confirmed', style: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' },
  probable: { label: 'Probable', style: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 border-dashed' },
  suspected: { label: 'Suspected', style: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20 border-dotted' },
};

const ENTITY_TYPES = [
  { value: 'person', label: 'Person' },
  { value: 'location', label: 'Location' },
  { value: 'event', label: 'Event' },
  { value: 'specimen', label: 'Specimen' },
  { value: 'organization', label: 'Organization' },
];

export function LinkagesPage() {
  const [linkages, setLinkages] = useState<Linkage[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLinkage, setEditingLinkage] = useState<Linkage | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Linkage | null>(null);
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'graph'>('table');
  const [filters, setFilters] = useState({ sourceType: '', targetType: '', confidence: '' });
  const [selectedLinkages, setSelectedLinkages] = useState<Set<number>>(new Set());

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<LinkageForm>({
    resolver: zodResolver(linkageSchema),
    defaultValues: {
      source_entity_type: 'person',
      source_entity_id: '',
      target_entity_type: 'location',
      target_entity_id: '',
      relationship_type: '',
      start_date: '',
      end_date: '',
      confidence: 'confirmed',
      notes: '',
    },
  });

  const fetchLinkages = async () => {
    setLoading(true);
    try {
      const response = await api.get('/linkages');
      setLinkages(response.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to fetch linkages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinkages();
  }, []);

  const handleSort = (key: string) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const filteredAndSortedLinkages = useMemo(() => {
    let result = [...linkages];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(l =>
        l.source_entity_type.toLowerCase().includes(term) ||
        l.source_entity_id.toLowerCase().includes(term) ||
        l.target_entity_type.toLowerCase().includes(term) ||
        l.target_entity_id.toLowerCase().includes(term) ||
        l.relationship_type.toLowerCase().includes(term)
      );
    }

    if (filters.sourceType) {
      result = result.filter(l => l.source_entity_type === filters.sourceType);
    }
    if (filters.targetType) {
      result = result.filter(l => l.target_entity_type === filters.targetType);
    }
    if (filters.confidence) {
      result = result.filter(l => l.confidence === filters.confidence);
    }

    result.sort((a, b) => {
      const aVal = a[sort.key as keyof Linkage];
      const bVal = b[sort.key as keyof Linkage];
      if (aVal === undefined || bVal === undefined) return 0;
      const comparison = String(aVal).localeCompare(String(bVal));
      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [linkages, searchTerm, filters, sort]);

  const paginatedLinkages = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAndSortedLinkages.slice(start, start + pageSize);
  }, [filteredAndSortedLinkages, page, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedLinkages.length / pageSize) || 1;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  const onSubmit = async (data: LinkageForm) => {
    try {
      if (editingLinkage) {
        await api.put(`/linkages/${editingLinkage.id}`, data as LinkageForm);
        toast.success('Linkage updated');
      } else {
        await api.post('/linkages', data as LinkageForm);
        toast.success('Linkage created');
      }
      setModalOpen(false);
      reset();
      setEditingLinkage(null);
      fetchLinkages();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Save failed');
    }
  };

  const openEditModal = (linkage: Linkage) => {
    setEditingLinkage(linkage);
    reset({
      source_entity_type: linkage.source_entity_type,
      source_entity_id: linkage.source_entity_id,
      target_entity_type: linkage.target_entity_type,
      target_entity_id: linkage.target_entity_id,
      relationship_type: linkage.relationship_type,
      start_date: linkage.start_date || '',
      end_date: linkage.end_date || '',
      confidence: linkage.confidence || 'confirmed',
      notes: linkage.notes || '',
    });
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingLinkage(null);
    reset({
      source_entity_type: 'person',
      source_entity_id: '',
      target_entity_type: 'location',
      target_entity_id: '',
      relationship_type: '',
      start_date: '',
      end_date: '',
      confidence: 'confirmed',
      notes: '',
    });
    setModalOpen(true);
  };

  const confirmDelete = (linkage: Linkage) => setDeleteConfirm(linkage);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/linkages/${deleteConfirm.id}`);
      toast.success('Linkage deleted');
      fetchLinkages();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const getEntityBadge = (type: string, id: string) => {
    const config = ENTITY_COLORS[type] || { color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800', icon: <Target className="w-3.5 h-3.5" /> };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full text-xs font-medium ${config.bg} ${config.color} border border-current/20 whitespace-nowrap`}>
        {config.icon}
        <span className="capitalize font-semibold">{type}</span>
        <span className="font-mono opacity-75 text-[10px]">({id})</span>
      </span>
    );
  };

  const getConfidenceBadge = (confidence: string | null) => {
    const config = CONFIDENCE_CONFIG[confidence || 'suspected'] || CONFIDENCE_CONFIG.suspected;
    return (
      <span className={`inline-flex items-center px-2.5 h-6 rounded-full text-xs font-semibold ${config.style} border whitespace-nowrap`}>
        {config.label}
      </span>
    );
  };

  const getRelationshipBadge = (type: string) => (
    <span className="inline-flex items-center px-2.5 h-6 rounded-lg text-xs font-semibold bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200 border border-violet-300 dark:border-violet-700 whitespace-nowrap">
      {type.replace(/_/g, ' ')}
    </span>
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return <span className="text-slate-400 dark:text-slate-500 italic text-xs">Not recorded</span>;
    return <span className="text-sm">{new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>;
  };

  // Graph view data preparation
  const graphNodes = useMemo(() => {
    const nodes = new Map<string, { id: string; type: string; label: string; color: string }>();
    filteredAndSortedLinkages.forEach(l => {
      const sourceKey = `${l.source_entity_type}:${l.source_entity_id}`;
      const targetKey = `${l.target_entity_type}:${l.target_entity_id}`;
      if (!nodes.has(sourceKey)) {
        const config = ENTITY_COLORS[l.source_entity_type] || { color: '#64748b' };
        nodes.set(sourceKey, { id: sourceKey, type: l.source_entity_type, label: `${l.source_entity_type}: ${l.source_entity_id}`, color: config.bg.replace('bg-', '').replace('dark:', '') });
      }
      if (!nodes.has(targetKey)) {
        const config = ENTITY_COLORS[l.target_entity_type] || { color: '#64748b' };
        nodes.set(targetKey, { id: targetKey, type: l.target_entity_type, label: `${l.target_entity_type}: ${l.target_entity_id}`, color: config.bg.replace('bg-', '').replace('dark:', '') });
      }
    });
    return Array.from(nodes.values());
  }, [filteredAndSortedLinkages]);

  const graphEdges = useMemo(() => {
    return filteredAndSortedLinkages.map((l, i) => ({
      id: `e-${i}`,
      source: `${l.source_entity_type}:${l.source_entity_id}`,
      target: `${l.target_entity_type}:${l.target_entity_id}`,
      label: l.relationship_type,
      confidence: l.confidence || 'suspected',
    }));
  }, [filteredAndSortedLinkages]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6"
    >
      {/* Header with View Toggle */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
              <span className="text-slate-500 dark:text-slate-400">Linkages</span>
              <ChevronDownIcon className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-slate-900 dark:text-white">Dynamic Linkages</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1" role="radiogroup" aria-label="View mode">
              <Button
                variant={viewMode === 'table' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                leftIcon={<Grid className="w-4 h-4" />}
                className="rounded-md"
              >
                Table
              </Button>
              <Button
                variant={viewMode === 'graph' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('graph')}
                leftIcon={<GitBranch className="w-4 h-4" />}
                className="rounded-md"
              >
                Graph
              </Button>
            </div>
            <Button onClick={openCreateModal} leftIcon={<Plus size={18} />}>
              Add Linkage
            </Button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{linkages.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Linkages</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {linkages.filter(l => l.confidence === 'confirmed').length}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Confirmed</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {linkages.filter(l => l.confidence === 'probable').length}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">Probable</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                  {new Set(linkages.map(l => l.relationship_type)).size}
                </p>
                <p className="text-xs text-violet-600 dark:text-violet-400">Relationship Types</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Search & Filter Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-row items-center gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by entity, relationship, or ID..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full h-10 pl-10 pr-4 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        <Select
          value={filters.sourceType}
          onChange={(e) => { setFilters(prev => ({ ...prev, sourceType: e.target.value })); setPage(1); }}
          options={[{ value: '', label: 'Source Type' }, ...ENTITY_TYPES]}
          className="w-36 h-10"
          placeholder="Source"
        />
        <Select
          value={filters.targetType}
          onChange={(e) => { setFilters(prev => ({ ...prev, targetType: e.target.value })); setPage(1); }}
          options={[{ value: '', label: 'Target Type' }, ...ENTITY_TYPES]}
          className="w-36 h-10"
          placeholder="Target"
        />
        <Select
          value={filters.confidence}
          onChange={(e) => { setFilters(prev => ({ ...prev, confidence: e.target.value })); setPage(1); }}
          options={[
            { value: '', label: 'Confidence' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'probable', label: 'Probable' },
            { value: 'suspected', label: 'Suspected' },
          ]}
          className="w-36 h-10"
          placeholder="Confidence"
        />
        {(searchTerm || filters.sourceType || filters.targetType || filters.confidence) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setFilters({ sourceType: '', targetType: '', confidence: '' }); setPage(1); }} leftIcon={<Filter className="w-4 h-4" />}>
            Clear
          </Button>
        )}
      </motion.div>

      {/* Graph View */}
      <AnimatePresence mode="wait">
        {viewMode === 'graph' && (
          <motion.div
            key="graph"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Network Graph</h3>
              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <span>{graphNodes.length} nodes</span>
                <span>{graphEdges.length} edges</span>
              </div>
            </div>
            <div className="relative h-96 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Simple force-directed graph using CSS positioning */}
              <svg className="w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
                  </marker>
                </defs>
                {/* Edges */}
                {graphEdges.map((edge, i) => {
                  const sourceNode = graphNodes.find(n => n.id === edge.source);
                  const targetNode = graphNodes.find(n => n.id === edge.target);
                  if (!sourceNode || !targetNode) return null;
                  // Simple circular layout
                  const angle = (i / graphEdges.length) * Math.PI * 2;
                  const radius = 180;
                  const cx = 400;
                  const cy = 250;
                  const sx = cx + radius * Math.cos(angle);
                  const sy = cy + radius * Math.sin(angle);
                  const tx = cx + radius * Math.cos(angle + 0.5);
                  const ty = cy + radius * Math.sin(angle + 0.5);
                  const confColor = edge.confidence === 'confirmed' ? '#10b981' : edge.confidence === 'probable' ? '#f59e0b' : '#ef4444';
                  const dash = edge.confidence === 'confirmed' ? 'none' : edge.confidence === 'probable' ? '5,5' : '2,4';
                  return (
                    <g key={edge.id}>
                      <line
                        x1={sx} y1={sy}
                        x2={tx} y2={ty}
                        stroke={confColor}
                        strokeWidth={2}
                        strokeDasharray={dash}
                        markerEnd="url(#arrowhead)"
                        opacity={0.6}
                      />
                      <text x={(sx + tx) / 2} y={(sy + ty) / 2} fontSize="10" fill="#64748b" textAnchor="middle" dominantBaseline="middle">
                        {edge.label}
                      </text>
                    </g>
                  );
                })}
                {/* Nodes */}
                {graphNodes.map((node, i) => {
                  const angle = (i / graphNodes.length) * Math.PI * 2;
                  const radius = 180;
                  const cx = 400;
                  const cy = 250;
                  const x = cx + radius * Math.cos(angle);
                  const y = cy + radius * Math.sin(angle);
                  const config = ENTITY_COLORS[node.type] || { color: '#64748b', bg: '#f1f5f9' };
                  return (
                    <g key={node.id}>
                      <circle
                        cx={x} cy={y} r={28}
                        fill={config.bg.replace('bg-', '').replace('dark:', '').replace('50', '100').replace('900/30', '200')}
                        stroke={config.color.replace('text-', '').replace('dark:', '').replace('700', '500').replace('300', '400')}
                        strokeWidth={2}
                      />
                      <text x={x} y={y + 4} fontSize="10" fill="#334155" textAnchor="middle" dominantBaseline="middle" fontWeight="600">
                        {node.id.split(':')[1]?.slice(0, 12) || node.id.slice(0, 12)}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                {Object.entries(ENTITY_COLORS).map(([type, config]) => (
                  <span key={type} className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    {config.icon}
                    <span className="capitalize">{type}</span>
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table View */}
      <AnimatePresence mode="wait">
        {viewMode === 'table' && (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3.5 w-12 text-left">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                        checked={paginatedLinkages.length > 0 && selectedLinkages.size === paginatedLinkages.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedLinkages(new Set(paginatedLinkages.map(l => l.id)));
                          else setSelectedLinkages(new Set());
                        }}
                      />
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Linkage Flow</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Confidence</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Dates</th>
                    <th className="w-14 px-4 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                          <span>Loading linkages...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedLinkages.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
                          <GitBranch className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                          <p className="text-lg">No linkages found</p>
                          {(searchTerm || filters.sourceType || filters.targetType || filters.confidence) && <p className="text-sm">Try adjusting your search or filters</p>}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {paginatedLinkages.map((linkage, index) => (
                        <motion.tr
                          key={linkage.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20, height: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.03, ease: [0.4, 0, 0.2, 1] }}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${selectedLinkages.has(linkage.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                        >
                          <td className="px-4 py-3.5">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                              checked={selectedLinkages.has(linkage.id)}
                              onChange={(e) => {
                                const newSet = new Set(selectedLinkages);
                                if (e.target.checked) newSet.add(linkage.id);
                                else newSet.delete(linkage.id);
                                setSelectedLinkages(newSet);
                              }}
                            />
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              {getEntityBadge(linkage.source_entity_type, linkage.source_entity_id)}
                              <span className="text-slate-300 dark:text-slate-600">➔</span>
                              {getRelationshipBadge(linkage.relationship_type)}
                              <span className="text-slate-300 dark:text-slate-600">➔</span>
                              {getEntityBadge(linkage.target_entity_type, linkage.target_entity_id)}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            {linkage.confidence ? getConfidenceBadge(linkage.confidence) : <span className="text-slate-400 dark:text-slate-500">—</span>}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-400">
                            {formatDate(linkage.start_date)}
                            {linkage.end_date && <><span className="mx-2 text-slate-300 dark:text-slate-600">→</span>{formatDate(linkage.end_date)}</>}
                          </td>
                          <td className="px-4 py-3.5 text-right pr-4">
                            <div className="relative inline-block">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); setActionMenuOpen(actionMenuOpen === linkage.id.toString() ? null : linkage.id.toString()); }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                aria-label="More actions"
                              >
                                <MoreHorizontal size={18} />
                              </motion.button>
                              <AnimatePresence>
                                {actionMenuOpen === linkage.id.toString() && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-10"
                                  >
                                    <button
                                      onClick={(e) => { e.stopPropagation(); openEditModal(linkage); setActionMenuOpen(null); }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                                    >
                                      <Edit size={16} />
                                      Edit
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); confirmDelete(linkage); setActionMenuOpen(null); }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                      <Trash2 size={16} />
                                      Delete
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <span>Showing</span>
                  <Select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                    options={[
                      { value: '10', label: '10 per page' },
                      { value: '25', label: '25 per page' },
                      { value: '50', label: '50 per page' },
                      { value: '100', label: '100 per page' },
                    ]}
                    className="w-auto min-w-[140px]"
                  />
                  <span>of {filteredAndSortedLinkages.length} linkages</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label="Previous page"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <span className="px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg min-w-[3rem] text-center">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    aria-label="Next page"
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); reset(); setEditingLinkage(null); }}
        title={editingLinkage ? 'Edit Linkage' : 'Add Linkage'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Source Entity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Source Entity Type"
                  select
                  options={ENTITY_TYPES}
                  error={errors.source_entity_type?.message}
                  {...register('source_entity_type')}
                />
                <FormField label="Source Entity ID" error={errors.source_entity_id?.message} placeholder="e.g., SUBJ-2025-0001" {...register('source_entity_id')} />
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Target Entity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Target Entity Type"
                  select
                  options={ENTITY_TYPES}
                  error={errors.target_entity_type?.message}
                  {...register('target_entity_type')}
                />
                <FormField label="Target Entity ID" error={errors.target_entity_id?.message} placeholder="e.g., EVT-2025-001" {...register('target_entity_id')} />
              </div>
            </div>

            <FormField
              label="Relationship Type"
              error={errors.relationship_type?.message}
              placeholder="e.g., exposed_at, resides_at, contact_of, treated_at"
              {...register('relationship_type')}
            />
            <FormField
              label="Confidence"
              select
              options={[
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'probable', label: 'Probable' },
                { value: 'suspected', label: 'Suspected' },
              ]}
              {...register('confidence')}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Start Date" type="date" {...register('start_date')} />
              <FormField label="End Date" type="date" {...register('end_date')} />
            </div>
            <FormField label="Notes" textarea {...register('notes')} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => { setModalOpen(false); reset(); setEditingLinkage(null); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting} leftIcon={<Loader2 className="w-4 h-4 animate-spin" />}>
              {editingLinkage ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Linkage"
        size="sm"
      >
        <p className="text-slate-600 dark:text-slate-300 mb-4">Are you sure you want to delete this linkage? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>

      {/* Floating Bulk Actions */}
      <AnimatePresence>
        {selectedLinkages.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-800 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-6"
          >
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                {selectedLinkages.size}
              </span>
              <span className="font-medium text-sm">Selected</span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => toast.success('Marking as confirmed...')} className="text-slate-300 hover:text-white hover:bg-slate-800">
                Mark as Confirmed
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toast.success('Deleting linkages...')} className="text-red-400 hover:text-red-300 hover:bg-red-900/30">
                Delete Linkages
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedLinkages(new Set())} className="text-slate-400 hover:text-white hover:bg-slate-800">
                Clear Selection
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}