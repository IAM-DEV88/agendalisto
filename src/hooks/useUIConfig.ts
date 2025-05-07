import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setItemsPerPage } from '../store/uiSlice';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';

export interface UseUIConfigResult {
  // Theme settings
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  
  // Items per page config
  itemsPerPage: number;
  setItemsPerPageValue: (value: number) => void;
  saveItemsPerPage: (userId: string) => Promise<boolean>;
  
  // Loading state
  loading: boolean;
  message: string | null;
}

export const useUIConfig = (): UseUIConfigResult => {
  const dispatch = useDispatch();
  const toast = useToast();
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

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const setItemsPerPageValue = (value: number) => {
    if (value >= 1 && value <= 50) {
      dispatch(setItemsPerPage(value));
    }
  };

  const saveItemsPerPage = async (userId: string): Promise<boolean> => {
    if (!userId) return false;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ items_per_page: itemsPerPage })
        .eq('id', userId);
        
      if (error) throw error;
      
      toast.success('Configuración guardada correctamente');
      return true;
    } catch (err: any) {
      const errorMsg = err.message || 'Error al guardar la configuración';
      setMessage(errorMsg);
      toast.error(errorMsg);
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