/**
 * CKEditor Upload Adapter for Cloudinary
 * 
 * Uploads the images to Cloudinary using the "unsigned" path (frontend only)
 * 
 * References:
 * https://cloudinary.com/documentation/upload_images#code_explorer_chunked_asset_upload_from_the_client_side
 * https://ckeditor.com/docs/ckeditor5/latest/framework/deep-dive/upload-adapter.html
 */
class CloudinaryAdapter {
	constructor(loader, cloudId, uploadPreset) {
		this.loader = loader
		this.cloudId = cloudId
		this.uploadPreset = uploadPreset
		this.controller = new AbortController()
		this.signal = this.controller.signal
	}

	async upload() {
		const file = await this.loader.file
		const response = await this._sendRequest(file)

		if (!response || !response.secure_url) throw new Error('Image upload failed')
		
		return {default: response.secure_url}
	}

	abort() {
		this.controller.abort()
	}

	async _sendRequest(file) {
		const data = new FormData()

		data.append('upload_preset', this.uploadPreset)
		data.append('file', file)

		const response = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudId}/auto/upload`, {
			method: 'POST',
			body: data,
			signal: this.signal,
		})

		if (!response.ok) {
			throw new Error('Error during image upload')
		}

		return await response.json()
	}
}

export function CloudinaryAdapterPlugin(editor) {
	const options = editor.config.get('cloudinary')
	editor.plugins.get('FileRepository').createUploadAdapter = (loader) =>
		new CloudinaryAdapter(loader, options.cloudName, options.uploadPreset)
}
