import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem("cartItems");
    return saved ? JSON.parse(saved) : [];
  });

  const [restaurant, setRestaurant] = useState(() => {
    const saved = localStorage.getItem("cartRestaurant");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
    localStorage.setItem("cartRestaurant", JSON.stringify(restaurant));
  }, [cartItems, restaurant]);

  const addToCart = (item, targetRestaurant) => {
    // If cart has items from another restaurant, reset cart or ask user
    if (restaurant && restaurant._id !== targetRestaurant._id && cartItems.length > 0) {
      if (window.confirm("Your cart contains items from another restaurant. Would you like to reset your cart to add items from this restaurant?")) {
        setCartItems([{ ...item, quantity: 1 }]);
        setRestaurant(targetRestaurant);
      }
      return;
    }

    setRestaurant(targetRestaurant);
    setCartItems(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCartItems(prev => {
      return prev
        .map(i => {
          if (i._id === itemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean);
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setRestaurant(null);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal > 0 ? (subtotal > 500 ? 0 : 40) : 0;
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const grandTotal = subtotal + deliveryFee + tax;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        restaurant,
        addToCart,
        updateQuantity,
        clearCart,
        subtotal,
        deliveryFee,
        tax,
        grandTotal,
        totalItemsCount: cartItems.reduce((acc, item) => acc + item.quantity, 0)
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
