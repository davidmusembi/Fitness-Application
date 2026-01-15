#!/bin/bash
# Fix params in all dynamic route files
sed -i 's/{ params }: { params: { id: string } }/{ params }: { params: Promise<{ id: string }> }/g' products/\[id\]/route.ts
sed -i 's/{ params }: { params: { id: string } }/{ params }: { params: Promise<{ id: string }> }/g' users/\[id\]/route.ts
sed -i 's/params\.id/id/g' products/\[id\]/route.ts
sed -i 's/params\.id/id/g' users/\[id\]/route.ts
