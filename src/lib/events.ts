import { User } from '@supabase/supabase-js';
import { UserProfile } from './supabase';

export const USER_PROFILE_UPDATED = 'userProfileUpdated';

interface UserProfileUpdatedDetail {
  user: User;
  profile: UserProfile;
}

export function dispatchUserProfileUpdated(user: User, profile: UserProfile) {
  const event = new CustomEvent<UserProfileUpdatedDetail>(USER_PROFILE_UPDATED, {
    detail: {
      user,
      profile
    }
  });
  window.dispatchEvent(event);
}

export function onUserProfileUpdated(callback: (detail: UserProfileUpdatedDetail) => void) {
  const handler = (event: CustomEvent<UserProfileUpdatedDetail>) => {
    callback(event.detail);
  };
  
  window.addEventListener(USER_PROFILE_UPDATED, handler as EventListener);
  
  // Retornamos una función para remover el event listener
  return () => {
    window.removeEventListener(USER_PROFILE_UPDATED, handler as EventListener);
  };
} 