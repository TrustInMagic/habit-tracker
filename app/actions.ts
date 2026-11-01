'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const DEFAULT_GOALS = [
  { name: 'Work', unit: 'hours', expected: 160 },
  { name: 'Gym', unit: 'days', expected: 20 },
  { name: 'Morning exercise', unit: 'days', expected: 15 },
  { name: 'Cold Shower', unit: 'days', expected: 30 },
  { name: 'Read', unit: 'days', expected: 20 },
  { name: 'Meditate morning', unit: 'days', expected: 30 },
  { name: 'PE', unit: 'days', expected: 12 },
];

export async function getMonths() {
  try {
    return await prisma.month.findMany({
      include: { goals: true },
      orderBy: { createdAt: 'asc' },
    });
  } catch (error: unknown) {
    console.error('Error fetching months:', error);
    return [];
  }
}

export async function createMonth(name: string, year: number) {
  try {
    const existing = await prisma.month.findUnique({ where: { name } });
    if (existing) {
      return { success: false, error: `Month "${name}" already exists!` };
    }

    const newMonth = await prisma.month.create({
      data: {
        name,
        year,
        goals: { create: DEFAULT_GOALS },
      },
      include: { goals: true },
    });

    revalidatePath('/');
    return { success: true, data: newMonth };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Database error occurred.';
    return { success: false, error: message };
  }
}

export async function deleteMonth(monthId: string) {
  try {
    await prisma.month.delete({ where: { id: monthId } });
    revalidatePath('/');
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete month.';
    return { success: false, error: message };
  }
}

export async function updateGoal(
  goalId: string,
  expected: number,
  achieved: number,
) {
  try {
    const updated = await prisma.goalCategory.update({
      where: { id: goalId },
      data: { expected, achieved },
    });
    revalidatePath('/');
    return { success: true, data: updated };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to update goal.';
    return { success: false, error: message };
  }
}

// --- INDIVIDUAL MONTH GOALS ---

export async function addCustomGoal(
  monthId: string,
  name: string,
  unit: string,
  expected: number,
) {
  try {
    const newGoal = await prisma.goalCategory.create({
      data: {
        monthId,
        name,
        unit,
        expected,
        achieved: 0,
      },
    });
    revalidatePath('/');
    return { success: true, data: newGoal };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to add goal.';
    return { success: false, error: message };
  }
}

export async function deleteGoal(goalId: string) {
  try {
    await prisma.goalCategory.delete({ where: { id: goalId } });
    revalidatePath('/');
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete goal.';
    return { success: false, error: message };
  }
}
