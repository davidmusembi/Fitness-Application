'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  ShoppingCart,
  Search,
  User,
  X,
  Dumbbell,
  Package,
  TrendingUp,
  Shield,
  Truck,
  Award,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  featured?: boolean;
  category?: string;
}

interface CartItem extends Product {
  quantity: number;
}

export default function PublicShopPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    fetchProducts();
    const savedCart = localStorage.getItem('publicCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    const uniqueCategories = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean))
    ) as string[];
    setCategories(uniqueCategories);
    setFilteredProducts(products);
  }, [products]);

  useEffect(() => {
    // Real-time search - filters as you type
    filterProducts();
  }, [searchTerm, selectedCategory, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
        setFilteredProducts(data.data);
      } else {
        toast.error(data.error || 'Failed to load products');
      }
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item._id === product._id);

    let newCart: CartItem[];
    if (existingItem) {
      newCart = cart.map((item) =>
        item._id === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newCart = [...cart, { ...product, quantity: 1 }];
    }

    setCart(newCart);
    localStorage.setItem('publicCart', JSON.stringify(newCart));
    toast.success('Added to cart');
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          {/* Top Bar */}
          <div className="border-b border-border/40">
            <div className="flex items-center justify-between py-2 text-xs">
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" />
                  <span>Free shipping on orders over $50</span>
                </div>
                <div className="hidden md:flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  <span>100% Secure Checkout</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/auth/login" className="hover:text-foreground transition-colors">
                  Sign In
                </Link>
                <Separator orientation="vertical" className="h-4" />
                <Link href="/auth/register" className="hover:text-foreground transition-colors">
                  Register
                </Link>
              </div>
            </div>
          </div>

          {/* Main Header */}
          <div className="flex items-center justify-between gap-4 py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <Dumbbell className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <div className="font-bold text-lg leading-none">Deeqdarajjo Shop</div>
                <div className="text-xs text-muted-foreground">Premium Supplements</div>
              </div>
            </Link>

            {/* Search */}
            <div className="flex-1 max-w-xl relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  className="pl-9 h-10 bg-muted/50"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-muted rounded p-1"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Real-time Search Results Dropdown */}
              {searchTerm && searchFocused && filteredProducts.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                  <div className="p-2 space-y-1">
                    {filteredProducts.slice(0, 5).map((product) => (
                      <button
                        key={product._id}
                        onClick={() => {
                          setSelectedProduct(product);
                          setSearchFocused(false);
                        }}
                        className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors text-left"
                      >
                        <div className="relative h-12 w-12 bg-muted rounded flex-shrink-0">
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{product.name}</div>
                          <div className="text-xs text-muted-foreground">${product.price}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {filteredProducts.length > 5 && (
                    <div className="border-t p-2">
                      <button
                        onClick={() => {
                          setSearchFocused(false);
                          document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-sm text-primary hover:underline"
                      >
                        View all {filteredProducts.length} results
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => router.push('/shop/cart')}
                variant="outline"
                size="sm"
                className="relative"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    {cartItemCount}
                  </span>
                )}
                <span className="ml-2 hidden sm:inline">Cart</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                New Arrivals Available
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                  Premium Deeqdarajjo
                  <span className="block text-primary">Supplements</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-md">
                  Fuel your deeqdarajjo journey with high-quality supplements designed for peak performance.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  onClick={() => {
                    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Shop Now
                </Button>
               
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">Lab Tested</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">Premium Quality</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">Fast Delivery</span>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className="relative aspect-square max-w-lg mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl transform rotate-6"></div>
                <div className="relative bg-background rounded-3xl shadow-xl overflow-hidden aspect-square flex items-center justify-center">
                  <img
                    src="/balance.png"
                    alt="Deeqdarajjo Supplements"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Stats Badge */}
                <div className="absolute -bottom-4 -left-4 bg-background rounded-xl shadow-lg p-4 border">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                      <span className="text-2xl">⭐</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">4.9/5</div>
                      <div className="text-xs text-muted-foreground">Customer Rating</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="border-b bg-background sticky top-[73px] md:top-[89px] z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Filter:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-9 px-3 border rounded-md text-sm bg-background"
              >
                <option value="all">All Products</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div id="products-section" className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted aspect-square rounded-lg"></div>
                <div className="mt-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? `No results for "${searchTerm}"` : 'Try adjusting your filters'}
            </p>
            {searchTerm && (
              <Button onClick={() => setSearchTerm('')} variant="outline" size="sm">
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product._id}
                className="group overflow-hidden border hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="relative aspect-square bg-muted/30">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-contain p-4"
                  />
                  {product.featured && (
                    <Badge className="absolute top-2 left-2 text-xs">
                      Featured
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm mb-1 line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold">
                      ${product.price}
                    </span>
                    {product.stock === 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Out of stock
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    disabled={product.stock === 0}
                    className="w-full h-8 text-sm"
                    size="sm"
                  >
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Dumbbell className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold">Deeqdarajjo Shop</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Premium supplements for your deeqdarajjo journey
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Shop</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/shop" className="hover:text-foreground transition-colors">All Products</Link></li>
                <li><Link href="/shop/cart" className="hover:text-foreground transition-colors">Cart</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Account</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/auth/login" className="hover:text-foreground transition-colors">Sign In</Link></li>
                <li><Link href="/auth/register" className="hover:text-foreground transition-colors">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Shipping</a></li>
              </ul>
            </div>
          </div>
          <Separator className="my-8" />
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Deeqdarajjo Shop. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-3xl">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProduct.name}</DialogTitle>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                {/* Product Image */}
                <div className="relative aspect-square bg-muted/30 rounded-lg overflow-hidden">
                  <Image
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    fill
                    className="object-contain p-6"
                  />
                </div>

                {/* Product Details */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedProduct.category && (
                        <Badge variant="secondary">{selectedProduct.category}</Badge>
                      )}
                      {selectedProduct.featured && (
                        <Badge>Featured</Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold">
                      ${selectedProduct.price}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedProduct.description}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm">
                      <span className="font-medium">Availability:</span>{' '}
                      {selectedProduct.stock > 0 ? (
                        <span className="text-green-600">{selectedProduct.stock} in stock</span>
                      ) : (
                        <span className="text-destructive">Out of stock</span>
                      )}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => {
                        addToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      disabled={selectedProduct.stock === 0}
                      className="flex-1"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Button
                      onClick={() => {
                        addToCart(selectedProduct);
                        router.push('/shop/cart');
                      }}
                      disabled={selectedProduct.stock === 0}
                      variant="outline"
                      className="flex-1"
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
