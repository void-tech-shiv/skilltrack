import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MoreHorizontal, FileDown, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

export default function Trainees() {
  const [trainees, setTrainees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [district, setDistrict] = useState('ALL');
  
  const { token } = useAuth();
  const navigate = useNavigate();

  const fetchTrainees = useCallback(() => {
    if (!token) return;
    setLoading(true);

    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (search.trim()) params.append('search', search.trim());
    if (status !== 'ALL') params.append('status', status);
    if (district !== 'ALL') params.append('district', district);

    fetch(`${API_BASE_URL}/trainees?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.trainees) {
          setTrainees(data.trainees);
          if (data.pagination) {
            setTotal(data.pagination.total);
            setTotalPages(data.pagination.totalPages);
          } else {
            setTotal(data.trainees.length);
            setTotalPages(1);
          }
        } else if (Array.isArray(data)) {
          setTrainees(data);
          setTotal(data.length);
          setTotalPages(1);
        } else {
          setTrainees([]);
          setTotal(0);
          setTotalPages(1);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching trainees:', err);
        setLoading(false);
      });
  }, [token, page, pageSize, search, status, district]);

  useEffect(() => {
    fetchTrainees();
  }, [fetchTrainees]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    setPage(1);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDistrict(e.target.value);
    setPage(1);
  };

  const startEntry = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endEntry = Math.min(page * pageSize, total);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Learners Roster</h2>
          <p className="text-sm text-slate-500">Manage and track longitudinal learning and employment outcomes for all enrolled learners.</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8," + 
                ["Canonical ID,Name,District,Status"].concat(
                  trainees.map((t: any) => `${t.canonicalId},${t.firstName} ${t.lastName},${t.district || ''},${t.outcomes?.[0]?.status || 'ENROLLED'}`)
                ).join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `learners_page_${page}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex items-center px-4 py-2 border border-slate-300 rounded text-sm font-medium hover:bg-slate-50 bg-white"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button 
            onClick={() => navigate('/upload')}
            className="flex items-center px-4 py-2 bg-blue-700 text-white rounded text-sm font-medium hover:bg-blue-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Import Records
          </button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between bg-slate-50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by ID, name, or phone..." 
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select 
                value={status}
                onChange={handleStatusChange}
                className="px-3 py-2 border border-slate-300 rounded text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="EMPLOYED">Employed</option>
                <option value="TRAINING">In Training</option>
                <option value="APPRENTICESHIP">Apprenticeship</option>
                <option value="UNEMPLOYED">Unemployed</option>
                <option value="DROPPED">Dropped</option>
                <option value="STUDYING">Studying</option>
                <option value="SELF_EMPLOYED">Self Employed</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <select 
                value={district}
                onChange={handleDistrictChange}
                className="px-3 py-2 border border-slate-300 rounded text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Districts</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Pune">Pune</option>
                <option value="Nagpur">Nagpur</option>
                <option value="Thane">Thane</option>
                <option value="Nashik">Nashik</option>
                <option value="Aurangabad">Aurangabad</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Learner ID</th>
                <th className="px-6 py-3">Learner Name</th>
                <th className="px-6 py-3">District</th>
                <th className="px-6 py-3">Program</th>
                <th className="px-6 py-3">Provider</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Last Update</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-500">Loading trainees...</td></tr>
              ) : trainees.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-500">No trainees found matching the criteria</td></tr>
              ) : trainees.map((t: any) => {
                const latestEnrollment = t.enrollments?.[0];
                const programName = latestEnrollment?.batch?.course?.name || 'N/A';
                const providerName = latestEnrollment?.batch?.provider?.name || 'N/A';
                
                const latestOutcome = t.outcomes?.[0];
                const displayStatus = latestOutcome?.status || latestEnrollment?.status || 'UNKNOWN';

                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td 
                      className="px-6 py-4 font-medium text-blue-600 cursor-pointer hover:underline"
                      onClick={() => navigate(`/trainees/${t.id}`)}
                    >
                      {t.canonicalId}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{t.firstName} {t.lastName}</td>
                    <td className="px-6 py-4 text-slate-600">{t.district || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-600">{programName}</td>
                    <td className="px-6 py-4 text-slate-600">{providerName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        displayStatus === 'EMPLOYED' || displayStatus === 'SELF_EMPLOYED' ? 'bg-green-100 text-green-800' :
                        displayStatus === 'TRAINING' || displayStatus === 'STUDYING' ? 'bg-blue-100 text-blue-800' :
                        displayStatus === 'APPRENTICESHIP' ? 'bg-purple-100 text-purple-800' :
                        displayStatus === 'DROPPED' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {displayStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right text-slate-500">
                      <button 
                        onClick={() => navigate(`/trainees/${t.id}`)}
                        className="hover:bg-slate-100 p-1.5 rounded text-slate-600 hover:text-slate-900"
                        title="View Profile"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-600 gap-3">
          <div>
            Showing <span className="font-semibold text-slate-800">{startEntry}</span> to <span className="font-semibold text-slate-800">{endEntry}</span> of <span className="font-semibold text-slate-800">{total}</span> entries
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setPage((p: number) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="flex items-center px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-100 bg-white disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            <span className="text-xs px-2 text-slate-500 font-medium">
              Page {page} of {totalPages}
            </span>
            <button 
              onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="flex items-center px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-100 bg-white disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
