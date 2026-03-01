import multer from 'multer';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './temp/uploads');
  },
  filename: function (req, file, cb) {
    const userId = req.user._id;
    const uniqueSuffix = Date.now();
    const ext = file.originalname.split('.').pop();

    cb(null, `${userId}-${uniqueSuffix}.${ext}`);
  },
});

export const upload = multer({ storage: storage });
