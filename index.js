require("dotenv").config(); // 引入 dotenv 模組

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongo = require("mongodb");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");


const uri = process.env.MONGO_URI;
const client = new mongo.MongoClient(uri);
let db = null;

// 連接 MongoDB
async function connectDB() {
  try {
    await client.connect();
    db = client.db("dictionary");
    console.log("✅ 連線成功");

    app.listen(3000, () =>
      console.log("🚀 伺服器啟動於 http://localhost:3000")
    );
  } catch (err) {
    console.error("❌ 連線失敗", err);
  }
}
connectDB();

// 設定檔案上傳
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

//首頁
app.get("/", async (req, res) => {
  const collection = db.collection("books");
  const books = await collection.find().toArray();
  res.render("index", { books });
});

//上傳書籍
app.post("/books/upload", upload.single("file"), async (req, res) => {
  try {
    const { title, author } = req.body;
    const content = fs.readFileSync(req.file.path, "utf-8");
    const collection = db.collection("books");
    await collection.insertOne({
      title,
      author,
      filename: req.file.filename,
      content,
    });
    res.redirect("/");
  } catch (err) {
    console.error("❌ 上傳失敗", err);
    res.status(500).send("上傳失敗");
  }
});

//查看書籍
app.get("/books/:id", async (req, res) => {
  const collection = db.collection("books");
  const book = await collection.findOne({
    _id: new mongo.ObjectId(req.params.id),
  });
  if (!book) return res.status(404).send("書籍未找到");
  res.render("book", { book });
});

//搜尋書籍
app.get("/search", async (req, res) => {
  const { query } = req.query;
  const collection = db.collection("books");
  const books = await collection
    .find({ content: new RegExp(query, "i") })
    .toArray();
  res.render("index", { books });
});
