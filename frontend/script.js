document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = 'http://localhost:3000/games';
    const tableBody = document.getElementById('product-table-body');

    // -- DOM Elements --
    const modal = document.getElementById('addProductModal');
    const openModalBtn = document.querySelector('.btn-primary'); // The "Add New Game" button
    const closeModalBtn = document.querySelector('.close-btn');
    const cancelBtn = document.querySelector('.cancel-btn');
    const addProductForm = document.getElementById('addProductForm');
    
    const modalTitle = document.querySelector('.modal-header h2');
    const submitBtn = document.querySelector('.form-actions button[type="submit"]');

    // -- State Variable --
    // We use this to know if we are creating a new game or editing an old one
    let currentEditId = null; 

    // -- Render Row Function --
    const renderRow = (game) => {
        const row = document.createElement('tr');
        row.dataset.rowId = game.id; // Store ID on the row for easy update later

        row.innerHTML = `
            <td>#${game.id}</td>
            <td class="game-title"><strong>${game.title}</strong></td>
            <td class="game-genre">${game.genre || 'N/A'}</td>
            <td>
                <button class="action-btn edit" data-id="${game.id}" title="Edit">
                    <i class="fa-solid fa-pen-to-square"></i> Edit
                </button>
                <button class="action-btn delete" data-id="${game.id}" title="Delete">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            </td>
        `;
        return row;
    };

    // -- Fetch Initial Data --
    fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    })
    .then(response => {
        if (response.status === 401) throw new Error('Unauthorized: Please log in first');
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(games => {
        tableBody.innerHTML = '';
        games.forEach(game => {
            const row = renderRow(game);
            tableBody.appendChild(row);
        });
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        tableBody.innerHTML = `<tr><td colspan="4" style="color: red; text-align: center;">${error.message}</td></tr>`;
    });

    // -- Modal Functions --

    const resetModal = () => {
        addProductForm.reset();
        // Reset state to "Add Mode"
        currentEditId = null;
        modalTitle.textContent = "Add New Game";
        submitBtn.textContent = "Create Game";
    };

    const closeModal = () => {
        modal.style.display = 'none';
        resetModal();
    };

    openModalBtn.addEventListener('click', () => {
        resetModal();
        modal.style.display = 'block';
    });

    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal();
        }
    });

    // -- Handle Table Actions (Edit & Delete) --
    tableBody.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.getAttribute('data-id');

        // --- DELETE LOGIC ---
        if (target.classList.contains('delete')) {
            if (confirm(`Are you sure you want to delete Game #${id}?`)) {
                fetch(`${apiUrl}/${id}`, { 
                    method: 'DELETE',
                    credentials: 'include'
                })
                .then(response => {
                    if (response.status === 401) throw new Error('Unauthorized');
                    if (response.ok) return response.json();
                    throw new Error('Failed to delete');
                })
                .then(() => {
                    target.closest('tr').remove();
                })
                .catch(error => {
                    console.error('Error deleting:', error);
                    alert(error.message);
                });
            }
        }

        // --- EDIT LOGIC (NEW) ---
        if (target.classList.contains('edit')) {
            const row = target.closest('tr');
            
            // Get current values from the table row
            const title = row.querySelector('.game-title').textContent;
            const genre = row.querySelector('.game-genre').textContent;

            // Populate form
            document.getElementById('title').value = title;
            document.getElementById('genre').value = genre;

            // Switch state to "Edit Mode"
            currentEditId = id;
            modalTitle.textContent = "Edit Game";
            submitBtn.textContent = "Update Game";

            // Open Modal
            modal.style.display = 'block';
        }
    });

    // -- Handle Form Submit (Create OR Edit) --
    addProductForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = {
            title: document.getElementById('title').value,
            genre: document.getElementById('genre').value 
        };

        // Determine Method and URL based on state
        const method = currentEditId ? 'PUT' : 'POST';
        const url = currentEditId ? `${apiUrl}/${currentEditId}` : apiUrl;

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (response.status === 401) throw new Error('Unauthorized');
            if (!response.ok) throw new Error(`Failed to ${currentEditId ? 'update' : 'create'} game`);
            return response.json();
        })
        .then(data => {
            // "data" is the updated/created game object
            const newRow = renderRow(data);

            if (currentEditId) {
                // EDIT MODE: Find existing row and replace it
                const existingRow = document.querySelector(`tr[data-row-id="${currentEditId}"]`);
                if (existingRow) {
                    existingRow.replaceWith(newRow);
                }
            } else {
                // CREATE MODE: Append to bottom
                tableBody.appendChild(newRow);
            }
            closeModal();
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
        });
    });
});