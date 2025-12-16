import React, { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  async function load() {
    setLoading(true);
    try {
      const res = await API.get("/api/logs", { params: { limit: 100 } });
      setLogs(res.data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function exportCsv() {
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/logs?export=csv&limit=1000`, "_blank");
  }

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.result === filter;
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Verification Logs</h1>
          <button 
            onClick={exportCsv} 
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <i className="fas fa-download"></i>
            Export CSV
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filter by result:</span>
            <div className="flex gap-2">
              {['all', 'valid', 'invalid', 'expired'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            <div className="ml-auto text-sm text-gray-500">
              Showing {filteredLogs.length} of {logs.length} logs
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <i className="fas fa-chart-bar text-blue-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-xl font-semibold">{logs.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <i className="fas fa-check-circle text-green-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valid</p>
                <p className="text-xl font-semibold text-green-600">
                  {logs.filter(l => l.result === 'valid').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="bg-red-100 p-2 rounded-lg mr-3">
                <i className="fas fa-times-circle text-red-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Invalid</p>
                <p className="text-xl font-semibold text-red-600">
                  {logs.filter(l => l.result === 'invalid').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                <i className="fas fa-clock text-yellow-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-xl font-semibold text-yellow-600">
                  {logs.filter(l => l.result === 'expired').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500">Loading logs...</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500">No logs found</td></tr>
                ) : (
                  filteredLogs.map(l => (
                    <tr key={l._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            {new Date(l.scannedAt).toLocaleDateString()}
                          </div>
                          <div className="text-gray-500">
                            {new Date(l.scannedAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-gray-600 font-medium text-xs">
                              {l.studentId?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {l.studentId?.name || 'Unknown Student'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {l.studentId?.regNo || 'No Reg No'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          l.result === 'valid' 
                            ? 'bg-green-100 text-green-800'
                            : l.result === 'expired'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {l.result}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {l.ip}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}