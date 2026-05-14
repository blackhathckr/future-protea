import api from '@/lib/api';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetRoles: string[];
  isActive: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  targetRoles: string[];
  expiresAt?: string;
}

export interface UpdateAnnouncementData {
  title?: string;
  content?: string;
  targetRoles?: string[];
  expiresAt?: string;
}

class AnnouncementAdminService {
  static async listAnnouncements(params?: { page?: number; limit?: number; search?: string }) {
    const response = await api.get('/users/announcements', { params });
    return response.data;
  }

  static async getAnnouncement(id: string) {
    const response = await api.get(`/users/announcements/${id}`);
    return response.data;
  }

  static async createAnnouncement(data: CreateAnnouncementData) {
    const response = await api.post('/users/announcements', data);
    return response.data;
  }

  static async updateAnnouncement(id: string, data: UpdateAnnouncementData) {
    const response = await api.put(`/users/announcements/${id}`, data);
    return response.data;
  }

  static async deleteAnnouncement(id: string) {
    const response = await api.delete(`/users/announcements/${id}`);
    return response.data;
  }

  static async publishAnnouncement(id: string) {
    const response = await api.put(`/users/announcements/${id}/publish`);
    return response.data;
  }

  static async unpublishAnnouncement(id: string) {
    const response = await api.put(`/users/announcements/${id}/unpublish`);
    return response.data;
  }
}

export default AnnouncementAdminService;
