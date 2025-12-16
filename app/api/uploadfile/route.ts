
import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req:NextRequest) {
   const data = await req.formData();
  const file = data.get("file") as File;
    const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (err, res) => (err ? reject(err) : resolve(res))
    ).end(buffer);
  });

  return NextResponse.json({
    url: result.secure_url,
    type: result.resource_type, 
  });
}