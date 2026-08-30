import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Briefcase, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuth();

  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE_URL}/analytics/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.metrics) {
          setData(result);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-500">Loading State Analytics...</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-lg shadow-sm border border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
              STATE OUTCOMES INTELLIGENCE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {user?.role === 'TRAINING_PROVIDER' ? `${user.organizationName} Performance Dashboard` : 'Government of Maharashtra State Overview'}
          </h1>
          <p className="text-sm text-slate-600">
            Real-time tracking of skilling outcomes, wage progression, retention curves & non-placement taxonomy.
          </p>
        </div>

        <div className="flex space-x-2">
          <select className="border border-slate-300 rounded px-3 py-2 text-xs font-medium bg-white">
            <option>All Divisions</option>
            <option>Pune Division</option>
            <option>Mumbai Division</option>
          </select>
          <select className="border border-slate-300 rounded px-3 py-2 text-xs font-medium bg-white">
            <option>All Districts</option>
            <option>Pune</option>
            <option>Mumbai</option>
            <option>Nagpur</option>
            <option>Thane</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Registered Learners</h3>
            <Users className="h-5 w-5 text-blue-900" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{data.metrics.totalTrainees.toLocaleString()}</div>
          <p className="text-xs text-emerald-700 font-medium mt-1">Across 6 Key Districts</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Placements</h3>
            <Briefcase className="h-5 w-5 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{data.metrics.totalPlaced?.toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-1">
            Emp: {data.metrics.employed} • Self: {data.metrics.selfEmployed} • Appr: {data.metrics.apprenticeship}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Placement Success Rate</h3>
            <TrendingUp className="h-5 w-5 text-blue-700" />
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-2">{data.metrics.placementRate}%</div>
          <p className="text-xs text-slate-500 mt-1">Avg Salary: ₹{data.metrics.avgSalary?.toLocaleString()}/mo</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Remedial Attention Needed</h3>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{data.metrics.dropped?.toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-1">Dropout cohorts flagged for counseling</p>
        </div>
      </div>

      {/* Charts Row 1: Placement Trends & Non-Placement Breakdown */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 text-base mb-1">Monthly Placement Trends & Targets</h3>
          <p className="text-xs text-slate-500 mb-4">Actual verified employment placements vs. quarterly state milestones.</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} textAnchor="middle" />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="placement" name="Placed Learners" stroke="#1e3a8a" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="target" name="State Target" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Structured Non-Placement Taxonomy (PS #26135) */}
        <div className="col-span-3 bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 text-base mb-1">Non-Placement Root Causes</h3>
          <p className="text-xs text-slate-500 mb-4">Structured taxonomy of why trainees did not transition to immediate employment.</p>
          <div className="space-y-3">
            {data.nonPlacementTaxonomy?.map((item: any, idx: number) => (
              <div key={item.reason} className="text-xs">
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>{item.reason}</span>
                  <span className="font-bold text-blue-900">{item.count} Candidates</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (item.count / 10) * 100)}%`,
                      backgroundColor: COLORS[idx % COLORS.length]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2: Retention Curves & Skill Gap Demand vs Supply */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Retention Checkpoints (PS #26135) */}
        <div className="col-span-4 bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 text-base mb-1">Longitudinal Job Retention Checkpoints</h3>
          <p className="text-xs text-slate-500 mb-4">Tracking verified employee retention at Initial, 3-Month, 6-Month & 12-Month milestones.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(data.retentionDistribution || {}).map(([key, val]: any) => (
              <div key={key} className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                <h4 className="text-xs font-semibold text-slate-600">{key}</h4>
                <div className="text-2xl font-bold text-blue-900 mt-1">{val}</div>
                <p className="text-[10px] text-emerald-700 font-semibold mt-1">Verified Active</p>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Gap Analysis */}
        <div className="col-span-3 bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 text-base mb-1">Skill Gap Index (Demand vs Supply)</h3>
          <p className="text-xs text-slate-500 mb-4">Trained cohort supply vs industrial hiring requisition volume.</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.skillGaps} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={90} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="demand" name="Market Demand" fill="#0f172a" radius={[0, 4, 4, 0]} />
                <Bar dataKey="supply" name="Trained Supply" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Provider Comparative Performance Leaderboard */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Training Provider Comparative Leaderboard</h3>
            <p className="text-xs text-slate-500">
              Government performance scoring across batches, completion rates, and verified outcome placement rates.
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">
            Ranked by Placement Efficiency
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Provider Organization</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Batches</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Total Enrolled</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Completed</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Verified Placements</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Placement Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {data.providerLeaderboard?.map((p: any) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-sm font-bold text-slate-900">{p.name}</td>
                  <td className="px-4 py-3 text-center text-sm text-slate-700">{p.totalBatches}</td>
                  <td className="px-4 py-3 text-center text-sm text-slate-700">{p.totalEnrolled}</td>
                  <td className="px-4 py-3 text-center text-sm text-emerald-700 font-semibold">{p.totalCompleted}</td>
                  <td className="px-4 py-3 text-center text-sm text-blue-900 font-bold">{p.totalPlaced}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-900 font-bold rounded text-xs">
                      {p.placementRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
