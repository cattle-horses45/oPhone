import api from './client';

export async function createChatSession() {
  const { data } = await api.post('/api/v1/chat/sessions');
  return data;
}

export async function getChatSessions() {
  const { data } = await api.get('/api/v1/chat/sessions');
  return data;
}

export async function getChatMessages(sessionId: number) {
  const { data } = await api.get(`/api/v1/chat/sessions/${sessionId}/messages`);
  return data;
}

export async function transferToHuman(sessionId: number, reason: string) {
  const { data } = await api.post(`/api/v1/chat/sessions/${sessionId}/transfer`, { reason });
  return data;
}

export async function closeChatSession(sessionId: number) {
  const { data } = await api.post(`/api/v1/chat/sessions/${sessionId}/close`);
  return data;
}
