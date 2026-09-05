import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, Calendar, CheckCircle, CheckCircle2, AlertTriangle, UserCheck, Check, XCircle } from 'lucide-react';

export default function AttendanceView({ token, currentUser }) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clockLoading, setClockLoading] = useState(false);
  const [clockNotes, setClockNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [approvingId, setApprovingId] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Digital clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/erp/hcm/attendance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch attendance records');
      }
      const data = await response.json();
      const records = Array.isArray(data) ? data : (data.records || []);
      setAttendanceRecords(records);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (recordId) => {
    setApprovingId(recordId);
    setActionFeedback(null);
    try {
      const response = await fetch(`/api/erp/hcm/attendance/${recordId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'approved' })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve attendance record');
      }

      setAttendanceRecords((prev) =>
        prev.map((rec) =>
          rec._id === recordId
            ? { ...rec, approvalStatus: 'approved', approvedAt: new Date() }
            : rec
        )
      );

      setActionFeedback({
        type: 'success',
        message: 'Attendance record approved successfully!'
      });
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Failed to approve record'
      });
    } finally {
      setApprovingId(null);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [token]);

  // Determine if active user is currently clocked in
  const myActiveSession = attendanceRecords.find(
    (rec) => (rec.staffId?._id === currentUser?._id || rec.staffId === currentUser?._id) && !rec.clockOut
  );

  const handleClockToggle = async () => {
    setClockLoading(true);
    setError('');
    try {
      const response = await fetch('/api/erp/hcm/attendance/clock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          staffId: currentUser?._id,
          action: myActiveSession ? 'clockOut' : 'clockIn',
          notes: clockNotes
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Clock operation failed');
      }

      setClockNotes('');
      await fetchAttendance();
    } catch (err) {
      setError(err.message);
    } finally {
      setClockLoading(false);
    }
  };

  // Metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter(
    (r) => new Date(r.date || r.clockIn).toISOString().split('T')[0] === todayStr
  );
  const presentCount = todayRecords.filter((r) => r.status === 'present' || r.status === 'late').length;
  const lateCount = todayRecords.filter((r) => r.status === 'late').length;
  const totalHoursWorked = attendanceRecords.reduce((acc, r) => acc + (r.totalHours || 0), 0);

  return (
    <div className="space-y-6">
      {/* Clocking Widget & Live Time Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-lg p-6 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-300">Live Attendance Terminal</span>
            </div>
            <span className="text-xs bg-slate-700/60 border border-slate-600 px-2.5 py-1 rounded-full text-slate-300">
              {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="my-6 text-center md:text-left">
            <div className="text-4xl md:text-5xl font-extrabold tracking-tight text-white font-mono">
              {currentTime.toLocaleTimeString()}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {myActiveSession
                ? `Clocked In since ${new Date(myActiveSession.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Not currently clocked in'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-700/60">
            <input
              type="text"
              placeholder="Optional session notes (e.g. HQ Front Desk)..."
              value={clockNotes}
              onChange={(e) => setClockNotes(e.target.value)}
              className="flex-1 w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={handleClockToggle}
              disabled={clockLoading}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-md text-sm font-bold shadow-md transition flex items-center justify-center space-x-2 ${
                myActiveSession
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
              }`}
            >
              {myActiveSession ? (
                <>
                  <LogOut className="w-4 h-4" />
                  <span>{clockLoading ? 'Clocking Out...' : 'Clock Out Now'}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{clockLoading ? 'Clocking In...' : 'Clock In Now'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Present Today</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{presentCount} Staff</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Late Arrivals</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{lateCount}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Recorded Hours</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{totalHoursWorked.toFixed(1)} hrs</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Logs Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Attendance & Timesheet Logs</span>
          </h2>
          <span className="text-xs text-slate-500">{attendanceRecords.length} Entries</span>
        </div>

        {actionFeedback && (
          <div className={`mx-4 mt-4 p-3 rounded-lg border text-xs flex items-center justify-between shadow-xs ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <span className="font-medium flex items-center gap-1.5">
              {actionFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
              {actionFeedback.message}
            </span>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-slate-400 hover:text-slate-600 font-bold ml-2 text-sm leading-none"
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading attendance timesheets...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">Error: {error}</div>
        ) : attendanceRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No attendance records logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Clock In</th>
                  <th className="px-4 py-3">Clock Out</th>
                  <th className="px-4 py-3 text-right">Total Hours</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Approval</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {attendanceRecords.map((rec) => {
                  const staffName = rec.staffId?.name || 'Staff User';
                  const dept = rec.staffId?.department || 'Operations';
                  const clockInDate = rec.clockIn ? new Date(rec.clockIn) : null;
                  const clockOutDate = rec.clockOut ? new Date(rec.clockOut) : null;
                  const approvalStatus = rec.approvalStatus || 'pending';

                  return (
                    <tr key={rec._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {clockInDate ? clockInDate.toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{staffName}</div>
                        <div className="text-xs text-slate-400">{dept}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {clockInDate ? clockInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {clockOutDate ? clockOutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (
                          <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-medium">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {rec.totalHours ? `${rec.totalHours.toFixed(1)} hrs` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {rec.status === 'present' && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Present
                          </span>
                        )}
                        {rec.status === 'late' && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Late Arrival
                          </span>
                        )}
                        {rec.status === 'absent' && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">
                            Absent
                          </span>
                        )}
                        {rec.status === 'leave' && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            On Leave
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {approvalStatus === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Approved</span>
                          </span>
                        )}
                        {approvalStatus === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="w-3 h-3 text-red-600" />
                            <span>Rejected</span>
                          </span>
                        )}
                        {approvalStatus === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
                        {rec.notes || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {approvalStatus === 'pending' ? (
                          <button
                            onClick={() => handleApprove(rec._id)}
                            disabled={approvingId === rec._id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs transition disabled:opacity-50"
                          >
                            <Check className="w-3 h-3" />
                            <span>{approvingId === rec._id ? 'Approving...' : 'Approve'}</span>
                          </button>
                        ) : approvalStatus === 'approved' ? (
                          <span className="text-xs text-emerald-700 font-medium flex items-center justify-end gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="text-xs text-red-600 font-medium">Declined</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
