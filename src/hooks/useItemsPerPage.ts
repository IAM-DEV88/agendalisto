import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../lib/supabase';
import { RootState } from '../store';
import { setItemsPerPage } from '../store/uiSlice';
import { notifySuccess, notifyError } from '../lib/toast';

export const useItemsPerPage = (userId: string | undefined) => {
  const dispatch = useDispatch();
  const [localItemsPerPage, setLocalItemsPerPage] = useState(4);
  const itemsPerPage = useSelector((state: RootState) => state.ui.itemsPerPage);

  // Load initial value from profile
  useEffect(() => {
    const loadItemsPerPage = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('items_per_page')
          .eq('id', userId)
          .single();

        if (error) throw error;
        if (data?.items_per_page) {
          dispatch(setItemsPerPage(data.items_per_page));
          setLocalItemsPerPage(data.items_per_page);
        }
      } catch (err) {
        console.error('Error loading items_per_page:', err);
      }
    };

    loadItemsPerPage();
  }, [userId, dispatch]);

  // Save items_per_page to profile
  const saveItemsPerPage = async (newValue: number): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: 'No user ID available' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ items_per_page: newValue })
        .eq('id', userId);

      if (error) throw error;

      dispatch(setItemsPerPage(newValue));
      setLocalItemsPerPage(newValue);
      notifySuccess('Configuración guardada correctamente');
      return { success: true };
    } catch (err) {
      console.error('Error saving items_per_page:', err);
      notifyError('Error al guardar la configuración');
      return { success: false, error: 'Error al guardar la configuración' };
    }
  };

  return {
    itemsPerPage,
    localItemsPerPage,
    setLocalItemsPerPage,
    saveItemsPerPage
  };
}; 