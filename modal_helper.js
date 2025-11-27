// Helper for Custom Input Modal
function showInputModal(title, initialValue, callback) {
    // Create modal elements if not exist
    let modal = document.getElementById('custom-input-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'custom-input-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10000;
        `;
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; width: 300px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                <h3 id="modal-title" style="margin-bottom: 20px; color: var(--accent-color); font-family: var(--font-display);"></h3>
                <input type="text" id="modal-input" style="width: 100%; padding: 10px; margin-bottom: 20px; border: 1px solid #ccc; border-radius: 5px; font-size: 1rem;">
                <div style="display: flex; justify-content: space-between;">
                    <button id="modal-cancel" class="glow-btn small" style="background: #95a5a6; border-color: #95a5a6; color: white;">Cancel</button>
                    <button id="modal-confirm" class="glow-btn small">Confirm</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    const titleEl = document.getElementById('modal-title');
    const inputEl = document.getElementById('modal-input');
    const cancelBtn = document.getElementById('modal-cancel');
    const confirmBtn = document.getElementById('modal-confirm');
    
    titleEl.textContent = title;
    inputEl.value = initialValue || '';
    modal.style.display = 'flex';
    inputEl.focus();
    
    const cleanup = () => {
        modal.style.display = 'none';
        cancelBtn.onclick = null;
        confirmBtn.onclick = null;
        inputEl.onkeydown = null;
    };

    cancelBtn.onclick = () => {
        cleanup();
        callback(null);
    };
    
    confirmBtn.onclick = () => {
        const val = inputEl.value;
        cleanup();
        callback(val);
    };
    
    inputEl.onkeydown = (e) => {
        if (e.key === 'Enter') confirmBtn.click();
        if (e.key === 'Escape') cancelBtn.click();
    };
}

