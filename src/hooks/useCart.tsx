import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const newCart = [...cart];
      const productInCart = newCart.find(product => product.id === productId);
      const newAmount = productInCart ? productInCart.amount + 1 : 1;
      const stock = await api.get<Stock>(`/stock/${productId}`)

      if (newAmount > stock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productInCart) {
        productInCart.amount = newAmount;
      } else {
        const product = await api.get(`/products/${productId}`);
        const newCartProduct = {
          ...product.data,
          amount: newAmount
        }
        newCart.push(newCartProduct);
      }

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {

      const product = cart.find(product => product.id === productId);

      if(product){
        const newCart = cart.filter(product => product.id !== productId);
        setCart([...newCart]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        throw new Error();
      }
      return;
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      const newCart = [...cart];
      const product = newCart.find(product => product.id === productId);

      const stock = await api.get<Stock>(`stock/${productId}`).then(response => response.data);

      if (stock.amount >= amount) {
        if (product) {
          if (amount <= 0) throw new Error()
          product.amount = amount;
        } else {
          throw new Error()
        }
      } else {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      setCart([...newCart]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
