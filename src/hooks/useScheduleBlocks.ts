'use client';

import { useState, useCallback, useRef } from 'react';
import { startOfWeek, endOfWeek } from 'date-fns';
import type { 
  ScheduleBlock, 
  CreateBlockData, 
  UpdateBlockData, 
  UseScheduleBlocksReturn,
  ScheduleBlocksResponse,
  ScheduleBlockResponse
} from '@/lib/types';

interface UseScheduleBlocksOptions {
  weekDate?: Date;
  enableOptimisticUpdates?: boolean;
}

export function useScheduleBlocks(options: UseScheduleBlocksOptions = {}): UseScheduleBlocksReturn {
  const { weekDate = new Date(), enableOptimisticUpdates = true } = options;
  
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Keep track of the current week to avoid unnecessary refetches
  const currentWeekRef = useRef<Date>(weekDate);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  // Helper function to make API requests with error handling
  const makeApiRequest = useCallback(async <T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> => {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data;
  }, []);

  // Fetch blocks for the current week
  const fetchBlocks = useCallback(async (targetDate: Date = weekDate): Promise<ScheduleBlock[]> => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);

    try {
      const weekStart = startOfWeek(targetDate, { weekStartsOn: 0 });
      const url = `/api/schedule?date=${weekStart.toISOString()}`;
      
      const fetchedBlocks = await makeApiRequest<ScheduleBlock[]>(url, {
        signal: abortController.signal,
      });

      // Only update if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setBlocks(fetchedBlocks);
        currentWeekRef.current = targetDate;
      }

      return fetchedBlocks;
    } catch (err) {
      if (!abortController.signal.aborted) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        console.error('Error fetching schedule blocks:', err);
      }
      throw err;
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [weekDate, makeApiRequest, handleApiError]);

  // Create a new block
  const createBlock = useCallback(async (data: CreateBlockData): Promise<void> => {
    setError(null);
    
    // Optimistic update
    let optimisticBlock: ScheduleBlock | null = null;
    if (enableOptimisticUpdates) {
      optimisticBlock = {
        id: `temp-${Date.now()}`,
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        categoryId: data.categoryId,
        category: { id: data.categoryId, name: 'Loading...', color: '#gray' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setBlocks(prev => [...prev, optimisticBlock!]);
    }

    try {
      const newBlock = await makeApiRequest<ScheduleBlock>('/api/schedule', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      // Replace optimistic update with real data
      if (enableOptimisticUpdates && optimisticBlock) {
        setBlocks(prev => prev.map(block => 
          block.id === optimisticBlock!.id ? newBlock : block
        ));
      } else {
        setBlocks(prev => [...prev, newBlock]);
      }
    } catch (err) {
      // Revert optimistic update on error
      if (enableOptimisticUpdates && optimisticBlock) {
        setBlocks(prev => prev.filter(block => block.id !== optimisticBlock!.id));
      }
      
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    }
  }, [enableOptimisticUpdates, makeApiRequest, handleApiError]);

  // Update an existing block
  const updateBlock = useCallback(async (id: string, data: UpdateBlockData): Promise<void> => {
    setError(null);
    
    // Store original block for rollback
    const originalBlock = blocks.find(block => block.id === id);
    if (!originalBlock) {
      throw new Error('Bloque no encontrado');
    }

    // Optimistic update
    if (enableOptimisticUpdates) {
      setBlocks(prev => prev.map(block => 
        block.id === id 
          ? { 
              ...block, 
              ...data,
              updatedAt: new Date(),
            }
          : block
      ));
    }

    try {
      const updatedBlock = await makeApiRequest<ScheduleBlock>(`/api/schedule/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      // Update with real data from server
      setBlocks(prev => prev.map(block => 
        block.id === id ? updatedBlock : block
      ));
    } catch (err) {
      // Revert optimistic update on error
      if (enableOptimisticUpdates) {
        setBlocks(prev => prev.map(block => 
          block.id === id ? originalBlock : block
        ));
      }
      
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    }
  }, [blocks, enableOptimisticUpdates, makeApiRequest, handleApiError]);

  // Delete a block
  const deleteBlock = useCallback(async (id: string): Promise<void> => {
    setError(null);
    
    // Store original block for rollback
    const originalBlock = blocks.find(block => block.id === id);
    if (!originalBlock) {
      throw new Error('Bloque no encontrado');
    }

    // Optimistic update
    if (enableOptimisticUpdates) {
      setBlocks(prev => prev.filter(block => block.id !== id));
    }

    try {
      await makeApiRequest(`/api/schedule/${id}`, {
        method: 'DELETE',
      });

      // Ensure block is removed (in case optimistic update was disabled)
      if (!enableOptimisticUpdates) {
        setBlocks(prev => prev.filter(block => block.id !== id));
      }
    } catch (err) {
      // Revert optimistic update on error
      if (enableOptimisticUpdates) {
        setBlocks(prev => [...prev, originalBlock]);
      }
      
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    }
  }, [blocks, enableOptimisticUpdates, makeApiRequest, handleApiError]);

  // Refetch blocks (useful for manual refresh)
  const refetch = useCallback(async (): Promise<void> => {
    await fetchBlocks(currentWeekRef.current);
  }, [fetchBlocks]);

  return {
    blocks,
    isLoading,
    error,
    createBlock,
    updateBlock,
    deleteBlock,
    refetch,
  };
}