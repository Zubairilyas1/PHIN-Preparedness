import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../api';
import { FormField } from '../components/FormField';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { Plus, Edit, Trash2, Loader2, Search, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const contactSchema = z.object({
  contact_subject_id: z.string().regex(/^SUBJ-\d{4}-\d{4}$/, 'Format: SUBJ-YYYY-NNNN'),
  case_subject_id: z.string().regex(/^SUBJ-\d{4}-\d{4}$/, 'Format: SUBJ-YYYY-NNNN'),
  event_id: z.string().regex(/^EVT-\d{4}-\d{3}$/, 'Format: EVT-YYYY-NNN'),
  exposure_type: z.enum(['intimate', 'social', 'household', 'conveyance', 'environmental', 'occupational']).optional(),
  exposure_start: z.string().optional(),
  exposure_end: z.string().optional(),
  proximity: z.enum(['direct', 'close', 'casual', 'unknown']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  status: z.enum(['identified', 'notified', 'interviewed', 'monitoring', 'released']).optional(),
  notes: z.string().optional(),
});

type ContactForm = z.infer<typeof contactSchema>;

interface Contact {
  id: number;
  contact_subject_id: string;
  case_subject_id: string;
  event_id: string;
  exposure_type: string | null;
  exposure_start: string | null;
  exposure_end: string | null;
  proximity: string | null;
  priority: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  contact_first: string | null;
  contact_last: string | null;
  case_first: string | null;
  case_last: string | null;
  event_name: string | null;
}

interface ContactCaseView {
  contact_subject_id: string;
  case_count: number;
  cases: Array<{
    case_subject_id: string;
    case_name: string;
    event_id: string;
    event_name: string;
    exposure_type: string | null;
    proximity: string | null;
    priority: string | null;
    status: string;
  }>;
}

export function ContactsPage() {
  const [searchParams] = useSearchParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [persons, setPersons] = useState<{ subject_id: string; first_name: string; last_name: string }[]>([]);
  const [events, setEvents] = useState<{ event_id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Contact | null>(null);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'list' | 'contact-cases'>('list');
  const [selectedContact, setSelectedContact] = useState<ContactCaseView | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      contact_subject_id: '',
      case_subject_id: '',
      event_id: '',
      exposure_type: 'household',
      exposure_start: '',
      exposure_end: '',
      proximity: 'direct',
      priority: 'high',
      status: 'identified',
      notes: '',
    },
  });

  // Handle deep link /trace/link?contact=SUB-102&event=EVT-999
  useEffect(() => {
    const contactParam = searchParams.get('contact');
    const eventParam = searchParams.get('event');
    if (contactParam && eventParam) {
      reset({
        contact_subject_id: contactParam,
        event_id: eventParam,
        case_subject_id: '',
        exposure_type: 'household',
        exposure_start: '',
        exposure_end: '',
        proximity: 'direct',
        priority: 'high',
        status: 'identified',
        notes: '',
      });
      setModalOpen(true);
    }
  }, [searchParams, reset]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contactsRes, personsRes, eventsRes] = await Promise.all([
        api.get('/contacts'),
        api.get('/persons'),
        api.get('/events'),
      ]);
      setContacts(contactsRes.data.data);
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
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const onSubmit = async (data: ContactForm) => {
    try {
      if (editingContact) {
        await api.put(`/contacts/${editingContact.id}`, data as ContactForm);
        toast.success('Contact updated');
      } else {
        await api.post('/contacts', data as ContactForm);
        toast.success('Contact exposure recorded');
      }
      setModalOpen(false);
      reset();
      setEditingContact(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Save failed');
    }
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    reset({
      contact_subject_id: contact.contact_subject_id,
      case_subject_id: contact.case_subject_id,
      event_id: contact.event_id,
      exposure_type: contact.exposure_type || 'household',
      exposure_start: contact.exposure_start?.slice(0, 16) || '',
      exposure_end: contact.exposure_end?.slice(0, 16) || '',
      proximity: contact.proximity || 'direct',
      priority: contact.priority || 'high',
      status: contact.status || 'identified',
      notes: contact.notes || '',
    });
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingContact(null);
    reset({
      contact_subject_id: '',
      case_subject_id: '',
      event_id: '',
      exposure_type: 'household',
      exposure_start: '',
      exposure_end: '',
      proximity: 'direct',
      priority: 'high',
      status: 'identified',
      notes: '',
    });
    setModalOpen(true);
  };

  const viewContactCases = async (contactSubjectId: string) => {
    try {
      const response = await api.get(`/contacts/contact/${contactSubjectId}`);
      setSelectedContact(response.data.data);
      setViewMode('contact-cases');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to fetch contact cases');
    }
  };

  const confirmDelete = (contact: Contact) => setDeleteConfirm(contact);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/contacts/${deleteConfirm.id}`);
      toast.success('Contact deleted');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>{priority}</span>;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      identified: 'bg-gray-100 text-gray-800',
      notified: 'bg-blue-100 text-blue-800',
      interviewed: 'bg-purple-100 text-purple-800',
      monitoring: 'bg-yellow-100 text-yellow-800',
      released: 'bg-green-100 text-green-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  const contactCaseCounts = new Map<string, number>();
  contacts.forEach(c => {
    const count = (contactCaseCounts.get(c.contact_subject_id) || 0) + 1;
    contactCaseCounts.set(c.contact_subject_id, count);
  });

  const listColumns = [
    { key: 'contact_subject_id', header: 'Contact', sortable: true, render: (row: Contact) => `${row.contact_first} ${row.contact_last} (${row.contact_subject_id})` },
    { key: 'case_subject_id', header: 'Case', sortable: true, render: (row: Contact) => `${row.case_first} ${row.case_last} (${row.case_subject_id})` },
    { key: 'event_id', header: 'Event', sortable: true, render: (row: Contact) => row.event_name || row.event_id },
    { key: 'exposure_type', header: 'Exposure Type', sortable: true },
    { key: 'proximity', header: 'Proximity', sortable: true },
    { key: 'priority', header: 'Priority', sortable: true, render: (row: Contact) => getPriorityBadge(row.priority) },
    { key: 'status', header: 'Status', sortable: true, render: (row: Contact) => getStatusBadge(row.status) },
    {
      key: 'case_count',
      header: 'Cases',
      sortable: false,
      render: (row: Contact) => (
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            {contactCaseCounts.get(row.contact_subject_id) || 1} cases
          </span>
          <button
            onClick={() => viewContactCases(row.contact_subject_id)}
            className="text-blue-600 hover:text-blue-800 p-1"
            aria-label="View cases"
            title="View all cases for this contact"
          >
            <Users size={14} />
          </button>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Contact) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEditModal(row)} className="text-blue-600 hover:text-blue-800 p-1" aria-label="Edit"><Edit size={16} /></button>
          <button onClick={() => confirmDelete(row)} className="text-red-600 hover:text-red-800 p-1" aria-label="Delete"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  if (viewMode === 'contact-cases' && selectedContact) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => { setViewMode('list'); setSelectedContact(null); }} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <Search size={20} />
            <span>Back to List</span>
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Contact: {selectedContact.contact_subject_id} ({selectedContact.case_count} cases)</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exposure Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proximity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedContact.cases.map((c, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 text-sm text-gray-900">{c.case_name} ({c.case_subject_id})</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{c.event_name} ({c.event_id})</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{c.exposure_type}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{c.proximity}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{getPriorityBadge(c.priority)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{getStatusBadge(c.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Contact Exposure Tracing</h2>
        <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={20} />
          <span>Add Contact</span>
        </button>
      </div>

      <DataTable
        data={contacts}
        columns={listColumns}
        keyField="id"
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        searchable
        searchPlaceholder="Search contacts..."
        loading={loading}
        emptyMessage="No contacts found"
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); reset(); setEditingContact(null); }}
        title={editingContact ? 'Edit Contact Exposure' : 'Add Contact Exposure'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Contact Subject ID"
              select
              options={persons.map(p => ({ value: p.subject_id, label: `${p.first_name} ${p.last_name} (${p.subject_id})` }))}
              error={errors.contact_subject_id?.message}
              {...register('contact_subject_id')}
              disabled={!!editingContact}
            />
            <FormField
              label="Case Subject ID"
              select
              options={persons.map(p => ({ value: p.subject_id, label: `${p.first_name} ${p.last_name} (${p.subject_id})` }))}
              error={errors.case_subject_id?.message}
              {...register('case_subject_id')}
              disabled={!!editingContact}
            />
            <FormField
              label="Event ID"
              select
              options={events.map(e => ({ value: e.event_id, label: `${e.name} (${e.event_id})` }))}
              error={errors.event_id?.message}
              {...register('event_id')}
              disabled={!!editingContact}
            />
            <FormField
              label="Exposure Type"
              select
              options={[
                { value: 'intimate', label: 'Intimate' },
                { value: 'social', label: 'Social' },
                { value: 'household', label: 'Household' },
                { value: 'conveyance', label: 'Conveyance' },
                { value: 'environmental', label: 'Environmental' },
                { value: 'occupational', label: 'Occupational' },
              ]}
              error={errors.exposure_type?.message}
              {...register('exposure_type')}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Exposure Start" type="datetime-local" {...register('exposure_start')} />
              <FormField label="Exposure End" type="datetime-local" {...register('exposure_end')} />
            </div>
            <FormField
              label="Proximity"
              select
              options={[
                { value: 'direct', label: 'Direct' },
                { value: 'close', label: 'Close' },
                { value: 'casual', label: 'Casual' },
                { value: 'unknown', label: 'Unknown' },
              ]}
              error={errors.proximity?.message}
              {...register('proximity')}
            />
            <FormField
              label="Priority"
              select
              options={[
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
              error={errors.priority?.message}
              {...register('priority')}
            />
            <FormField
              label="Status"
              select
              options={[
                { value: 'identified', label: 'Identified' },
                { value: 'notified', label: 'Notified' },
                { value: 'interviewed', label: 'Interviewed' },
                { value: 'monitoring', label: 'Monitoring' },
                { value: 'released', label: 'Released' },
              ]}
              error={errors.status?.message}
              {...register('status')}
            />
            <FormField label="Notes" textarea {...register('notes')} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => { setModalOpen(false); reset(); setEditingContact(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingContact ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Contact"
      >
        <p className="text-gray-600 mb-4">Are you sure you want to delete this contact exposure record? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}