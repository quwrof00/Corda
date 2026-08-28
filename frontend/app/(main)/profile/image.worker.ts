self.onmessage = async (e: MessageEvent) => {
    const { file, maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = e.data;

    try {
        // Create an ImageBitmap from the file
        const bitmap = await createImageBitmap(file);

        // Calculate new dimensions preserving aspect ratio
        let width = bitmap.width;
        let height = bitmap.height;

        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }

        // Create OffscreenCanvas for background rendering
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Could not get 2d context from OffscreenCanvas');
        }

        // Draw and scale the image
        ctx.drawImage(bitmap, 0, 0, width, height);

        // Convert to WebP blob for optimal compression
        const blob = await canvas.convertToBlob({
            type: 'image/webp',
            quality: quality
        });

        // Cleanup bitmap memory
        bitmap.close();

        // Send compressed blob back to main thread
        self.postMessage({ success: true, blob });
    } catch (error) {
        self.postMessage({ success: false, error: (error as Error).message });
    }
};
