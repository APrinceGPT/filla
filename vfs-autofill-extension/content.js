// VFS Japan Visa Form Autofill - Content Script
// This script runs on VFS Global pages and provides additional functionality

console.log('VFS Autofill Extension loaded');

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fillForm') {
    const result = fillFormWithProfile(request.profile);
    sendResponse(result);
  }
  return true;
});

// Fill form with profile data
function fillFormWithProfile(profile) {
  // Helper function to set value and trigger Angular change detection
  function setInputValue(element, value) {
    if (!element) return false;
    
    // Store original value
    const originalValue = element.value;
    
    // Focus the element first
    element.focus();
    
    // For Angular Material inputs, we need to simulate user typing
    element.value = '';
    
    // Set the value character by character for better Angular detection
    for (let i = 0; i < value.length; i++) {
      element.value += value[i];
      element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    }
    
    // Trigger all necessary events
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
    
    // Trigger keyboard events
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true }));
    
    // For Angular forms
    const inputEvent = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: value
    });
    element.dispatchEvent(inputEvent);
    
    return element.value === value;
  }
  
  // Helper function to select a mat-select dropdown option
  async function selectMatOption(matSelectElement, optionText) {
    if (!matSelectElement) return false;
    
    return new Promise((resolve) => {
      // Click to open the dropdown
      matSelectElement.click();
      matSelectElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      // Wait for dropdown panel to appear
      setTimeout(() => {
        // Find the option in the overlay panel
        const overlayContainer = document.querySelector('.cdk-overlay-container');
        if (!overlayContainer) {
          console.warn('Overlay container not found');
          resolve(false);
          return;
        }
        
        // Find all mat-options
        const options = overlayContainer.querySelectorAll('mat-option');
        let found = false;
        
        for (const option of options) {
          const text = option.textContent.trim().toUpperCase();
          if (text === optionText.toUpperCase() || text.includes(optionText.toUpperCase())) {
            option.click();
            found = true;
            console.log(`✓ VFS Autofill: Selected option: ${optionText}`);
            break;
          }
        }
        
        if (!found) {
          // Try clicking backdrop to close if not found
          const backdrop = document.querySelector('.cdk-overlay-backdrop');
          if (backdrop) backdrop.click();
          console.warn(`Option not found: ${optionText}`);
        }
        
        resolve(found);
      }, 300);
    });
  }
  
  // Helper function to find input by various methods
  function findInputByLabel(labelText) {
    // Method 1: Find by label text in parent containers
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      if (div.textContent.trim().startsWith(labelText) && div.textContent.includes('*')) {
        const parentControl = div.closest('app-input-control, app-ngb-datepicker, app-dropdown');
        if (parentControl) {
          const input = parentControl.querySelector('input');
          if (input) return input;
        }
      }
    }
    return null;
  }
  
  // Helper function to find mat-select by label
  function findMatSelectByLabel(labelText) {
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      const text = div.textContent.trim();
      if (text.startsWith(labelText) && text.includes('*')) {
        const parent = div.closest('app-dropdown');
        if (parent) {
          return parent.querySelector('mat-select');
        }
      }
    }
    return null;
  }
  
  // Helper function to find input by placeholder
  function findInputByPlaceholder(placeholderText) {
    return document.querySelector(`input[placeholder="${placeholderText}"]`) ||
           document.querySelector(`input[placeholder*="${placeholderText}" i]`);
  }
  
  // Helper function to find input by ID pattern
  function findInputById(idPattern) {
    return document.querySelector(`input[id="${idPattern}"]`) ||
           document.querySelector(`input[id*="${idPattern}" i]`);
  }
  
  // Helper function to find element by selectors
  function findBySelectors(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    return null;
  }
  
  const results = {
    success: true,
    filled: [],
    failed: []
  };
  
  // Define input field mappings with multiple fallback methods
  const inputFields = [
    {
      name: 'First Name',
      value: profile.firstName,
      finders: [
        () => findInputByPlaceholder('Enter your first name'),
        () => findInputByLabel('First Name'),
        () => document.querySelector('input[placeholder*="first name" i]')
      ]
    },
    {
      name: 'Last Name',
      value: profile.lastName,
      finders: [
        () => findInputByPlaceholder('Please enter last name.'),
        () => findInputByLabel('Last Name'),
        () => document.querySelector('input[placeholder*="last name" i]')
      ]
    },
    {
      name: 'Date of Birth',
      value: profile.dateOfBirth,
      finders: [
        () => findInputById('dateOfBirth'),
        () => findInputByLabel('Date Of Birth'),
        () => document.querySelector('app-ngb-datepicker input')
      ]
    },
    {
      name: 'Passport Number',
      value: profile.passportNumber,
      finders: [
        () => findInputByPlaceholder('Enter passport number'),
        () => findInputByLabel('Passport Number'),
        () => document.querySelector('input[placeholder*="passport number" i]')
      ]
    },
    {
      name: 'Passport Expiry',
      value: profile.passportExpiry,
      finders: [
        () => findInputById('passportExpirtyDate'),
        () => findInputById('passportExpiryDate'),
        () => findInputByLabel('Passport Expiry Date'),
        () => {
          const datepickers = document.querySelectorAll('app-ngb-datepicker input');
          return datepickers.length > 1 ? datepickers[1] : null;
        }
      ]
    },
    {
      name: 'Country Code',
      value: profile.countryCode,
      finders: [
        () => document.querySelector('input[maxlength="3"][placeholder="44"]'),
        () => document.querySelector('.col-12.col-sm-4 input[maxlength="3"]'),
        () => document.querySelector('input[maxlength="3"]:not([type="email"])')
      ]
    },
    {
      name: 'Mobile Number',
      value: profile.mobileNumber,
      finders: [
        () => document.querySelector('input[placeholder="012345648382"]'),
        () => document.querySelector('input[minlength="7"][maxlength="15"]'),
        () => document.querySelector('.col-12.col-sm-8 input[minlength="7"]')
      ]
    },
    {
      name: 'Email',
      value: profile.email,
      finders: [
        () => document.querySelector('input[type="email"]'),
        () => findInputByPlaceholder('Enter Email Address'),
        () => findInputByLabel('Email')
      ]
    }
  ];
  
  // Define dropdown field mappings
  const dropdownFields = [
    {
      name: 'Gender',
      value: profile.gender || 'Male',
      finders: [
        () => findBySelectors(['mat-select#mat-select-23', 'mat-select[aria-labelledby*="mat-select-value-23"]']),
        () => findMatSelectByLabel('Gender')
      ]
    },
    {
      name: 'Current Nationality',
      value: profile.nationality || 'PHILIPPINES',
      finders: [
        () => findBySelectors(['mat-select#mat-select-24', 'mat-select[aria-labelledby*="mat-select-value-24"]']),
        () => findMatSelectByLabel('Current Nationality')
      ]
    }
  ];
  
  // Process input fields
  inputFields.forEach(field => {
    let input = null;
    
    // Try each finder method until one works
    for (const finder of field.finders) {
      input = finder();
      if (input) break;
    }
    
    if (input) {
      try {
        if (setInputValue(input, field.value)) {
          results.filled.push(field.name);
          console.log(`✓ VFS Autofill: Filled ${field.name}`);
        } else {
          results.failed.push(field.name);
          console.warn(`✗ VFS Autofill: Value mismatch for ${field.name}`);
        }
      } catch (error) {
        results.failed.push(field.name);
        console.error(`✗ VFS Autofill: Error filling ${field.name}:`, error);
      }
    } else {
      results.failed.push(field.name);
      console.warn(`✗ VFS Autofill: Could not find ${field.name}`);
    }
  });
  
  // Process dropdown fields with delay
  dropdownFields.forEach((field, index) => {
    setTimeout(async () => {
      let matSelect = null;
      
      // Try each finder method until one works
      for (const finder of field.finders) {
        matSelect = finder();
        if (matSelect) break;
      }
      
      if (matSelect) {
        const success = await selectMatOption(matSelect, field.value);
        if (success) {
          results.filled.push(field.name);
        } else {
          results.failed.push(field.name);
        }
      } else {
        results.failed.push(field.name);
        console.warn(`✗ VFS Autofill: Could not find dropdown ${field.name}`);
      }
    }, 500 + (index * 600)); // 600ms between dropdowns
  });
  
  results.success = results.failed.length === 0;
  return results;
}

// Add a visual indicator when extension is active
function addExtensionIndicator() {
  // Only add if on a form page
  const form = document.querySelector('form');
  if (!form) return;
  
  // Check if indicator already exists
  if (document.getElementById('vfs-autofill-indicator')) return;
  
  const indicator = document.createElement('div');
  indicator.id = 'vfs-autofill-indicator';
  indicator.innerHTML = '🇯🇵 VFS Autofill Ready';
  indicator.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    color: white;
    padding: 10px 16px;
    border-radius: 25px;
    font-size: 12px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: transform 0.2s ease;
  `;
  
  indicator.addEventListener('mouseenter', () => {
    indicator.style.transform = 'scale(1.05)';
  });
  
  indicator.addEventListener('mouseleave', () => {
    indicator.style.transform = 'scale(1)';
  });
  
  indicator.addEventListener('click', () => {
    // Notify that user should use the extension popup
    indicator.innerHTML = '👆 Click extension icon to fill';
    setTimeout(() => {
      indicator.innerHTML = '🇯🇵 VFS Autofill Ready';
    }, 3000);
  });
  
  document.body.appendChild(indicator);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addExtensionIndicator);
} else {
  addExtensionIndicator();
}

// Also check periodically in case the page loads dynamically
let checkCount = 0;
const checkInterval = setInterval(() => {
  addExtensionIndicator();
  checkCount++;
  if (checkCount > 10) {
    clearInterval(checkInterval);
  }
}, 2000);
