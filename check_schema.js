import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://lxzytxsoxvgavribszpx.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4enl0eHNveHZnYXZyaWJzenB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODIyNzksImV4cCI6MjA4ODY1ODI3OX0.Ko8vWFj1Qu9912JEgqUi8aVZaPbdB_HP5fi3e_BZw9Y');

async function main() {
    console.log('Checking monthly_records table...');
    const { data: records, error: errRec } = await supabase.from('monthly_records').select('*').limit(1);
    if (errRec) console.error('Error fetching records:', errRec);
    else console.log('Columns in monthly_records:', Object.keys(records[0] || {}));

    console.log('Checking settings table...');
    const { data: settings, error: errSet } = await supabase.from('settings').select('*').limit(1);
    if (errSet) console.error('Error fetching settings:', errSet);
    else console.log('Columns in settings:', Object.keys(settings[0] || {}));
}

main().catch(console.error);
