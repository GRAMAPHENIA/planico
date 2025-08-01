'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWeekGrid } from '@/hooks/useWeekGrid';
import { useScheduleBlocks } from '@/hooks/useScheduleBlocks';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/useToast';
import { WeekNavigation } from '@/components/schedule/WeekNavigation';
import { WeekGrid } from '@/components/schedule/WeekGrid';
import { BlockForm } from '@/components/schedule/BlockForm';
import { Header } from '@/components/layout/Header';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, AlertCircle, RefreshCw, Calendar, Loader2, Bell, Download } from 'lucide-react';
import type { ScheduleBlock as ScheduleBlockType, BlockFormData, TimeSlot } from '@/lib/types';
import { ConflictChecker } from '@/lib/conflict-checker';
import { ReminderService } from '@/lib/reminders';
import { CalendarSyncService } from '@/lib/calendar-sync';
import { MetricsCalculator } from '@/lib/metrics';
import { differenceInMinutes } from 'date-fns';



export default function Home() {
  // Core hooks for data management
  const weekGrid = useWeekGrid({ enableUrlState: true });
  const scheduleBlocks = useScheduleBlocks({ 
    weekDate: weekGrid.currentWeek,
    enableOptimisticUpdates: true 
  });
  const categories = useCategories();
  const { toast, toasts } = useToast();

  // UI state management
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlockType | undefined>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState(() => 
    MetricsCalculator.calculateWeeklyMetrics(scheduleBlocks.blocks, weekGrid.currentWeek)
  );

  // Request notification permission on mount
  useEffect(() => {
    ReminderService.requestNotificationPermission();
  }, []);

  // Update metrics when blocks change
  useEffect(() => {
    const updatedMetrics = MetricsCalculator.calculateWeeklyMetrics(
      scheduleBlocks.blocks, 
      weekGrid.currentWeek
    );
    setMetrics(updatedMetrics);
  }, [scheduleBlocks.blocks, weekGrid.currentWeek]);

  // Fetch blocks when week changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        await scheduleBlocks.refetch();
      } catch (error) {
        // Ignore AbortError - it's expected when changing weeks quickly
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error fetching blocks for new week:', error);
        }
      }
    };
    
    fetchData();
  }, [weekGrid.currentWeek]); // Removed scheduleBlocks.refetch from dependencies

  // Handle block creation/editing with enhanced functionality
  const handleSaveBlock = useCallback(async (data: BlockFormData) => {
    try {
      if (editingBlock) {
        // Update existing block
        await scheduleBlocks.updateBlock(editingBlock.id, data);
        toast.success('Bloque actualizado', 'El bloque se ha actualizado correctamente');
      } else {
        // Create new block with enhanced functionality
        const newBlock = await scheduleBlocks.createBlock(data, {
          onSuccess: (block) => {
            // Schedule reminder
            ReminderService.scheduleReminder(block, {
              minutesBefore: 15,
              enabled: true,
              type: 'notification'
            });

            // Update metrics
            const updatedMetrics = MetricsCalculator.updateMetricsAfterBlockCreation(metrics, block);
            setMetrics(updatedMetrics);

            // Show success notification
            toast.success(
              'Bloque creado exitosamente',
              `"${block.title}" ha sido agregado a tu calendario`
            );
          }
        });
      }
      
      // Close form and reset state
      setIsFormOpen(false);
      setEditingBlock(undefined);
      setSelectedTimeSlot(undefined);
    } catch (error) {
      // Handle specific conflict errors
      if (error instanceof Error && error.message.includes('se superpone')) {
        toast.warning(
          'Conflicto de horario detectado',
          'Este bloque se superpone con otro bloque existente. Por favor, elige un horario diferente.'
        );
      } else {
        toast.error(
          'Error al guardar el bloque',
          error instanceof Error ? error.message : 'Ha ocurrido un error inesperado'
        );
      }
      console.error('Error saving block:', error);
      // Error is already handled by the hook with user-friendly messages
    }
  }, [editingBlock, scheduleBlocks, toast, metrics]);

  // Handle block deletion with confirmation
  const handleDeleteBlock = useCallback(async (blockId: string) => {
    try {
      // Cancel any scheduled reminders
      ReminderService.cancelReminder(blockId);
      
      await scheduleBlocks.deleteBlock(blockId);
      
      toast.success('Bloque eliminado', 'El bloque ha sido eliminado correctamente');
      
      // Update metrics
      const updatedMetrics = MetricsCalculator.calculateWeeklyMetrics(
        scheduleBlocks.blocks.filter(b => b.id !== blockId), 
        weekGrid.currentWeek
      );
      setMetrics(updatedMetrics);
    } catch (error) {
      toast.error('Error al eliminar el bloque', 'No se pudo eliminar el bloque');
      console.error('Error deleting block:', error);
    }
  }, [scheduleBlocks, toast, weekGrid.currentWeek]);

  // Export calendar functionality
  const handleExportCalendar = useCallback((format: 'google' | 'outlook' | 'ics') => {
    if (scheduleBlocks.blocks.length === 0) {
      toast.warning('Sin bloques para exportar', 'No hay bloques en la semana actual');
      return;
    }

    try {
      if (format === 'ics') {
        CalendarSyncService.downloadICSFile(scheduleBlocks.blocks);
        toast.success('Calendario exportado', 'El archivo .ics se ha descargado correctamente');
      } else {
        // For Google/Outlook, we'll open each event individually
        scheduleBlocks.blocks.forEach(block => {
          CalendarSyncService.syncBlockToExternalCalendar(block, format);
        });
        toast.info('Abriendo calendario externo', `Se abrirán ${scheduleBlocks.blocks.length} eventos en ${format}`);
      }
    } catch (error) {
      toast.error('Error al exportar', 'No se pudo exportar el calendario');
      console.error('Export error:', error);
    }
  }, [scheduleBlocks.blocks, toast]);

  // Handle block editing
  const handleEditBlock = useCallback((block: ScheduleBlockType) => {
    setEditingBlock(block);
    setSelectedTimeSlot(undefined);
    setIsFormOpen(true);
  }, []);

  // Handle form cancellation
  const handleCancelForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingBlock(undefined);
    setSelectedTimeSlot(undefined);
  }, []);

  // Handle time slot click to create new block
  const handleBlockCreate = useCallback((timeSlot: TimeSlot) => {
    setEditingBlock(undefined);
    setSelectedTimeSlot(timeSlot);
    setIsFormOpen(true);
  }, []);

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        scheduleBlocks.refetch(),
        categories.refetch()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [scheduleBlocks, categories]);

  // Filter blocks for current week
  const currentWeekBlocks = scheduleBlocks.blocks.filter(block => 
    weekGrid.isInCurrentWeek(block.startTime)
  );

  // Check if any critical data is loading
  const isInitialLoading = scheduleBlocks.isLoading && scheduleBlocks.blocks.length === 0;
  const hasAnyError = scheduleBlocks.error || categories.error;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <Header />
        
        {/* Action Bar */}
        <div className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Planificador Semanal</p>
                  <p className="text-xs text-muted-foreground">
                    {weekGrid.weekRangeString}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Actualizando...' : 'Actualizar'}
                </Button>
                
                <Button 
                  onClick={() => setIsFormOpen(true)} 
                  className="flex items-center gap-2"
                  disabled={categories.isLoading}
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Bloque
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Week Navigation */}
          <WeekNavigation
            currentWeek={weekGrid.currentWeek}
            weekInfo={weekGrid.weekInfo}
            onNavigateWeek={weekGrid.navigateWeek}
            onGoToCurrentWeek={weekGrid.goToCurrentWeek}
          />

          {/* Global Error Display */}
          {hasAnyError && (
            <Card className="border-destructive/20 bg-destructive/5">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-destructive mb-1">
                      Error al cargar los datos
                    </h4>
                    <div className="space-y-1 text-sm text-destructive/80">
                      {scheduleBlocks.error && (
                        <p>• Bloques de horario: {scheduleBlocks.error}</p>
                      )}
                      {categories.error && (
                        <p>• Categorías: {categories.error}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="mt-3 text-destructive border-destructive/20 hover:bg-destructive/10"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? 'Reintentando...' : 'Reintentar'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Initial Loading State */}
          {isInitialLoading ? (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <div className="text-center">
                  <h3 className="font-medium text-foreground">Cargando horarios</h3>
                  <p className="text-sm text-muted-foreground">
                    Obteniendo los bloques de la semana...
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <>
              {/* Week Grid */}
              <WeekGrid
                weekStart={weekGrid.weekInfo.start}
                blocks={currentWeekBlocks}
                onBlockCreate={handleBlockCreate}
                onBlockEdit={handleEditBlock}
                onBlockDelete={handleDeleteBlock}
                isLoading={scheduleBlocks.isLoading}
                className="shadow-sm"
              />

              {/* Categories Legend */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-card-foreground">
                    Categorías
                  </h3>
                  {categories.isLoading && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                
                {categories.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Cargando categorías...
                      </p>
                    </div>
                  </div>
                ) : categories.error ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-destructive mb-3">
                      Error al cargar categorías: {categories.error}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={categories.refetch}
                      className="text-destructive border-destructive/20"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reintentar
                    </Button>
                  </div>
                ) : categories.categories.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay categorías disponibles</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {categories.categories.map((category) => (
                      <div 
                        key={category.id} 
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-border/20"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm font-medium text-card-foreground">
                          {category.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Empty State for Blocks */}
              {!scheduleBlocks.isLoading && currentWeekBlocks.length === 0 && !hasAnyError && (
                <Card className="p-8">
                  <div className="text-center space-y-4">
                    <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto" />
                    <div>
                      <h3 className="font-medium text-foreground mb-1">
                        No hay bloques esta semana
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Comienza agregando tu primer bloque de horario
                      </p>
                      <Button 
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Crear primer bloque
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </main>

        {/* Export Calendar Section */}
        {currentWeekBlocks.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Exportar Calendario</h3>
                <p className="text-sm text-muted-foreground">
                  Sincroniza tus bloques con calendarios externos
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportCalendar('google')}
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Google
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportCalendar('outlook')}
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Outlook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportCalendar('ics')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  .ICS
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Productivity Metrics */}
        {currentWeekBlocks.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">
              Métricas de Productividad
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{metrics.totalBlocks}</div>
                <div className="text-sm text-muted-foreground">Bloques Totales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(metrics.totalMinutes / 60)}h
                </div>
                <div className="text-sm text-muted-foreground">Tiempo Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(metrics.averageBlockDuration)}m
                </div>
                <div className="text-sm text-muted-foreground">Duración Promedio</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {metrics.weeklyProgress.efficiency}%
                </div>
                <div className="text-sm text-muted-foreground">Eficiencia</div>
              </div>
            </div>
          </Card>
        )}

        {/* Block Form Modal */}
        <BlockForm
          block={editingBlock}
          initialTimeSlot={selectedTimeSlot}
          categories={categories.categories}
          existingBlocks={scheduleBlocks.blocks}
          onSave={handleSaveBlock}
          onCancel={handleCancelForm}
          isOpen={isFormOpen}
          weekStart={weekGrid.weekInfo.start}
        />

        {/* Toast Notifications */}
        <Toaster toasts={toasts} />
      </div>
    </ErrorBoundary>
  );
}
