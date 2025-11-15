/*
 * Professional JavaScript for Secure Inventory Management System
 * Author: Gemini
 * Date: November 2025
 */

// --- 1. CONFIGURATION & CONSTANTS ---
const CONFIG = {
    STORAGE_KEY: 'fullInventoryData',
    MODE_KEY: 'darkModeEnabled',
    LOGGED_IN_KEY: 'loggedInUser',
    LOW_STOCK_THRESHOLD: 10,
    USERS: {
        'admin': { password: '123', name: 'Inventory Manager' },
        'guest': { password: 'abc', name: 'Guest User' }
    }
};

// --- 2. GLOBAL STATE ---
let inventory = [];
let nextId = 1;
let isLowStockView = false;
let lineCounter = 0; // Used for multi-IO modals


// --- 3. UTILITY FUNCTIONS ---

/**
 * Loads inventory data from Local Storage or initializes default data.
 */
function loadInventory() {
    try {
        const storedData = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (storedData) {
            inventory = JSON.parse(storedData);
        } else {
            // Default initial data
            inventory = [
                { id: 1, name: 'Warehouse Widget', quantity: 15 },
                { id: 2, name: 'Bulk Fastener (M8)', quantity: 4 },
                { id: 3, name: 'Assembly Tool Kit', quantity: 50 }
            ];
        }
        nextId = inventory.length > 0 ? Math.max(...inventory.map(item => item.id)) + 1 : 1;
    } catch (e) {
        console.error("Error loading inventory:", e);
        inventory = []; // Reset on error
    }
}

/**
 * Saves the current inventory state to Local Storage.
 */
function saveInventory() {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(inventory));
    } catch (e) {
        console.error("Error saving inventory:", e);
        alert("Warning: Could not save data to local storage!");
    }
}


/**
 * Handles the Enter key press event to trigger appropriate action.
 * @param {Event} event - The keyboard event.
 * @param {string} action - The action to perform ('login', 'addNewProduct', etc.).
 */
function handleEnterKey(event, action) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission behavior
        switch (action) {
            case 'login':
                login();
                break;
            case 'addNewProduct':
                addNewProduct();
                break;
            case 'multiStockIn':
                multiStockIn();
                break;
            case 'multiStockOut':
                multiStockOut();
                break;
        }
    }
}

// --- 4. AUTHENTICATION & UI SETUP ---

/**
 * Checks for user session and updates the UI accordingly.
 */
function checkAuth() {
    const user = localStorage.getItem(CONFIG.LOGGED_IN_KEY);
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');

    if (user && CONFIG.USERS[user]) {
        loginScreen.style.display = 'none';
        mainApp.style.display = 'block';
        document.getElementById('welcomeMessage').textContent = `Welcome, ${CONFIG.USERS[user].name}!`;
        loadInventory();
        renderInventory();
    } else {
        loginScreen.style.display = 'block';
        mainApp.style.display = 'none';
        localStorage.removeItem(CONFIG.LOGGED_IN_KEY);
    }
}

/**
 * Attempts to log the user in.
 */
function login() {
    const username = document.getElementById('usernameInput').value;
    const password = document.getElementById('passwordInput').value;
    const message = document.getElementById('loginMessage');

    if (CONFIG.USERS[username] && CONFIG.USERS[username].password === password) {
        localStorage.setItem(CONFIG.LOGGED_IN_KEY, username);
        message.textContent = '';
        checkAuth();
    } else {
        message.textContent = 'Invalid username or password.';
    }
}

/**
 * Logs the user out.
 */
function logout() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem(CONFIG.LOGGED_IN_KEY);
        alert('You have been logged out.');
        checkAuth();
    }
}

/**
 * Toggles dark mode and persists the setting.
 */
function toggleDarkMode() {
    const body = document.body;
    const button = document.getElementById('darkModeToggle');
    
    body.classList.toggle('dark-mode');
    
    const isDarkMode = body.classList.contains('dark-mode');
    localStorage.setItem(CONFIG.MODE_KEY, isDarkMode ? 'enabled' : 'disabled');
    
    button.textContent = isDarkMode ? '💡 Disable Dark Mode' : '🌙 Enable Dark Mode';
}

/**
 * Applies dark mode based on saved preference on load.
 */
function applyInitialMode() {
    const savedMode = localStorage.getItem(CONFIG.MODE_KEY);
    if (savedMode === 'enabled') {
        document.body.classList.add('dark-mode');
    }
    const button = document.getElementById('darkModeToggle');
    if (button) {
        button.textContent = document.body.classList.contains('dark-mode') ? '💡 Disable Dark Mode' : '🌙 Enable Dark Mode';
    }
}

/**
 * Toggles between displaying all stock and only low stock items.
 */
function filterLowStock() {
    isLowStockView = !isLowStockView;
    renderInventory();
}

// --- 5. MODAL MANAGEMENT ---

function openNewProductModal() {
    document.getElementById('newProductModal').style.display = 'block';
}

function closeNewProductModal() {
    document.getElementById('newProductModal').style.display = 'none';
    document.getElementById('newProductName').value = '';
    document.getElementById('newProductQuantity').value = '';
}

function openStockInModal() {
    document.getElementById('stockInModal').style.display = 'block';
    const stockInItemsDiv = document.getElementById('stockInItems');
    stockInItemsDiv.innerHTML = '';
    lineCounter = 0;
    addStockInLine();
}

function closeStockInModal() {
    document.getElementById('stockInModal').style.display = 'none';
    document.getElementById('stockInItems').innerHTML = '';
}

function openStockOutModal() {
    document.getElementById('stockOutModal').style.display = 'block';
    const stockOutItemsDiv = document.getElementById('stockOutItems');
    stockOutItemsDiv.innerHTML = '';
    lineCounter = 0; 
    addStockOutLine();
}

function closeStockOutModal() {
    document.getElementById('stockOutModal').style.display = 'none';
    document.getElementById('stockOutItems').innerHTML = '';
}

/**
 * Adds a new product line to the Stock In modal.
 */
function addStockInLine() {
    const stockInItemsDiv = document.getElementById('stockInItems');
    const newLine = document.createElement('div');
    newLine.className = 'io-line';
    newLine.id = `stock-in-line-${lineCounter}`;

    const select = createProductSelect('selectProductIn', lineCounter);
    const input = createQuantityInput('quantityInValue', lineCounter, 'Qty to Add');
    const removeBtn = createRemoveButton(newLine);

    newLine.appendChild(select);
    newLine.appendChild(input);
    
    if (lineCounter > 0) {
         newLine.appendChild(removeBtn);
    }

    stockInItemsDiv.appendChild(newLine);
    lineCounter++;
}

/**
 * Adds a new product line to the Stock Out modal.
 */
function addStockOutLine() {
    const stockOutItemsDiv = document.getElementById('stockOutItems');
    const newLine = document.createElement('div');
    newLine.className = 'io-line';
    newLine.id = `stock-out-line-${lineCounter}`;

    const select = createProductSelect('selectProductOut', lineCounter);
    const input = createQuantityInput('quantityOutValue', lineCounter, 'Qty to Subtract');
    const removeBtn = createRemoveButton(newLine);

    newLine.appendChild(select);
    newLine.appendChild(input);
    
    if (lineCounter > 0) {
         newLine.appendChild(removeBtn);
    }

    stockOutItemsDiv.appendChild(newLine);
    lineCounter++;
}

/**
 * Creates a dropdown select element populated with inventory items.
 */
function createProductSelect(idPrefix, lineId) {
    const select = document.createElement('select');
    select.className = 'product-io-select';
    select.id = `${idPrefix}-${lineId}`;
    select.setAttribute('data-line-id', lineId);
    
    let optionsHTML = '<option value="">-- Select Product --</option>';
    // Ensure the options reflect the latest inventory
    inventory.forEach(item => {
        optionsHTML += `<option value="${item.id}">${item.name}</option>`;
    });
    select.innerHTML = optionsHTML;
    return select;
}

/**
 * Creates a quantity input field.
 */
function createQuantityInput(idPrefix, lineId, placeholder) {
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'quantity-io-input';
    input.id = `${idPrefix}-${lineId}`;
    input.placeholder = placeholder;
    input.min = '1';
    return input;
}

/**
 * Creates a remove button for multi-IO lines.
 */
function createRemoveButton(lineElement) {
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-base out-btn action-btn';
    removeBtn.textContent = 'X';
    removeBtn.type = 'button'; // Prevent implicit form submission
    removeBtn.onclick = function() {
        lineElement.remove();
    };
    return removeBtn;
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = [
        document.getElementById('newProductModal'),
        document.getElementById('stockInModal'),
        document.getElementById('stockOutModal')
    ];

    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}


// --- 6. CORE INVENTORY LOGIC ---

/**
 * Adds a new product from the modal input.
 */
function addNewProduct() {
    const nameInput = document.getElementById('newProductName');
    const quantityInput = document.getElementById('newProductQuantity');

    const name = nameInput.value.trim();
    const quantity = parseInt(quantityInput.value);

    if (name && !isNaN(quantity) && quantity >= 0) {
        inventory.push({
            id: nextId++,
            name: name,
            quantity: quantity
        });
        closeNewProductModal();
        renderInventory();
    } else {
        alert('Please enter a valid product name and non-negative quantity.');
    }
}

/**
 * Handles multiple stock-in transactions from the modal.
 */
function multiStockIn() {
    const selectElements = document.querySelectorAll('#stockInItems .product-io-select');
    const quantityElements = document.querySelectorAll('#stockInItems .quantity-io-input');
    let transactions = 0;

    for (let i = 0; i < selectElements.length; i++) {
        const selectedProductId = parseInt(selectElements[i].value);
        const quantityToAdd = parseInt(quantityElements[i].value);

        if (selectedProductId && !isNaN(quantityToAdd) && quantityToAdd > 0) {
            const item = inventory.find(invItem => invItem.id === selectedProductId);
            if (item) {
                item.quantity += quantityToAdd;
                transactions++;
            }
        }
    }

    if (transactions > 0) {
        alert(`Stock In successful! ${transactions} product(s) updated.`);
        closeStockInModal();
        renderInventory();
    } else {
        alert('Please select at least one product with a valid quantity (greater than 0).');
    }
}

/**
 * Handles multiple stock-out transactions from the modal.
 */
function multiStockOut() {
    const selectElements = document.querySelectorAll('#stockOutItems .product-io-select');
    const quantityElements = document.querySelectorAll('#stockOutItems .quantity-io-input');
    let transactions = 0;
    let errors = [];

    for (let i = 0; i < selectElements.length; i++) {
        const selectedProductId = parseInt(selectElements[i].value);
        const quantityToSubtract = parseInt(quantityElements[i].value);

        if (selectedProductId && !isNaN(quantityToSubtract) && quantityToSubtract > 0) {
            const item = inventory.find(invItem => invItem.id === selectedProductId);
            
            if (item) {
                if (item.quantity >= quantityToSubtract) {
                    item.quantity -= quantityToSubtract;
                    transactions++;
                } else {
                    errors.push(`Not enough stock for ${item.name}. Available: ${item.quantity}`);
                }
            }
        }
    }

    if (transactions > 0 || errors.length > 0) {
        let message = transactions > 0 ? `Stock Out successful! ${transactions} product(s) updated.` : "No successful transactions.";
        if (errors.length > 0) {
            message += "\n\n⚠️ Warnings/Errors:\n" + errors.join('\n');
        }
        alert(message);
        closeStockOutModal();
        renderInventory();
    } else {
        alert('Please select at least one product with a valid quantity (greater than 0).');
    }
}

/**
 * Renders the inventory table based on the current view state.
 */
function renderInventory() {
    const tableBody = document.getElementById('inventoryTable').getElementsByTagName('tbody')[0];
    const lowStockBtn = document.getElementById('lowStockFilterBtn');
    const tableHeader = document.getElementById('tableHeader');
    
    tableBody.innerHTML = ''; 

    const itemsToDisplay = isLowStockView
        ? inventory.filter(item => item.quantity <= CONFIG.LOW_STOCK_THRESHOLD)
        : inventory;

    const lowStockCount = inventory.filter(item => item.quantity <= CONFIG.LOW_STOCK_THRESHOLD).length;

    // Update Filter Button Text
    if (isLowStockView) {
        lowStockBtn.textContent = `✅ Showing Low Stock (${lowStockCount}). Click to Show All.`;
        tableHeader.textContent = `Low Stock Items (${itemsToDisplay.length})`;
    } else {
        lowStockBtn.textContent = `⚠️ Show Low Stock Only (${lowStockCount})`;
        tableHeader.textContent = 'Current Stock';
    }

    itemsToDisplay.forEach(item => {
        const row = tableBody.insertRow();
        row.id = `row-${item.id}`;
        
        row.insertCell(0).innerHTML = item.name;
        
        let quantityCell = row.insertCell(1);
        let quantityHTML = item.quantity;

        // Low Stock Alert Badge
        if (item.quantity <= CONFIG.LOW_STOCK_THRESHOLD) {
            const alertTitle = item.quantity === 0 ? 'Out of Stock!' : 'Low Stock!';
            const bgColor = item.quantity === 0 ? 'orange' : 'var(--danger-color)';
            quantityHTML += ` <span class="low-stock-alert" style="background-color: ${bgColor};" title="${alertTitle}"></span>`;
        }
        quantityCell.innerHTML = quantityHTML;

        let actionCell = row.insertCell(2);
        actionCell.innerHTML = `
            <button class="edit-btn action-btn btn-base" onclick="startEdit(${item.id})">Edit</button>
            <button class="delete-btn action-btn btn-base" onclick="deleteProduct(${item.id})">Remove</button>
        `;
    });
    
    saveInventory();
}

/**
 * Deletes a product from the inventory.
 */
function deleteProduct(id) {
    if (confirm('Are you sure you want to remove this product? This action cannot be undone.')) {
        inventory = inventory.filter(item => item.id !== id);
        renderInventory();
    }
}

/**
 * Switches a table row into editable input fields.
 */
function startEdit(id) {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    const row = document.getElementById(`row-${id}`);
    const nameCell = row.cells[0];
    const quantityCell = row.cells[1];
    const actionCell = row.cells[2];

    nameCell.innerHTML = `<input type="text" id="editName-${id}" value="${item.name}">`;
    quantityCell.innerHTML = `<input type="number" id="editQuantity-${id}" value="${item.quantity}" min="0">`;

    actionCell.innerHTML = `
        <button class="save-btn action-btn btn-base" onclick="saveEdit(${id})">Save</button>
        <button class="cancel-btn action-btn btn-base" onclick="cancelEdit(${id}, '${item.name}', ${item.quantity})">Cancel</button>
    `;
}

/**
 * Saves the edited values back to the inventory state.
 */
function saveEdit(id) {
    const nameInput = document.getElementById(`editName-${id}`);
    const quantityInput = document.getElementById(`editQuantity-${id}`);

    const newName = nameInput.value.trim();
    const newQuantity = parseInt(quantityInput.value);

    if (newName && !isNaN(newQuantity) && newQuantity >= 0) {
        const item = inventory.find(i => i.id === id);
        item.name = newName;
        item.quantity = newQuantity;
        renderInventory();
    } else {
        alert('Invalid input. Name cannot be empty and Quantity must be non-negative.');
    }
}

/**
 * Discards edits and reverts the row to display mode.
 */
function cancelEdit(id, originalName, originalQuantity) {
    const row = document.getElementById(`row-${id}`);
    row.cells[0].innerHTML = originalName;
    row.cells[1].innerHTML = originalQuantity;

    // Rerender to get the correct quantity cell formatting (e.g., low stock badge)
    renderInventory();
}


// --- 7. INITIALIZATION ---

/**
 * Initializes the application on window load.
 */
window.onload = function() {
    applyInitialMode();
    checkAuth();
}