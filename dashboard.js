const supabaseUrl = 'https://smslkyshaxivjpxuxgpf.supabase.co';
const supabaseKey = 'sb_publishable_l_HBoHxAlJeCauzuTUuoZg_hmXKHwqm';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

const tableBody = document.getElementById('tableBody');
const loadingState = document.getElementById('loadingState');
const searchInput = document.getElementById('searchInput');
const filterCategory = document.getElementById('filterCategory');
const viewMonth = document.getElementById('viewMonth');

let masterData = [];

async function fetchData() {
    try {
        const { data, error } = await _supabase
            .from('beneficiary')
            .select(`
                *,
                month_sale (*)
            `);

        if (error) throw error;

        masterData = data;
        renderTable(masterData);
    } catch (err) {
        console.error("Dashboard Error:", err);
        loadingState.innerText = "Error loading data. Check console.";
    }
}

function renderTable(data) {
    loadingState.classList.add('hidden');
    tableBody.innerHTML = '';
    
    // Switch column selection based on month dropdown
    const selectedMonth = viewMonth.value; 
    const salesKey = `${selectedMonth}_total_sale`;

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-slate-400">No records found matching your filters.</td></tr>`;
        return;
    }

    data.forEach(item => {
        const salesData = item.month_sale?.[0] || {};
        const amount = salesData[salesKey] || 0;

        const row = document.createElement('tr');
        row.className = "hover:bg-slate-50 transition-colors group";
        
        row.innerHTML = `
            <td class="px-6 py-4">
                <p class="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">${item.fname}</p>
            </td>
            <td class="px-6 py-4">
                <span class="text-sm text-slate-600">${item.location}</span>
            </td>
            <td class="px-6 py-4 text-center">
                <span class="text-sm font-semibold text-slate-500">${item.years_solved}</span>
            </td>
            <td class="px-6 py-4">
                <span class="text-[10px] font-extrabold uppercase px-2 py-1 rounded-full ${
                    item.food_or_non === 'Food' 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }">
                    ${item.food_or_non || 'N/A'}
                </span>
            </td>
            <td class="px-6 py-4">
                <span class="text-sm text-slate-500 italic">${item.goods || 'No details'}</span>
            </td>
            <td class="px-6 py-4 text-right">
                <span class="font-mono font-bold ${amount > 0 ? 'text-emerald-600' : 'text-slate-300'}">
                    ₱${parseFloat(amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                </span>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Combined Search & Category Filter
function handleFilters() {
    const term = searchInput.value.toLowerCase();
    const cat = filterCategory.value;

    const filtered = masterData.filter(item => {
        const matchesSearch = item.fname.toLowerCase().includes(term) || 
                              item.location.toLowerCase().includes(term);
        const matchesCat = cat === 'All' || item.food_or_non === cat;
        
        return matchesSearch && matchesCat;
    });

    renderTable(filtered);
}

// Listen for interactions
searchInput.addEventListener('input', handleFilters);
filterCategory.addEventListener('change', handleFilters);
viewMonth.addEventListener('change', handleFilters);

// Initial trigger
fetchData();