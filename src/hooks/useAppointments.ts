import { useEffect, useReducer } from 'react';
import * as ApiClient from '../lib/api';
import { Appointment } from '../types/appointment';
import { supabase } from '../lib/supabase';

type AppointmentsState = {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
};

type AppointmentsAction = 
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Appointment[] }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'UPDATE_APPOINTMENT'; payload: Appointment }
  | { type: 'ADD_REVIEW'; payload: { appointmentId: string; review: any } };

function appointmentsReducer(state: AppointmentsState, action: AppointmentsAction): AppointmentsState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { appointments: action.payload, loading: false, error: null };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'UPDATE_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.map(apt => 
          apt.id === action.payload.id ? action.payload : apt
        )
      };
    case 'ADD_REVIEW':
      return {
        ...state,
        appointments: state.appointments.map(apt => 
          apt.id === action.payload.appointmentId 
            ? { ...apt, review: action.payload.review }
            : apt
        )
      };
    default:
      return state;
  }
}

export function useAppointments(userId: string | undefined) {
  const [state, dispatch] = useReducer(appointmentsReducer, {
    appointments: [],
    loading: false,
    error: null
  });

  const fetchAppointments = async () => {
    if (!userId) return;
    dispatch({ type: 'FETCH_START' });
    const result = await ApiClient.getUserAppointments(userId);
    if (result.success && result.data) {
      dispatch({ type: 'FETCH_SUCCESS', payload: result.data });
    } else {
      dispatch({ type: 'FETCH_ERROR', payload: result.error || 'Error al cargar citas' });
    }
  };

  useEffect(() => {
    if (!userId) return;

    fetchAppointments();

    // Subscribe to changes
    const appointmentsChannel = supabase
      .channel('appointments-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      appointmentsChannel.unsubscribe();
    };
  }, [userId]);

  const addReview = (appointmentId: string, review: any) => {
    dispatch({ type: 'ADD_REVIEW', payload: { appointmentId, review } });
  };

  return {
    ...state,
    addReview,
    refreshAppointments: fetchAppointments
  };
} 
