import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setItemsPerPage } from '../store/uiSlice';
import { supabase } from '../lib/supabase';
import { notifySuccess, notifyError } from '../lib/toast';

export interface UseUIConfigResult {
  // Theme settings
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  
  // Items per page config
  itemsPerPage: number;
  setItemsPerPageValue: (value: number) => void;
  saveItemsPerPage: (userId?: string) => Promise<boolean>;
  
  // Loading state
  loading: boolean;
  message: string | null;
}

export const useUIConfig = (userId?: string): UseUIConfigResult => {
  const dispatch = useDispatch();
  const itemsPerPage = useSelector((state: RootState) => state.ui.itemsPerPage);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Initialize dark mode based on localStorage or system preference
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Load itemsPerPage from DB
  useEffect(() => {
    const loadItemsPerPage = async () => {
      if (!userId) return;
      try {
        const { data, error } = await supabase
          .from('agendaya_profiles')
          .select('items_per_page')
          .eq('id', userId)
          .single();
        if (error) throw error;
        if (data?.items_per_page) {
          dispatch(setItemsPerPage(data.items_per_page));
        }
      } catch (err) {
        console.error('Error loading items_per_page:', err);
      }
    };
    loadItemsPerPage();
  }, [userId, dispatch]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const setItemsPerPageValue = (value: number) => {
    if (value >= 1 && value <= 50) {
      dispatch(setItemsPerPage(value));
    }
  };

  const saveItemsPerPage = async (userIdParam?: string): Promise<boolean> => {
    const uid = userIdParam || userId;
    if (!uid) return false;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const { error } = await supabase
        .from('agendaya_profiles')
        .update({ items_per_page: itemsPerPage })
        .eq('id', uid);
        
      if (error) throw error;
      
      notifySuccess('Configuración guardada correctamente');
      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar la configuración';
      setMessage(errorMsg);
      notifyError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    isDarkMode,
    toggleDarkMode,
    itemsPerPage,
    setItemsPerPageValue,
    saveItemsPerPage,
    loading,
    message
  };
}; 