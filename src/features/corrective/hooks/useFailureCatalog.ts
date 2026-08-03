import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';
import type { FailureCategory, FailureTemplate } from '@/core/db';
import { v4 as uuidv4 } from 'uuid';

export function useFailureCatalog() {
  const categories = useLiveQuery(() => db.failureCategories.toArray()) || [];
  const templates = useLiveQuery(() => db.failureTemplates.toArray()) || [];

  const addCategory = async (name: string, description?: string, color?: string) => {
    const id = uuidv4();
    await db.failureCategories.add({
      id,
      name,
      description,
      color
    });
    return id;
  };

  const updateCategory = async (id: string, updates: Partial<FailureCategory>) => {
    await db.failureCategories.update(id, updates);
  };

  const deleteCategory = async (id: string) => {
    // Delete all templates in this category first
    const templatesInCat = await db.failureTemplates.where('categoryId').equals(id).toArray();
    await db.failureTemplates.bulkDelete(templatesInCat.map(t => t.id));
    await db.failureCategories.delete(id);
  };

  const addTemplate = async (categoryId: string, name: string, description?: string, severity?: 'low' | 'medium' | 'high' | 'critical') => {
    const id = uuidv4();
    await db.failureTemplates.add({
      id,
      categoryId,
      name,
      description,
      severity
    });
    return id;
  };

  const updateTemplate = async (id: string, updates: Partial<FailureTemplate>) => {
    await db.failureTemplates.update(id, updates);
  };

  const deleteTemplate = async (id: string) => {
    await db.failureTemplates.delete(id);
  };

  // Seed default categories if empty
  const seedDefaultCategories = async () => {
    const count = await db.failureCategories.count();
    if (count === 0) {
      const defaults = [
        { id: uuidv4(), name: 'Mécanique', color: 'orange-500' },
        { id: uuidv4(), name: 'Électrique', color: 'amber-400' },
        { id: uuidv4(), name: 'Pneumatique', color: 'cyan-400' },
        { id: uuidv4(), name: 'Hydraulique', color: 'blue-500' },
        { id: uuidv4(), name: 'Électronique', color: 'purple-500' },
      ];
      await db.failureCategories.bulkAdd(defaults);
    }
  };

  return {
    categories,
    templates,
    addCategory,
    updateCategory,
    deleteCategory,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    seedDefaultCategories
  };
}
