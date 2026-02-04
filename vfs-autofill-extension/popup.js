// VFS Japan Visa Form Autofill - Popup Script

const MAX_PROFILES = 5;
const STORAGE_KEY = 'vfs_autofill_profiles';

// DOM Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const profilesTab = document.getElementById('profiles-tab');
const addProfileTab = document.getElementById('add-profile-tab');
const profilesList = document.getElementById('profiles-list');
const noProfilesDiv = document.getElementById('no-profiles');
const profileForm = document.getElementById('profile-form');
const editProfileId = document.getElementById('edit-profile-id');
const statusMessage = document.getElementById('status-message');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');

// Tab switching
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const tabName = btn.dataset.tab;
    if (tabName === 'profiles') {
      profilesTab.classList.add('active');
      addProfileTab.classList.remove('active');
    } else {
      profilesTab.classList.remove('active');
      addProfileTab.classList.add('active');
      // Reset form when switching to add tab
      resetForm();
    }
  });
});

// Load profiles on popup open
document.addEventListener('DOMContentLoaded', loadProfiles);

// Form submission
profileForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  await saveProfile();
});

// Cancel button
cancelBtn.addEventListener('click', () => {
  resetForm();
  switchToProfilesTab();
});

// Load all profiles from storage
async function loadProfiles() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const profiles = result[STORAGE_KEY] || [];
    renderProfiles(profiles);
  } catch (error) {
    console.error('Error loading profiles:', error);
    showStatus('Error loading profiles', 'error');
  }
}

// Render profiles list
function renderProfiles(profiles) {
  profilesList.innerHTML = '';
  
  if (profiles.length === 0) {
    noProfilesDiv.style.display = 'block';
    profilesList.style.display = 'none';
    return;
  }
  
  noProfilesDiv.style.display = 'none';
  profilesList.style.display = 'flex';
  
  profiles.forEach((profile, index) => {
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.innerHTML = `
      <div class="profile-card-header">
        <span class="profile-name">${escapeHtml(profile.profileName)}</span>
        <div class="profile-actions">
          <button class="btn-fill" data-index="${index}" title="Fill form">✓ Fill</button>
          <button class="btn-edit" data-index="${index}" title="Edit profile">✏️</button>
          <button class="btn-delete" data-index="${index}" title="Delete profile">🗑️</button>
        </div>
      </div>
      <div class="profile-info">
        <span><strong>Name:</strong> ${escapeHtml(profile.firstName)} ${escapeHtml(profile.lastName)}</span>
        <span><strong>Passport:</strong> ${escapeHtml(profile.passportNumber)}</span>
        <span><strong>Email:</strong> ${escapeHtml(profile.email)}</span>
      </div>
    `;
    profilesList.appendChild(card);
  });
  
  // Add event listeners to buttons
  document.querySelectorAll('.btn-fill').forEach(btn => {
    btn.addEventListener('click', () => fillForm(parseInt(btn.dataset.index)));
  });
  
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => editProfile(parseInt(btn.dataset.index)));
  });
  
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteProfile(parseInt(btn.dataset.index)));
  });
}

// Save profile
async function saveProfile() {
  const profile = {
    id: editProfileId.value || generateId(),
    profileName: document.getElementById('profile-name').value.trim(),
    firstName: document.getElementById('first-name').value.trim().toUpperCase(),
    lastName: document.getElementById('last-name').value.trim().toUpperCase(),
    gender: document.getElementById('gender').value,
    nationality: document.getElementById('nationality').value,
    dateOfBirth: document.getElementById('date-of-birth').value.trim(),
    passportNumber: document.getElementById('passport-number').value.trim().toUpperCase(),
    passportExpiry: document.getElementById('passport-expiry').value.trim(),
    countryCode: document.getElementById('country-code').value.trim(),
    mobileNumber: document.getElementById('mobile-number').value.trim(),
    email: document.getElementById('email').value.trim().toUpperCase(),
    createdAt: new Date().toISOString()
  };
  
  // Validate required fields
  if (!validateProfile(profile)) {
    return;
  }
  
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    let profiles = result[STORAGE_KEY] || [];
    
    // Check if editing existing profile
    const existingIndex = profiles.findIndex(p => p.id === profile.id);
    
    if (existingIndex >= 0) {
      // Update existing profile
      profiles[existingIndex] = profile;
      showStatus('Profile updated successfully!', 'success');
    } else {
      // Check max profiles limit
      if (profiles.length >= MAX_PROFILES) {
        showStatus(`Maximum ${MAX_PROFILES} profiles allowed. Delete one to add more.`, 'error');
        return;
      }
      // Add new profile
      profiles.push(profile);
      showStatus('Profile saved successfully!', 'success');
    }
    
    await chrome.storage.local.set({ [STORAGE_KEY]: profiles });
    resetForm();
    loadProfiles();
    switchToProfilesTab();
    
  } catch (error) {
    console.error('Error saving profile:', error);
    showStatus('Error saving profile', 'error');
  }
}

// Validate profile data
function validateProfile(profile) {
  // Check date format DD/MM/YYYY
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  
  if (!dateRegex.test(profile.dateOfBirth)) {
    showStatus('Date of Birth must be in DD/MM/YYYY format', 'error');
    return false;
  }
  
  if (!dateRegex.test(profile.passportExpiry)) {
    showStatus('Passport Expiry must be in DD/MM/YYYY format', 'error');
    return false;
  }
  
  // Validate country code (1-3 digits)
  if (!/^\d{1,3}$/.test(profile.countryCode)) {
    showStatus('Country code must be 1-3 digits', 'error');
    return false;
  }
  
  // Validate mobile number (7-15 digits)
  if (!/^\d{7,15}$/.test(profile.mobileNumber)) {
    showStatus('Mobile number must be 7-15 digits', 'error');
    return false;
  }
  
  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    showStatus('Please enter a valid email address', 'error');
    return false;
  }
  
  return true;
}

// Edit profile
async function editProfile(index) {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const profiles = result[STORAGE_KEY] || [];
    const profile = profiles[index];
    
    if (!profile) return;
    
    // Fill form with profile data
    editProfileId.value = profile.id;
    document.getElementById('profile-name').value = profile.profileName;
    document.getElementById('first-name').value = profile.firstName;
    document.getElementById('last-name').value = profile.lastName;
    document.getElementById('gender').value = profile.gender || 'Male';
    document.getElementById('nationality').value = profile.nationality || 'PHILIPPINES';
    document.getElementById('date-of-birth').value = profile.dateOfBirth;
    document.getElementById('passport-number').value = profile.passportNumber;
    document.getElementById('passport-expiry').value = profile.passportExpiry;
    document.getElementById('country-code').value = profile.countryCode;
    document.getElementById('mobile-number').value = profile.mobileNumber;
    document.getElementById('email').value = profile.email;
    
    // Update save button text
    saveBtn.textContent = 'Update Profile';
    
    // Switch to add/edit tab
    tabBtns.forEach(b => b.classList.remove('active'));
    tabBtns[1].classList.add('active');
    profilesTab.classList.remove('active');
    addProfileTab.classList.add('active');
    
  } catch (error) {
    console.error('Error loading profile for edit:', error);
    showStatus('Error loading profile', 'error');
  }
}

// Delete profile
async function deleteProfile(index) {
  if (!confirm('Are you sure you want to delete this profile?')) {
    return;
  }
  
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    let profiles = result[STORAGE_KEY] || [];
    
    profiles.splice(index, 1);
    
    await chrome.storage.local.set({ [STORAGE_KEY]: profiles });
    showStatus('Profile deleted successfully!', 'success');
    loadProfiles();
    
  } catch (error) {
    console.error('Error deleting profile:', error);
    showStatus('Error deleting profile', 'error');
  }
}

// Fill form on the website
async function fillForm(index) {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const profiles = result[STORAGE_KEY] || [];
    const profile = profiles[index];
    
    if (!profile) {
      showStatus('Profile not found', 'error');
      return;
    }
    
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      showStatus('No active tab found', 'error');
      return;
    }
    
    // Check if on VFS Global website
    if (!tab.url.includes('vfsglobal.com')) {
      showStatus('Please navigate to VFS Global website first', 'error');
      return;
    }
    
    // Execute content script to fill the form
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: fillVFSForm,
        args: [profile]
      });
      
      showStatus('Form filled successfully! ✓', 'success');
      
    } catch (scriptError) {
      console.error('Script execution error:', scriptError);
      showStatus('Error: Could not access the page. Try refreshing.', 'error');
    }
    
  } catch (error) {
    console.error('Error filling form:', error);
    showStatus('Error filling form', 'error');
  }
}

// This function will be injected into the page
function fillVFSForm(profile) {
  // Helper function to set value and trigger Angular change detection
  function setInputValue(element, value) {
    if (!element) return false;
    
    // Focus the element
    element.focus();
    
    // Clear existing value
    element.value = '';
    
    // Set the new value
    element.value = value;
    
    // Trigger various events for Angular to detect the change
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    
    // Also trigger Angular-specific events
    const ngModelEvent = new Event('ngModelChange', { bubbles: true });
    element.dispatchEvent(ngModelEvent);
    
    return true;
  }
  
  // Helper function to select a mat-select dropdown option
  async function selectMatOption(matSelectElement, optionText) {
    if (!matSelectElement) return false;
    
    return new Promise((resolve) => {
      // Click to open the dropdown
      matSelectElement.click();
      matSelectElement.dispatchEvent(new Event('click', { bubbles: true }));
      
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
            console.log(`✓ Selected option: ${optionText}`);
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
  
  // Helper function to find input by various selectors
  function findInput(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
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
  
  // Field mapping - using multiple possible selectors for each field
  const inputFieldMappings = [
    {
      name: 'First Name',
      value: profile.firstName,
      selectors: [
        'input[placeholder="Enter your first name"]',
        'input[id*="mat-input"][placeholder*="first name" i]',
        'app-input-control input[placeholder*="first" i]'
      ]
    },
    {
      name: 'Last Name',
      value: profile.lastName,
      selectors: [
        'input[placeholder="Please enter last name."]',
        'input[placeholder*="last name" i]',
        'app-input-control input[placeholder*="last" i]'
      ]
    },
    {
      name: 'Date of Birth',
      value: profile.dateOfBirth,
      selectors: [
        'input#dateOfBirth',
        'input[id="dateOfBirth"]',
        'app-ngb-datepicker input[placeholder*="date" i]'
      ]
    },
    {
      name: 'Passport Number',
      value: profile.passportNumber,
      selectors: [
        'input[placeholder="Enter passport number"]',
        'input[placeholder*="passport number" i]',
        'app-input-control input[placeholder*="passport" i]'
      ]
    },
    {
      name: 'Passport Expiry Date',
      value: profile.passportExpiry,
      selectors: [
        'input#passportExpirtyDate',
        'input[id="passportExpirtyDate"]',
        'input#passportExpiryDate',
        'app-ngb-datepicker input[id*="passport" i]'
      ]
    },
    {
      name: 'Country Code',
      value: profile.countryCode,
      selectors: [
        'input[placeholder="44"][maxlength="3"]',
        'input[maxlength="3"][placeholder*="44"]',
        '.col-12.col-sm-4 input[maxlength="3"]',
        'app-input-control input[maxlength="3"]'
      ]
    },
    {
      name: 'Mobile Number',
      value: profile.mobileNumber,
      selectors: [
        'input[placeholder="012345648382"]',
        'input[minlength="7"][maxlength="15"]',
        '.col-12.col-sm-8 input[maxlength="15"]',
        'input[placeholder*="0123456" i]'
      ]
    },
    {
      name: 'Email',
      value: profile.email,
      selectors: [
        'input[type="email"]',
        'input[placeholder="Enter Email Address"]',
        'input[placeholder*="email" i]',
        'app-input-control input[type="email"]'
      ]
    }
  ];
  
  // Dropdown field mappings
  const dropdownFieldMappings = [
    {
      name: 'Gender',
      value: profile.gender,
      label: 'Gender',
      selectors: ['mat-select#mat-select-23', 'mat-select[aria-labelledby*="mat-select-value-23"]']
    },
    {
      name: 'Current Nationality',
      value: profile.nationality,
      label: 'Current Nationality',
      selectors: ['mat-select#mat-select-24', 'mat-select[aria-labelledby*="mat-select-value-24"]']
    }
  ];
  
  let filledCount = 0;
  let errors = [];
  
  // Fill input fields with a small delay between them
  inputFieldMappings.forEach((field, index) => {
    setTimeout(() => {
      const input = findInput(field.selectors);
      if (input) {
        if (setInputValue(input, field.value)) {
          filledCount++;
          console.log(`✓ Filled ${field.name}: ${field.value}`);
        }
      } else {
        errors.push(field.name);
        console.warn(`✗ Could not find field: ${field.name}`);
      }
    }, index * 100); // 100ms delay between each field
  });
  
  // Fill dropdown fields after input fields (with additional delay)
  const dropdownStartDelay = inputFieldMappings.length * 100 + 200;
  
  dropdownFieldMappings.forEach((field, index) => {
    setTimeout(async () => {
      // Try to find by selectors first
      let matSelect = findInput(field.selectors);
      
      // If not found, try by label
      if (!matSelect) {
        matSelect = findMatSelectByLabel(field.label);
      }
      
      if (matSelect) {
        const success = await selectMatOption(matSelect, field.value);
        if (success) {
          filledCount++;
          console.log(`✓ Selected ${field.name}: ${field.value}`);
        } else {
          errors.push(field.name);
        }
      } else {
        errors.push(field.name);
        console.warn(`✗ Could not find dropdown: ${field.name}`);
      }
    }, dropdownStartDelay + (index * 600)); // 600ms between dropdowns to allow panels to close
  });
  
  // Log summary after all fields are processed
  const totalDelay = dropdownStartDelay + (dropdownFieldMappings.length * 600) + 500;
  setTimeout(() => {
    const totalFields = inputFieldMappings.length + dropdownFieldMappings.length;
    console.log(`VFS Autofill Complete: ${filledCount}/${totalFields} fields filled`);
    if (errors.length > 0) {
      console.warn('Fields not found:', errors.join(', '));
    }
  }, totalDelay);
  
  return { success: true, filledCount, errors };
}

// Reset form
function resetForm() {
  profileForm.reset();
  editProfileId.value = '';
  saveBtn.textContent = 'Save Profile';
  document.getElementById('country-code').value = '63'; // Default to Philippines
  document.getElementById('gender').value = 'Male';
  document.getElementById('nationality').value = 'PHILIPPINES';
  hideStatus();
}

// Switch to profiles tab
function switchToProfilesTab() {
  tabBtns.forEach(b => b.classList.remove('active'));
  tabBtns[0].classList.add('active');
  profilesTab.classList.add('active');
  addProfileTab.classList.remove('active');
}

// Show status message
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  
  // Auto-hide after 3 seconds for success messages
  if (type === 'success') {
    setTimeout(hideStatus, 3000);
  }
}

// Hide status message
function hideStatus() {
  statusMessage.className = 'status-message';
  statusMessage.textContent = '';
}

// Generate unique ID
function generateId() {
  return 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
