export const API_ENDPOINT = {
  AUTH: {
    LOGIN: '/api/auth/login',
  },
  CLASSES: {
    ROOT: '/api/classes',
    SEARCH: '/api/classes/search',
    BY_ID: (id: string | number) => `/api/classes/${id}`,
  },
  DASHBOARD: {
    SUMMARY: '/api/dashboard/summary',
  },
  FACULTIES: {
    ROOT: '/api/faculties',
  },
  LOGS: {
    ACTIONS: '/api/logs/actions/search',
    LOGINS: '/api/logs/logins/search',
  },
  ROLES: {
    ROOT: '/api/roles',
    SEARCH: '/api/roles/search',
    BY_ID: (id: string | number) => `/api/roles/${id}`,
    PERMISSIONS: '/api/roles/permissions',
    PERMISSIONS_BY_ROLE: (roleId: string | number) => `/api/roles/${roleId}/permissions`,
    MODULE_PERMISSIONS: '/api/roles/permissions/module',
  },
  SCORES: {
    ROOT: '/api/scores',
    SEARCH: '/api/scores/search',
    BY_ID: (id: string | number) => `/api/scores/${id}`,
  },
  STUDENTS: {
    ROOT: '/api/students',
    SEARCH: '/api/students/search',
    BY_ID: (id: string | number) => `/api/students/${id}`,
  },
  SUBJECTS: {
    ROOT: '/api/subjects',
    SEARCH: '/api/subjects/search',
    BY_ID: (id: string | number) => `/api/subjects/${id}`,
  },
  SEMESTERS: {
    ROOT: '/api/semesters',
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
