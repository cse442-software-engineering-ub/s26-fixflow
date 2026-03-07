interface User {
  email: string;
  username: string;
  password: string;
  name?: string;
  joinDate?: string;
  role?: string;
  avatar?: string;
}

const USERS_KEY = 'fixflow_users';

// Sample users for testing
const SAMPLE_USERS: User[] = [
  {
    email: 'john@fixflow.com',
    username: 'john',
    password: 'password123',
    joinDate: new Date().toISOString(),
    role: 'Developer'
  },
  {
    email: 'sarah@fixflow.com',
    username: 'sarah',
    password: 'password123',
    joinDate: new Date().toISOString(),
    role: 'Developer'
  },
  {
    email: 'mike@fixflow.com',
    username: 'mike',
    password: 'password123',
    joinDate: new Date().toISOString(),
    role: 'Developer'
  }
];

// Initialize users storage with sample users if needed
const initializeUsers = (): void => {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    
    if (!stored) {
      // No storage exists, create with sample users
      localStorage.setItem(USERS_KEY, JSON.stringify(SAMPLE_USERS));
      console.log('Initialized with sample users');
      return;
    }
    
    const users = JSON.parse(stored);
    
    if (!Array.isArray(users) || users.length === 0) {
      // Storage exists but is invalid or empty, reset with sample users
      localStorage.setItem(USERS_KEY, JSON.stringify(SAMPLE_USERS));
      console.log('Reset with sample users');
      return;
    }
    
    // Storage exists and has users, ensure sample users exist
    const sampleUsernames = SAMPLE_USERS.map(u => u.username);
    const existingSampleUsers = users.filter(u => sampleUsernames.includes(u.username));
    
    if (existingSampleUsers.length < SAMPLE_USERS.length) {
      // Some sample users are missing, add them
      const missingUsers = SAMPLE_USERS.filter(su => !users.some(u => u.username === su.username));
      const updatedUsers = [...users, ...missingUsers];
      localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
      console.log('Added missing sample users');
    }
  } catch (error) {
    console.error('Error initializing users:', error);
    // On error, reset with sample users
    localStorage.setItem(USERS_KEY, JSON.stringify(SAMPLE_USERS));
  }
};

// Call initialization immediately
initializeUsers();

export const auth = {
  signup: (email: string, username: string, password: string): { success: boolean; error?: string } => {
    try {
      const users = auth.getAllUsers();
      
      // Check if username already exists
      if (users.some(u => u.username === username)) {
        return { success: false, error: 'Username already exists' };
      }
      
      // Check if email already exists
      if (users.some(u => u.email === email)) {
        return { success: false, error: 'Email already registered' };
      }
      
      // Add new user
      const newUser = { 
        email, 
        username, 
        password,
        joinDate: new Date().toISOString(),
        role: 'Developer'
      };
      
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      // Verify the save was successful
      const savedUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const userWasSaved = savedUsers.some((u: User) => u.username === username && u.email === email);
      
      if (!userWasSaved) {
        console.error('User was not saved properly');
        return { success: false, error: 'Failed to save user. Please try again.' };
      }
      
      console.log('User signed up successfully:', username);
      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'An error occurred during signup' };
    }
  },
  
  login: (username: string, password: string): { success: boolean; error?: string; username?: string } => {
    try {
      const users = auth.getAllUsers();
      console.log('Attempting login for:', username);
      console.log('Total users in storage:', users.length);
      
      const user = users.find(u => u.username === username && u.password === password);
      
      if (!user) {
        console.log('Login failed: Invalid credentials');
        return { success: false, error: 'Invalid username or password' };
      }
      
      console.log('Login successful for:', username);
      return { success: true, username: user.username };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  },
  
  getUserInfo: (username: string): User | null => {
    const users = auth.getAllUsers();
    return users.find(u => u.username === username) || null;
  },
  
  updateProfile: (currentUsername: string, updates: { email?: string; username?: string; name?: string; avatar?: string }): { success: boolean; error?: string; newUsername?: string } => {
    const users = auth.getAllUsers();
    const userIndex = users.findIndex(u => u.username === currentUsername);
    
    if (userIndex === -1) {
      return { success: false, error: 'User not found' };
    }
    
    // Check if new username already exists (if changing username)
    if (updates.username && updates.username !== currentUsername) {
      if (users.some(u => u.username === updates.username)) {
        return { success: false, error: 'Username already exists' };
      }
    }
    
    // Check if new email already exists (if changing email)
    if (updates.email && updates.email !== users[userIndex].email) {
      if (users.some(u => u.email === updates.email)) {
        return { success: false, error: 'Email already registered' };
      }
    }
    
    // Update user
    if (updates.email !== undefined) users[userIndex].email = updates.email;
    if (updates.username !== undefined) users[userIndex].username = updates.username;
    if (updates.name !== undefined) users[userIndex].name = updates.name;
    if (updates.avatar !== undefined) users[userIndex].avatar = updates.avatar;
    
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    return { success: true, newUsername: updates.username || currentUsername };
  },
  
  changePassword: (username: string, currentPassword: string, newPassword: string): { success: boolean; error?: string } => {
    const users = auth.getAllUsers();
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex === -1) {
      return { success: false, error: 'User not found' };
    }
    
    // Verify current password
    if (users[userIndex].password !== currentPassword) {
      return { success: false, error: 'Current password is incorrect' };
    }
    
    // Update password
    users[userIndex].password = newPassword;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    return { success: true };
  },
  
  resetPassword: (email: string, newPassword: string): { success: boolean; error?: string } => {
    const users = auth.getAllUsers();
    const userIndex = users.findIndex(u => u.email === email);
    
    if (userIndex === -1) {
      return { success: false, error: 'No account found with this email' };
    }
    
    // Update password
    users[userIndex].password = newPassword;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    return { success: true };
  },
  
  getAllUsers: (): User[] => {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  },
};