import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function Verify() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/verify/${token}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'invalid' }));
          setErr(body.error || 'Verification failed');
          return;
        }
        const body = await res.json();
        setData(body);
      } catch (e) {
        setErr('Network error');
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying QR Code...</p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md mx-4">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
          <p className="text-red-600 mb-4">{err}</p>
          <div className="text-sm text-gray-500">
            Please contact the administrator if you believe this is an error.
          </div>
        </div>
      </div>
    );
  }

  const isValid = data.status === 'success';
  const isExpired = data.status === 'expired';

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isValid ? 'bg-gradient-to-br from-green-50 to-emerald-100' :
      isExpired ? 'bg-gradient-to-br from-yellow-50 to-orange-100' :
      'bg-gradient-to-br from-red-50 to-pink-100'
    }`}>
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className={`p-6 text-center ${
          isValid ? 'bg-green-500' :
          isExpired ? 'bg-yellow-500' :
          'bg-red-500'
        }`}>
          <div className="mx-auto h-16 w-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3">
            {isValid ? (
              <i className="fas fa-check-circle text-white text-2xl"></i>
            ) : isExpired ? (
              <i className="fas fa-clock text-white text-2xl"></i>
            ) : (
              <i className="fas fa-times-circle text-white text-2xl"></i>
            )}
          </div>
          <h2 className="text-xl font-bold text-white">
            {isValid ? 'Valid ID' : isExpired ? 'Expired ID' : 'Invalid ID'}
          </h2>
        </div>

        {/* Student Info */}
        <div className="p-6">
          <div className="text-center mb-6">
            {data.photoUrl ? (
              <img 
                src={data.photoUrl} 
                alt="Student Photo" 
                className="w-24 h-24 object-cover rounded-full mx-auto mb-4 border-4 border-gray-200"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className="h-24 w-24 bg-gray-200 rounded-full mx-auto mb-4 border-4 border-gray-200 flex items-center justify-center" style={{display: data.photoUrl ? 'none' : 'flex'}}>
              <i className="fas fa-user text-gray-400 text-3xl"></i>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{data.name}</h3>
            <p className="text-gray-600 mb-4">{data.regNo}</p>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Department</span>
              <span className="font-medium text-gray-900">{data.department}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Year</span>
              <span className="font-medium text-gray-900">{data.year}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                isValid ? 'bg-green-100 text-green-800' :
                isExpired ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {data.status}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Issued</span>
              <span className="font-medium text-gray-900">
                {new Date(data.issuedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Expires</span>
              <span className="font-medium text-gray-900">
                {new Date(data.expiry).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              Verified at {new Date().toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Student ID Verification System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}