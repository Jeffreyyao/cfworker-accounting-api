// const API_URL = 'https://accounting-api.zyaoaq.workers.dev';
const API_URL = 'http://127.0.0.1:8787';
const DB = 'accounting-0'

async function fetchAllSpendings() {
    const response = await fetch(`${API_URL}/spendings?db=${DB}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (response.ok) {
        const result = await response.json();
        console.log('Spendings fetched successfully:', result);
    } else {
        console.error('Failed to fetch spendings:', response.status, response.statusText);
    }
}

async function addSpending() {
    const response = await fetch(`${API_URL}/spendings/add?db=${DB}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            amount: -100,
            description: 'Test spending',
            categoryId: 0,
            dateOfSpending: '2025-08-08',
            currency: 'USD'
        })
    });
    if (response.ok) {
        const result = await response.json();
        console.log('Spending added successfully:', result);
    } else {
        console.error('Failed to add spending:', response.status, response.statusText);
    }
}

async function main() {
    await fetchAllSpendings();
    // await addSpending();
}
main().catch(console.error);