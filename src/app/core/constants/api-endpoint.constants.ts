export const API_ENDPOINT = {
  AUTH: {
    LOGIN: '/api/auth/login',
  },
  CLASSES: {
    ROOT: '/api/classes',
    BY_ID: (id: string | number) => `/api/classes/${id}`,
  },
  DASHBOARD: {
    SUMMARY: '/api/dashboard/summary',
  },
  LOGS: {
    ACTIONS: '/api/logs/actions',
    LOGINS: '/api/logs/logins',
  },
  ROLES: {
    ROOT: '/api/roles',
    PERMISSIONS: '/api/roles/permissions',
    PERMISSIONS_BY_ROLE: (roleId: string | number) => `/api/roles/${roleId}/permissions`,
    MODULE_PERMISSIONS: '/api/roles/permissions/module',
  },
  SCORES: {
    ROOT: '/api/scores',
    BY_ID: (id: string | number) => `/api/scores/${id}`,
  },
  STUDENTS: {
    ROOT: '/api/students',
    BY_ID: (id: string | number) => `/api/students/${id}`,
  },
  SUBJECTS: {
    ROOT: '/api/subjects',
    BY_ID: (id: string | number) => `/api/subjects/${id}`,
  },
  UPLOADS: {
    IMAGES: '/api/uploads/images',
  },
  USERS: {
    CHANGE_PASSWORD: (userId: string | number) => `/api/users/${userId}/password`,
    RESET_PASSWORD: (userId: string | number) => `/api/users/${userId}/reset-password`,
  },
  WEATHER_FORECAST: '/WeatherForecast',
};
