const express = require('express');
const multer = require('multer');
const cors = require('cors');
const tf = require('@tensorflow/tfjs-node');
const cocoSsd = require('@tensorflow-models/coco-ssd');
const Jimp = require('jimp');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.static(__dirname));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|bmp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

let model;

async function loadModel() {
  console.log('Loading COCO-SSD model...');
  model = await cocoSsd.load();
  console.log('Model loaded successfully!');
}

async function imageToTensor(imagePath) {
  const imageBuffer = await fs.readFile(imagePath);
  const image = await Jimp.read(imageBuffer);
  const { width, height } = image.bitmap;
  const imageData = new Uint8Array(width * height * 3);

  let idx = 0;
  image.scan(0, 0, width, height, (x, y, index) => {
    imageData[idx++] = image.bitmap.data[index + 0];
    imageData[idx++] = image.bitmap.data[index + 1];
    imageData[idx++] = image.bitmap.data[index + 2];
  });

  const tensor = tf.tensor3d(imageData, [height, width, 3]);
  return tensor;
}

app.post('/detect-human', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Please upload an image file!'
      });
    }

    const imagePath = req.file.path;
    const tensor = await imageToTensor(imagePath);
    const predictions = await model.detect(tensor);

    tensor.dispose();

    const humanDetected = predictions.some(prediction =>
      prediction.class === 'person' && prediction.score > 0.5
    );

    await fs.unlink(imagePath);

    res.json({
      result: humanDetected ? 'detected' : 'not_detected',
      human_detected: humanDetected,
      details: {
        human_count: predictions.filter(p => p.class === 'person').length,
        detected_objects: predictions.map(p => ({
          class: p.class,
          confidence: (p.score * 100).toFixed(2) + '%'
        }))
      }
    });

  } catch (error) {
    console.error('Error:', error);

    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({
      error: 'Error processing image!',
      details: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    model_loaded: !!model,
    port: PORT
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Human Detection API!',
    usage: {
      endpoint: 'POST /detect-human',
      parameter: 'image (multipart/form-data)',
      example_response: {
        result: 'detected or not_detected',
        human_detected: true,
        details: {
          human_count: 1,
          detected_objects: []
        }
      }
    }
  });
});

async function createUploadsDir() {
  try {
    await fs.mkdir('uploads', { recursive: true });
    console.log('Uploads directory ready');
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }
}

async function startServer() {
  try {
    await createUploadsDir();
    await loadModel();

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on: http://localhost:${PORT}`);
      console.log(`📸 Human detection: POST http://localhost:${PORT}/detect-human`);
      console.log(`❤️  Health check: GET http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();
