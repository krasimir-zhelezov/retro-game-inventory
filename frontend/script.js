document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = 'https://api.escuelajs.co/api/v1/products';
    const tableBody = document.getElementById('product-table-body');

    // -- DOM Elements for Modal --
    const modal = document.getElementById('addProductModal');
    const openModalBtn = document.querySelector('.btn-primary'); // The "Add New Product" button
    const closeModalBtn = document.querySelector('.close-btn');
    const cancelBtn = document.querySelector('.cancel-btn');
    const addProductForm = document.getElementById('addProductForm');
    
    // -- Modal UI Elements --
    const modalTitle = document.querySelector('.modal-header h2');
    const submitBtn = document.querySelector('.form-actions button[type="submit"]');

    // -- State Variables --
    let isEditing = false;
    let currentEditId = null;

    const categorySelect = document.getElementById('categoryId');

    // -- Fetch Categories for Dropdown --
    const fetchCategories = () => {
        fetch('https://api.escuelajs.co/api/v1/categories')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch categories');
                return res.json();
            })
            .then(categories => {
                categorySelect.innerHTML = '<option value="" disabled selected>Select a Category</option>';
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
            })
            .catch(err => {
                console.error('Error loading categories:', err);
                categorySelect.innerHTML = '<option value="" disabled>Error loading categories</option>';
            });
    };

    fetchCategories();

    // Function to truncate long descriptions
    const truncateText = (text, limit) => {
        if (!text) return '';
        return text.length > limit ? text.substring(0, limit) + '...' : text;
    };

    // -- Render Row Function --
    const renderRow = (product) => {
        const row = document.createElement('tr');
        // Add a dataset ID to the row for easy finding later
        row.dataset.rowId = product.id; 

        let imageUrl = 'https://placehold.co/50';
        if (product.images && product.images.length > 0) {
            // Clean up messy URL strings sometimes returned by this specific API
            imageUrl = product.images[0].replace(/["\[\]]/g, '');
            if (!imageUrl.startsWith('http')) imageUrl = 'https://placehold.co/50';
        }

        row.innerHTML = `
            <td>#${product.id}</td>
            <td><strong>${product.title}</strong></td>
            <td>${product.slug || 'N/A'}</td>
            <td>$${product.price}</td>
            <td class="desc-col" title="${product.description}">${truncateText(product.description, 40)}</td>
            <td><span class="status in-stock">${product.category ? product.category.name : 'Unknown'}</span></td>
            <td>
                <img src="${imageUrl}" alt="${product.title}" class="product-thumbnail" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" onError="this.src='https://placehold.co/50'">
            </td>
            <td>
                <button class="action-btn edit" data-id="${product.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn delete" data-id="${product.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        return row;
    };

    // -- Fetch Initial Data --
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(products => {
            tableBody.innerHTML = '';
            products.slice(0, 15).forEach(product => {
                const row = renderRow(product);
                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            tableBody.innerHTML = `<tr><td colspan="8" style="color: red; text-align: center;">Error loading data.</td></tr>`;
        });

    // -- Modal Functions --

    const resetModal = () => {
        addProductForm.reset();
        isEditing = false;
        currentEditId = null;
        modalTitle.textContent = "Add New Product";
        submitBtn.textContent = "Create Product";
    };

    // Open Modal for Create
    openModalBtn.addEventListener('click', () => {
        resetModal();
        modal.style.display = 'block';
    });

    const closeModal = () => {
        modal.style.display = 'none';
        resetModal();
    };

    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal();
        }
    });

    // -- Handle Edit & Delete Actions (Event Delegation) --
    tableBody.addEventListener('click', (e) => {
        const target = e.target.closest('button'); // Clicked button
        if (!target) return;

        const id = target.getAttribute('data-id');

        // --- DELETE LOGIC ---
        if (target.classList.contains('delete')) {
            if (confirm(`Are you sure you want to delete Product #${id}?`)) {
                fetch(`${apiUrl}/${id}`, { method: 'DELETE' })
                    .then(response => {
                        if (response.ok) return response.json();
                        throw new Error('Failed to delete');
                    })
                    .then(isDeleted => {
                        if (isDeleted) {
                            target.closest('tr').remove();
                            alert('Product deleted successfully');
                        }
                    })
                    .catch(error => {
                        console.error('Error deleting:', error);
                        alert('Could not delete product.');
                    });
            }
        }

        // --- EDIT LOGIC ---
        if (target.classList.contains('edit')) {
            // 1. Fetch current product data to fill the form
            fetch(`${apiUrl}/${id}`)
                .then(res => res.json())
                .then(product => {
                    // 2. Populate Form
                    document.getElementById('title').value = product.title;
                    document.getElementById('price').value = product.price;
                    document.getElementById('description').value = product.description;
                    document.getElementById('categoryId').value = product.category ? product.category.id : '';
                    
                    if(product.images && product.images.length > 0) {
                        document.getElementById('imageUrl').value = product.images[0].replace(/["\[\]]/g, '');
                    }

                    // 3. Set State to Editing
                    isEditing = true;
                    currentEditId = id;

                    // 4. Update UI
                    modalTitle.textContent = `Edit Product #${id}`;
                    submitBtn.textContent = "Update Product";

                    // 5. Open Modal
                    modal.style.display = 'block';
                })
                .catch(err => {
                    console.error("Error fetching details", err);
                    alert("Could not load product details for editing.");
                });
        }
    });

    // -- Handle Form Submission (POST or PUT) --
    addProductForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = {
            title: document.getElementById('title').value,
            price: parseFloat(document.getElementById('price').value),
            description: document.getElementById('description').value,
            categoryId: parseInt(document.getElementById('categoryId').value),
            images: [document.getElementById('imageUrl').value]
        };

        // Determine URL and Method based on state
        let url = apiUrl + '/';
        let method = 'POST';

        if (isEditing) {
            url = `${apiUrl}/${currentEditId}`;
            method = 'PUT';
        }

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
            .then(response => {
                if (!response.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} product`);
                return response.json();
            })
            .then(data => {
                const newRow = renderRow(data);

                if (isEditing) {
                    // Find the existing row and replace it
                    const existingRow = document.querySelector(`tr[data-row-id="${currentEditId}"]`);
                    if (existingRow) {
                        existingRow.replaceWith(newRow);
                    }
                    alert('Product updated successfully!');
                } else {
                    // Prepend new row for create
                    tableBody.insertBefore(newRow, tableBody.firstChild);
                    alert('Product created successfully!');
                }

                closeModal();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Operation failed. Check console.');
            });
    });
});