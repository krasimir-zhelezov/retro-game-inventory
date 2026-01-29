document.addEventListener('DOMContentLoaded', () => {
    // 1. Updated API URL
    const apiUrl = 'http://localhost:3000/games';
    const tableBody = document.getElementById('product-table-body');

    // -- DOM Elements for Modal --
    const modal = document.getElementById('addProductModal');
    const openModalBtn = document.querySelector('.btn-primary'); 
    const closeModalBtn = document.querySelector('.close-btn');
    const cancelBtn = document.querySelector('.cancel-btn');
    const addProductForm = document.getElementById('addProductForm');
    
    const modalTitle = document.querySelector('.modal-header h2');
    const submitBtn = document.querySelector('.form-actions button[type="submit"]');

    // -- Render Row Function --
    // Adapted to match your 'games' table: id, title, genre
    const renderRow = (game) => {
        const row = document.createElement('tr');
        row.dataset.rowId = game.id; 

        row.innerHTML = `
            <td>#${game.id}</td>
            <td><strong>${game.title}</strong></td>
            <td>${game.genre || 'N/A'}</td>
            <td>
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
        credentials: 'include' // Important: Sends the session cookie
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
        modalTitle.textContent = "Add New Game";
        submitBtn.textContent = "Create Game";
    };

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

    // -- Handle Delete Action --
    tableBody.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.getAttribute('data-id');

        // --- DELETE LOGIC ---
        if (target.classList.contains('delete')) {
            if (confirm(`Are you sure you want to delete Game #${id}?`)) {
                fetch(`${apiUrl}/${id}`, { 
                    method: 'DELETE',
                    credentials: 'include' // Sends session cookie
                })
                .then(response => {
                    if (response.status === 401) throw new Error('Unauthorized');
                    if (response.ok) return response.json();
                    throw new Error('Failed to delete');
                })
                .then(() => {
                    target.closest('tr').remove();
                    // Optional: alert('Game deleted successfully');
                })
                .catch(error => {
                    console.error('Error deleting:', error);
                    alert(error.message);
                });
            }
        }
    });

    // -- Handle Create (POST) --
    // Note: The backend provided does not support PUT (Edit), so this only handles POST.
    addProductForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Ensure you have inputs with IDs "title" and "genre" in your HTML now
        const formData = {
            title: document.getElementById('title').value,
            genre: document.getElementById('genre').value 
        };

        fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Sends session cookie
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (response.status === 401) throw new Error('Unauthorized');
            if (!response.ok) throw new Error('Failed to create game');
            return response.json();
        })
        .then(newGame => {
            // Your backend returns the created object directly
            const newRow = renderRow(newGame);
            tableBody.appendChild(newRow); // Append to bottom (or insertBefore for top)
            closeModal();
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
        });
    });
});