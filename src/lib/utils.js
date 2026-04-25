/**
 * Утилиты для работы с проектами и версиями
 */

export const formatDate = (date) => {
  if (!date) return '';
  try {
    return new Date(date).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (err) {
    console.error('❌ Format date error:', err);
    return '';
  }
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getAcceptedMembersCount = (members) => {
  if (!Array.isArray(members)) return 0;
  return members.filter(m => m.accepted === true).length;
};

export const isProjectOwner = (project, userId) => {
  if (!project || !userId) return false;
  return project.owner_id === userId;
};

export const isProjectAdmin = (project, members, userId) => {
  if (isProjectOwner(project, userId)) return true;
  if (!Array.isArray(members)) return false;
  const member = members.find(m => m.user?.id === userId || m.user_id === userId);
  return member?.role === 'admin' && member?.accepted === true;
};

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const getInitials = (fullName) => {
  if (!fullName || typeof fullName !== 'string') return '??';
  const parts = fullName.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return fullName.substring(0, 2).toUpperCase();
};

export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const getAvatarColor = (name) => {
  if (!name) return '#999999';
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1',
    '#FFA07A', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E2', '#F8B88B',
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export const formatVersion = (version) => {
  if (typeof version !== 'number') return '';
  return `v${version}`;
};

export default {
  formatDate,
  truncateText,
  getAcceptedMembersCount,
  isProjectOwner,
  isProjectAdmin,
  formatFileSize,
  getInitials,
  isValidEmail,
  getAvatarColor,
  formatVersion,
};