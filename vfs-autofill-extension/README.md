# VFS Japan Visa Form Autofill Extension

A Chrome/Edge browser extension that automatically fills VFS Global Japan visa application forms with saved profile data.

## Features

- ✅ **Save up to 5 profiles** - Store multiple applicant profiles in your browser
- ✅ **One-click form filling** - Fill the entire form with a single click
- ✅ **Secure local storage** - All data is stored locally in your browser
- ✅ **Edit & delete profiles** - Easily manage your saved profiles
- ✅ **Visual feedback** - See which fields are filled and confirmation messages

## Fields Supported

The extension fills the following fields:

### Input Fields:
- First Name
- Last Name
- Date of Birth (DD/MM/YYYY format)
- Passport Number
- Passport Expiry Date (DD/MM/YYYY format)
- Country Mobile Code (e.g., 63 for Philippines)
- Mobile Number (10-15 digits)
- Email Address

### Dropdown Fields:
- Gender (Male/Female)
- Current Nationality (Philippines, India, China, and more)

## Installation

### For Chrome:

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `vfs-autofill-extension` folder
5. The extension icon will appear in your toolbar

### For Microsoft Edge:

1. Open Edge and navigate to `edge://extensions/`
2. Enable **Developer mode** (toggle in the left sidebar)
3. Click **Load unpacked**
4. Select the `vfs-autofill-extension` folder
5. The extension icon will appear in your toolbar

### For Firefox:

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select the `manifest.json` file from the extension folder

## How to Use

### Step 1: Create a Profile

1. Click the extension icon in your browser toolbar
2. Click the **Add/Edit** tab
3. Fill in the profile information:
   - **Profile Name**: A name to identify this profile
   - **First Name**: As it appears on passport (UPPERCASE)
   - **Last Name**: As it appears on passport (UPPERCASE)
   - **Gender**: Select Male or Female
   - **Nationality**: Select your nationality from the dropdown
   - **Date of Birth**: In DD/MM/YYYY format (e.g., 15/03/1990)
   - **Passport Number**: Your passport number
   - **Passport Expiry**: In DD/MM/YYYY format
   - **Country Code**: Phone country code (e.g., 63 for Philippines)
   - **Mobile Number**: 10-digit phone number without country code
   - **Email**: Your email address
4. Click **Save Profile**

### Step 2: Fill the VFS Form

1. Navigate to the VFS Global Japan visa application website
2. Go to the appointment booking page with the form
3. Click the extension icon in your toolbar
4. Select a profile and click the green **✓ Fill** button
5. The form will be automatically filled with your profile data
6. Review the filled information before submitting

## Troubleshooting

### Form not filling?

1. **Refresh the page** and try again
2. Make sure you're on the VFS Global website (`*.vfsglobal.com`)
3. Wait for the page to fully load before clicking Fill
4. Check the browser console (F12 → Console) for error messages

### Fields showing wrong values?

1. Make sure you entered dates in DD/MM/YYYY format
2. Check that names are in UPPERCASE
3. Verify the mobile number has the correct length

### Extension not appearing?

1. Make sure Developer mode is enabled
2. Try reloading the extension from the extensions page
3. Restart your browser

## Privacy & Security

- 🔒 All data is stored **locally** in your browser
- 🔒 No data is sent to external servers
- 🔒 The extension only activates on VFS Global websites
- 🔒 You can delete profiles at any time

## File Structure

```
vfs-autofill-extension/
├── manifest.json       # Extension configuration
├── popup.html          # Extension popup interface
├── popup.css           # Popup styles
├── popup.js            # Popup functionality
├── content.js          # Page injection script
├── content.css         # Content styles
├── icons/              # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # This file
```

## Notes

- The extension is designed specifically for VFS Global Japan visa application forms
- Form field IDs may change if VFS updates their website
- Maximum 5 profiles can be saved to prevent storage bloat
- All text fields are automatically converted to UPPERCASE

## Version History

- **v1.0.0** - Initial release with profile management and form filling

## Disclaimer

This extension is provided as-is for convenience purposes. Always verify that form data is correctly filled before submission. The developers are not responsible for any issues arising from the use of this extension.
