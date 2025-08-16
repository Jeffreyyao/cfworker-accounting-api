import { AutoRouter } from 'itty-router';
import { withDatabase } from './db';

export type Spending = {
    spendingId: number;
    amount: number;
    currency: string;
    dateOfSpending: Date;
    description?: string;
    categoryId?: string;
}

export const basePath = '/spendings';
export const router = AutoRouter({ base: basePath });

// Function to ensure spendings collection exists
async function ensureSpendingsCollection(db: any) {
    try {
        // Check if collection exists by trying to get collection info
        const collections = await db.listCollections({ name: 'spendings' }).toArray();
        if (collections.length === 0) {
            // Collection doesn't exist, create it
            await db.createCollection('spendings');
            console.log('Created empty spendings collection');
        }
    } catch (error) {
        console.error('Error ensuring spendings collection:', error);
        // Continue execution even if collection creation fails
    }
}

// GET / - Get all spendings (mounted at /spendings)
router.get('/', async (request) => {
    const db = request.query.db as string;
    if (!db) {
        return new Response('Missing db_name parameter', { status: 400 });
    }
    try {
        const spendings = await withDatabase(db, async (accounting_db) => {
            await ensureSpendingsCollection(accounting_db);
            return (await accounting_db.collection('spendings').find({}).toArray()) as unknown as Spending[];
        });
        return new Response(JSON.stringify(spendings), { status: 200 });
    } catch (err: any) {
        console.error(err);
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});

// POST / - Add new spending (mounted at /spendings)
router.post('/', async (request) => {
    const db = request.query.db as string;
    if (!db) {
        return new Response('Missing db_name parameter', { status: 400 });
    }
    try {
        const spending = await request.json() as Spending;
        if (!spending) {
            return new Response('Missing spending parameter', { status: 400 });
        }
        
        const result = await withDatabase(db, async (accounting_db) => {
            await ensureSpendingsCollection(accounting_db);
            
            const lastSpending = await accounting_db.collection('spendings')
                .findOne({}, { sort: { spendingId: -1 } });
            const nextSpendingId = lastSpending ? (lastSpending.spendingId + 1) : 1;
            spending.spendingId = nextSpendingId;
            
            return await accounting_db.collection('spendings').insertOne(spending);
        });
        
        return new Response(JSON.stringify(result), { status: 200 });
    } catch (err: any) {
        console.error(err);
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});

// DELETE / - Delete spending by ID (mounted at /spendings)
router.delete('/', async (request) => {
    const db = request.query.db as string;
    if (!db) {
        return new Response('Missing db_name parameter', { status: 400 });
    }
    try {
        const { spendingId } = await request.json() as { spendingId: number };
        if (spendingId === undefined) {
            return new Response('Missing spendingId parameter', { status: 400 });
        }
        
        const result = await withDatabase(db, async (accounting_db) => {
            await ensureSpendingsCollection(accounting_db);
            return await accounting_db.collection('spendings').deleteOne({ spendingId: spendingId });
        });
        
        if (result.deletedCount === 0) {
            return new Response('Spending not found', { status: 404 });
        }
        
        return new Response(JSON.stringify(result), { status: 200 });
    } catch (err: any) {
        console.error(err);
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});

// PUT / - Update spending by ID (mounted at /spendings)
router.put('/', async (request) => {
    const db = request.query.db as string;
    if (!db) {
        return new Response('Missing db_name parameter', { status: 400 });
    }
    try {
        const { spendingId, amount, currency, dateOfSpending, description, categoryId } = await request.json() as {
            spendingId: number;
            amount?: number;
            currency?: string;
            dateOfSpending?: Date;
            description?: string;
            categoryId?: string;
        };
        
        if (spendingId === undefined) {
            return new Response('Missing spendingId parameter', { status: 400 });
        }
        
        // Build update object with only provided fields
        const updateFields: Partial<Spending> = {};
        if (amount !== undefined) updateFields.amount = amount;
        if (currency !== undefined) updateFields.currency = currency;
        if (dateOfSpending !== undefined) updateFields.dateOfSpending = dateOfSpending;
        if (description !== undefined) updateFields.description = description;
        if (categoryId !== undefined) updateFields.categoryId = categoryId;
        
        // Check if at least one field is provided for update
        if (Object.keys(updateFields).length === 0) {
            return new Response('No fields provided for update', { status: 400 });
        }
        
        const result = await withDatabase(db, async (accounting_db) => {
            await ensureSpendingsCollection(accounting_db);
            return await accounting_db.collection('spendings').updateOne(
                { spendingId: spendingId },
                { $set: updateFields }
            );
        });
        
        if (result.matchedCount === 0) {
            return new Response('Spending not found', { status: 404 });
        }
        
        if (result.modifiedCount === 0) {
            return new Response('No changes made to spending', { status: 200 });
        }
        
        return new Response(JSON.stringify(result), { status: 200 });
    } catch (err: any) {
        console.error(err);
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});

// GET /by-date - Get spendings by date range (mounted at /spendings/by-date)
router.get('/by-date', async (request) => {
    const db = request.query.db as string;
    if (!db) {
        return new Response('Missing db parameter', { status: 400 });
    }
    const startDate = request.query.startDate as string;
    if (!startDate) {
        return new Response('Missing startDate parameter', { status: 400 });
    }
    const endDate = request.query.endDate as string;
    if (!endDate) {
        return new Response('Missing endDate parameter', { status: 400 });
    }
    try {
        const spendings = await withDatabase(db, async (accounting_db) => {
            await ensureSpendingsCollection(accounting_db);
            return (await accounting_db.collection('spendings').find({
                dateOfSpending: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }).toArray()) as unknown as Spending[];
        });
        return new Response(JSON.stringify(spendings), { status: 200 });
    } catch (err: any) {
        console.error(err);
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});
