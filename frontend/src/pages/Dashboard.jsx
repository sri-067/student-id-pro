import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState({ students: 0, verifications: 0, active: 0 });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const [studentsRes, logsRes] = await Promise.all([
        API.get("/api/students?limit=1000"),
        API.get("/api/logs?limit=5")
      ]);
      
      const students = studentsRes.data.students || [];
      const logs = logsRes.data.logs || [];
      
      setStats({
        students: students.length,
        verifications: logs.length,
        active: students.filter(s => s.status === 'active').length
      });
      setRecentLogs(logs);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium opacity-90">Total Students</h3>
                <p className="text-3xl font-bold mt-2">{loading ? '...' : stats.students}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <i className="fas fa-users text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium opacity-90">Recent Verifications</h3>
                <p className="text-3xl font-bold mt-2">{loading ? '...' : stats.verifications}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <i className="fas fa-check-circle text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium opacity-90">Active QR Codes</h3>
                <p className="text-3xl font-bold mt-2">{loading ? '...' : stats.active}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <i className="fas fa-qrcode text-2xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/students" className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="bg-blue-500 p-2 rounded-lg mr-3">
                <i className="fas fa-users text-white"></i>
              </div>
              <div>
                <p className="font-medium text-gray-900">Manage Students</p>
                <p className="text-sm text-gray-600">Add, edit, or remove students</p>
              </div>
            </Link>

            <Link to="/logs" className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <div className="bg-green-500 p-2 rounded-lg mr-3">
                <i className="fas fa-chart-line text-white"></i>
              </div>
              <div>
                <p className="font-medium text-gray-900">View Logs</p>
                <p className="text-sm text-gray-600">Check verification history</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Verifications</h2>
            <Link to="/logs" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              View All →
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : recentLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No recent verifications</div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map(log => (
                <div key={log._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      log.result === 'valid' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {log.studentId?.name || 'Unknown Student'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {log.studentId?.regNo || 'No Reg No'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      log.result === 'valid' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {log.result}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.scannedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
