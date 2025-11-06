# Human Detection API

A RESTful API built with Node.js, Express, and TensorFlow.js for detecting humans in images using the COCO-SSD model.

## Features

- 🎯 Real-time human detection in images
- 🤖 Powered by TensorFlow.js and COCO-SSD model
- 📊 Returns detection confidence scores
- 🔍 Identifies all objects in the image
- 🌐 CORS enabled
- 📝 Simple JSON responses

## Installation

```bash
npm install
```

## Usage

Start the server:

```bash
npm start
```

For development mode with auto-reload:

```bash
npm run dev
```

The server will run on `http://localhost:3000` by default.

## API Endpoints

### Detect Human

Analyzes an image and detects if humans are present.

**Endpoint:** `POST /detect-human`

**Content-Type:** `multipart/form-data`

**Parameters:**
- `image` (file) - Image file to analyze

**Example cURL:**

```bash
curl -X POST http://localhost:3000/detect-human \
  -F "image=@/path/to/your/image.jpg"
```

**Response:**

```json
{
  "result": "detected",
  "human_detected": true,
  "details": {
    "human_count": 2,
    "detected_objects": [
      {
        "class": "person",
        "confidence": "87.45%"
      },
      {
        "class": "person",
        "confidence": "92.31%"
      }
    ]
  }
}
```

**Response Fields:**
- `result`: `"detected"` or `"not_detected"`
- `human_detected`: Boolean indicating if humans were found
- `details.human_count`: Number of humans detected
- `details.detected_objects`: Array of all detected objects with confidence scores

### Health Check

Check if the server and model are running properly.

**Endpoint:** `GET /health`

```bash
curl http://localhost:3000/health
```

**Response:**

```json
{
  "status": "OK",
  "model_loaded": true,
  "port": 3000
}
```

## Web Interface

Open `http://localhost:3000/test.html` in your browser for a user-friendly web interface to test the API.

## Supported Image Formats

- JPEG / JPG
- PNG
- GIF
- BMP

**Maximum file size:** 10MB

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TensorFlow.js** - Machine learning library
- **COCO-SSD** - Object detection model
- **Multer** - File upload middleware
- **Jimp** - Image processing

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
