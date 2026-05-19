import { API_ENDPOINT } from '@constants/api-endpoint.constants';

import { ApiEndpoint, FieldType } from './api-console.model';

type CrudField = [string, string, FieldType];

export const API_CONSOLE_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'auth-login',
    group: 'Auth',
    name: 'Dang nhap',
    description: 'Lay thong tin phien dang nhap tu username va password.',
    method: 'POST',
    path: API_ENDPOINT.AUTH.LOGIN,
    tone: 'create',
    fields: [
      { key: 'username', label: 'Username', type: 'text', location: 'body', placeholder: 'admin' },
      { key: 'password', label: 'Mat khau', type: 'password', location: 'body', placeholder: '********' },
    ],
  },
  { id: 'dashboard-summary', group: 'Dashboard', name: 'Tong quan he thong', description: 'Doc cac chi so tong hop.', method: 'GET', path: API_ENDPOINT.DASHBOARD.SUMMARY, tone: 'neutral', fields: [] },
  { id: 'logs-actions', group: 'Logs', name: 'Nhat ky thao tac', description: 'Danh sach hanh dong trong he thong.', method: 'GET', path: API_ENDPOINT.LOGS.ACTIONS, tone: 'neutral', fields: [] },
  { id: 'logs-logins', group: 'Logs', name: 'Nhat ky dang nhap', description: 'Lich su login cua nguoi dung.', method: 'GET', path: API_ENDPOINT.LOGS.LOGINS, tone: 'neutral', fields: [] },
  { id: 'roles-list', group: 'Roles', name: 'Danh sach vai tro', description: 'Lay tat ca role.', method: 'GET', path: API_ENDPOINT.ROLES.ROOT, tone: 'neutral', fields: [] },
  { id: 'roles-permissions', group: 'Roles', name: 'Tat ca phan quyen', description: 'Lay ma tran quyen.', method: 'GET', path: API_ENDPOINT.ROLES.PERMISSIONS, tone: 'neutral', fields: [] },
  { id: 'roles-permissions-by-role', group: 'Roles', name: 'Quyen theo role', description: 'Loc quyen theo roleId.', method: 'GET', path: '/api/roles/{roleId}/permissions', tone: 'neutral', fields: [{ key: 'roleId', label: 'Role ID', type: 'number', location: 'path', required: true }] },
  {
    id: 'roles-permissions-update',
    group: 'Roles',
    name: 'Cap nhat quyen chuc nang',
    description: 'Bat/tat quyen theo role, module va function.',
    method: 'PUT',
    path: API_ENDPOINT.ROLES.PERMISSIONS,
    tone: 'update',
    fields: [
      { key: 'roleId', label: 'Role ID', type: 'number', location: 'body' },
      { key: 'moduleId', label: 'Module ID', type: 'number', location: 'body' },
      { key: 'functionId', label: 'Function ID', type: 'number', location: 'body' },
      { key: 'isAllow', label: 'Cho phep', type: 'boolean', location: 'body' },
      { key: 'updatedBy', label: 'Nguoi cap nhat', type: 'text', location: 'body' },
    ],
  },
  {
    id: 'roles-module-update',
    group: 'Roles',
    name: 'Cap nhat quyen module',
    description: 'Bat/tat quyen o cap module.',
    method: 'PUT',
    path: API_ENDPOINT.ROLES.MODULE_PERMISSIONS,
    tone: 'update',
    fields: [
      { key: 'roleId', label: 'Role ID', type: 'number', location: 'body' },
      { key: 'moduleId', label: 'Module ID', type: 'number', location: 'body' },
      { key: 'isAllow', label: 'Cho phep', type: 'boolean', location: 'body' },
      { key: 'updatedBy', label: 'Nguoi cap nhat', type: 'text', location: 'body' },
    ],
  },
  ...crudEndpoints('Classes', API_ENDPOINT.CLASSES.ROOT, 'Lop hoc', [
    ['classCode', 'Ma lop', 'text'],
    ['className', 'Ten lop', 'text'],
    ['facultyId', 'Khoa ID', 'number'],
    ['schoolYear', 'Nam hoc', 'text'],
    ['homeroomTeacher', 'GVCN', 'text'],
    ['createdBy', 'Nguoi tao', 'text'],
  ]),
  ...crudEndpoints('Students', API_ENDPOINT.STUDENTS.ROOT, 'Sinh vien', [
    ['personCode', 'Ma sinh vien', 'text'],
    ['fullName', 'Ho ten', 'text'],
    ['email', 'Email', 'text'],
    ['classId', 'Lop ID', 'number'],
    ['createdBy', 'Nguoi tao', 'text'],
  ]),
  ...crudEndpoints('Subjects', API_ENDPOINT.SUBJECTS.ROOT, 'Mon hoc', [
    ['subjectCode', 'Ma mon', 'text'],
    ['subjectName', 'Ten mon', 'text'],
    ['credits', 'Tin chi', 'number'],
    ['totalLessons', 'So tiet', 'number'],
    ['createdBy', 'Nguoi tao', 'text'],
  ]),
  ...crudEndpoints('Scores', API_ENDPOINT.SCORES.ROOT, 'Diem', [
    ['personProfileId', 'Ho so SV ID', 'number'],
    ['subjectId', 'Mon hoc ID', 'number'],
    ['semesterId', 'Hoc ky ID', 'number'],
    ['attendanceScore', 'Diem chuyen can', 'number'],
    ['midtermScore', 'Diem giua ky', 'number'],
    ['finalScore', 'Diem cuoi ky', 'number'],
    ['createdBy', 'Nguoi tao ID', 'number'],
  ], false),
  {
    id: 'uploads-images',
    group: 'Uploads',
    name: 'Tai anh len',
    description: 'Upload file bang multipart/form-data.',
    method: 'POST',
    path: API_ENDPOINT.UPLOADS.IMAGES,
    tone: 'create',
    fields: [{ key: 'file', label: 'File anh', type: 'file', location: 'formData', required: true }],
  },
  {
    id: 'users-change-password',
    group: 'Users',
    name: 'Doi mat khau',
    description: 'Doi mat khau cho user theo userId.',
    method: 'PUT',
    path: '/api/users/{userId}/password',
    tone: 'update',
    fields: [
      { key: 'userId', label: 'User ID', type: 'number', location: 'path', required: true },
      { key: 'oldPassword', label: 'Mat khau cu', type: 'password', location: 'body' },
      { key: 'newPassword', label: 'Mat khau moi', type: 'password', location: 'body' },
      { key: 'updatedBy', label: 'Nguoi cap nhat', type: 'text', location: 'body' },
    ],
  },
  {
    id: 'users-reset-password',
    group: 'Users',
    name: 'Reset mat khau',
    description: 'Dat lai mat khau cho user.',
    method: 'PUT',
    path: '/api/users/{userId}/reset-password',
    tone: 'update',
    fields: [
      { key: 'userId', label: 'User ID', type: 'number', location: 'path', required: true },
      { key: 'newPassword', label: 'Mat khau moi', type: 'password', location: 'body' },
      { key: 'updatedBy', label: 'Nguoi cap nhat', type: 'text', location: 'body' },
    ],
  },
  { id: 'weather', group: 'WeatherForecast', name: 'WeatherForecast', description: 'Endpoint mau cua backend.', method: 'GET', path: API_ENDPOINT.WEATHER_FORECAST, tone: 'neutral', fields: [] },
];

function crudEndpoints(group: string, basePath: string, noun: string, fields: CrudField[], softDelete = true): ApiEndpoint[] {
  const bodyFields = fields.map(([key, label, type]) => ({ key, label, type, location: 'body' as const }));
  const updateFields = [
    ...bodyFields,
    { key: 'isActive', label: 'Dang hoat dong', type: 'boolean' as const, location: 'body' as const },
    { key: 'updatedBy', label: softDelete ? 'Nguoi cap nhat' : 'Nguoi cap nhat ID', type: softDelete ? 'text' as const : 'number' as const, location: 'body' as const },
  ];

  return [
    { id: `${group}-list`, group, name: `Danh sach ${noun}`, description: `Lay toan bo ${noun.toLowerCase()}.`, method: 'GET', path: basePath, tone: 'neutral', fields: [] },
    { id: `${group}-detail`, group, name: `Chi tiet ${noun}`, description: `Tim ${noun.toLowerCase()} theo ID.`, method: 'GET', path: `${basePath}/{id}`, tone: 'neutral', fields: [{ key: 'id', label: 'ID', type: 'number', location: 'path', required: true }] },
    { id: `${group}-create`, group, name: `Tao ${noun}`, description: `Them moi ${noun.toLowerCase()}.`, method: 'POST', path: basePath, tone: 'create', fields: bodyFields },
    { id: `${group}-update`, group, name: `Cap nhat ${noun}`, description: `Sua thong tin ${noun.toLowerCase()}.`, method: 'PUT', path: `${basePath}/{id}`, tone: 'update', fields: [{ key: 'id', label: 'ID', type: 'number', location: 'path', required: true }, ...updateFields] },
    { id: `${group}-delete`, group, name: `Xoa ${noun}`, description: `Xoa hoac khoa ${noun.toLowerCase()}.`, method: 'DELETE', path: `${basePath}/{id}`, tone: 'danger', fields: [{ key: 'id', label: 'ID', type: 'number', location: 'path', required: true }, ...(softDelete ? [{ key: 'updatedBy', label: 'Nguoi cap nhat', type: 'text' as const, location: 'query' as const }] : [])] },
  ];
}
