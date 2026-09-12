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
import { Plus, Edit, Trash2, Loader2, Search, ChevronUp, ChevronDown as ChevronDownIcon, MoreHorizontal, AlertTriangle, Biohazard, Shield, MapPin, Calendar, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../auth/AuthContext';

const eventSchema = z.object({
  event_id: z.string().regex(/^EVT-\d{4}-\d{3}$/, 'Format: EVT-YYYY-NNN'),
  name: z.string().min(1, 'Event name is required'),
  category: z.enum(['infectious', 'environmental', 'bioterrorism', 'other']),
  status: z.enum(['Open', 'Closed', 'Archived']),
  suspected_agent: z.string().optional(),
  geographic_area: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
});

type EventForm = z.infer<typeof eventSchema>;

interface HealthEvent {
  id: number;
  event_id: string;
  name: string;
  category: string;
  status: string;
  suspected_agent: string | null;
  geographic_area: string | null;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  Open: {
    label: 'Active Outbreak',
    icon: <Activity className="w-3.5 h-3.5" />,
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  Closed: {
    label: 'Under Surveillance',
    icon: <Shield className="w-3.5 h-3.5" />,
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    border: 'border-amber-200 dark:border-amber-800',
  },
  Archived: {
    label: 'Closed',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-700',
  },
};

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  infectious: { label: 'Infectious', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/50 border border-transparent dark:border-red-800/40' },
  environmental: { label: 'Environmental', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50 border border-transparent dark:border-emerald-800/40' },
  bioterrorism: { label: 'Bioterrorism', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/50 border border-transparent dark:border-purple-800/40' },
  other: { label: 'Other', color: 'text-slate-700 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-900/50 border border-transparent dark:border-slate-800/40' },
};

export function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<HealthEvent | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<HealthEvent | null>(null);
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ category: '', status: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      event_id: '',
      name: '',
      category: 'infectious',
      status: 'Open',
      suspected_agent: '',
      geographic_area: '',
      start_date: '',
      end_date: '',
    },
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/events');
      setEvents(response.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    setSelectAll(false);
    setSelectedRows(new Set());
  }, [events]);

  const handleSort = (key: string) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const toggleRowSelection = (eventId: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
      setSelectAll(false);
    } else {
      setSelectedRows(new Set(paginatedEvents.map(e => e.event_id)));
      setSelectAll(true);
    }
  };

  const filteredAndSortedEvents = useMemo(() => {
    let result = [...events];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(term) ||
        e.event_id.toLowerCase().includes(term) ||
        e.suspected_agent?.toLowerCase().includes(term) ||
        e.geographic_area?.toLowerCase().includes(term)
      );
    }

    if (filters.category) {
      result = result.filter(e => e.category === filters.category);
    }
    if (filters.status) {
      result = result.filter(e => e.status === filters.status);
    }

    result.sort((a, b) => {
      const aVal = a[sort.key as keyof HealthEvent];
      const bVal = b[sort.key as keyof HealthEvent];
      if (aVal === undefined || bVal === undefined) return 0;
      const comparison = String(aVal).localeCompare(String(bVal));
      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [events, searchTerm, filters, sort]);

  const paginatedEvents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAndSortedEvents.slice(start, start + pageSize);
  }, [filteredAndSortedEvents, page, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedEvents.length / pageSize) || 1;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  // Quick Metrics
  const metrics = useMemo(() => ({
    total: events.length,
    activeOutbreaks: events.filter(e => e.status === 'Open').length,
    highRisk: events.filter(e => e.category === 'bioterrorism' || e.category === 'infectious').length,
    underSurveillance: events.filter(e => e.status === 'Closed').length,
  }), [events]);

  const onSubmit = async (data: EventForm) => {
    try {
      if (editingEvent) {
        await api.put(`/events/${editingEvent.event_id}`, data as EventForm);
        toast.success('Event updated');
      } else {
        await api.post('/events', data as EventForm);
        toast.success('Event created');
      }
      setModalOpen(false);
      reset();
      setEditingEvent(null);
      fetchEvents();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Save failed');
    }
  };

  const openEditModal = (event: HealthEvent) => {
    setEditingEvent(event);
    reset({
      event_id: event.event_id,
      name: event.name,
      category: event.category,
      status: event.status,
      suspected_agent: event.suspected_agent || '',
      geographic_area: event.geographic_area || '',
      start_date: event.start_date,
      end_date: event.end_date || '',
    });
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    reset({
      event_id: '',
      name: '',
      category: 'infectious',
      status: 'Open',
      suspected_agent: '',
      geographic_area: '',
      start_date: '',
      end_date: '',
    });
    setModalOpen(true);
  };

  const confirmDelete = (event: HealthEvent) => setDeleteConfirm(event);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/events/${deleteConfirm.event_id}`);
      toast.success('Event deleted');
      fetchEvents();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatPathogen = (agent: string | null) => {
    if (!agent) return <span className="text-slate-400 dark:text-slate-500">—</span>;
    return (
      <span className="font-mono text-sm italic px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
        {agent}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.Archived;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color} ${config.border}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6"
    >
      {/* Header with Breadcrumbs & Quick Metrics */}
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
              <span className="text-slate-500 dark:text-slate-400">Events</span>
              <ChevronDownIcon className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-slate-900 dark:text-white">Health Events</span>
            </nav>
          </div>
          <Button onClick={openCreateModal} leftIcon={<Plus size={18} />}>
            Add Event
          </Button>
        </motion.div>

        {/* Quick Metrics Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <Card className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 border-slate-200/50 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Activity className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.total}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Events</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/50 border-emerald-200/50 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Biohazard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{metrics.activeOutbreaks}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Active Outbreaks</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-900/50 border-red-200/50 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{metrics.highRisk}</p>
                <p className="text-xs text-red-600 dark:text-red-400">High-Risk Events</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-900/50 border-amber-200/50 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{metrics.underSurveillance}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">Under Surveillance</p>
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
            placeholder="Search by name, ID, agent, or location..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full h-10 pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex flex-row items-center gap-3">
          <Select
            value={filters.category}
            onChange={(e) => { setFilters(prev => ({ ...prev, category: e.target.value })); setPage(1); }}
            options={[
              { value: '', label: 'All Categories' },
              { value: 'infectious', label: 'Infectious' },
              { value: 'environmental', label: 'Environmental' },
              { value: 'bioterrorism', label: 'Bioterrorism' },
              { value: 'other', label: 'Other' },
            ]}
            className="w-44 h-10"
            placeholder="Category"
          />
          <Select
            value={filters.status}
            onChange={(e) => { setFilters(prev => ({ ...prev, status: e.target.value })); setPage(1); }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'Open', label: 'Open' },
              { value: 'Closed', label: 'Closed' },
              { value: 'Archived', label: 'Archived' },
            ]}
            className="w-40 h-10"
            placeholder="Status"
          />
          {(searchTerm || filters.category || filters.status) && (
            <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setFilters({ category: '', status: '' }); setPage(1); }} leftIcon={<Search className="w-4 h-4" />}>
              Clear
            </Button>
          )}
        </div>
      </motion.div>

      {/* Bulk Actions Toolbar */}
      <AnimatePresence>
        {selectedRows.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center justify-between overflow-hidden sticky top-4 z-10"
          >
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedRows.size} events selected
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">Export Selected</Button>
              <Button variant="outline" size="sm">Change Status</Button>
              <Button variant="ghost" size="sm" onClick={() => { setSelectedRows(new Set()); setSelectAll(false); }}>Clear Selection</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="w-12 px-4 py-3.5 text-center">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectAll && paginatedEvents.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      aria-label="Select all"
                      indeterminate={selectedRows.size > 0 && selectedRows.size < paginatedEvents.length}
                    />
                  </div>
                </th>
                {[
                  { key: 'event_id', label: 'Event ID', sortable: true, className: 'whitespace-nowrap min-w-[130px]' },
                  { key: 'name', label: 'Event Name', sortable: true },
                  { key: 'category', label: 'Category', sortable: true },
                  { key: 'status', label: 'Status', sortable: true },
                  { key: 'suspected_agent', label: 'Suspected Agent', sortable: true },
                  { key: 'geographic_area', label: 'Location', sortable: true },
                  { key: 'start_date', label: 'Start Date', sortable: true },
                ].map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700/50 ${col.className || ''}`}
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
                      <span>Loading events...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
                      <Activity className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                      <p className="text-lg">No events found</p>
                      {searchTerm && <p className="text-sm">Try adjusting your search</p>}
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {paginatedEvents.map((event, index) => (
                    <motion.tr
                      key={event.event_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20, height: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03, ease: [0.4, 0, 0.2, 1] }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(event.event_id)}
                            onChange={(e) => { e.stopPropagation(); toggleRowSelection(event.event_id); }}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap min-w-[130px]">
                        <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                          {event.event_id}
                        </code>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-900 dark:text-white">{event.name}</p>
                      </td>
                      <td className="px-4 py-3.5">{getCategoryBadge(event.category)}</td>
                      <td className="px-4 py-3.5">{getStatusBadge(event.status)}</td>
                      <td className="px-4 py-3.5 max-w-xs truncate">{formatPathogen(event.suspected_agent)}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-700 dark:text-slate-300 max-w-xs truncate">
                        {event.geographic_area || <span className="text-slate-400 dark:text-slate-500">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-700 dark:text-slate-300">
                        {event.start_date ? new Date(event.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right pr-4">
                        <div className="relative inline-block">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); setActionMenuOpen(actionMenuOpen === event.event_id ? null : event.event_id); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            aria-label="More actions"
                          >
                            <MoreHorizontal size={18} />
                          </motion.button>
                          <AnimatePresence>
                            {actionMenuOpen === event.event_id && (
                              <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-10"
                              >
                                <button
                                  onClick={(e) => { e.stopPropagation(); openEditModal(event); setActionMenuOpen(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                  <Edit size={16} />
                                  Edit
                                </button>
                                {user?.role === 'admin' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); confirmDelete(event); setActionMenuOpen(null); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <Trash2 size={16} />
                                    Delete
                                  </button>
                                )}
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
              <span>of {filteredAndSortedEvents.length} events</span>
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
        onClose={() => { setModalOpen(false); reset(); setEditingEvent(null); }}
        title={editingEvent ? 'Edit Event' : 'Add Event'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Event ID" error={errors.event_id?.message} helperText="Format: EVT-YYYY-NNN" {...register('event_id')} disabled={!!editingEvent} />
            <FormField label="Name" error={errors.name?.message} {...register('name')} />
            <FormField
              label="Category"
              select
              options={[
                { value: 'infectious', label: 'Infectious' },
                { value: 'environmental', label: 'Environmental' },
                { value: 'bioterrorism', label: 'Bioterrorism' },
                { value: 'other', label: 'Other' },
              ]}
              error={errors.category?.message}
              {...register('category')}
            />
            <FormField
              label="Status"
              select
              options={[
                { value: 'Open', label: 'Open' },
                { value: 'Closed', label: 'Closed' },
                { value: 'Archived', label: 'Archived' },
              ]}
              error={errors.status?.message}
              {...register('status')}
              disabled={!editingEvent || user?.role !== 'admin'}
            />
            <FormField label="Suspected Agent" {...register('suspected_agent')} />
            <FormField label="Geographic Area" {...register('geographic_area')} />
            <FormField label="Start Date" type="date" error={errors.start_date?.message} {...register('start_date')} />
            <FormField label="End Date" type="date" {...register('end_date')} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => { setModalOpen(false); reset(); setEditingEvent(null); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting} leftIcon={<Loader2 className="w-4 h-4 animate-spin" />}>
              {editingEvent ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Event"
        size="sm"
      >
        <p className="text-slate-600 dark:text-slate-300 mb-4">Are you sure you want to delete <strong>{deleteConfirm?.name}</strong> ({deleteConfirm?.event_id})? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </motion.div>
  );
}