const API_URL = 'https://accounting-api.zyaoaq.workers.dev';
//const API_URL = 'http://127.0.0.1:8787';
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
            amount: Math.floor(Math.random() * 2001) - 1000,
            description: `Test spending ${new Date().toISOString()}`,
            categoryId: 0,
            dateOfSpending: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            currency: ['HKD', 'USD', 'CNY', 'JPY'][Math.floor(Math.random() * 4)]
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
    const args = process.argv.slice(2);
    const functionNumber = parseInt(args[0]);
    
    switch (functionNumber) {
        case 0:
            await fetchAllSpendings();
            break;
        case 1:
            await addSpending();
            break;
        default:
            console.log('Available functions:');
            console.log('0: fetchAllSpendings');
            console.log('1: addSpending');
            break;
    }
}
main().catch(console.error);
