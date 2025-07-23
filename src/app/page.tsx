'use client';

import { useState } from 'react';
import { useWeekGrid } from '@/hooks/useWeekGrid';
import { WeekNavigation } from '@/components/schedule/WeekNavigation';
import { ScheduleBlock } from '@/components/schedule/ScheduleBlock';
import { BlockForm } from '@/components/schedule/BlockForm';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { ScheduleBlock as ScheduleBlockType, Category, BlockFormData } from '@/lib/types';

// Mock data for demonstration
const mockCategories: Category[] = [
  { id: '1', name: 'Trabajo', color: '#3B82F6' },
  { id: '2', name: 'Personal', color: '#22C55E' },
  { id: '3', name: 'Ejercicio', color: '#EF4444' },
  { id: '4', name: 'Estudio', color: '#8B5CF6' },
];

const mockBlocks: ScheduleBlockType[] = [
  {
    id: '1',
    title: 'Reunión de equipo',
    description: 'Revisión semanal del proyecto',
    startTime: new Date(2025, 0, 20, 9, 0), // Monday 9:00 AM
    endTime: new Date(2025, 0, 20, 10, 30), // Monday 10:30 AM
    categoryId: '1',
    category: mockCategories[0],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Ejercicio',
    description: 'Rutina de cardio',
    startTime: new Date(2025, 0, 21, 7, 0), // Tuesday 7:00 AM
    endTime: new Date(2025, 0, 21, 8, 0), // Tuesday 8:00 AM
    categoryId: '3',
    category: mockCategories[2],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    title: 'Almuerzo con cliente',
    description: 'Presentación de propuesta',
    startTime: new Date(2025, 0, 22, 13, 0), // Wednesday 1:00 PM
    endTime: new Date(2025, 0, 22, 14, 30), // Wednesday 2:30 PM
    categoryId: '1',
    category: mockCategories[0],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function Home() {
  const weekGrid = useWeekGrid();
  const [blocks, setBlocks] = useState<ScheduleBlockType[]>(mockBlocks);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlockType | undefined>();

  // Handle block creation/editing
  const handleSaveBlock = async (data: BlockFormData) => {
    if (editingBlock) {
      // Update existing block
      const updatedBlock: ScheduleBlockType = {
        ...editingBlock,
        ...data,
        category: mockCategories.find(cat => cat.id === data.categoryId) || mockCategories[0],
        updatedAt: new Date(),
      };
      setBlocks(prev => prev.map(block => 
        block.id === editingBlock.id ? updatedBlock : block
      ));
    } else {
      // Create new block
      const newBlock: ScheduleBlockType = {
        id: `block-${Date.now()}`,
        ...data,
        category: mockCategories.find(cat => cat.id === data.categoryId) || mockCategories[0],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setBlocks(prev => [...prev, newBlock]);
    }
    
    setIsFormOpen(false);
    setEditingBlock(undefined);
  };

  // Handle block deletion
  const handleDeleteBlock = async (blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
  };

  // Handle block editing
  const handleEditBlock = (block: ScheduleBlockType) => {
    setEditingBlock(block);
    setIsFormOpen(true);
  };

  // Handle form cancellation
  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingBlock(undefined);
  };

  // Filter blocks for current week
  const currentWeekBlocks = blocks.filter(block => 
    weekGrid.isInCurrentWeek(block.startTime)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />
      
      {/* Action Bar */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Planificador semanal</p>
            </div>
            
            <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Bloque
            </Button>
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

        {/* Schedule Grid */}
        <div className="bg-card rounded-lg border shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-card-foreground">Horario de la Semana</h2>
              <div className="text-sm text-muted-foreground">
                {currentWeekBlocks.length} bloque{currentWeekBlocks.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Schedule Blocks Display */}
            <div className="space-y-4">
              {currentWeekBlocks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg mb-2">No hay bloques programados para esta semana</p>
                  <p className="text-sm">Haz clic en "Nuevo Bloque" para agregar tu primer evento</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {currentWeekBlocks.map((block) => {
                    const gridPosition = weekGrid.getBlockPosition(block);
                    return (
                      <div key={block.id} className="relative">
                        <ScheduleBlock
                          block={block}
                          gridPosition={gridPosition}
                          onEdit={() => handleEditBlock(block)}
                          onDelete={() => handleDeleteBlock(block.id)}
                          className="w-full"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Categories Legend */}
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 text-card-foreground">Categorías</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {mockCategories.map((category) => (
              <div key={category.id} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-sm font-medium text-card-foreground">{category.name}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Block Form Modal */}
      <BlockForm
        block={editingBlock}
        categories={mockCategories}
        onSave={handleSaveBlock}
        onCancel={handleCancelForm}
        isOpen={isFormOpen}
        weekStart={weekGrid.weekInfo.start}
      />
    </div>
  );
}
