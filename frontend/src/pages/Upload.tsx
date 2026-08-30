import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

export default function Upload() {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setJobId(null);
      setJobStatus(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/ingest/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setJobId(data.jobId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (jobId && (!jobStatus || (jobStatus.status !== 'COMPLETED' && jobStatus.status !== 'FAILED'))) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/ingest/status/${jobId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await res.json();
          if (res.ok) {
            setJobStatus(data);
          }
        } catch (err) {
          console.error("Failed to poll status", err);
        }
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [jobId, jobStatus, token]);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Upload Learner Data</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Select CSV or Excel File</label>
        <div className="flex items-center space-x-4">
          <input 
            type="file" 
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-4 py-2 bg-blue-700 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-800"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded mb-6 border border-red-200">
          <p className="font-semibold text-sm">{error}</p>
        </div>
      )}

      {jobStatus && (
        <div className="border rounded border-gray-200 p-4 bg-gray-50">
          <h3 className="font-semibold text-slate-800 mb-2">Processing Status</h3>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div><span className="text-slate-500">Status:</span> <span className={`font-medium ${jobStatus.status === 'COMPLETED' ? 'text-green-600' : jobStatus.status === 'FAILED' ? 'text-red-600' : 'text-blue-600'}`}>{jobStatus.status}</span></div>
            <div><span className="text-slate-500">File:</span> {jobStatus.fileName}</div>
            <div><span className="text-slate-500">Processed:</span> {jobStatus.processedRows} / {jobStatus.totalRows || '?'} rows</div>
            <div><span className="text-slate-500">Errors:</span> {jobStatus.errorCount}</div>
          </div>
          
          {(jobStatus.status === 'PROCESSING' || jobStatus.status === 'PENDING') && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: jobStatus.totalRows ? `${(jobStatus.processedRows / jobStatus.totalRows) * 100}%` : '5%' }}
              ></div>
            </div>
          )}

          {jobStatus.errors && jobStatus.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-red-700 text-sm mb-2">Recent Errors</h4>
              <ul className="text-xs text-red-600 space-y-1 bg-red-50 p-2 rounded max-h-40 overflow-y-auto">
                {jobStatus.errors.map((err: any, i: number) => (
                  <li key={i}>Row {err.row}: {err.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
