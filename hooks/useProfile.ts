import { useState, useEffect, useCallback } from 'react';
import { sanitizeForStorage } from '../services/security';
import type { UserProfile } from '../types';

interface UseProfileResult {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

/**
 * Custom hook for profile data management
 * Handles loading, caching, and updating user profiles
 */
export function useProfile(phoneNumber: string | null): UseProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!phoneNumber) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Normalize phone for comparison
      const normalizedPhone = phoneNumber.replace(/\D/g, '').slice(-10);

      // Try localStorage first
      const cached = localStorage.getItem('userProfile');
      if (cached) {
        const parsedProfile = JSON.parse(cached);
        // Verify it matches current user (normalize both for comparison)
        const cachedPhone = (parsedProfile.basicInfo?.phone || '').replace(/\D/g, '').slice(-10);
        if (cachedPhone === normalizedPhone) {
          setProfile(parsedProfile);
          setIsLoading(false);
          return;
        }
      }

      // Fetch from backend only if not in cache
      const response = await fetch(`/api/profiles?action=lookup&phone=${encodeURIComponent(normalizedPhone)}`);
      
      if (response.ok) {
        const fetchedProfile = await response.json();
        setProfile(fetchedProfile);
        
        // Cache in localStorage
        localStorage.setItem('userProfile', JSON.stringify(sanitizeForStorage(fetchedProfile)));
      } else if (response.status === 404) {
        // Profile doesn't exist yet
        setProfile(null);
      } else {
        throw new Error(`Failed to fetch profile (${response.status})`);
      }
    } catch (err) {
      console.error('[useProfile] Error loading profile:', err);

      // Fallback for local/dev instability: if cache belongs to current number, use it.
      try {
        const cached = localStorage.getItem('userProfile');
        if (cached) {
          const parsedProfile = JSON.parse(cached);
          const cachedPhone = (parsedProfile.basicInfo?.phone || '').replace(/\D/g, '').slice(-10);
          const normalizedPhone = (phoneNumber || '').replace(/\D/g, '').slice(-10);
          if (cachedPhone && cachedPhone === normalizedPhone) {
            setProfile(parsedProfile);
            setError(null);
            return;
          }
        }
      } catch (fallbackErr) {
        console.error('[useProfile] Cache fallback failed:', fallbackErr);
      }

      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile) return;

    try {
      setIsLoading(true);
      setError(null);

      const updatedProfile = { ...profile, ...updates };
      
      const response = await fetch('/api/profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const savedProfile = await response.json();
      setProfile(savedProfile);
      
      // Update cache
      localStorage.setItem('userProfile', JSON.stringify(sanitizeForStorage(savedProfile)));
    } catch (err) {
      console.error('[useProfile] Error updating profile:', err);
      setError('Failed to update profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    isLoading,
    error,
    refreshProfile: loadProfile,
    updateProfile,
  };
}
