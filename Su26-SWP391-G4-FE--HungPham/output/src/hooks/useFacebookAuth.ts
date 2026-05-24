/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Facebook OAuth Hook for ParkFlow
 * Handles Facebook SDK initialization, login, logout and user profile fetching.
 */

import { useState, useEffect, useCallback } from 'react';

// Extend Window to include FB SDK types
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
    __FB_APP_ID__: string;
  }
}

export interface FacebookUserProfile {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
      width: number;
      height: number;
    };
  };
}

export interface FacebookAuthState {
  isSDKLoaded: boolean;
  isProcessing: boolean;
  user: FacebookUserProfile | null;
  accessToken: string | null;
  error: string | null;
}

export function useFacebookAuth() {
  const [state, setState] = useState<FacebookAuthState>({
    isSDKLoaded: false,
    isProcessing: false,
    user: null,
    accessToken: null,
    error: null,
  });

  // Listen for FB SDK ready event
  useEffect(() => {
    const handleSDKReady = () => {
      setState(prev => ({ ...prev, isSDKLoaded: true }));
    };

    // Check if SDK is already loaded
    if (window.FB) {
      setState(prev => ({ ...prev, isSDKLoaded: true }));
    } else {
      window.addEventListener('fb-sdk-ready', handleSDKReady);
    }

    return () => {
      window.removeEventListener('fb-sdk-ready', handleSDKReady);
    };
  }, []);

  /**
   * Fetch user profile from Facebook Graph API
   */
  const fetchUserProfile = useCallback((): Promise<FacebookUserProfile> => {
    return new Promise((resolve, reject) => {
      window.FB.api(
        '/me',
        { fields: 'id,name,email,picture.width(200).height(200)' },
        (response: any) => {
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response as FacebookUserProfile);
          }
        }
      );
    });
  }, []);

  /**
   * Initiate Facebook Login popup
   * Returns the user profile and access token on success
   */
  const login = useCallback(async (): Promise<{
    user: FacebookUserProfile;
    accessToken: string;
  }> => {
    if (!state.isSDKLoaded || !window.FB) {
      throw new Error('Facebook SDK chưa được tải. Vui lòng thử lại sau.');
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    return new Promise((resolve, reject) => {
      window.FB.login(
        async (response: any) => {
          if (response.authResponse) {
            const accessToken = response.authResponse.accessToken;
            try {
              const userProfile = await fetchUserProfile();
              setState(prev => ({
                ...prev,
                isProcessing: false,
                user: userProfile,
                accessToken,
                error: null,
              }));
              resolve({ user: userProfile, accessToken });
            } catch (profileError: any) {
              setState(prev => ({
                ...prev,
                isProcessing: false,
                error: profileError.message || 'Không thể lấy thông tin người dùng từ Facebook',
              }));
              reject(profileError);
            }
          } else {
            // User cancelled the login or didn't authorize
            setState(prev => ({
              ...prev,
              isProcessing: false,
              error: 'Đăng nhập Facebook bị hủy.',
            }));
            reject(new Error('Đăng nhập Facebook bị hủy bởi người dùng.'));
          }
        },
        {
          scope: 'public_profile,email',
          return_scopes: true,
        }
      );
    });
  }, [state.isSDKLoaded, fetchUserProfile]);

  /**
   * Logout from Facebook
   */
  const logout = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (window.FB) {
        window.FB.logout(() => {
          setState(prev => ({
            ...prev,
            user: null,
            accessToken: null,
          }));
          resolve();
        });
      } else {
        resolve();
      }
    });
  }, []);

  /**
   * Check if user is already logged in to Facebook
   */
  const checkLoginStatus = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!window.FB) {
        resolve(false);
        return;
      }
      window.FB.getLoginStatus((response: any) => {
        if (response.status === 'connected') {
          const accessToken = response.authResponse.accessToken;
          fetchUserProfile().then(user => {
            setState(prev => ({
              ...prev,
              user,
              accessToken,
            }));
            resolve(true);
          }).catch(() => resolve(false));
        } else {
          resolve(false);
        }
      });
    });
  }, [fetchUserProfile]);

  return {
    ...state,
    login,
    logout,
    checkLoginStatus,
  };
}
