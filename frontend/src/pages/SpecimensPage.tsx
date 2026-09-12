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
import { Plus, Edit, Trash2, Loader2, Search, ChevronUp, ChevronDown as ChevronDownIcon, MoreHorizontal, AlertTriangle, Biohazard, Shield, MapPin, Calendar, Activity, FlaskConical, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const specimenSchema = z.object({
  specimen_id: z.string().regex(/^SPC-\d{4}-\d{4}$/, 'Format: SPC-YYYY-NNNN'),
  subject_id: z.string().regex(/^SUBJ-\d{4}-\d{4}$/, 'Format: SUBJ-YYYY-NNNN'),
  event_id: z.string().regex(/^EVT-\d{4}-\d{3}$/, 'Format: EVT-YYYY-NNN').optional().or(z.literal('')),
  specimen_type: z.enum(['clinical', 'environmental', 'food', 'other']),
  collection_date: z.string().min(1, 'Collection date is required'),
  collection_location: z.string().optional(),
  collector_name: z.string().optional(),
  suspected_agent: z.string().optional(),
  risk_level: z.enum(['low', 'medium', 'high', 'select_agent']).optional(),
  notes: z.string().optional(),
});

type SpecimenForm = z.infer<typeof specimenSchema>;

interface Specimen {
  id: number;
  specimen_id: string;
  subject_id: string;
  event_id: string | null;
  specimen_type: string;
  collection_date: string;
  collection_location: string | null;
  collector_name: string | null;
  suspected_agent: string | null;
  risk_level: string | null;
  notes: string | null;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  event_name: string | null;
}

const RISK_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  low: {
    label: 'Low Risk',
    icon: <Shield className="w-3.5 h-3.5" />,
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  medium: {
    label: 'Medium Risk',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    border: 'border-amber-200 dark:border-amber-800',
  },
  high: {
    label: 'High Risk',
    icon: <Biohazard className="w-3.5 h-3.5" />,
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
  },
  select_agent: {
    label: 'Select Agent',
    icon: <Biohazard className="w-3.5 h-3.5" />,
    color: 'text-purple-700 dark:text-purple-300',
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    border: 'border-purple-200 dark:border-purple-800',
  },
};

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  clinical: { label: 'Clinical', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-900/30', icon: <FlaskConical className="w-3.5 h-3.5" /> },
  environmental: { label: 'Environmental', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-900/30', icon: <Shield className="w-3.5 h-3.5" /> },
  food: { label: 'Food', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/30', icon: <MapPin className="w-3.5 h-3.5" /> },
  other: { label: 'Other', color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800', icon: <Biohazard className="w-3.5 h-3.5" /> },
};

export function SpecimensPage() {
  const [specimens, setSpecimens] = useState<Specimen[]>([]);
  const [persons, setPersons] = useState<{ subject_id: string; first_name: string; last_name: string }[]>([]);
  const [events, setEvents] = useState<{ event_id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSpecimen, setEditingSpecimen] = useState<Specimen | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Specimen | null>(null);
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [filters, setFilters] = useState({ type: '', risk: '' });
  const [selectedSpecimens, setSelectedSpecimens] = useState<Set<string>>(new Set());

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SpecimenForm>({
    resolver: zodResolver(specimenSchema),
    defaultValues: {
      specimen_id: '',
      subject_id: '',
      event_id: '',
      specimen_type: 'clinical',
      collection_date: '',
      collection_location: '',
      collector_name: '',
      suspected_agent: '',
      risk_level: 'low',
      notes: '',
    },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [specimensRes, personsRes, eventsRes] = await Promise.all([
        api.get('/specimens'),
        api.get('/persons'),
        api.get('/events'),
      ]);
      setSpecimens(specimensRes.data.data);
      setPersons(personsRes.data.data.map((p: any) => ({ subject_id: p.subject_id, first_name: p.first_name, last_name: p.last_name })));
      setEvents(eventsRes.data.data.map((e: any) => ({ event_id: e.event_id, name: e.name })));
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSort = (key: string) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const filteredAndSortedSpecimens = useMemo(() => {
    let result = [...specimens];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.specimen_id.toLowerCase().includes(term) ||
        s.subject_id.toLowerCase().includes(term) ||
        s.event_id?.toLowerCase().includes(term) ||
        s.first_name?.toLowerCase().includes(term) ||
        s.last_name?.toLowerCase().includes(term) ||
        s.specimen_type.toLowerCase().includes(term) ||
        s.suspected_agent?.toLowerCase().includes(term)
      );
    }

    if (filters.type) {
      result = result.filter(s => s.specimen_type === filters.type);
    }
    if (filters.risk) {
      result = result.filter(s => s.risk_level === filters.risk);
    }

    result.sort((a, b) => {
      const aVal = a[sort.key as keyof Specimen];
      const bVal = b[sort.key as keyof Specimen];
      if (aVal === undefined || bVal === undefined) return 0;
      const comparison = String(aVal).localeCompare(String(bVal));
      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [specimens, searchTerm, filters, sort]);

  const paginatedSpecimens = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAndSortedSpecimens.slice(start, start + pageSize);
  }, [filteredAndSortedSpecimens, page, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedSpecimens.length / pageSize) || 1;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  const onSubmit = async (data: SpecimenForm) => {
    try {
      const submitData = { ...data, event_id: data.event_id || undefined };
      if (editingSpecimen) {
        await api.put(`/specimens/${editingSpecimen.specimen_id}`, submitData as SpecimenForm);
        toast.success('Specimen updated');
      } else {
        await api.post('/specimens', submitData as SpecimenForm);
        toast.success('Specimen created');
      }
      setModalOpen(false);
      reset();
      setEditingSpecimen(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Save failed');
    }
  };

  const openEditModal = (specimen: Specimen) => {
    setEditingSpecimen(specimen);
    reset({
      specimen_id: specimen.specimen_id,
      subject_id: specimen.subject_id,
      event_id: specimen.event_id || '',
      specimen_type: specimen.specimen_type,
      collection_date: specimen.collection_date.slice(0, 16),
      collection_location: specimen.collection_location || '',
      collector_name: specimen.collector_name || '',
      suspected_agent: specimen.suspected_agent || '',
      risk_level: specimen.risk_level || 'low',
      notes: specimen.notes || '',
    });
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingSpecimen(null);
    reset({
      specimen_id: '',
      subject_id: '',
      event_id: '',
      specimen_type: 'clinical',
      collection_date: '',
      collection_location: '',
      collector_name: '',
      suspected_agent: '',
      risk_level: 'low',
      notes: '',
    });
    setModalOpen(true);
  };

  const confirmDelete = (specimen: Specimen) => setDeleteConfirm(specimen);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/specimens/${deleteConfirm.specimen_id}`);
      toast.success('Specimen deleted');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    const formatted = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    if (diffMs < 0) return `${formatted} (future)`;
    if (diffMins < 1) return `${formatted} (just now)`;
    if (diffMins < 60) return `${formatted} (${diffMins}m ago)`;
    if (diffHours < 24) return `${formatted} (${diffHours}h ago)`;
    if (diffDays < 7) return `${formatted} (${diffDays}d ago)`;
    return formatted;
  };

  const formatPathogen = (agent: string | null) => {
    if (!agent) return <span className="text-slate-400 dark:text-slate-500">—</span>;
    return (
      <span className="font-mono text-sm italic px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
        {agent}
      </span>
    );
  };

  const getRiskBadge = (risk: string | null) => {
    const config = RISK_CONFIG[risk || 'low'] || RISK_CONFIG.low;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color} ${config.border}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const config = TYPE_CONFIG[type] || TYPE_CONFIG.other;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getEntityChip = (id: string, type: 'subject' | 'event', onClick: () => void) => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
        type === 'subject'
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50'
          : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50'
      }`}
      aria-label={`Filter by ${type}: ${id}`}
    >
      {type === 'subject' ? <User className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
      <span className="font-mono">{id}</span>
    </motion.button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
            <span className="text-slate-500 dark:text-slate-400">Specimens</span>
            <ChevronDownIcon className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-slate-900 dark:text-white">Specimens</span>
          </nav>
        </div>
        <Button onClick={openCreateModal} leftIcon={<Plus size={18} />}>
          Add Specimen
        </Button>
      </motion.div>

      {/* Top Specimen Metric Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          { label: 'Total Specimens', value: specimens.length, icon: <FlaskConical className="w-5 h-5 text-blue-400" /> },
          { label: 'High-Risk Samples', value: specimens.filter(s => s.risk_level === 'high').length, icon: <Biohazard className="w-5 h-5 text-red-400" /> },
          { label: 'Clinical Samples', value: specimens.filter(s => s.specimen_type === 'clinical').length, icon: <Activity className="w-5 h-5 text-emerald-400" /> },
          { label: 'Environmental/Food', value: specimens.filter(s => ['environmental', 'food'].includes(s.specimen_type)).length, icon: <MapPin className="w-5 h-5 text-amber-400" /> },
        ].map((card, i) => (
          <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">{card.icon}</div>
            <div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-xs text-slate-400">{card.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Search & Filter Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-row items-center gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by ID, subject, type, agent, or location..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full h-10 pl-10 pr-4 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        <Select
          value={filters.type}
          onChange={(e) => { setFilters(prev => ({ ...prev, type: e.target.value })); setPage(1); }}
          options={[
            { value: '', label: 'All Types' },
            { value: 'clinical', label: 'Clinical' },
            { value: 'environmental', label: 'Environmental' },
            { value: 'food', label: 'Food' },
            { value: 'other', label: 'Other' },
          ]}
          className="w-40 h-10"
          placeholder="Type"
        />
        <Select
          value={filters.risk}
          onChange={(e) => { setFilters(prev => ({ ...prev, risk: e.target.value })); setPage(1); }}
          options={[
            { value: '', label: 'All Risk Levels' },
            { value: 'low', label: 'Low Risk' },
            { value: 'medium', label: 'Medium Risk' },
            { value: 'high', label: 'High Risk' },
            { value: 'select_agent', label: 'Select Agent' },
          ]}
          className="w-44 h-10"
          placeholder="Risk Level"
        />
        {(searchTerm || filters.type || filters.risk) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setFilters({ type: '', risk: '' }); setPage(1); }} leftIcon={<Search className="w-4 h-4" />}>
            Clear
          </Button>
        )}
      </motion.div>

      {/* Data Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
                    checked={paginatedSpecimens.length > 0 && selectedSpecimens.size === paginatedSpecimens.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSpecimens(new Set(paginatedSpecimens.map(s => s.specimen_id)));
                      } else {
                        setSelectedSpecimens(new Set());
                      }
                    }}
                  />
                </th>
                {[
                  { key: 'specimen_id', label: 'Specimen ID', sortable: true },
                  { key: 'specimen_type', label: 'Type', sortable: true },
                  { key: 'subject_id', label: 'Subject', sortable: true },
                  { key: 'event_id', label: 'Event', sortable: true },
                  { key: 'collection_date', label: 'Collection Date', sortable: true },
                  { key: 'risk_level', label: 'Risk Level', sortable: true },
                  { key: 'suspected_agent', label: 'Suspected Agent', sortable: true },
                ].map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700/50 ${col.sortable ? '' : ''}`}
                    onClick={() => col.sortable && handleSort(col.key)}
                    style={{ userSelect: 'none' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.label}</span>
                      {col.sortable && sort.key === col.key && (
                        <motion.span
                          animate={{ rotate: sort.direction === 'asc' ? 0 : 180 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        </motion.span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="w-14 px-4 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <span>Loading specimens...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedSpecimens.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
                      <FlaskConical className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                      <p className="text-lg">No specimens found</p>
                      {(searchTerm || filters.type || filters.risk) && <p className="text-sm">Try adjusting your search or filters</p>}
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {paginatedSpecimens.map((specimen, index) => (
                    <motion.tr
                      key={specimen.specimen_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20, height: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03, ease: [0.4, 0, 0.2, 1] }}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${selectedSpecimens.has(specimen.specimen_id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    >
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                          checked={selectedSpecimens.has(specimen.specimen_id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedSpecimens);
                            if (e.target.checked) newSet.add(specimen.specimen_id);
                            else newSet.delete(specimen.specimen_id);
                            setSelectedSpecimens(newSet);
                          }}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                          {specimen.specimen_id}
                        </code>
                      </td>
                      <td className="px-4 py-3.5">{getTypeBadge(specimen.specimen_type)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <a href={`/subjects/${specimen.subject_id}`} className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm whitespace-nowrap">
                            {specimen.first_name} {specimen.last_name}
                          </a>
                          {getEntityChip(
                            specimen.subject_id,
                            'subject',
                            () => { setFilters(prev => ({ ...prev, type: specimen.subject_id })); setPage(1); }
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {specimen.event_id ? (
                          <div className="flex items-center gap-2">
                            {getEntityChip(
                              specimen.event_id,
                              'event',
                              () => { setFilters(prev => ({ ...prev, risk: specimen.event_id || '' })); setPage(1); }
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-700 dark:text-slate-300">
                        {formatDateTime(specimen.collection_date)}
                      </td>
                      <td className="px-4 py-3.5">
                        {specimen.risk_level ? getRiskBadge(specimen.risk_level) : <span className="text-slate-400 dark:text-slate-500">—</span>}
                      </td>
                      <td className="px-4 py-3.5 max-w-xs truncate">{formatPathogen(specimen.suspected_agent)}</td>
                      <td className="px-4 py-3.5 text-right pr-4">
                        <div className="relative inline-block">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); setActionMenuOpen(actionMenuOpen === specimen.specimen_id ? null : specimen.specimen_id); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            aria-label="More actions"
                          >
                            <MoreHorizontal size={18} />
                          </motion.button>
                          <AnimatePresence>
                            {actionMenuOpen === specimen.specimen_id && (
                              <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-10"
                              >
                                <button
                                  onClick={(e) => { e.stopPropagation(); openEditModal(specimen); setActionMenuOpen(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                  <Edit size={16} />
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); confirmDelete(specimen); setActionMenuOpen(null); }}
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
              <span>of {filteredAndSortedSpecimens.length} specimens</span>
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

      {/* Modals */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); reset(); setEditingSpecimen(null); }}
        title={editingSpecimen ? 'Edit Specimen' : 'Add Specimen'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Specimen ID" error={errors.specimen_id?.message} helperText="Format: SPC-YYYY-NNNN" {...register('specimen_id')} disabled={!!editingSpecimen} />
            <FormField
              label="Subject ID"
              error={errors.subject_id?.message}
              helperText="Format: SUBJ-YYYY-NNNN (type to search or enter manually)"
              {...register('subject_id')}
              disabled={!!editingSpecimen}
              list="subject-id-suggestions"
            />
            <datalist id="subject-id-suggestions">
              {persons.map(p => (
                <option key={p.subject_id} value={p.subject_id} label={`${p.first_name} ${p.last_name} (${p.subject_id})`} />
              ))}
            </datalist>
            <FormField
              label="Event ID"
              select
              options={[{ value: '', label: 'None' }, ...events.map(e => ({ value: e.event_id, label: `${e.name} (${e.event_id})` }) )]}
              {...register('event_id')}
            />
            <FormField
              label="Specimen Type"
              select
              options={[
                { value: 'clinical', label: 'Clinical' },
                { value: 'environmental', label: 'Environmental' },
                { value: 'food', label: 'Food' },
                { value: 'other', label: 'Other' },
              ]}
              error={errors.specimen_type?.message}
              {...register('specimen_type')}
            />
            <FormField label="Collection Date/Time" type="datetime-local" error={errors.collection_date?.message} {...register('collection_date')} />
            <FormField
              label="Risk Level"
              select
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'select_agent', label: 'Select Agent' },
              ]}
              {...register('risk_level')}
            />
            <FormField label="Collection Location" {...register('collection_location')} />
            <FormField label="Collector Name" {...register('collector_name')} />
            <FormField label="Suspected Agent" {...register('suspected_agent')} />
            <FormField label="Notes" textarea {...register('notes')} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => { setModalOpen(false); reset(); setEditingSpecimen(null); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting} leftIcon={<Loader2 className="w-4 h-4 animate-spin" />}>
              {editingSpecimen ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Specimen"
        size="sm"
      >
        <p className="text-slate-600 dark:text-slate-300 mb-4">Are you sure you want to delete <strong>{deleteConfirm?.specimen_id}</strong>? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>

      {/* Floating Bulk Actions */}
      <AnimatePresence>
        {selectedSpecimens.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-800 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-6"
          >
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                {selectedSpecimens.size}
              </span>
              <span className="font-medium text-sm">Selected</span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => toast.success('Printing labels...')} className="text-slate-300 hover:text-white hover:bg-slate-800">
                Print Labels
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toast.success('Exporting data...')} className="text-slate-300 hover:text-white hover:bg-slate-800">
                Export Selected Data
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedSpecimens(new Set())} className="text-slate-400 hover:text-white hover:bg-slate-800">
                Clear Selection
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}