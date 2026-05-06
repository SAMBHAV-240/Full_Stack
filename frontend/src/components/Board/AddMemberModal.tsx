import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { closeAddMemberModal } from '../../store/slices/uiSlice';
import { addBoardMember, fetchBoard } from '../../store/slices/boardSlice';
import { api } from '../../services/api';
import { Modal, Button, Input } from '../Common';
import { User } from '../../types';
import toast from 'react-hot-toast';
import { Search, UserPlus } from 'lucide-react';

export const AddMemberModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { addMemberModalOpen } = useAppSelector((state) => state.ui);
  const { currentBoard, isLoading } = useAppSelector((state) => state.boards);
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (email.trim().length > 2) {
      searchUsers(email);
    } else {
      setUsers([]);
      setShowSuggestions(false);
    }
  }, [email]);

  const searchUsers = async (query: string) => {
    try {
      setLoading(true);
      const results = await api.searchUsers(query);
      
      // Filter out existing board members
      const existingMemberIds = currentBoard?.members.map((m) => m.user.id) || [];
      const filtered = results.filter((u) => !existingMemberIds.includes(u.id));
      
      setUsers(filtered);
      setShowSuggestions(filtered.length > 0);
    } catch (error) {
      console.error('Search users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('member');
    setUsers([]);
    setShowSuggestions(false);
    dispatch(closeAddMemberModal());
  };

  const handleSelectUser = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setShowSuggestions(false);
    setUsers([]);
  };

  const handleAddMember = async () => {
    if (!email.trim() || !currentBoard?.id) {
      toast.error('Please select a user');
      return;
    }

    try {
      await dispatch(
        addBoardMember({
          boardId: currentBoard.id,
          email: email.trim(),
          role,
        })
      ).unwrap();

      // Refresh board to get updated members list
      await dispatch(fetchBoard(currentBoard.id)).unwrap();
      
      toast.success('Member added successfully');
      handleClose();
    } catch (error: any) {
      toast.error(error || 'Failed to add member');
    }
  };

  return (
    <Modal isOpen={addMemberModalOpen} onClose={handleClose} title="Add Member to Board">
      <div className="space-y-4">
        {/* Email/User Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            User Email
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="email"
              placeholder="Search user by email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* User Suggestions */}
          {showSuggestions && users.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user.email)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-3 border-b border-gray-200 last:border-b-0"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary-600">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {loading && (
            <p className="mt-2 text-sm text-gray-500">Searching...</p>
          )}

          {showSuggestions && users.length === 0 && !loading && (
            <p className="mt-2 text-sm text-gray-500">No users found</p>
          )}
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddMember}
            disabled={!email.trim() || isLoading}
            className="flex-1"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {isLoading ? 'Adding...' : 'Add Member'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
