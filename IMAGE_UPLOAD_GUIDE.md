# How to Add Your Own Images to the Website

## Steps to Upload and Use Your Images:

### 1. Upload Images
- Upload your images to the `client/src/assets/` folder
- Recommended image names:
  - `hero-background.jpg` - Hero section background
  - `company-office.jpg` - Company section office photo  
  - `team-collaboration.jpg` - Welfare section team photo
  - `customer-logos/` - Folder for customer company logos

### 2. Replace Placeholder Graphics

#### Hero Section Background:
In `client/src/components/hero-section.tsx`, replace the CSS pattern with:
```jsx
<img src="/src/assets/hero-background.jpg" alt="" className="w-full h-full object-cover" />
```

#### Company Section Image:
In `client/src/components/company-section.tsx`, replace the placeholder div with:
```jsx
<img src="/src/assets/company-office.jpg" alt="Modern corporate office environment" className="rounded-xl shadow-lg w-full h-96 object-cover" />
```

#### Welfare Section Image:
In `client/src/components/welfare-section.tsx`, replace the placeholder div with:
```jsx
<img src="/src/assets/team-collaboration.jpg" alt="Happy diverse team collaborating in modern office" className="rounded-xl shadow-lg w-full h-96 object-cover" />
```

#### Customer Logos:
In `client/src/components/customers-section.tsx`, you can replace the generic company names with actual customer logos.

### 3. Image Requirements:
- **Format**: JPG, PNG, or WebP
- **Hero Background**: 1920x1080 or larger
- **Section Images**: 800x600 minimum
- **Customer Logos**: 200x200 maximum, transparent PNG preferred

### 4. Alternative: Using External URLs
If you prefer to host images elsewhere, you can also use external URLs:
```jsx
<img src="https://your-domain.com/your-image.jpg" alt="Description" />
```

## Current Status:
✓ All images are currently placeholder graphics (legally safe)
✓ Comments added to code showing exactly where to replace images
✓ Ready for your custom images whenever you're ready to upload them