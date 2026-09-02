import { Router, Request, Response } from 'express';
import { db } from '../db';
import { defects, departments } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export const defectsRouter = Router();

/**
 * GET /api/defects
 * Returns all defects joined with their department entity names.
 */
defectsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const allDefects = await db
      .select({
        id: defects.id,
        dept_id: defects.deptId,
        department_name: departments.name,
        corridor_id: defects.corridorId,
        asset_id: defects.assetId,
        defect_type: defects.defectType,
        severity: defects.severity,
        overdue_days: defects.overdueDays,
        status: defects.status,
        created_at: defects.createdAt,
      })
      .from(defects)
      .innerJoin(departments, eq(defects.deptId, departments.id))
      .orderBy(defects.id);

    res.json(allDefects);
  } catch (error) {
    console.error('Error fetching defects:', error);
    res.status(500).json({ error: 'Failed to retrieve defects list' });
  }
});

/**
 * POST /api/defects
 * Creates a new defect with validation for live demo use.
 */
defectsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { dept_id, corridor_id, asset_id, defect_type, severity, overdue_days, status } = req.body;

    // Validation
    const errors: string[] = [];

    const numSeverity = Number(severity);
    if (isNaN(numSeverity) || !Number.isInteger(numSeverity) || numSeverity < 1 || numSeverity > 5) {
      errors.push('severity must be an integer between 1 and 5');
    }

    const numOverdue = Number(overdue_days);
    if (isNaN(numOverdue) || !Number.isInteger(numOverdue) || numOverdue < 0) {
      errors.push('overdue_days must be an integer >= 0');
    }

    if (!corridor_id || typeof corridor_id !== 'string' || corridor_id.trim().length < 5) {
      errors.push('corridor_id must be at least 5 characters long (e.g. "NDLS-PNP")');
    }

    if (!defect_type || typeof defect_type !== 'string' || defect_type.trim().length < 5) {
      errors.push('defect_type must be at least 5 characters long');
    }

    if (asset_id !== undefined && asset_id !== null && asset_id !== '') {
      if (typeof asset_id !== 'string' || asset_id.trim().length < 5) {
        errors.push('asset_id must be at least 5 characters long if provided');
      }
    }

    // Default to dept_id = 1 (Engineering) if not explicitly provided
    const numDeptId = dept_id !== undefined && dept_id !== null ? Number(dept_id) : 1;
    if (isNaN(numDeptId) || numDeptId <= 0 || !Number.isInteger(numDeptId)) {
      errors.push('dept_id must be a valid positive integer department ID');
    }

    if (errors.length > 0) {
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }

    // Verify department exists
    const deptExists = await db
      .select()
      .from(departments)
      .where(eq(departments.id, numDeptId))
      .limit(1);

    if (deptExists.length === 0) {
      res.status(400).json({ error: `Department with id ${numDeptId} does not exist` });
      return;
    }

    const generatedAssetId = asset_id?.trim() || `AST-${corridor_id.trim().toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const [newDefect] = await db
      .insert(defects)
      .values({
        deptId: numDeptId,
        corridorId: corridor_id.trim(),
        assetId: generatedAssetId,
        defectType: defect_type.trim(),
        severity: numSeverity,
        overdueDays: numOverdue,
        status: status?.trim() || 'open',
      })
      .returning();

    res.status(201).json({
      ...newDefect,
      dept_id: newDefect.deptId,
      department_name: deptExists[0].name,
      corridor_id: newDefect.corridorId,
      asset_id: newDefect.assetId,
      defect_type: newDefect.defectType,
      overdue_days: newDefect.overdueDays,
      created_at: newDefect.createdAt,
    });
  } catch (error) {
    console.error('Error creating defect:', error);
    res.status(500).json({ error: 'Failed to create defect record' });
  }
});
