'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Category } from '@/lib/types';

interface UseCategoriesReturn {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to handle API errors
  const handleApiError = useCallback((error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Ha ocurrido un error inesperado';
  }, []);

  // Fetch categories from API
  const fetchCategories = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/categories');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setCategories(data.data || data);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Error fetching categories:', err);
      
      // Fallback to default categories if API fails
      const defaultCategories: Category[] = [
        { id: '1', name: 'Trabajo', color: '#3B82F6' },
        { id: '2', name: 'Personal', color: '#22C55E' },
        { id: '3', name: 'Ejercicio', color: '#EF4444' },
        { id: '4', name: 'Estudio', color: '#8B5CF6' },
      ];
      setCategories(defaultCategories);
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
  };
}