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
import { Plus, Edit, Trash2, Search, Loader2, ChevronDown, MoreHorizontal, Check, ChevronUp, ChevronDown as ChevronDownIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const personSchema = z.object({
  subject_id: z.string().regex(/^SUBJ-\d{4}-\d{4}$/, 'Format: SUBJ-YYYY-NNNN'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  dob: z.string()
    .min(1, 'Date of birth is required')
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format')
    .refine((val) => new Date(val) <= new Date(), 'Date of birth cannot be in the future')
    .refine((val) => {
      const age = new Date().getFullYear() - new Date(val).getFullYear();
      return age >= 0 && age <= 120;
    }, 'Age must be between 0 and 120'),
  gender: z.enum(['M', 'F', 'O', 'U']),
  phone: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  street_address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
});

type PersonForm = z.infer<typeof personSchema>;

interface Person {
  id: number;
  subject_id: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  phone: string;
  country: string;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  created_at: string;
  updated_at: string;
}

interface ColumnSort {
  key: string;
  direction: 'asc' | 'desc';
}

const GENDER_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  M: { label: 'Male', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  F: { label: 'Female', color: 'text-pink-700 dark:text-pink-300', bg: 'bg-pink-100 dark:bg-pink-900/30' },
  O: { label: 'Other', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  U: { label: 'Unknown', color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-800' },
};

const COUNTRY_FLAGS: Record<string, string> = {
  USA: '🇺🇸',
  CAN: '🇨🇦',
  GBR: '🇬🇧',
  DEU: '🇩🇪',
  FRA: '🇫🇷',
  JPN: '🇯🇵',
  AUS: '🇦🇺',
};

export function PersonsPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState<ColumnSort>({ key: 'created_at', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({ country: '', gender: '' });
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PersonForm>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      subject_id: '',
      first_name: '',
      last_name: '',
      dob: '',
      gender: 'M',
      phone: '',
      country: '',
      street_address: '',
      city: '',
      state: '',
      zip_code: '',
    },
  });

  const fetchPersons = async () => {
    setLoading(true);
    try {
      const response = await api.get('/persons');
      setPersons(response.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to fetch persons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersons();
  }, []);

  useEffect(() => {
    setSelectAll(false);
    setSelectedRows(new Set());
  }, [persons]);

  const handleSort = (key: string) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const filteredAndSortedPersons = useMemo(() => {
    let result = [...persons];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.first_name.toLowerCase().includes(term) ||
        p.last_name.toLowerCase().includes(term) ||
        p.subject_id.toLowerCase().includes(term) ||
        p.phone?.toLowerCase().includes(term) ||
        p.city?.toLowerCase().includes(term) ||
        p.country.toLowerCase().includes(term)
      );
    }

    if (filters.country) {
      result = result.filter(p => p.country === filters.country);
    }
    if (filters.gender) {
      result = result.filter(p => p.gender === filters.gender);
    }

    result.sort((a, b) => {
      const aVal = a[sort.key as keyof Person];
      const bVal = b[sort.key as keyof Person];
      if (aVal === undefined || bVal === undefined) return 0;
      const comparison = String(aVal).localeCompare(String(bVal));
      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [persons, searchTerm, filters, sort]);

  const paginatedPersons = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAndSortedPersons.slice(start, start + pageSize);
  }, [filteredAndSortedPersons, page, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedPersons.length / pageSize) || 1;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  const onSubmit = async (data: PersonForm) => {
    try {
      if (editingPerson) {
        await api.put(`/persons/${editingPerson.subject_id}`, data as PersonForm);
        toast.success('Person updated');
      } else {
        await api.post('/persons', data as PersonForm);
        toast.success('Person created');
      }
      setModalOpen(false);
      reset();
      setEditingPerson(null);
      fetchPersons();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Save failed');
    }
  };

  const openEditModal = (person: Person) => {
    setEditingPerson(person);
    reset({
      subject_id: person.subject_id,
      first_name: person.first_name,
      last_name: person.last_name,
      dob: person.dob,
      gender: person.gender,
      phone: person.phone || '',
      country: person.country,
      street_address: person.street_address || '',
      city: person.city || '',
      state: person.state || '',
      zip_code: person.zip_code || '',
    });
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingPerson(null);
    reset({
      subject_id: '',
      first_name: '',
      last_name: '',
      dob: '',
      gender: 'M',
      phone: '',
      country: '',
      street_address: '',
      city: '',
      state: '',
      zip_code: '',
    });
    setModalOpen(true);
  };

  const confirmDelete = (person: Person) => setDeleteConfirm(person);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/persons/${deleteConfirm.subject_id}`);
      toast.success('Person deleted');
      fetchPersons();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const toggleRowSelection = (subjectId: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(subjectId)) next.delete(subjectId);
      else next.add(subjectId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
      setSelectAll(false);
    } else {
      setSelectedRows(new Set(paginatedPersons.map(p => p.subject_id)));
      setSelectAll(true);
    }
  };

  const countries = useMemo(() => [...new Set(persons.map(p => p.country))].sort(), [persons]);
  const genders = ['M', 'F', 'O', 'U'];

  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  const avatarColors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
    'bg-rose-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500',
  ];

  const getAvatarColor = (subjectId: string) => {
    let hash = 0;
    for (let i = 0; i < subjectId.length; i++) hash = subjectId.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6"
    >
      {/* Header with Breadcrumbs */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
            <span className="text-gray-500 dark:text-gray-400">Persons</span>
            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">Demographics</span>
          </nav>
        </div>
        <Button onClick={openCreateModal} leftIcon={<Plus size={18} />}>
          Add Person
        </Button>
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
            placeholder="Search by name, ID, phone, or location..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full h-10 pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex flex-row items-center gap-3">
          <Select
            value={filters.country}
            onChange={(e) => { setFilters(prev => ({ ...prev, country: e.target.value })); setPage(1); }}
            options={[{ value: '', label: 'All Countries' }, ...countries.map(c => {
              const cleanC = c.replace(/^[a-z]+/, '');
              return { value: c, label: `${COUNTRY_FLAGS[cleanC] || '🌐'} ${cleanC}` };
            })]}
            className="w-44 h-10"
            placeholder="Country"
          />
          <Select
            value={filters.gender}
            onChange={(e) => { setFilters(prev => ({ ...prev, gender: e.target.value })); setPage(1); }}
            options={[
              { value: '', label: 'All Genders' },
              { value: 'M', label: 'Male (M)' },
              { value: 'F', label: 'Female (F)' },
              { value: 'O', label: 'Other (O)' },
              { value: 'U', label: 'Unknown (U)' },
            ]}
            className="w-40 h-10"
            placeholder="Gender"
          />
          {(searchTerm || filters.country || filters.gender) && (
            <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setFilters({ country: '', gender: '' }); setPage(1); }} leftIcon={<Search className="w-4 h-4" />}>
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
              {selectedRows.size} persons selected
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">Export Selected</Button>
              <Button variant="destructive" size="sm">Delete Selected</Button>
              <Button variant="ghost" size="sm" onClick={() => { setSelectedRows(new Set()); setSelectAll(false); }}>Clear Selection</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-700">
              <tr>
                <th className="w-12 px-4 py-3.5 text-center">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectAll && paginatedPersons.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      aria-label="Select all"
                      indeterminate={selectedRows.size > 0 && selectedRows.size < paginatedPersons.length}
                    />
                  </div>
                </th>
                {[
                  { key: 'name', label: 'Name', sortable: true },
                  { key: 'subject_id', label: 'Subject ID', sortable: true },
                  { key: 'dob', label: 'DOB', sortable: true },
                  { key: 'gender', label: 'Gender', sortable: true },
                  { key: 'country', label: 'Country', sortable: true },
                  { key: 'phone', label: 'Phone', sortable: true },
                  { key: 'city', label: 'City', sortable: true },
                ].map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-gray-700/50 ${col.sortable ? '' : ''}`}
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
            <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <span>Loading persons...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedPersons.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
                      <Search className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                      <p className="text-lg">No persons found</p>
                      {(searchTerm || filters.country || filters.gender) && (
                        <p className="text-sm">Try adjusting your search or filters</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {paginatedPersons.map((person, index) => (
                    <motion.tr
                      key={person.subject_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20, height: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03, ease: [0.4, 0, 0.2, 1] }}
                      className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors"
                      onClick={(e) => {
                        if (!(e.target as HTMLElement).closest('button, input, [role="menu"]')) {
                          openEditModal(person);
                        }
                      }}
                    >
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(person.subject_id)}
                            onChange={(e) => { e.stopPropagation(); toggleRowSelection(person.subject_id); }}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(person.subject_id)}`}
                          >
                            {getInitials(person.first_name, person.last_name)}
                          </motion.div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{person.first_name} {person.last_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{person.street_address ? `${person.street_address}, ${person.city}, ${person.state} ${person.zip_code}` : 'No address'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <code className="px-2 py-1 bg-slate-100 dark:bg-gray-800 rounded text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-gray-700">
                          {person.subject_id}
                        </code>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">{person.dob}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${GENDER_BADGES[person.gender]?.bg || 'bg-gray-100 dark:bg-gray-800'} ${GENDER_BADGES[person.gender]?.color || 'text-gray-700 dark:text-gray-300'}`}>
                          {GENDER_BADGES[person.gender]?.label || person.gender}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 dark:bg-gray-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                          {COUNTRY_FLAGS[person.country.replace(/^[a-z]+/, '')] || '🌐'}
                          {person.country.replace(/^[a-z]+/, '')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300 font-mono">{person.phone || '—'}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">{person.city || '—'}</td>
                      <td className="px-4 py-3.5 text-right pr-4">
                        <div className="relative inline-block">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); setActionMenuOpen(actionMenuOpen === person.subject_id ? null : person.subject_id); }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="More actions"
                          >
                            <MoreHorizontal size={18} />
                          </motion.button>
                          <AnimatePresence>
                            {actionMenuOpen === person.subject_id && (
                              <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10"
                              >
                                <button
                                  onClick={(e) => { e.stopPropagation(); openEditModal(person); setActionMenuOpen(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Edit size={16} />
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); confirmDelete(person); setActionMenuOpen(null); }}
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
        <div className="px-4 py-3 border-t border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50">
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
              <span>of {filteredAndSortedPersons.length} persons</span>
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
              <span className="px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-gray-800 rounded-lg min-w-[3rem] text-center">
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
        onClose={() => { setModalOpen(false); reset(); setEditingPerson(null); }}
        title={editingPerson ? 'Edit Person' : 'Add Person'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Subject ID" error={errors.subject_id?.message} helperText="Format: SUBJ-YYYY-NNNN" {...register('subject_id')} disabled={!!editingPerson} />
            <FormField label="First Name" error={errors.first_name?.message} {...register('first_name')} />
            <FormField label="Last Name" error={errors.last_name?.message} {...register('last_name')} />
            <FormField label="Date of Birth" type="date" error={errors.dob?.message} {...register('dob')} />
            <FormField
              label="Gender"
              select
              options={[
                { value: 'M', label: 'Male (M)' },
                { value: 'F', label: 'Female (F)' },
                { value: 'O', label: 'Other (O)' },
                { value: 'U', label: 'Unknown (U)' },
              ]}
              error={errors.gender?.message}
              {...register('gender')}
            />
            <FormField label="Phone" error={errors.phone?.message} placeholder="555-0101" {...register('phone')} />
            <FormField label="Country" error={errors.country?.message} {...register('country')} />
            <FormField label="Street Address" {...register('street_address')} />
            <FormField label="City" {...register('city')} />
            <FormField label="State" {...register('state')} />
            <FormField label="ZIP Code" {...register('zip_code')} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => { setModalOpen(false); reset(); setEditingPerson(null); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting} leftIcon={isSubmitting ? undefined : <Loader2 className="w-4 h-4 animate-spin" />}>
              {editingPerson ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Person"
        size="sm"
      >
        <p className="text-gray-600 dark:text-gray-300 mb-4">Are you sure you want to delete <strong>{deleteConfirm?.first_name} {deleteConfirm?.last_name}</strong> ({deleteConfirm?.subject_id})? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </motion.div>
  );
}