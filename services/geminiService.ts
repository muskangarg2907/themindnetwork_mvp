import { UserProfile, ChatMessage } from '../types';

const API_BASE = '';

export const generateProfileSummary = async (profile: Partial<UserProfile>): Promise<string> => {
  try {
    const res = await fetch(`${API_BASE}/api/generate/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error('generateProfileSummary failed:', res.status, txt);
      return 'Summary generation failed.';
    }
    const json = await res.json();
    return json.text || 'Summary could not be generated.';
  } catch (err) {
    console.error('generateProfileSummary error:', err);
    return 'AI generation currently unavailable.';
  }
};

export const generateProviderBio = async (profile: Partial<UserProfile>): Promise<string> => {
  try {
    const res = await fetch(`${API_BASE}/api/generate/bio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error('generateProviderBio failed:', res.status, txt);
      return 'Bio generation failed.';
    }
    const json = await res.json();
    return json.text || 'Bio could not be generated.';
  } catch (err) {
    console.error('generateProviderBio error:', err);
    return 'AI generation currently unavailable.';
  }
};

export class ProfileChatService {
  // Placeholder: chat is not implemented server-side yet.
  constructor(profile: UserProfile) {}
  public async sendMessage(_message: string): Promise<string> { return "Chat not available in local mode."; }
}