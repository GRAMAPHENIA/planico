'use client';

import { useState, useEffect } from 'react';
import { ScheduleBlock, Category, TimeSlot, BlockFormData } from '@/lib/types';
import { scheduleBlockSchema, type ScheduleBlockInput } from '@/lib/validations';
import { formatTime, roundToTimeSlot, timeSlotToDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Icons
import { Clock, Calendar, Tag, Save, X, Loader2 } from 'lucide-react';

interface BlockFormProps {
  block?: ScheduleBlock;
  initialTimeSlot?: TimeSlot;
  weekStart?: Date;
  categories: Category[];
  onSave: (data: BlockFormData) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
  isLoading?: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export function BlockForm({
  block,
  initialTimeSlot,
  weekStart = new Date(),
  categories,
  onSave,
  onCancel,
  isOpen,
  isLoading = false,
}: BlockFormProps) {
  // Form state
  const [formData, setFormData] = useState<BlockFormData>({
    title: '',
    description: '',
    startTime: new Date(),
    endTime: new Date(),
    categoryId: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (block) {
      // Editing existing block
      setFormData({
        title: block.title,
        description: block.description || '',
        startTime: new Date(block.startTime),
        endTime: new Date(block.endTime),
        categoryId: block.categoryId,
      });
    } else if (initialTimeSlot && weekStart) {
      // Creating new block from time slot
      const startTime = timeSlotToDate(initialTimeSlot, weekStart);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 60); // Default 1 hour duration
      
      setFormData({
        title: '',
        description: '',
        startTime: roundToTimeSlot(startTime),
        endTime: roundToTimeSlot(endTime),
        categoryId: categories.length > 0 ? categories[0].id : '',
      });
    } else {
      // Default new block
      const now = new Date();
      const startTime = roundToTimeSlot(now);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 60);
      
      setFormData({
        title: '',
        description: '',
        startTime,
        endTime: roundToTimeSlot(endTime),
        categoryId: categories.length > 0 ? categories[0].id : '',
      });
    }
    
    // Clear errors when dialog opens/closes
    setErrors({});
  }, [block, initialTimeSlot, weekStart, categories, isOpen]);

  // Validation
  const validateForm = (): boolean => {
    try {
      scheduleBlockSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error: any) {
      const newErrors: FormErrors = {};
      
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
      }
      
      setErrors(newErrors);
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSave(formData);
      onCancel(); // Close dialog on success
    } catch (error) {
      console.error('Error saving block:', error);
      setErrors({ 
        submit: 'Error al guardar el bloque. Por favor, inténtalo de nuevo.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof BlockFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle time changes
  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const [hours, minutes] = value.split(':').map(Number);
    const newTime = new Date(formData[field]);
    newTime.setHours(hours, minutes, 0, 0);
    
    // Round to nearest 30-minute slot
    const roundedTime = roundToTimeSlot(newTime);
    
    handleInputChange(field, roundedTime);
    
    // Auto-adjust end time if start time changes
    if (field === 'startTime') {
      const currentDuration = formData.endTime.getTime() - formData.startTime.getTime();
      const newEndTime = new Date(roundedTime.getTime() + currentDuration);
      
      // Ensure minimum 30 minutes duration
      if (newEndTime.getTime() - roundedTime.getTime() < 30 * 60 * 1000) {
        newEndTime.setTime(roundedTime.getTime() + 30 * 60 * 1000);
      }
      
      handleInputChange('endTime', roundToTimeSlot(newEndTime));
    }
  };

  // Format time for input
  const formatTimeForInput = (date: Date): string => {
    return date.toTimeString().slice(0, 5);
  };

  // Get selected category
  const selectedCategory = categories.find(cat => cat.id === formData.categoryId);

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {block ? 'Editar Bloque' : 'Nuevo Bloque'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Ej: Reunión de equipo"
              className={cn(errors.title && 'border-red-500')}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descripción opcional del bloque..."
              rows={3}
              className={cn(errors.description && 'border-red-500')}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Hora de inicio *
              </Label>
              <Input
                id="startTime"
                type="time"
                value={formatTimeForInput(formData.startTime)}
                onChange={(e) => handleTimeChange('startTime', e.target.value)}
                step="1800" // 30 minutes
                className={cn(errors.startTime && 'border-red-500')}
              />
              {errors.startTime && (
                <p className="text-sm text-red-500">{errors.startTime}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime" className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Hora de fin *
              </Label>
              <Input
                id="endTime"
                type="time"
                value={formatTimeForInput(formData.endTime)}
                onChange={(e) => handleTimeChange('endTime', e.target.value)}
                step="1800" // 30 minutes
                className={cn(errors.endTime && 'border-red-500')}
              />
              {errors.endTime && (
                <p className="text-sm text-red-500">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* Duration Display */}
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <div className="flex items-center justify-between">
              <span>Duración:</span>
              <span className="font-medium">
                {Math.round((formData.endTime.getTime() - formData.startTime.getTime()) / (1000 * 60))} minutos
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Horario:</span>
              <span className="font-medium">
                {formatTime(formData.startTime)} - {formatTime(formData.endTime)}
              </span>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Tag className="w-4 h-4" />
              Categoría *
            </Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => handleInputChange('categoryId', value)}
            >
              <SelectTrigger className={cn(errors.categoryId && 'border-red-500')}>
                <SelectValue placeholder="Selecciona una categoría">
                  {selectedCategory && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedCategory.color }}
                      />
                      {selectedCategory.name}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-red-500">{errors.categoryId}</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Form Actions */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="min-w-[100px]"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {block ? 'Actualizar' : 'Crear'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}