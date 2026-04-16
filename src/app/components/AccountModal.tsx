//Added DarkMode Fam//
import { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Calendar,
  Shield,
  Edit,
  Lock,
  Upload,
  Trash2,
  ListChecks,
  Eye,
  EyeOff,
  Loader2,
  Sun,
  Moon,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import {
  DEFAULT_AVATAR_GRADIENT_ID,
  displayNameForSelf,
  isPersistedCustomAvatar,
  normalizeAvatarGradientId,
} from '../lib/user-display';
import { activityLogger } from '../lib/activity';
import type { Bug as BugType } from '../types';
import {
  AI_KEY_HELPER_TEXT,
  AI_MODELS_BY_PROVIDER,
  AI_PROVIDER_OPTIONS,
  type AiProviderOption,
} from '../lib/user-ai-key-mock';
import { useDarkMode } from '../lib/DarkModeContext';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string;
  onUserUpdate?: (newUsername: string) => void;
  onSessionRefresh?: () => void | Promise<void>;
  bugs?: BugType[];
  onBugSelect?: (bug: BugType) => void;
}

export function AccountModal({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  onSessionRefresh,
  bugs = [],
  onBugSelect,
}: AccountModalProps) {
  const { darkMode, setDarkMode } = useDarkMode();
  const [view, setView] = useState<'details' | 'edit' | 'password'>('details');
  const [userInfo, setUserInfo] = useState<any>(null);
  
  // Edit Profile State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editGradientId, setEditGradientId] = useState(DEFAULT_AVATAR_GRADIENT_ID);
  const [editCustomImage, setEditCustomImage] = useState<string | null>(null);
  const [editError, setEditError] = useState('');

  // BYOK — AI API Key (mock API until backend exists)
  const [aiProvider, setAiProvider] = useState<string>('');
  const [aiModel, setAiModel] = useState<string>('');
  const [aiKeyInput, setAiKeyInput] = useState('');
  const [aiShowKey, setAiShowKey] = useState(false);
  const [aiHasKey, setAiHasKey] = useState(false);
  const [aiMaskedKey, setAiMaskedKey] = useState<string | null>(null);
  const [aiLoadingGet, setAiLoadingGet] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiRemoving, setAiRemoving] = useState(false);
  
  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Available avatars
  const avatars = [
    { id: DEFAULT_AVATAR_GRADIENT_ID, label: 'Blue Gradient', colors: 'from-blue-500 to-purple-600' },
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
          const u = res.user;
          const gradient = normalizeAvatarGradientId(u.avatar_gradient);
          const custom = u.avatar_image || null;
          const user = {
            ...u,
            joinDate: u.joinDate || u.created_at,
            role: 'Developer',
            avatar_gradient: gradient,
            avatar_image: custom,
          };
          setUserInfo(user);
          setEditName(u.full_name?.trim() ?? '');
          setEditEmail(user.email);
          setEditUsername(user.username);
          setEditGradientId(gradient);
          setEditCustomImage(custom);
        } catch (e: any) {
          toast.error(e?.message || 'Failed to load profile');
          setUserInfo(null);
        }
      })();
    }
  }, [isOpen, currentUser]);

  function isAiProvider(v: string): v is AiProviderOption {
    return (AI_PROVIDER_OPTIONS as readonly string[]).includes(v);
  }

  useEffect(() => {
    if (!isOpen || view !== 'edit' || !userInfo) return;
    let cancelled = false;
    setAiLoadingGet(true);
    (async () => {
      try {
        const data = await api.userAiKeyGet();
        if (cancelled) return;
        setAiHasKey(data.hasKey);
        setAiProvider(data.provider && isAiProvider(data.provider) ? data.provider : '');
        setAiModel(data.model ?? '');
        setAiMaskedKey(data.maskedKey);
        setAiKeyInput('');
        setAiShowKey(false);
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message || 'Failed to load AI key settings');
      } finally {
        if (!cancelled) setAiLoadingGet(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, view, userInfo?.id]);

  const applyAiKeyFromServer = async () => {
    try {
      const data = await api.userAiKeyGet();
      setAiHasKey(data.hasKey);
      setAiProvider(data.provider && isAiProvider(data.provider) ? data.provider : '');
      setAiModel(data.model ?? '');
      setAiMaskedKey(data.maskedKey);
      setAiKeyInput('');
    } catch {
      /* ignore */
    }
  };

  const handleAiSaveKey = async () => {
    if (!aiProvider || !aiModel || !aiKeyInput.trim()) return;
    setAiSaving(true);
    try {
      const res = await api.userAiKeySave({
        provider: aiProvider,
        model: aiModel,
        api_key: aiKeyInput.trim(),
      });
      if (!res.success) {
        toast.error((res as { message?: string }).message || 'Failed to save API key');
        return;
      }
      toast.success('API key saved successfully');
      await applyAiKeyFromServer();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save API key');
    } finally {
      setAiSaving(false);
    }
  };

  const handleAiRemoveKey = async () => {
    setAiRemoving(true);
    try {
      const res = await api.userAiKeyDelete();
      if (!res.success) {
        toast.error((res as { message?: string }).message || 'Failed to remove API key');
        return;
      }
      toast.success('API key removed');
      setAiHasKey(false);
      setAiProvider('');
      setAiModel('');
      setAiMaskedKey(null);
      setAiKeyInput('');
      setAiShowKey(false);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to remove API key');
    } finally {
      setAiRemoving(false);
    }
  };

  const aiModelsForProvider =
    aiProvider && isAiProvider(aiProvider) ? [...AI_MODELS_BY_PROVIDER[aiProvider]] : [];

  const aiKeyPlaceholder = aiHasKey && aiMaskedKey ? aiMaskedKey : 'Paste your API key here';
  const aiHelperLine =
    aiProvider && isAiProvider(aiProvider) ? AI_KEY_HELPER_TEXT[aiProvider] : '';
  const canSaveAiKey =
    Boolean(aiProvider && aiModel && aiKeyInput.trim() !== '') &&
    !aiSaving &&
    !aiRemoving &&
    !aiLoadingGet;

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

    const okTypes = ['image/jpeg', 'image/png'];
    if (!okTypes.includes(file.type)) {
      toast.error('Please upload a JPEG or PNG image');
      e.target.value = '';
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setEditCustomImage(base64String);
      toast.success('Image uploaded successfully!');
    };
    reader.onerror = () => {
      toast.error('Failed to read image');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeUploadedImage = () => {
    setEditCustomImage(null);
    toast.info('Switched back to gradient avatar');
  };

  const handleEditProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');

    (async () => {
      try {
        const res = await api.profileUpdate({
          full_name: editName.trim(),
          email: editEmail,
          username: editUsername,
          avatar_gradient: editGradientId,
          avatar_image: editCustomImage,
        });

        if (!res.success) {
          const msg = res.message || 'Failed to update profile';
          setEditError(msg);
          toast.error(msg);
          return;
        }

        const updated = await api.profileGet();
        const u = updated.user;
        const gradient = normalizeAvatarGradientId(u.avatar_gradient);
        const custom = u.avatar_image || null;
        const user = {
          ...u,
          joinDate: u.joinDate || u.created_at,
          role: 'Developer',
          avatar_gradient: gradient,
          avatar_image: custom,
        };
        setUserInfo(user);
        setEditName(u.full_name?.trim() ?? '');
        setEditEmail(u.email);
        setEditUsername(u.username);
        setEditGradientId(gradient);
        setEditCustomImage(custom);

        if (onUserUpdate && editUsername && editUsername !== currentUser) {
          onUserUpdate(editUsername);
        }
        await onSessionRefresh?.();

        setView('details');
        toast.success('Profile updated successfully!');

        activityLogger.logActivity({
          type: 'profile_updated',
          user: editUsername,
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
      <div className="bg-white dark:bg-[#2f353c] dark:text-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-[#2f353c] border-b border-gray-200 dark:border-[#3e4650] px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold">
            {view === 'details' && 'Account Details'}
            {view === 'edit' && 'Edit Profile'}
            {view === 'password' && 'Change Password'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-8 space-y-6">
          {view === 'details' && (
            <>
              {/* Profile Section */}
              <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-[#363d45] dark:to-[#3a424b] rounded-xl">
                {isPersistedCustomAvatar(userInfo.avatar_image) ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-blue-500">
                    <img src={userInfo.avatar_image} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div
                    className={`w-20 h-20 bg-gradient-to-br ${getAvatarColors(normalizeAvatarGradientId(userInfo.avatar_gradient))} rounded-full flex items-center justify-center`}
                  >
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold">
                    {displayNameForSelf(userInfo.full_name, userInfo.username)}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{userInfo.username} · {userInfo.role || 'Developer'}</p>
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-4">
                <h4 className="font-bold text-lg">Account Information</h4>
                
                <div className="space-y-3">
                  {userInfo.full_name?.trim() && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#363d45] rounded-lg">
                      <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Display name</p>
                        <p className="font-medium">{userInfo.full_name.trim()}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#363d45] rounded-lg">
                    <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-medium">{userInfo.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#363d45] rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                      <p className="font-medium">{formatDate(userInfo.joinDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#363d45] rounded-lg">
                    <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                      <p className="font-medium">{userInfo.role || 'Developer'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appearance */}
              <div className="space-y-3">
                <h4 className="font-bold text-lg">Appearance</h4>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#363d45] rounded-lg">
                  <div className="flex items-center gap-3">
                    {darkMode ? (
                      <Moon className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <Sun className="w-5 h-5 text-amber-500" />
                    )}
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {darkMode ? 'Dark theme is active' : 'Light theme is active'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={darkMode}
                    onClick={() => setDarkMode(!darkMode)}
                    className={`relative inline-flex h-7 w-[52px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                      darkMode ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${
                        darkMode ? 'translate-x-[28px]' : 'translate-x-1'
                      }`}
                    >
                      {darkMode ? (
                        <Moon className="h-3 w-3 text-indigo-600" />
                      ) : (
                        <Sun className="h-3 w-3 text-amber-500" />
                      )}
                    </span>
                  </button>
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
                          className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-[#363d45] rounded-lg hover:bg-gray-100 dark:hover:bg-[#3e4650] border border-gray-200 dark:border-[#3e4650] transition-colors"
                        >
                          <span className="font-medium text-gray-900 dark:text-white">{bug.bugNumber || bug.title}</span>
                          <span className="text-gray-600 dark:text-gray-400 text-sm block truncate">{bug.title}</span>
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
                  className="flex-1 py-3 px-4 bg-gray-200 dark:bg-[#363d45] text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-[#3e4650] transition-colors flex items-center justify-center gap-2"
                >
                  <Lock className="w-5 h-5" />
                  Change Password
                </button>
              </div>
            </>
          )}

          {view === 'edit' && (
            <div className="space-y-6">
              <form id="edit-profile-form" onSubmit={handleEditProfile} className="space-y-6">
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
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#3e4650] dark:bg-[#363d45] dark:text-white rounded-lg outline-none focus:border-blue-400 focus:bg-blue-50 dark:focus:bg-[#3a424b] transition-colors"
                    placeholder="e.g. John Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Username</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#3e4650] dark:bg-[#363d45] dark:text-white rounded-lg outline-none focus:border-blue-400 focus:bg-blue-50 dark:focus:bg-[#3a424b] transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#3e4650] dark:bg-[#363d45] dark:text-white rounded-lg outline-none focus:border-blue-400 focus:bg-blue-50 dark:focus:bg-[#3a424b] transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Avatar</label>

                  <div className="mb-4">
                    <label className="block text-xs text-gray-600 mb-2">Upload Custom Image</label>
                    {editCustomImage ? (
                      <div className="relative inline-block">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500">
                          <img src={editCustomImage} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={removeUploadedImage}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-sm"
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
                          accept="image/jpeg,image/png"
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

                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Or Choose a Gradient</label>
                    <div className="flex flex-wrap gap-3">
                      {avatars.map((avatar) => (
                        <div
                          key={avatar.id}
                          className={`w-16 h-16 bg-gradient-to-br ${avatar.colors} rounded-full cursor-pointer flex items-center justify-center transition-transform hover:scale-110 ${
                            editGradientId === avatar.id && !editCustomImage ? 'ring-4 ring-blue-500 ring-offset-2' : ''
                          }`}
                          onClick={() => {
                            setEditCustomImage(null);
                            setEditGradientId(avatar.id);
                          }}
                          title={avatar.label}
                        >
                          <User className="w-8 h-8 text-white" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </form>

              {/* BYOK — AI API Key (mock API) */}
              <div className="border-t border-gray-200 dark:border-[#3e4650] pt-6 space-y-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI API Key</h3>

                {/* Step 1 — Provider */}
                <div>
                  <label className="block text-sm font-bold mb-2">Provider</label>
                  <select
                    value={aiProvider}
                    onChange={(e) => {
                      setAiProvider(e.target.value);
                      setAiModel('');
                    }}
                    disabled={aiLoadingGet}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#3e4650] dark:bg-[#363d45] dark:text-white rounded-lg outline-none focus:border-blue-400 focus:bg-blue-50 dark:focus:bg-[#3a424b] transition-colors bg-white dark:bg-[#363d45] disabled:opacity-60"
                  >
                    <option value="">Select a provider</option>
                    {AI_PROVIDER_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2 — Model */}
                {aiProvider !== '' && (
                  <div>
                    <label className="block text-sm font-bold mb-2">Model</label>
                    <select
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      disabled={aiLoadingGet}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#3e4650] dark:bg-[#363d45] dark:text-white rounded-lg outline-none focus:border-blue-400 focus:bg-blue-50 dark:focus:bg-[#3a424b] transition-colors bg-white dark:bg-[#363d45] disabled:opacity-60"
                    >
                      <option value="">Select a model</option>
                      {aiModelsForProvider.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Step 3 — API key */}
                {aiProvider !== '' && aiModel !== '' && (
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <label className="block text-sm font-bold">API key</label>
                      {aiHasKey && (
                        <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5">
                          Key saved ✓
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={aiShowKey ? 'text' : 'password'}
                        value={aiKeyInput}
                        onChange={(e) => setAiKeyInput(e.target.value)}
                        placeholder={aiKeyPlaceholder}
                        autoComplete="off"
                        className="w-full px-4 py-3 pr-12 border-2 border-gray-300 dark:border-[#3e4650] dark:bg-[#363d45] dark:text-white rounded-lg outline-none focus:border-blue-400 focus:bg-blue-50 dark:focus:bg-[#3a424b] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setAiShowKey((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-800 rounded-lg"
                        aria-label={aiShowKey ? 'Hide API key' : 'Show API key'}
                      >
                        {aiShowKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {aiHelperLine && (
                      <p className="text-sm text-gray-600 mt-2">{aiHelperLine}</p>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleAiSaveKey}
                    disabled={!canSaveAiKey}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {aiSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      'Save API Key'
                    )}
                  </button>
                  {aiHasKey && (
                    <button
                      type="button"
                      onClick={handleAiRemoveKey}
                      disabled={aiRemoving || aiSaving}
                      className="flex-1 py-3 px-4 border-2 border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {aiRemoving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Removing…
                        </>
                      ) : (
                        'Remove Key'
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('details');
                    setEditError('');
                    const u = userInfo;
                    setEditName(u.full_name?.trim() ?? '');
                    setEditEmail(u.email);
                    setEditUsername(u.username);
                    setEditGradientId(normalizeAvatarGradientId(u.avatar_gradient));
                    setEditCustomImage(u.avatar_image || null);
                    void applyAiKeyFromServer();
                  }}
                  className="flex-1 py-3 px-4 bg-gray-200 dark:bg-[#363d45] text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-[#3e4650] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-profile-form"
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
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
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#3e4650] dark:bg-[#363d45] dark:text-white rounded-lg outline-none focus:border-blue-400 focus:bg-blue-50 dark:focus:bg-[#3a424b] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#3e4650] dark:bg-[#363d45] dark:text-white rounded-lg outline-none focus:border-blue-400 focus:bg-blue-50 dark:focus:bg-[#3a424b] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#3e4650] dark:bg-[#363d45] dark:text-white rounded-lg outline-none focus:border-blue-400 focus:bg-blue-50 dark:focus:bg-[#3a424b] transition-colors"
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
                  className="flex-1 py-3 px-4 bg-gray-200 dark:bg-[#363d45] text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-[#3e4650] transition-colors"
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