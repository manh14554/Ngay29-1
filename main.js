let allProducts = [];
let filteredProducts = [];
let currentSort = null;

async function loadProducts() {
    try {
        const response = await fetch('db.json');
        const products = await response.json();
        allProducts = products;
        filteredProducts = [...allProducts];
        renderProducts(filteredProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('products-container').innerHTML =
            '<tr><td colspan="7" class="text-center text-danger">Failed to load products. Please check that db.json exists.</td></tr>';
    }
}

function renderProducts(products) {
    const container = document.getElementById('products-container');
    if (!products || products.length === 0) {
        container.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Không tìm thấy sản phẩm nào.</td></tr>';
        return;
    }
    container.innerHTML = products.map((product, idx) => `
        <tr>
            <td>${product.id}</td>
            <td>
                <img src="${product.images[0]}" alt="${product.title}" class="product-img" onerror="this.src='https://placehold.co/64x64'">
            </td>
            <td>${product.title}</td>
            <td>${product.category.name}</td>
            <td>
                <img src="${product.category.image}" alt="${product.category.name}" class="category-img" title="${product.category.name}" onerror="this.src='https://placehold.co/32x32'">
            </td>
            <td style="max-width:300px;min-width:120px;">${product.description}</td>
            <td class="fw-bold text-danger">$${product.price}</td>
        </tr>
    `).join('');
}

function onChanged() {
    const searchValue = document.getElementById('searchInput').value.trim().toLowerCase();
    filteredProducts = allProducts.filter(p =>
        p.title.toLowerCase().includes(searchValue)
    );
    applySort();
    renderProducts(filteredProducts);
}

function sortBy(type) {
    currentSort = type;
    applySort();
    renderProducts(filteredProducts);
}

function applySort() {
    if (!currentSort) return;
    if (currentSort === 'nameAsc') {
        filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
    } else if (currentSort === 'nameDesc') {
        filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
    } else if (currentSort === 'priceDesc') {
        filteredProducts.sort((a, b) => b.price - a.price);
    }
}

// Load products when page loads
document.addEventListener('DOMContentLoaded', loadProducts);

// Expose functions to window for inline HTML usage
window.onChanged = onChanged;
window.sortBy = sortBy;
