import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDefaultCategories } from '@/lib/utils';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    // Si no hay categorías, crear las por defecto
    if (categories.length === 0) {
      const defaultCategories = getDefaultCategories();
      const createdCategories = await Promise.all(
        defaultCategories.map(category =>
          prisma.category.create({
            data: category
          })
        )
      );
      
      return NextResponse.json({
        success: true,
        data: createdCategories
      });
    }

    return NextResponse.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener las categorías'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const category = await prisma.category.create({
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
    console.error('Error creating category:', error);
    
    // Manejar error de nombre duplicado
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
        error: 'Error al crear la categoría'
      },
      { status: 500 }
    );
  }
}