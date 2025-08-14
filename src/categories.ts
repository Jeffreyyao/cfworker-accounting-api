import { AutoRouter } from 'itty-router';
import { withDatabase } from './db';

export type Category = {
    categoryId: number;
    name: string;
}

export const basePath = '/categories';
export const router = AutoRouter({ base: basePath });

// Function to ensure categories collection exists
async function ensureCategoriesCollection(db: any) {
    try {
        // Check if collection exists by trying to get collection info
        const collections = await db.listCollections({ name: 'categories' }).toArray();
        if (collections.length === 0) {
            // Collection doesn't exist, create it
            await db.createCollection('categories');
            console.log('Created empty categories collection');
        }
    } catch (error) {
        console.error('Error ensuring categories collection:', error);
        // Continue execution even if collection creation fails
    }
}

// GET / - Get all categories (mounted at /categories)
router.get('/', async (request) => {
    const db = request.query.db as string;
    if (!db) {
        return new Response('Missing db_name parameter', { status: 400 });
    }
    try {
        const categories = await withDatabase(db, async (accounting_db) => {
            await ensureCategoriesCollection(accounting_db);
            return await accounting_db.collection('categories').find({}).toArray();
        });
        return new Response(JSON.stringify(categories), { status: 200 });
    } catch (err: any) {
        console.error('error', err);
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});

// POST / - Add new category (mounted at /categories)
router.post('/', async (request) => {
    const db = request.query.db as string;
    if (!db) {
        return new Response('Missing db_name parameter', { status: 400 });
    }
    try {
        const category = await request.json() as Category;
        if (!category) {
            return new Response('Missing category parameter', { status: 400 });
        }
        
        const result = await withDatabase(db, async (accounting_db) => {
            await ensureCategoriesCollection(accounting_db);
            return await accounting_db.collection('categories').insertOne(category);
        });
        
        return new Response(JSON.stringify(result), { status: 200 });
    } catch (err: any) {
        console.error(err);
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});

// DELETE / - Delete category by ID (mounted at /categories)
router.delete('/', async (request) => {
    const db = request.query.db as string;
    if (!db) {
        return new Response('Missing db_name parameter', { status: 400 });
    }
    try {
        const { categoryId } = await request.json() as { categoryId: number };
        if (categoryId === undefined) {
            return new Response('Missing categoryId parameter', { status: 400 });
        }
        
        const result = await withDatabase(db, async (accounting_db) => {
            await ensureCategoriesCollection(accounting_db);
            return await accounting_db.collection('categories').deleteOne({ categoryId: categoryId });
        });
        
        if (result.deletedCount === 0) {
            return new Response('Category not found', { status: 404 });
        }
        
        return new Response(JSON.stringify(result), { status: 200 });
    } catch (err: any) {
        console.error(err);
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});
