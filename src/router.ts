import { AutoRouter } from 'itty-router';
import { MongoClient } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.x1kgpq6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri);

const router = AutoRouter();

router.get('/', () => {
    return new Response('Hello AA!');
});

router.get('/dbs', async () => {
    try {
        const dbs = await client.db().admin().listDatabases();
        return new Response(JSON.stringify(dbs), { status: 200 });
    } catch (err: any) {
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});

router.get('/name', async (request) => {
    const db = request.query.db as string;
    if (!db) {
        return new Response('Missing db_name parameter', { status: 400 });
    }
    try {
        const accounting_db = client.db(db);
        const property = await accounting_db.collection('properties').findOne({});
        const db_name = property?.name;
        if (!db_name) {
            return new Response('Property not found', { status: 404 });
        }
        return new Response(JSON.stringify(db_name), { status: 200 });
    } catch (err: any) {
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});

router.post('/name/modify', async (request) => {
    type NameModifyRequestBody = { db: string, name: string };
    const body = await request.json() as NameModifyRequestBody;
    const db = body.db;
    if (!db) {
        return new Response('Missing db parameter', { status: 400 });
    }
    const name = body.name;
    if (!name) {
        return new Response('Missing name parameter', { status: 400 });
    }
    try {
        const accounting_db = client.db(db);
        const property = await accounting_db.collection('properties').findOne({});
        if (!property) {
            return new Response('Property not found', { status: 404 });
        }
        const result = await accounting_db.collection('properties').updateOne({ _id: property._id }, { $set: { name: name } });
        return new Response(JSON.stringify(result), { status: 200 });
    } catch (err: any) {
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});

type Spending = {
    spendingId: number;
    amount: number;
    currency: string;
    dateOfSpending: Date;
    description?: string;
    categoryId?: string;
}

router.get('/spendings', async (request) => {
    const db = request.query.db as string;
    if (!db) {
        return new Response('Missing db_name parameter', { status: 400 });
    }
    try {
        const accounting_db = client.db(db);
        const spendings = (await accounting_db.collection('spendings').find({}).toArray()) as unknown as Spending[];
        return new Response(JSON.stringify(spendings), { status: 200 });
    } catch (err: any) {
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});

router.get('/spendings/by-date', async (request) => {
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
        const accounting_db = client.db(db);
        const spendings = (await accounting_db.collection('spendings').find({
            dateOfSpending: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }).toArray()) as unknown as Spending[];
        return new Response(JSON.stringify(spendings), { status: 200 });
    } catch (err: any) {
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});

router.post('/spendings/add', async (request) => {
    type SpendingsAddRequestBody = { db: string, spending: Spending };
    const db = request.query.db as string;
    if (!db) {
        return new Response('Missing db_name parameter', { status: 400 });
    }
    try {
        const body = await request.json() as SpendingsAddRequestBody;
        const db = body.db;
        if (!db) {
            return new Response('Missing db parameter', { status: 400 });
        }
        const spending = body.spending;
        if (!spending) {
            return new Response('Missing spending parameter', { status: 400 });
        }
        const accounting_db = client.db(db);
        const result = await accounting_db.collection('spendings').insertOne(body);
        return new Response(JSON.stringify(result), { status: 200 });
    } catch (err: any) {
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});

export default router;