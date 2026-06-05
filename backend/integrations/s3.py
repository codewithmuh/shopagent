"""S3 image upload utility for product images.

Downloads images from external URLs (e.g. Shopify CDN) and uploads
them to our S3 bucket, returning the public S3 URL.
"""
import logging
import hashlib
from io import BytesIO
from urllib.parse import urlparse

import boto3
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

_s3_client = None


def _get_s3_client():
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION,
        )
    return _s3_client


def _guess_content_type(url: str) -> str:
    """Guess content type from URL extension."""
    path = urlparse(url).path.lower()
    if path.endswith(".png"):
        return "image/png"
    if path.endswith(".webp"):
        return "image/webp"
    if path.endswith(".gif"):
        return "image/gif"
    return "image/jpeg"


def upload_image_from_url(source_url: str, merchant_id: str, product_id: str, position: int = 1) -> str | None:
    """Download image from URL and upload to S3.

    Returns the public S3 URL, or None on failure.
    Key format: products/{merchant_id}/{product_id}/{hash}.{ext}
    """
    try:
        resp = requests.get(source_url, timeout=30, stream=True)
        resp.raise_for_status()

        image_data = resp.content
        content_type = resp.headers.get("Content-Type", _guess_content_type(source_url))

        # Determine extension from content type
        ext_map = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
            "image/gif": "gif",
        }
        ext = ext_map.get(content_type, "jpg")

        # Create a deterministic key based on the source URL so re-syncs don't duplicate
        url_hash = hashlib.md5(source_url.encode()).hexdigest()[:12]
        s3_key = f"products/{merchant_id}/{product_id}/{url_hash}_{position}.{ext}"

        bucket = settings.AWS_S3_BUCKET_NAME
        client = _get_s3_client()

        client.upload_fileobj(
            BytesIO(image_data),
            bucket,
            s3_key,
            ExtraArgs={
                "ContentType": content_type,
                "CacheControl": "public, max-age=31536000",
            },
        )

        s3_url = f"https://{bucket}.s3.{settings.AWS_S3_REGION}.amazonaws.com/{s3_key}"
        logger.info(f"Uploaded image to S3: {s3_key}")
        return s3_url

    except Exception as e:
        logger.error(f"Failed to upload image to S3 from {source_url}: {e}")
        return None


def upload_product_images(images_data: list, merchant_id: str, product_id: str) -> list:
    """Upload all product images to S3, updating the src field.

    Takes the rich image objects list, downloads each from Shopify CDN,
    uploads to S3, and returns updated objects with S3 URLs.
    """
    updated = []
    for img in images_data:
        shopify_src = img.get("src", "")
        if not shopify_src:
            updated.append(img)
            continue

        position = img.get("position", 1)
        s3_url = upload_image_from_url(shopify_src, str(merchant_id), str(product_id), position)

        updated.append({
            **img,
            "src": s3_url or shopify_src,  # fallback to Shopify URL if upload fails
            "shopify_src": shopify_src,
        })

    return updated
