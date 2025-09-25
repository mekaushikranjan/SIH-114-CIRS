// Mock Authentication Configuration
// Set this to true to use mock authentication (bypasses Firebase)
export const ENABLE_MOCK_AUTH = true;

// Mock user credentials for testing
export const MOCK_CREDENTIALS = {
  // Citizen Users
  citizen: {
    email: 'citizen@test.com',
    password: 'password123',
    role: 'CITIZEN'
  },
  
  // Ground Worker
  worker: {
    email: 'worker@test.com', 
    password: 'password123',
    role: 'GROUND_WORKER'
  },
  
  // Department Head
  department: {
    email: 'department@test.com',
    password: 'password123',
    role: 'DEPARTMENT_HEAD'
  },
  
  // Admin
  admin: {
    email: 'admin@test.com',
    password: 'password123',
    role: 'ADMIN'
  },
  
  // Your specific user
  mritunjay: {
    email: 'mritunjaykaushik1803@gmail.com',
    password: 'Kaushik@17',
    role: 'CITIZEN'
  }
};

// Helper function to get mock credentials by role
export const getMockCredentialsByRole = (role: keyof typeof MOCK_CREDENTIALS) => {
  return MOCK_CREDENTIALS[role];
};

// Helper function to check if email is a mock user
export const isMockUser = (email: string): boolean => {
  return Object.values(MOCK_CREDENTIALS).some(cred => cred.email === email);
};
