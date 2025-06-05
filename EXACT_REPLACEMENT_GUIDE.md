# Exact Steps to Replace Images

## 1. Hero Section Background Image

**Current Code (in `client/src/components/hero-section.tsx` around line 9):**
```jsx
{/* To use your own image, replace the CSS pattern below with:
    <img src="/src/assets/your-hero-image.jpg" alt="" className="w-full h-full object-cover" />
*/}
<div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800"></div>
```

**Replace with (after uploading your image):**
```jsx
<img src="/src/assets/hero-background.jpg" alt="" className="w-full h-full object-cover" />
```

---

## 2. Company Office Image

**Current Code (in `client/src/components/company-section.tsx` around line 16):**
```jsx
{/* To use your own image, replace this div with:
    <img src="/src/assets/company-office.jpg" alt="Modern corporate office environment" className="rounded-xl shadow-lg w-full h-96 object-cover" />
*/}
<div className="rounded-xl shadow-lg w-full h-96 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
  <div className="text-center p-8">
    <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
      <Building className="h-12 w-12 text-white" />
    </div>
    <h3 className="text-2xl font-bold text-gray-800 mb-2">Modern Workplace</h3>
    <p className="text-gray-600">Innovation-driven environment</p>
  </div>
</div>
```

**Replace with:**
```jsx
<img src="/src/assets/company-office.jpg" alt="Modern corporate office environment" className="rounded-xl shadow-lg w-full h-96 object-cover" />
```

---

## 3. Team Collaboration Image

**Current Code (in `client/src/components/welfare-section.tsx` around line 49):**
```jsx
{/* To use your own image, replace this div with:
    <img src="/src/assets/team-collaboration.jpg" alt="Happy diverse team collaborating in modern office" className="rounded-xl shadow-lg w-full h-96 object-cover" />
*/}
<div className="rounded-xl shadow-lg w-full h-96 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
  <div className="text-center p-8">
    <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
      <Heart className="h-12 w-12 text-white" />
    </div>
    <h3 className="text-2xl font-bold text-gray-800 mb-2">Team Wellness</h3>
    <p className="text-gray-600">Supporting our people's success</p>
  </div>
</div>
```

**Replace with:**
```jsx
<img src="/src/assets/team-collaboration.jpg" alt="Happy diverse team collaborating in modern office" className="rounded-xl shadow-lg w-full h-96 object-cover" />
```

---

## Simple Process:
1. Upload your images to `client/src/assets/`
2. Find the commented sections in the code
3. Delete the placeholder `<div>` 
4. Replace with the `<img>` tag using your filename

The changes will appear instantly on your website!