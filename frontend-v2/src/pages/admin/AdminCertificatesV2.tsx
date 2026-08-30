import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  QrCode,
  Search,
  ExternalLink,
  ShieldAlert,
  Clock,
  RefreshCw
} from 'lucide-react';
import { TabsNav } from '../../components/ui/TabsNav';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { QRModal } from '../../components/common/QRModal';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Certificate, CertificateApplication } from '../../types';

export const AdminCertificatesV2: React.FC = () => {
  const [activeTab, setActiveTab] = useState('applications');
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<CertificateApplication[]>([]);
  const [issuedCerts, setIssuedCerts] = useState<Certificate[]>([]);

  // Feedback states
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // QR Modal
  const [qrModalData, setQrModalData] = useState<{ isOpen: boolean; certNumber: string; recipient: string }>({
    isOpen: false,
    certNumber: '',
    recipient: '',
  });

  // Revoke Modal State
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [selectedCertId, setSelectedCertId] = useState('');
  const [revokeReason, setRevokeReason] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsRes, certsRes] = await Promise.all([
        api.get('/certificates/applications/all').catch(() => ({ applications: [] })),
        api.get('/certificates/issued/all').catch(() => ({ certificates: [] })),
      ]);

      setApplications(appsRes.applications || []);
      setIssuedCerts(certsRes.certificates || []);
    } catch (err) {
      console.error('Error fetching certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveApplication = async (appId: string) => {
    try {
      const res = await api.post(`/certificates/applications/${appId}/approve`);
      setSuccess(`Application approved! Issued Certificate ID: ${res.certificate?.certificateNumber || 'CERT-MH-SUCCESS'}`);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to approve certificate application.');
    }
  };

  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCertId || !revokeReason) return;

    try {
      await api.put(`/certificates/${selectedCertId}/revoke`, { reason: revokeReason });
      setSuccess('Certificate officially revoked with audit record.');
      setRevokeModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke certificate.');
    }
  };

  const tabs = [
    { id: 'applications', label: 'Pending Applications', icon: Clock, badge: applications.filter((a) => a.status === 'PENDING').length },
    { id: 'registry', label: 'Issued Credential Registry', icon: Award, badge: issuedCerts.length },
  ];

  // Applications table columns
  const appColumns: Column<CertificateApplication>[] = [
    {
      key: 'recipient',
      header: 'Learner Applicant',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">
            {item.trainee ? `${item.trainee.firstName} ${item.trainee.lastName}` : 'Candidate'}
          </p>
          <p className="text-xs text-slate-400 font-mono">{item.trainee?.canonicalId}</p>
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Course / Batch',
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{item.enrollment?.batch?.course?.name || 'Technical Course'}</p>
          <p className="text-[11px] text-slate-400">{item.enrollment?.batch?.name}</p>
        </div>
      ),
    },
    {
      key: 'appliedAt',
      header: 'Application Date',
      render: (item) => <span className="text-xs text-slate-600">{formatDate(item.appliedAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: 'State Decision',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end space-x-2">
          {item.status === 'PENDING' ? (
            <button
              onClick={() => handleApproveApplication(item.id)}
              className="px-3.5 py-1.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-subtle transition flex items-center space-x-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Issue Official Certificate</span>
            </button>
          ) : (
            <span className="text-xs text-slate-400 italic">Processed</span>
          )}
        </div>
      ),
    },
  ];

  // Issued registry table columns
  const certColumns: Column<Certificate>[] = [
    {
      key: 'certificateNumber',
      header: 'Certificate ID',
      render: (item) => (
        <div className="flex items-center space-x-2">
          <Award className="w-4 h-4 text-amber-500" />
          <span className="font-mono font-bold text-brand-700 text-xs">{item.certificateNumber}</span>
        </div>
      ),
    },
    {
      key: 'recipient',
      header: 'Certified Recipient',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900 text-xs">
            {item.trainee ? `${item.trainee.firstName} ${item.trainee.lastName}` : 'State Learner'}
          </p>
          <p className="text-[11px] text-slate-400">{item.trainee?.canonicalId}</p>
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Certified Course',
      render: (item) => (
        <span className="text-xs font-medium text-slate-800">{item.course?.name || 'Advanced Program'}</span>
      ),
    },
    {
      key: 'issueDate',
      header: 'Issue Date',
      render: (item) => <span className="text-xs text-slate-600">{formatDate(item.issueDate)}</span>,
    },
    {
      key: 'status',
      header: 'Registry Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() =>
              setQrModalData({
                isOpen: true,
                certNumber: item.certificateNumber,
                recipient: item.trainee ? `${item.trainee.firstName} ${item.trainee.lastName}` : 'State Learner',
              })
            }
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="View QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <a
            href={`/verify/${item.certificateNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Open Public Registry Link"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          {item.status === 'ISSUED' && (
            <button
              onClick={() => {
                setSelectedCertId(item.id);
                setRevokeModalOpen(true);
              }}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition"
            >
              Revoke
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            State Skilling Certificate Authority
          </h2>
          <p className="text-xs text-slate-500">
            Authoritative credential issuance, cryptographic indexing, and public registry controls.
          </p>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center justify-between">
          <span>✓ {success}</span>
          <button onClick={() => setSuccess(null)} className="text-emerald-900 font-bold">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-bold flex items-center justify-between">
          <span>✕ {error}</span>
          <button onClick={() => setError(null)} className="text-rose-900 font-bold">Dismiss</button>
        </div>
      )}

      <TabsNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'applications' && (
        <DataTable
          columns={appColumns}
          data={applications}
          searchPlaceholder="Search applicant by name..."
          emptyTitle="No pending applications"
          emptyDescription="All completed candidate certificate requests have been reviewed."
        />
      )}

      {activeTab === 'registry' && (
        <DataTable
          columns={certColumns}
          data={issuedCerts}
          searchPlaceholder="Search by Certificate ID or recipient..."
          emptyTitle="No certificates issued yet"
          emptyDescription="Issued credentials with tamper-evident records will appear here."
        />
      )}

      {/* QR Code Modal */}
      <QRModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData({ ...qrModalData, isOpen: false })}
        certificateNumber={qrModalData.certNumber}
        recipientName={qrModalData.recipient}
      />

      {/* Revocation Modal */}
      <Modal
        isOpen={revokeModalOpen}
        onClose={() => setRevokeModalOpen(false)}
        title="Revoke State Skilling Certificate"
        subtitle="This action will flag the credential as REVOKED in the public registry"
        maxWidth="sm"
      >
        <form onSubmit={handleRevokeSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reason for Revocation *
            </label>
            <textarea
              required
              rows={3}
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="e.g. Lab evidence falsification detected during forensic audit."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setRevokeModalOpen(false)}
              className="px-3.5 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md"
            >
              Confirm Revocation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
