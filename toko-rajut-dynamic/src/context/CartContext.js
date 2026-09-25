'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { parseProduct } from '@/lib/productHelper';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on initial client mount & validate active products
  useEffect(() => {
    async function initCart() {
      try {
        const savedCart = localStorage.getItem('rajajutan_cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          if (Array.isArray(parsedCart) && parsedCart.length > 0) {
            // Validasi status produk aktif di database Supabase
            const ids = parsedCart.map(item => item.id);
            const { data: dbProducts } = await supabase
              .from('produk')
              .select('id, nama, harga, stok, deskripsi, gambar_url')
              .in('id', ids);

            if (dbProducts) {
              const activeMap = {};
              dbProducts.forEach(p => {
                const parsed = parseProduct(p);
                if (parsed.is_active !== false) {
                  activeMap[p.id] = parsed;
                }
              });

              // Hanya simpan item yang masih aktif
              const validCart = parsedCart
                .filter(item => activeMap[item.id])
                .map(item => ({
                  ...item,
                  harga: activeMap[item.id].harga,
                  nama: activeMap[item.id].nama,
                  stok: activeMap[item.id].stok
                }));

              setCart(validCart);
              localStorage.setItem('rajajutan_cart', JSON.stringify(validCart));
              setIsLoaded(true);
              return;
            }
          }
          setCart(parsedCart);
        }
      } catch (e) {
        console.error('Error loading cart from localStorage:', e);
      }
      setIsLoaded(true);
    }

    initCart();
  }, []);

  // Save cart to localStorage whenever it updates
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('rajajutan_cart', JSON.stringify(cart));
      } catch (e) {
        console.error('Error saving cart to localStorage:', e);
      }
    }
  }, [cart, isLoaded]);

  const addToCart = (product, quantity = 1) => {
    // Jika produk nonaktif, cegah penambahan ke keranjang
    if (product?.is_active === false) return;

    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      const maxStok = product.stok !== undefined ? product.stok : 999;

      if (existing) {
        const newQty = Math.min(maxStok, existing.quantity + quantity);
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQty, stok: maxStok }
            : item
        );
      }
      const initialQty = Math.min(maxStok, Math.max(1, quantity));
      return [...prevCart, { ...product, quantity: initialQty, stok: maxStok }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const removeMultipleFromCart = (productIds) => {
    if (!Array.isArray(productIds)) return;
    setCart(prevCart => prevCart.filter(item => !productIds.includes(item.id)));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === productId) {
          const maxStok = item.stok !== undefined ? item.stok : 999;
          const newQty = Math.min(maxStok, quantity);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rajajutan_cart');
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
  const cartItemCount = cart.length;

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      removeMultipleFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
