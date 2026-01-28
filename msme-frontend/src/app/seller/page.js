"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SellerDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('product');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', price: '', category: 'Food' });
  const [file, setFile] = useState(null);

  // --- SECURITY CHECK ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
    } else {
      const user = JSON.parse(userStr);
      // Ensure user is actually a seller
      if (user.isSeller) {
        setIsLoading(false);
      } else {
        alert("Access Denied: You are not a registered seller.");
        router.push('/');
      }
    }
  }, [router]);

  // --- SUBMIT LOGIC ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user) {
      alert("Please login again.");
      router.push('/login');
      return;
    }

    try {
      let mediaId = null;

      // 1. Upload File
      if (file) {
        const uploadData = new FormData();
        uploadData.append('files', file);

        try {
          const uploadRes = await axios.post('http://localhost:1337/api/upload', uploadData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          mediaId = uploadRes.data[0].id;
        } catch (uploadError) {
          console.error("Upload Error:", uploadError);
          alert("Failed to upload file.");
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Publish Item
      const endpoint = activeTab === 'product' ? 'products' : 'services';
      
      const payloadData = {
        name: formData.name,
        price: Number(formData.price),
        category: formData.category, 
        seller: user.id,
        media: mediaId // We send 'media' because we renamed it in Strapi
      };

      await axios.post(`http://localhost:1337/api/${endpoint}`, { data: payloadData }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Item published successfully!');
      // Reset
      setFormData({ 
        name: '', 
        price: '', 
        category: activeTab === 'product' ? 'Food' : 'Massage' 
      });
      setFile(null);

    } catch (err) {
      console.error("Publish Error:", err);
      const strapiError = err.response?.data?.error;
      const msg = strapiError?.message || "Unknown Error";
      alert(`Failed: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="container" style={{textAlign:'center', marginTop:'2rem'}}>Loading Dashboard...</div>;

  return (
    <div>
      {/* Navbar for Seller Page */}
      <nav className="navbar">
        <h1 style={{ margin: 0 }}>Seller Dashboard</h1>
        <div className="nav-links">
           <Link href="/" style={{color:'white', textDecoration:'none', fontWeight:'bold'}}>
             &larr; Back to Market
           </Link>
        </div>
      </nav>

      <div className="container">
        <div className="form-container">
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary-900)' }}>
            Publish New Item
          </h2>
          
          <div className="tab-group">
            <button 
              onClick={() => { setActiveTab('product'); setFormData({...formData, category: 'Food'}); }} 
              className={`tab-btn ${activeTab === 'product' ? 'active' : ''}`}
            >
              Add Product
            </button>
            <button 
              onClick={() => { setActiveTab('service'); setFormData({...formData, category: 'Massage'}); }} 
              className={`tab-btn ${activeTab === 'service' ? 'active' : ''}`}
            >
              Add Service
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Item Name</label>
              <input 
                className="input-field" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required
              />
            </div>
            
            <div className="form-group">
              <label>Price (Rp)</label>
              <input 
                type="number" 
                className="input-field" 
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})} 
                required
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select 
                className="input-field" 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                {activeTab === 'product' ? (
                  <><option>Food</option><option>Clothes</option><option>Crafts</option><option>Other</option></>
                ) : (
                  <><option>Massage</option><option>Electronics Repair</option><option>Cleaning</option><option>Consulting</option></>
                )}
              </select>
            </div>

            <div className="form-group">
              <label>Upload Media</label>
              <input 
                type="file" 
                className="file-input"
                accept="image/*,video/*"
                onChange={e => setFile(e.target.files ? e.target.files[0] : null)} 
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ marginTop: '1rem', opacity: isSubmitting ? 0.7 : 1 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Uploading...' : 'Publish Item'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}