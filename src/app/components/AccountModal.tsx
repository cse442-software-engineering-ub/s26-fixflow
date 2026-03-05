import { useState, useEffect } from 'react';
import { X, User, Mail, Calendar, Shield, Edit, Lock, Upload, Trash2, ListChecks } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { activityLogger } from '../lib/activity';
import type { Bug as BugType } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string;
  onUserUpdate?: (newUsername: string) => void;
  bugs?: BugType[];
  onBugSelect?: (bug: BugType) => void;
}

export function AccountModal({ isOpen, onClose, currentUser, onUserUpdate, bugs = [], onBugSelect }: AccountModalProps) {
  const [view, setView] = useState<'details' | 'edit' | 'password'>('details');
  const [userInfo, setUserInfo] = useState<any>(null);
  
  // Edit Profile State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editError, setEditError] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Available avatars
  const avatars = [
    { id: 'gradient-blue', label: 'Blue Gradient', colors: 'from-blue-500 to-purple-600' },
    { id: 'gradient-pink', label: 'Pink Gradient', colors: 'from-pink-500 to-rose-600' },
    { id: 'gradient-green', label: 'Green Gradient', colors: 'from-green-500 to-teal-600' },
    { id: 'gradient-orange', label: 'Orange Gradient', colors: 'from-orange-500 to-red-600' },
    { id: 'gradient-purple', label: 'Purple Gradient', colors: 'from-purple-500 to-indigo-600' },
    { id: 'gradient-cyan', label: 'Cyan Gradient', colors: 'from-cyan-500 to-blue-600' },
    { id: 'gradient-yellow', label: 'Yellow Gradient', colors: 'from-yellow-500 to-orange-600' },
    { id: 'gradient-emerald', label: 'Emerald Gradient', colors: 'from-emerald-500 to-green-600' },
  ];

  useEffect(() => {
    if (isOpen && currentUser) {
      (async () => {
        try {
          const res = await api.profileGet();
          const user = {
            ...res.user,
            // UI expects these optional fields sometimes
            name: res.user.name || res.user.full_name || res.user.username,
            joinDate: res.user.joinDate || res.user.created_at,
            role: 'Developer',
            avatar: 'gradient-blue',
          };
          setUserInfo(user);
          setEditName(user.name ?? '');
          setEditEmail(user.email);
          setEditUsername(user.username);
          setEditAvatar(user.avatar || 'gradient-blue');
          setUploadedImage(null);
        } catch (e: any) {
          toast.error(e?.message || 'Failed to load profile');
          setUserInfo(null);
        }
      })();
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !userInfo) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getAvatarColors = (avatarId: string) => {
    const avatar = avatars.find(a => a.id === avatarId);
    return avatar ? avatar.colors : 'from-blue-500 to-purple-600';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setUploadedImage(base64String);
      setEditAvatar(base64String);
      toast.success('Image uploaded successfully!');
    };
    reader.onerror = () => {
      toast.error('Failed to upload image');
    };
    reader.readAsDataURL(file);
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
    setEditAvatar('gradient-blue');
    toast.info('Switched back to gradient avatar');
  };

  const handleEditProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');

    (async () => {
      try {
        const res = await api.profileUpdate({
          full_name: editName || undefined,
          email: editEmail,
          username: editUsername,
        });

        if (!res.success) {
          const msg = res.message || 'Failed to update profile';
          setEditError(msg);
          toast.error(msg);
          return;
        }

        const updated = await api.profileGet();
        const user = {
          ...updated.user,
          name: updated.user.name || updated.user.full_name || updated.user.username,
          joinDate: updated.user.joinDate || updated.user.created_at,
          role: 'Developer',
          avatar: 'gradient-blue',
        };
        setUserInfo(user);

        if (onUserUpdate && editUsername && editUsername !== currentUser) {
          localStorage.setItem('currentUser', editUsername);
          onUserUpdate(editUsername);
        }

        setView('details');
        toast.success('Profile updated successfully!');

        activityLogger.logActivity({
          type: 'profile_updated',
          user: currentUser,
        });
      } catch (e: any) {
        const msg = e?.message || 'Failed to update profile';
        setEditError(msg);
        toast.error(msg);
      }
    })();
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 4) {
      setPasswordError('Password must be at least 4 characters');
      return;
    }
    
    (async () => {
      try {
        const res = await api.changePassword(currentPassword, newPassword);
        if (!res.success) {
          const msg = res.message || 'Failed to change password';
          setPasswordError(msg);
          toast.error(msg);
          return;
        }
        setPasswordSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setView('details');
          setPasswordSuccess('');
        }, 1500);
        toast.success('Password changed successfully!');

        activityLogger.logActivity({
          type: 'password_changed',
          user: currentUser,
        });
      } catch (e: any) {
        const msg = e?.message || 'Failed to change password';
        setPasswordError(msg);
        toast.error(msg);
      }
    })();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold">
            {view === 'details' && 'Account Details'}
            {view === 'edit' && 'Edit Profile'}
            {view === 'password' && 'Change Password'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {view === 'details' && (
            <>
              {/* Profile Section */}
              <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                {userInfo.avatar && userInfo.avatar.startsWith('data:image') ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-blue-500">
                    <img src={userInfo.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`w-20 h-20 bg-gradient-to-br ${getAvatarColors(userInfo.avatar || 'gradient-blue')} rounded-full flex items-center justify-center`}>
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold">{userInfo.name || userInfo.username}</h3>
                  <p className="text-gray-600">{userInfo.username} · {userInfo.role || 'Developer'}</p>
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-4">
                <h4 className="font-bold text-lg">Account Information</h4>
                
                <div className="space-y-3">
                  {userInfo.name && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">{userInfo.name}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{userInfo.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="font-medium">{formatDate(userInfo.joinDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-500">Role</p>
                      <p className="font-medium">{userInfo.role || 'Developer'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* My Assigned Bugs */}
              <div className="space-y-3">
                <h4 className="font-bold text-lg flex items-center gap-2">
                  <ListChecks className="w-5 h-5" />
                  My Assigned Bugs
                </h4>
                {bugs.filter(b => b.assignedTo === currentUser).length > 0 ? (
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {bugs.filter(b => b.assignedTo === currentUser).map(bug => (
                      <li key={bug.id}>
                        <button
                          type="button"
                          onClick={() => {
                            onBugSelect?.(bug);
                            onClose();
                          }}
                          className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
                        >
                          <span className="font-medium text-gray-900">{bug.bugNumber || bug.title}</span>
                          <span className="text-gray-600 text-sm block truncate">{bug.title}</span>
                          <span className={`text-xs ${bug.status === 'fixed' ? 'text-green-600' : 'text-amber-600'}`}>
                            {bug.status === 'fixed' ? 'Fixed' : 'Active'}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 px-4 py-2">No bugs assigned to you.</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setView('edit')}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="w-5 h-5" />
                  Edit Profile
                </button>
                <button 
                  onClick={() => setView('password')}
                  className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Lock className="w-5 h-5" />
                  Change Password
                </button>
              </div>
            </>
          )}

          {view === 'edit' && (
            <form onSubmit={handleEditProfile} className="space-y-6">
              {editError && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold mb-2">Display Name (optional)</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg outline-none focus:border-blue-400 focus:bg-blue-50 transition-colors"
                  placeholder="e.g. John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg outline-none focus:border-blue-400 focus:bg-blue-50 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg outline-none focus:border-blue-400 focus:bg-blue-50 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Avatar</label>
                
                {/* Upload Custom Image */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-600 mb-2">Upload Custom Image</label>
                  {uploadedImage ? (
                    <div className="relative inline-block">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500">
                        <img src={uploadedImage} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={removeUploadedImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="inline-flex items-center gap-2 px-4 py-3 bg-blue-100 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-200 transition-colors"
                      >
                        <Upload className="w-5 h-5" />
                        <span>Upload Image (Max 2MB)</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Gradient Options */}
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Or Choose a Gradient</label>
                  <div className="flex flex-wrap gap-3">
                    {avatars.map((avatar) => (
                      <div
                        key={avatar.id}
                        className={`w-16 h-16 bg-gradient-to-br ${avatar.colors} rounded-full cursor-pointer flex items-center justify-center transition-transform hover:scale-110 ${
                          editAvatar === avatar.id && !uploadedImage ? 'ring-4 ring-blue-500 ring-offset-2' : ''
                        }`}
                        onClick={() => {
                          setUploadedImage(null);
                          setEditAvatar(avatar.id);
                        }}
                        title={avatar.label}
                      >
                        <User className="w-8 h-8 text-white" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setView('details');
                    setEditError('');
                    setEditName(userInfo.name ?? '');
                    setEditEmail(userInfo.email);
                    setEditUsername(userInfo.username);
                    setEditAvatar(userInfo.avatar || 'gradient-blue');
                  }}
                  className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {view === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-6">
              {passwordError && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                  {passwordSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg outline-none focus:border-blue-400 focus:bg-blue-50 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg outline-none focus:border-blue-400 focus:bg-blue-50 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg outline-none focus:border-blue-400 focus:bg-blue-50 transition-colors"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setView('details');
                    setPasswordError('');
                    setPasswordSuccess('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Change Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}