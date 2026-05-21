import { API_ENDPOINT } from '@constants/api-endpoint.constants';

import { ApiEndpoint, FieldType } from './api-console.model';

type CrudField = [string, string, FieldType];

export const API_CONSOLE_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'auth-login',
    group: 'Auth',
    name: 'Đăng nhập',
    description: 'Lấy thông tin phiên đăng nhập từ username và password.',
    method: 'POST',
    path: API_ENDPOINT.AUTH.LOGIN,
    tone: 'create',
    fields: [
      { key: 'username', label: 'Username', type: 'text', location: 'body', placeholder: 'admin' },
      { key: 'password', label: 'Mật khẩu', type: 'password', location: 'body', placeholder: '********' },
    ],
  },
  { id: 'dashboard-summary', group: 'Dashboard', name: 'Tổng quan hệ thống', description: 'Đọc các chỉ số tổng hợp.', method: 'GET', path: API_ENDPOINT.DASHBOARD.SUMMARY, tone: 'neutral', fields: [] },
  { id: 'logs-actions', group: 'Logs', name: 'Nhật ký thao tác', description: 'Danh sách hành động trong hệ thống.', method: 'POST', path: API_ENDPOINT.LOGS.ACTIONS, tone: 'neutral', fields: [] },
  { id: 'logs-logins', group: 'Logs', name: 'Nhật ký đăng nhập', description: 'Lịch sử login của người dùng.', method: 'POST', path: API_ENDPOINT.LOGS.LOGINS, tone: 'neutral', fields: [] },
  { id: 'roles-list', group: 'Roles', name: 'Danh sách vai trò', description: 'Lấy tất cả vai trò.', method: 'POST', path: API_ENDPOINT.ROLES.SEARCH, tone: 'neutral', fields: [] },
  { id: 'roles-permissions', group: 'Roles', name: 'Tất cả phân quyền', description: 'Lấy ma trận quyền.', method: 'GET', path: API_ENDPOINT.ROLES.PERMISSIONS, tone: 'neutral', fields: [] },
  { id: 'roles-permissions-by-role', group: 'Roles', name: 'Quyền theo vai trò', description: 'Lọc quyền theo roleId.', method: 'GET', path: '/api/roles/{roleId}/permissions', tone: 'neutral', fields: [{ key: 'roleId', label: 'Role ID', type: 'number', location: 'path', required: true }] },
  {
    id: 'roles-permissions-update',
    group: 'Roles',
    name: 'Cập nhật quyền chức năng',
    description: 'Bật/tắt quyền theo vai trò, module và chức năng.',
    method: 'PUT',
    path: API_ENDPOINT.ROLES.PERMISSIONS,
    tone: 'update',
    fields: [
      { key: 'roleId', label: 'Role ID', type: 'number', location: 'body' },
      { key: 'moduleId', label: 'Module ID', type: 'number', location: 'body' },
      { key: 'functionId', label: 'Function ID', type: 'number', location: 'body' },
      { key: 'isAllow', label: 'Cho phép', type: 'boolean', location: 'body' },
      { key: 'updatedBy', label: 'Người cập nhật', type: 'text', location: 'body' },
    ],
  },
  {
    id: 'roles-module-update',
    group: 'Roles',
    name: 'Cập nhật quyền module',
    description: 'Bật/tắt quyền ở cấp module.',
    method: 'PUT',
    path: API_ENDPOINT.ROLES.MODULE_PERMISSIONS,
    tone: 'update',
    fields: [
      { key: 'roleId', label: 'Role ID', type: 'number', location: 'body' },
      { key: 'moduleId', label: 'Module ID', type: 'number', location: 'body' },
      { key: 'isAllow', label: 'Cho phép', type: 'boolean', location: 'body' },
      { key: 'updatedBy', label: 'Người cập nhật', type: 'text', location: 'body' },
    ],
  },
  ...crudEndpoints('Classes', API_ENDPOINT.CLASSES.ROOT, API_ENDPOINT.CLASSES.SEARCH, 'Lớp học', [
    ['classCode', 'Mã lớp', 'text'],
    ['className', 'Tên lớp', 'text'],
    ['facultyId', 'Khoa ID', 'number'],
    ['schoolYear', 'Năm học', 'text'],
    ['homeroomTeacher', 'GVCN', 'text'],
    ['createdBy', 'Người tạo', 'text'],
  ]),
  ...crudEndpoints('Students', API_ENDPOINT.STUDENTS.ROOT, API_ENDPOINT.STUDENTS.SEARCH, 'Sinh viên', [
    ['personCode', 'Mã sinh viên', 'text'],
    ['fullName', 'Họ tên', 'text'],
    ['email', 'Email', 'text'],
    ['classId', 'Lớp ID', 'number'],
    ['createdBy', 'Người tạo', 'text'],
  ]),
  ...crudEndpoints('Subjects', API_ENDPOINT.SUBJECTS.ROOT, API_ENDPOINT.SUBJECTS.SEARCH, 'Môn học', [
    ['subjectCode', 'Mã môn', 'text'],
    ['subjectName', 'Tên môn', 'text'],
    ['credits', 'Tín chỉ', 'number'],
    ['totalLessons', 'Số tiết', 'number'],
    ['createdBy', 'Người tạo', 'text'],
  ]),
  ...crudEndpoints('Scores', API_ENDPOINT.SCORES.ROOT, API_ENDPOINT.SCORES.SEARCH, 'Điểm', [
    ['personProfileId', 'Hồ sơ SV ID', 'number'],
    ['subjectId', 'Môn học ID', 'number'],
    ['semesterId', 'Học kỳ ID', 'number'],
    ['attendanceScore', 'Điểm chuyên cần', 'number'],
    ['midtermScore', 'Điểm giữa kỳ', 'number'],
    ['finalScore', 'Điểm cuối kỳ', 'number'],
    ['createdBy', 'Người tạo ID', 'number'],
  ], false),
  {
    id: 'uploads-images',
    group: 'Uploads',
    name: 'Tải ảnh lên',
    description: 'Upload file bằng multipart/form-data.',
    method: 'POST',
    path: API_ENDPOINT.UPLOADS.IMAGES,
    tone: 'create',
    fields: [{ key: 'file', label: 'File ảnh', type: 'file', location: 'formData', required: true }],
  },
  {
    id: 'users-change-password',
    group: 'Users',
    name: 'Đổi mật khẩu',
    description: 'Đổi mật khẩu cho user theo userId.',
    method: 'PUT',
    path: '/api/users/{userId}/password',
    tone: 'update',
    fields: [
      { key: 'userId', label: 'User ID', type: 'number', location: 'path', required: true },
      { key: 'oldPassword', label: 'Mật khẩu cũ', type: 'password', location: 'body' },
      { key: 'newPassword', label: 'Mật khẩu mới', type: 'password', location: 'body' },
      { key: 'updatedBy', label: 'Người cập nhật', type: 'text', location: 'body' },
    ],
  },
  {
    id: 'users-reset-password',
    group: 'Users',
    name: 'Reset mật khẩu',
    description: 'Đặt lại mật khẩu cho user.',
    method: 'PUT',
    path: '/api/users/{userId}/reset-password',
    tone: 'update',
    fields: [
      { key: 'userId', label: 'User ID', type: 'number', location: 'path', required: true },
      { key: 'newPassword', label: 'Mật khẩu mới', type: 'password', location: 'body' },
      { key: 'updatedBy', label: 'Người cập nhật', type: 'text', location: 'body' },
    ],
  },
  { id: 'weather', group: 'WeatherForecast', name: 'WeatherForecast', description: 'Endpoint mẫu của backend.', method: 'GET', path: API_ENDPOINT.WEATHER_FORECAST, tone: 'neutral', fields: [] },
];

function crudEndpoints(group: string, basePath: string, searchPath: string, noun: string, fields: CrudField[], softDelete = true): ApiEndpoint[] {
  const bodyFields = fields.map(([key, label, type]) => ({ key, label, type, location: 'body' as const }));
  const updateFields = [
    ...bodyFields,
    { key: 'isActive', label: 'Đang hoạt động', type: 'boolean' as const, location: 'body' as const },
    { key: 'updatedBy', label: softDelete ? 'Người cập nhật' : 'Người cập nhật ID', type: softDelete ? 'text' as const : 'number' as const, location: 'body' as const },
  ];

  return [
    { id: `${group}-list`, group, name: `Danh sách ${noun}`, description: `Lấy toàn bộ ${noun.toLowerCase()}.`, method: 'POST', path: searchPath, tone: 'neutral', fields: [] },
    { id: `${group}-detail`, group, name: `Chi tiết ${noun}`, description: `Tìm ${noun.toLowerCase()} theo ID.`, method: 'GET', path: `${basePath}/{id}`, tone: 'neutral', fields: [{ key: 'id', label: 'ID', type: 'number', location: 'path', required: true }] },
    { id: `${group}-create`, group, name: `Tạo ${noun}`, description: `Thêm mới ${noun.toLowerCase()}.`, method: 'POST', path: basePath, tone: 'create', fields: bodyFields },
    { id: `${group}-update`, group, name: `Cập nhật ${noun}`, description: `Sửa thông tin ${noun.toLowerCase()}.`, method: 'PUT', path: `${basePath}/{id}`, tone: 'update', fields: [{ key: 'id', label: 'ID', type: 'number', location: 'path', required: true }, ...updateFields] },
    { id: `${group}-delete`, group, name: `Xóa ${noun}`, description: `Xóa hoặc khóa ${noun.toLowerCase()}.`, method: 'DELETE', path: `${basePath}/{id}`, tone: 'danger', fields: [{ key: 'id', label: 'ID', type: 'number', location: 'path', required: true }, ...(softDelete ? [{ key: 'updatedBy', label: 'Người cập nhật', type: 'text' as const, location: 'query' as const }] : [])] },
  ];
}
