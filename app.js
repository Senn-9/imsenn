// Initialize Supabase
const supabaseUrl = 'https://smslkyshaxivjpxuxgpf.supabase.co';
const supabaseKey = 'sb_publishable_l_HBoHxAlJeCauzuTUuoZg_hmXKHwqm';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const fnameInput = document.getElementById('fname');
const fnameLabel = document.getElementById('name_label');
const typeRadios = document.querySelectorAll('input[name="beneficiary_type"]');
const verifyBtn = document.getElementById('verify_btn');
const verifyMsg = document.getElementById('verify_msg');
const locInput = document.getElementById('location');
const salesSection = document.getElementById('sales_section');
const submitBtn = document.getElementById('submit_btn');
const resetBtn = document.getElementById('reset_form');
const form = document.getElementById('masterForm');

const lockableFields = ['years_solved', 'food_or_non', 'goods'];

// Helper to clean strings for matching
const normalize = (str) => str ? str.toString().toLowerCase().replace(/\s+/g, '') : '';

// 1. Placeholder & Label Logic
typeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        const isSLPA = e.target.value === 'SLPA';
        fnameLabel.innerText = isSLPA ? "Association Name" : "Full Name";
        fnameInput.placeholder = isSLPA ? "e.g. Bagong Pag-asa Association" : "e.g. Juan D. Dela Cruz";
    });
});

// 2. Verification Logic
verifyBtn.addEventListener('click', async () => {
    const nameVal = fnameInput.value.trim();
    const locVal = locInput.value.trim();

    if (!nameVal || !locVal) {
        alert("Please enter Name and Location.");
        return;
    }

    verifyBtn.innerText = "Searching...";
    verifyBtn.disabled = true;

    try {
        const { data: allB, error } = await _supabase.from('beneficiary').select('*');
        
        if (error) throw error;

        verifyBtn.innerText = "Verify & Unlock";
        verifyBtn.disabled = false;
        verifyMsg.classList.remove('hidden');

        // Logic to match based on user input vs fname column in DB
        const match = allB?.find(b => 
            normalize(b.fname) === normalize(nameVal) && 
            normalize(b.location) === normalize(locVal)
        );

        if (match) {
            verifyMsg.innerText = "✅ Record Found. Identity Verified.";
            verifyMsg.className = "text-center text-[10px] font-bold uppercase text-emerald-600";
            
            // Populate
            fnameInput.value = match.fname;
            locInput.value = match.location;
            document.getElementById('years_solved').value = match.years_solved;
            document.getElementById('food_or_non').value = match.food_or_non;
            document.getElementById('goods').value = match.goods;
            
            toggleLock(true);
        } else {
            verifyMsg.innerText = "✨ New Record Detected.";
            verifyMsg.className = "text-center text-[10px] font-bold uppercase text-blue-600";
            toggleLock(false);
        }
    } catch (err) {
        console.error("Supabase Error:", err);
        alert("Error connecting to database. Check console (F12).");
        verifyBtn.innerText = "Verify & Unlock";
        verifyBtn.disabled = false;
    }
});

function toggleLock(isUpdate) {
    document.getElementById('type_container').classList.add('opacity-50', 'pointer-events-none');
    fnameInput.disabled = true;
    locInput.disabled = true;
    fnameInput.classList.add('bg-slate-100', 'cursor-not-allowed');
    locInput.classList.add('bg-slate-100', 'cursor-not-allowed');

    lockableFields.forEach(id => {
        const el = document.getElementById(id);
        el.disabled = isUpdate;
        el.classList.toggle('bg-slate-100', isUpdate);
        el.classList.toggle('cursor-not-allowed', isUpdate);
    });

    salesSection.classList.remove('opacity-50', 'pointer-events-none');
    submitBtn.disabled = false;
    submitBtn.classList.remove('bg-slate-300', 'cursor-not-allowed');
    submitBtn.classList.add('bg-slate-900', 'hover:bg-blue-600');
    resetBtn.classList.remove('hidden');
}

// 3. Final Submit
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.innerText = "Saving...";
    submitBtn.disabled = true;

    try {
        const { data: allB } = await _supabase.from('beneficiary').select('*');
        const match = allB.find(b => 
            normalize(b.fname) === normalize(fnameInput.value) && 
            normalize(b.location) === normalize(locInput.value)
        );

        let bId;
        if (!match) {
            const { data: newB, error: bErr } = await _supabase.from('beneficiary').insert([{
                fname: fnameInput.value,
                location: locInput.value,
                years_solved: document.getElementById('years_solved').value,
                food_or_non: document.getElementById('food_or_non').value,
                goods: document.getElementById('goods').value
            }]).select();
            if (bErr) throw bErr;
            bId = newB[0].id;
        } else {
            bId = match.id;
        }

        const month = document.getElementById('selected_month').value;
        const amount = document.getElementById('sales_amount').value;

        let { data: sRec } = await _supabase.from('month_sale').select('id').eq('beneficiary_id', bId).maybeSingle();

        const salePayload = { 
            beneficiary_id: bId, 
            [month]: month, 
            [`${month.toLowerCase()}_total_sale`]: amount 
        };

        const { error: sErr } = sRec 
            ? await _supabase.from('month_sale').update(salePayload).eq('id', sRec.id)
            : await _supabase.from('month_sale').insert([salePayload]);

        if (sErr) throw sErr;

        document.getElementById('successModal').classList.remove('hidden');
        setTimeout(() => { 
            document.getElementById('modalContent').classList.remove('scale-95', 'opacity-0');
            document.getElementById('modalContent').classList.add('scale-100', 'opacity-100');
        }, 10);

    } catch (err) {
        console.error("Submit Error:", err);
        alert("Failed to save. Check database permissions.");
        submitBtn.innerText = "Submit Record";
        submitBtn.disabled = false;
    }
});

resetBtn.addEventListener('click', () => location.reload());