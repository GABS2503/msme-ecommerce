"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Marketplace() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);

  // --- NORMALIZE FUNCTION ---
  const normalizeData = (list, type) => {
    if (!list) return [];
    return list.map((item) => {
      const data = item.attributes || item;
      const sellerData = data.seller?.data?.attributes || data.seller;
      const shopName = sellerData?.shopName || sellerData?.username || "Unknown Shop";

      const mediaData = data.media?.data?.attributes || data.media;
      const mediaUrl = mediaData?.url || null;
      const mimeType = mediaData?.mime || '';
      const isVideo = mimeType.startsWith('video/');

      return {
        id: item.id,
        ...data,
        type: type,
        sellerName: shopName, 
        mediaUrl: mediaUrl,
        isVideo: isVideo
      };
    });
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));

    const fetchData = async () => {
      try {
        const p = await axios.get('http://localhost:1337/api/products?populate=*');
        const s = await axios.get('http://localhost:1337/api/services?populate=*');
        
        const products = normalizeData(p.data.data, 'product');
        const services = normalizeData(s.data.data, 'service');
        
        setItems([...products, ...services]);
      } catch (e) { 
        console.error("Fetch error:", e); 
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.refresh();
  };

  const handlePayment = async (item) => {
    try {
      const res = await axios.post('/api/payment', { 
        id: item.id, price: item.price, name: item.name 
      });
      // @ts-ignore
      window.snap.pay(res.data.token);
    } catch (err) {
      alert("Payment Error");
      console.error(err);
    }
  };

  const filteredItems = items.filter(item => 
    (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.sellerName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key="YOUR_CLIENT_KEY" />
      
      <nav className="navbar">
        <h1 style={{ margin: 0 }}>MSME Market</h1>
        <div className="nav-links">
           {!user && (
             <Link href="/login" style={{ color: 'white', textDecoration: 'none' }}>
               Login / Register
             </Link>
           )}
           {user && (
             <>
               <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Hi, {user.username}</span>
               {user.isSeller && (
                 <Link href="/seller" className="btn-nav">
                   Seller Zone
                 </Link>
               )}
               <button onClick={handleLogout} style={{ background:'none', border:'1px solid white', color:'white', padding:'0.25rem 0.5rem', borderRadius:'4px', cursor:'pointer' }}>
                 Logout
               </button>
             </>
           )}
        </div>
      </nav>

      <main className="container">
        <div className="flex-row" style={{ marginBottom: '2rem' }}>
          <input 
            type="text" 
            placeholder="Search products or shop names..." 
            className="input-field"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* --- ANIMATED GRID START --- */}
        <div className="grid-4">
          {filteredItems.map((item, index) => (
            <div 
              key={`${item.type}-${item.id}`} 
              className="card animate-enter"
              // THIS IS THE ANIMATION MAGIC:
              style={{ animationDelay: `${index * 0.1}s` }} 
            >
              <div className="card-image" style={{ position: 'relative' }}>
                 {item.mediaUrl ? (
                    item.isVideo ? (
                       <video 
                         src={`http://localhost:1337${item.mediaUrl}`} 
                         controls 
                         style={{ width:'100%', height:'100%', objectFit:'cover' }} 
                       />
                    ) : (
                       <img 
                          src={`http://localhost:1337${item.mediaUrl}`} 
                          alt={item.name}
                          style={{ width:'100%', height:'100%', objectFit:'cover' }} 
                       />
                    )
                 ) : (
                    <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#888', background:'#eee'}}>
                       No Media
                    </div>
                 )}
              </div>
              
              <div className="card-body">
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'0.5rem'}}>
                  <span className="category-badge">{item.category}</span>
                  <span style={{ fontSize: '0.75rem', color: '#666', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontWeight:'bold' }}>
                    🏪 {item.sellerName}
                  </span>
                </div>

                <h3 style={{margin: '0.5rem 0'}}>{item.name}</h3>
                <p className="price-tag">Rp {item.price?.toLocaleString()}</p>
                <button onClick={() => handlePayment(item)} className="btn-primary">Buy Now</button>
              </div>
            </div>
          ))}
        </div>
        {/* --- ANIMATED GRID END --- */}
      </main>
    </div>
  );
}