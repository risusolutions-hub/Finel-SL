import React from 'react';
import { Plus, Edit2, Trash2, Ban, Unlock } from 'lucide-react';

export default function TeamView({ users, user, onNewUser, onEditUser, onDeleteUser, onBlockUser, setModal }) {
  const ROLES = ['engineer', 'manager', 'admin', 'superadmin'];
  const canManage = (actorRole, targetRole) => {
    if (!actorRole || !targetRole) return false;
    return ROLES.indexOf(actorRole) > ROLES.indexOf(targetRole);
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
        <h3 className="font-semibold text-neutral-900 text-lg">Team Management</h3>
        <div className="flex items-center gap-2">
          {user?.role !== 'engineer' && (
            <button 
              onClick={() => setModal('complaint')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-xs font-medium flex items-center gap-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors shadow-sm"
              title="Create New Ticket"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Ticket</span>
            </button>
          )}
          {canManage(user.role, 'manager') && (
            <button 
              onClick={onNewUser}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-xs font-medium flex items-center gap-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-700">
          <thead className="bg-neutral-50 text-xs uppercase font-semibold text-neutral-600 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 tracking-wider">Name</th>
              <th className="px-6 py-3 tracking-wider">Email</th>
              <th className="px-6 py-3 tracking-wider">Role</th>
              <th className="px-6 py-3 tracking-wider">Status</th>
              <th className="px-6 py-3 text-right tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {users.map((targetUser, idx) => {
              const userKey = targetUser.id || targetUser._id || `user-${idx}`;
              const userIdForApi = targetUser._id || targetUser.id;
              return (
              <tr key={userKey} className="hover:bg-neutral-50 transition-colors">
                <td className="px-6 py-3 font-medium text-neutral-900">{targetUser.name}</td>
                <td className="px-6 py-3 text-neutral-700">{targetUser.email}</td>
                <td className="px-6 py-3 capitalize">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800 border border-neutral-200">
                        {targetUser.role}
                    </span>
                </td>
                <td className="px-6 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${targetUser.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                    {targetUser.status || 'Active'}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  {canManage(user.role, targetUser.role) && (
                    <div className="flex gap-2 justify-end items-center">
                      <button 
                        onClick={() => onEditUser(targetUser)} 
                        className="p-1 hover:bg-primary-50 text-neutral-400 hover:text-primary-600 rounded transition-colors"
                        title="Edit User"
                      >
                         <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDeleteUser(userIdForApi)} 
                        className="p-1 hover:bg-red-50 text-neutral-400 hover:text-red-600 rounded transition-colors"
                        title="Delete User"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                      {(user.role === 'admin' || user.role === 'superadmin') && (
                        targetUser.status === 'active'
                          ? <button onClick={() => onBlockUser(userIdForApi, true)} className="p-1 hover:bg-amber-50 text-neutral-400 hover:text-amber-600 rounded transition-colors" title="Block User"><Ban className="w-4 h-4" /></button>
                          : <button onClick={() => onBlockUser(userIdForApi, false)} className="p-1 hover:bg-emerald-50 text-neutral-400 hover:text-emerald-600 rounded transition-colors" title="Unblock User"><Unlock className="w-4 h-4" /></button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
}
