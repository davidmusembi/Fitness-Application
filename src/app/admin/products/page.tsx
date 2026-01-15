'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, Edit, Trash2, Eye } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  featured: boolean;
  imageUrl?: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDialog, setViewDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: '',
    featured: false,
    imageUrl: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Request failed');
      }
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setViewDialog(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      featured: product.featured,
      imageUrl: product.imageUrl || '',
    });
    setSelectedImage(null);
    setImagePreview(product.imageUrl || '');
    setEditDialog(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialog(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'Image size must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.url;
  };

  const confirmEdit = async () => {
    if (!selectedProduct) return;

    try {
      setUploading(true);

      let imageUrl = editFormData.imageUrl;

      // Upload new image if selected
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      const response = await fetch(`/api/products/${selectedProduct._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          imageUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success!',
          description: 'Product updated successfully',
        });
        setEditDialog(false);
        setSelectedImage(null);
        setImagePreview('');
        fetchProducts();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update product',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;

    try {
      const response = await fetch(`/api/products/${selectedProduct._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success!',
          description: 'Product deleted successfully',
        });
        setDeleteDialog(false);
        fetchProducts();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete product',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage supplement products</p>
        </div>
        <Link href="/admin/products/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product._id}>
            <CardContent className="p-4">
              {product.imageUrl && (
                <div className="relative mb-4 h-48 w-full overflow-hidden rounded-lg bg-gray-100">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              {!product.imageUrl && (
                <div className="mb-4 flex h-48 items-center justify-center rounded-lg bg-gray-100">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
              )}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">{product.description}</p>
                </div>
                {product.featured && <Badge>Featured</Badge>}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold text-blue-600">${product.price}</span>
                <span className="text-sm text-gray-600">Stock: {product.stock}</span>
              </div>
              <Badge variant="secondary" className="mt-2">{product.category}</Badge>

              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleView(product)}
                  className="flex-1"
                >
                  <Eye className="mr-1 h-3 w-3" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(product)}
                  className="flex-1"
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(product)}
                  className="flex-1"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <div className="mt-8 text-center text-gray-600">No products found</div>
      )}

      {/* View Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              {selectedProduct.imageUrl && (
                <div className="relative h-64 w-full overflow-hidden rounded-lg">
                  <Image
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <Label>Name</Label>
                <p className="text-lg font-semibold">{selectedProduct.name}</p>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-gray-700">{selectedProduct.description}</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label>Price</Label>
                  <p className="text-lg font-bold text-blue-600">${selectedProduct.price}</p>
                </div>
                <div>
                  <Label>Stock</Label>
                  <p className="text-lg">{selectedProduct.stock}</p>
                </div>
              </div>
              <div>
                <Label>Category</Label>
                <p>{selectedProduct.category}</p>
              </div>
              <div>
                <Label>Featured</Label>
                <p>{selectedProduct.featured ? 'Yes' : 'No'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Product</DialogTitle>
            <DialogDescription className="text-sm">Make changes to the product details</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="edit-name" className="text-sm sm:text-base">Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="text-sm sm:text-base"
              />
            </div>
            <div>
              <Label htmlFor="edit-description" className="text-sm sm:text-base">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                rows={3}
                className="text-sm sm:text-base"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="edit-price" className="text-sm sm:text-base">Price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={editFormData.price}
                  onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) })}
                  className="text-sm sm:text-base"
                />
              </div>
              <div>
                <Label htmlFor="edit-stock" className="text-sm sm:text-base">Stock</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  value={editFormData.stock}
                  onChange={(e) => setEditFormData({ ...editFormData, stock: parseInt(e.target.value) })}
                  className="text-sm sm:text-base"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-category" className="text-sm sm:text-base">Category</Label>
              <Input
                id="edit-category"
                value={editFormData.category}
                onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                className="text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm sm:text-base">Product Image</Label>

              {/* Current/Preview Image */}
              {imagePreview && (
                <div className="relative w-full h-40 sm:h-48 border rounded-lg overflow-hidden bg-gray-50">
                  <Image
                    src={imagePreview}
                    alt="Product preview"
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="edit-image" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      id="edit-image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                      <Package className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-700 break-words px-2">
                          {selectedImage ? selectedImage.name : 'Click to upload new image'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    </div>
                  </div>
                </Label>
              </div>

              {/* Manual URL Input (Optional) */}
              <div className="pt-2">
                <Label htmlFor="edit-imageUrl" className="text-xs text-gray-500">
                  Or paste image URL
                </Label>
                <Input
                  id="edit-imageUrl"
                  value={editFormData.imageUrl}
                  onChange={(e) => {
                    setEditFormData({ ...editFormData, imageUrl: e.target.value });
                    if (e.target.value) {
                      setImagePreview(e.target.value);
                      setSelectedImage(null);
                    }
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="text-sm"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-featured"
                checked={editFormData.featured}
                onChange={(e) => setEditFormData({ ...editFormData, featured: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="edit-featured">Featured Product</Label>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setEditDialog(false)}
              disabled={uploading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmEdit}
              disabled={uploading}
              className="w-full sm:w-auto"
            >
              {uploading ? 'Uploading...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedProduct?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
