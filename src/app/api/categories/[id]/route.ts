import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const category = await prisma.category.findUnique({
      where: {
        id: params.id
      }
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Categoría no encontrada'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener la categoría'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name || !color) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nombre y color son requeridos'
        },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: {
        id: params.id
      },
      data: {
        name,
        color
      }
    });

    return NextResponse.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Categoría no encontrada'
        },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ya existe una categoría con ese nombre'
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error al actualizar la categoría'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar si la categoría tiene bloques asociados
    const blocksCount = await prisma.scheduleBlock.count({
      where: {
        categoryId: params.id
      }
    });

    if (blocksCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se puede eliminar la categoría porque tiene bloques asociados'
        },
        { status: 409 }
      );
    }

    await prisma.category.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Categoría eliminada correctamente'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Categoría no encontrada'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error al eliminar la categoría'
      },
      { status: 500 }
    );
  }
}