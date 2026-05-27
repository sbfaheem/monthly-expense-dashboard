import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://lxzytxsoxvgavribszpx.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4enl0eHNveHZnYXZyaWJzenB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODIyNzksImV4cCI6MjA4ODY1ODI3OX0.Ko8vWFj1Qu9912JEgqUi8aVZaPbdB_HP5fi3e_BZw9Y');

async function main() {
    console.log('--- MONTHLY RECORDS ---');
    const { data: records, error: errRec } = await supabase.from('monthly_records').select('*');
    if (errRec) console.error('Error fetching records:', errRec);
    else console.log(records);

    console.log('--- EXPENSES (distinct months) ---');
    const { data: expenses, error: errExp } = await supabase.from('expenses').select('month');
    if (errExp) console.error('Error fetching expenses:', errExp);
    else {
        const uniqueMonths = [...new Set(expenses.map(e => e.month))];
        console.log('Months with expenses:', uniqueMonths);
        console.log('Total expense count:', expenses.length);
    }
}

main().catch(console.error);
