import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../api';
import { Plus, Loader2, Copy, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const labMessageSchema = z.object({
  specimenIds: z.array(z.string()).min(1, 'At least one specimen required'),
  requestedTests: z.array(z.object({
    loinc: z.string().min(1, 'LOINC code required'),
    description: z.string().optional(),
  })).min(1, 'At least one test required'),
  priority: z.enum(['routine', 'urgent', 'stat']),
  submitterName: z.string().optional(),
});

type LabMessageForm = z.infer<typeof labMessageSchema>;

interface Specimen {
  specimen_id: string;
  subject_id: string;
  first_name: string | null;
  last_name: string | null;
  specimen_type: string;
  collection_date: string;
}

export function LabMessagePage() {
  const [specimens, setSpecimens] = useState<Specimen[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<LabMessageForm>({
    resolver: zodResolver(labMessageSchema),
    defaultValues: {
      specimenIds: [],
      requestedTests: [{ loinc: '', description: '' }],
      priority: 'routine',
      submitterName: '',
    },
  });

  const fetchSpecimens = async () => {
    try {
      const response = await api.get('/specimens');
      setSpecimens(response.data.data);
    } catch (err) {
      console.error('Failed to fetch specimens');
    }
  };

  useEffect(() => {
    fetchSpecimens();
  }, []);

  const selectedSpecimenIds = watch('specimenIds');
  const requestedTests = watch('requestedTests');

  const handleSpecimenToggle = (specimenId: string) => {
    const current = selectedSpecimenIds;
    if (current.includes(specimenId)) {
      setValue('specimenIds', current.filter(id => id !== specimenId));
    } else {
      setValue('specimenIds', [...current, specimenId]);
    }
  };

  const addTest = () => {
    setValue('requestedTests', [...requestedTests, { loinc: '', description: '' }]);
  };

  const removeTest = (index: number) => {
    if (requestedTests.length <= 1) return;
    setValue('requestedTests', requestedTests.filter((_, i) => i !== index));
  };

  const updateTest = (index: number, field: 'loinc' | 'description', value: string) => {
    const updated = [...requestedTests];
    updated[index] = { ...updated[index], [field]: value };
    setValue('requestedTests', updated);
  };

  const onSubmit = async (data: LabMessageForm) => {
    setGenerating(true);
    try {
      const response = await api.post('/lab/message', data);
      setGeneratedMessage(response.data.data);
      toast.success('Lab message generated');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to generate message');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedMessage) {
      navigator.clipboard.writeText(JSON.stringify(generatedMessage, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied to clipboard');
    }
  };

  const downloadJson = () => {
    if (generatedMessage) {
      const blob = new Blob([JSON.stringify(generatedMessage, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lab-request-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloaded');
    }
  };

  const handlePreviewPayload = () => {
    toast('Fill out the form and submit to preview the payload.', { icon: 'ℹ️', style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } });
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-2xl font-bold text-white">Outbound Lab Message</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Left Column: Form Container */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 flex-1 flex flex-col overflow-y-auto pr-2 custom-scrollbar">
            {/* Select Specimens */}
            <section className="shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-slate-100">Select Specimens</h3>
                {selectedSpecimenIds.length > 0 && (
                  <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/30">
                    {selectedSpecimenIds.length} Selected
                  </span>
                )}
              </div>
              
              <div className="max-h-64 overflow-y-auto border border-slate-700 rounded-xl bg-slate-800/40 custom-scrollbar">
                {specimens.length === 0 ? (
                  <p className="p-8 text-center text-slate-500">No specimens available</p>
                ) : (
                  <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-800/80 sticky top-0 z-10 border-b border-slate-700 backdrop-blur-md">
                      <tr>
                        <th className="px-4 py-3 text-left w-12">
                          <input 
                            type="checkbox" 
                            onChange={e => e.target.checked ? setValue('specimenIds', specimens.map(s => s.specimen_id)) : setValue('specimenIds', [])} 
                            className="rounded border-slate-600 bg-slate-700/50 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-slate-800" 
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Specimen</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Collected</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {specimens.map(specimen => (
                        <tr key={specimen.specimen_id} className="hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => handleSpecimenToggle(specimen.specimen_id)}>
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedSpecimenIds.includes(specimen.specimen_id)}
                              onChange={() => handleSpecimenToggle(specimen.specimen_id)}
                              className="rounded border-slate-600 bg-slate-700/50 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-slate-800"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <code className="w-max px-2 py-0.5 bg-slate-950 text-blue-400 rounded-md text-xs border border-slate-800 font-mono">
                                {specimen.specimen_id}
                              </code>
                              <span className="text-sm text-slate-300">
                                {specimen.first_name} {specimen.last_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20 whitespace-nowrap">
                              {specimen.specimen_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-400">
                            {specimen.collection_date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Requested Tests */}
            <section className="shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-slate-100">Requested Tests</h3>
                <button type="button" onClick={addTest} className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  <Plus size={16} /> Add Test
                </button>
              </div>
              <div className="space-y-3">
                {requestedTests.map((test, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 border border-slate-700/80 rounded-xl bg-slate-800/30">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">LOINC Code</label>
                      <input
                        className="w-full bg-slate-800/80 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-lg px-3 py-2 sm:text-sm placeholder-slate-500 transition-shadow"
                        value={test.loinc}
                        onChange={(e) => updateTest(index, 'loinc', e.target.value)}
                        placeholder="e.g., 1234-5"
                      />
                      {errors.requestedTests?.[index]?.loinc?.message && (
                        <p className="mt-1.5 text-xs text-rose-400">{errors.requestedTests[index]?.loinc?.message}</p>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                      <input
                        className="w-full bg-slate-800/80 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-lg px-3 py-2 sm:text-sm placeholder-slate-500 transition-shadow"
                        value={test.description}
                        onChange={(e) => updateTest(index, 'description', e.target.value)}
                        placeholder="e.g., Salmonella culture"
                      />
                    </div>
                    {requestedTests.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTest(index)}
                        className="text-slate-400 hover:text-rose-400 p-2 mt-7 rounded-lg hover:bg-rose-400/10 transition-colors"
                        aria-label="Remove test"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Priority & Submitter */}
            <section className="shrink-0 mb-4">
              <h3 className="text-lg font-medium text-slate-100 mb-4">Priority & Submitter</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Priority</label>
                  <div className="relative">
                    <select
                      className="w-full bg-slate-800/80 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-lg px-3 py-2 sm:text-sm appearance-none transition-shadow"
                      {...register('priority')}
                    >
                      <option value="routine">Routine</option>
                      <option value="urgent">Urgent</option>
                      <option value="stat">STAT</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                    </div>
                  </div>
                  {errors.priority?.message && (
                    <p className="mt-1.5 text-xs text-rose-400">{errors.priority.message}</p>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Submitter Name</label>
                  <input
                    className="w-full bg-slate-800/80 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-lg px-3 py-2 sm:text-sm placeholder-slate-500 pr-24 transition-shadow"
                    {...register('submitterName')}
                    placeholder="Name"
                  />
                  <div className="absolute right-2 top-[2rem] flex items-center">
                    <span className="px-1.5 py-0.5 bg-slate-700/80 text-slate-300 text-[10px] uppercase font-bold rounded-md tracking-wider border border-slate-600">Auto-filled</span>
                  </div>
                </div>
              </div>
            </section>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-800 mt-auto shrink-0">
              <button 
                type="button" 
                onClick={handlePreviewPayload}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 border border-slate-700 transition-colors font-medium text-sm"
              >
                Preview Payload
              </button>
              <button 
                type="submit" 
                disabled={generating || selectedSpecimenIds.length === 0} 
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 font-medium text-sm"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate & Send Lab Message'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Message Preview Panel */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col h-[600px] lg:h-auto">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="text-lg font-medium text-slate-100">Live Payload Preview</h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={copyToClipboard} 
                disabled={!generatedMessage}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Copy size={14} />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button 
                onClick={downloadJson} 
                disabled={!generatedMessage}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={14} />
                <span>Download</span>
              </button>
            </div>
          </div>
          
          <div className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-hidden flex flex-col relative min-h-0">
            <div className="flex-1 overflow-auto custom-scrollbar">
              {generatedMessage ? (
                <pre className="font-mono text-xs text-emerald-400 leading-relaxed">
                  {JSON.stringify(generatedMessage, null, 2)}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 font-mono text-sm opacity-60">
                  // Submit the form to preview the HL7 v2/FHIR JSON payload
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}