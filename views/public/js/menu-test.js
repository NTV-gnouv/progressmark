// Mobile Menu Test Script
console.log('Menu test script loaded');

// Test function
function testMenu() {
    console.log('=== Testing Mobile Menu ===');
    
    const toggleBtn = document.querySelector('.navbar-toggler');
    const menu = document.querySelector('.navbar-collapse');
    
    if (!toggleBtn) {
        console.error('❌ Toggle button not found');
        return false;
    }
    
    if (!menu) {
        console.error('❌ Menu not found');
        return false;
    }
    
    console.log('✅ Toggle button found:', toggleBtn);
    console.log('✅ Menu found:', menu);
    console.log('✅ Current menu state:', menu.classList.contains('show') ? 'OPEN' : 'CLOSED');
    
    // Test click
    console.log('🔄 Testing click...');
    toggleBtn.click();
    
    setTimeout(() => {
        console.log('✅ After click, menu state:', menu.classList.contains('show') ? 'OPEN' : 'CLOSED');
    }, 100);
    
    return true;
}

// Auto-test on load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, testing menu...');
    setTimeout(testMenu, 1000);
});

// Make test function global
window.testMenu = testMenu;
