import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function StudentPortal() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentData();
  }, []);

  async function loadStudentData() {
    try {
      const auth = JSON.parse(localStorage.getItem('studentAuth') || '{}');
      if (!auth.token) {
        navigate('/student-login');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student-portal/profile`, {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setStudent(data.student);
        setQrDataUrl(data.qrDataUrl);
      } else {
        localStorage.removeItem('studentAuth');
        navigate('/student-login');
      }
    } catch (err) {
      console.error(err);
      navigate('/student-login');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('studentAuth');
    navigate('/student-login');
  }

  function downloadQR() {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `MyID_${student.regNo}.png`;
    link.click();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-green-600 mb-4"></i>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">My Digital ID Card</h1>
          <button
            onClick={handleLogout}
            className="text-red-600 hover:text-red-800 flex items-center gap-2"
          >
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Student Info Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-6">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt="Student Photo"
                  className="w-32 h-32 object-cover rounded-full mx-auto mb-4 border-4 border-green-200"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <i className="fas fa-user text-gray-400 text-4xl"></i>
                </div>
              )}
              <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
              <p className="text-green-600 font-medium">{student.regNo}</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Department:</span>
                <span className="font-medium">{student.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Year:</span>
                <span className="font-medium">{student.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {student.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Card Expires:</span>
                <span className="font-medium">{new Date(student.cardExpiry).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* QR Code Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Your QR Code</h3>
              <div className="bg-gray-50 p-6 rounded-lg mb-4">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-200 mx-auto flex items-center justify-center">
                    <i className="fas fa-qrcode text-gray-400 text-6xl"></i>
                  </div>
                )}
              </div>
              
              <button
                onClick={downloadQR}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <i className="fas fa-download"></i>
                Download QR Code
              </button>
              
              <p className="text-sm text-gray-500 mt-4">
                Save this QR code to your phone for easy access
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            <i className="fas fa-info-circle mr-2"></i>
            How to use your Digital ID
          </h3>
          <ul className="text-blue-800 space-y-2">
            <li>• Download and save the QR code to your phone</li>
            <li>• Show the QR code when asked for ID verification</li>
            <li>• Security staff will scan it to verify your identity</li>
            <li>• Your QR code is unique and secure - don't share it</li>
          </ul>
        </div>
      </div>
    </div>
  );
}