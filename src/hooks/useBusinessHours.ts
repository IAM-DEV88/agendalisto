import { useState, useEffect } from 'react';
import { BusinessHours, getBusinessHours, setBusinessHours } from '../lib/api';
import { useToast } from './useToast';

export interface UseBusinessHoursResult {
  businessHours: BusinessHours[];
  loading: boolean;
  saving: boolean;
  message: { text: string; type: 'success' | 'error' } | null;
  updateHour: (index: number, field: keyof Omit<BusinessHours, 'id'>, value: any) => void;
  saveHours: (e: React.FormEvent) => Promise<boolean>;
}

export const useBusinessHours = (businessId: string | undefined): UseBusinessHoursResult => {
  const [businessHours, setBusinessHoursState] = useState<BusinessHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const toast = useToast();

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  useEffect(() => {
    const loadHours = async () => {
      if (!businessId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const hours = await getBusinessHours(businessId);
        
        // Ensure full week array
        const fullWeek = days.map((_, idx) => {
          const found = hours.find(h => h.day_of_week === idx);
          return found
            ? found
            : { 
                id: `${businessId}-${idx}`, 
                business_id: businessId, 
                day_of_week: idx, 
                start_time: '09:00', 
                end_time: '17:00', 
                is_closed: true 
              } as BusinessHours;
        });
        
        setBusinessHoursState(fullWeek);
      } catch (err: any) {
        setMessage({ 
          text: err.message || 'Error al cargar los horarios del negocio', 
          type: 'error' 
        });
        toast.error(err.message || 'Error al cargar los horarios del negocio');
      } finally {
        setLoading(false);
      }
    };

    loadHours();
  }, [businessId]);

  const updateHour = (index: number, field: keyof Omit<BusinessHours, 'id'>, value: any) => {
    setBusinessHoursState(prev => {
      const newHours = [...prev];
      (newHours[index] as any)[field] = value;
      return newHours;
    });
  };

  const saveHours = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    
    if (!businessId) {
      setMessage({ type: 'error', text: 'No business ID available' });
      toast.error('No business ID available');
      return false;
    }

    setSaving(true);
    setMessage(null);

    try {
      // Prepare payload for API (no id field)
      const payload = businessHours.map(({ business_id, day_of_week, start_time, end_time, is_closed }) => ({ 
        business_id, 
        day_of_week, 
        start_time, 
        end_time, 
        is_closed 
      }));
      
      await setBusinessHours(payload);
      setMessage({ text: 'Horarios actualizados correctamente', type: 'success' });
      toast.success('Horarios actualizados correctamente');
      return true;
    } catch (err: any) {
      setMessage({ text: err.message || 'Error al actualizar horarios', type: 'error' });
      toast.error(err.message || 'Error al actualizar horarios');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    businessHours,
    loading,
    saving,
    message,
    updateHour,
    saveHours
  };
}; 