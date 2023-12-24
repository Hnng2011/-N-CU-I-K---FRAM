import express from 'express';
import mongoose from 'mongoose';
import { engine } from 'express-handlebars';

const app = express();
const PORT = process.env.PORT || 3000;

// Kết nối đến MongoDB
mongoose.connect('mongodb://localhost:27017/', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Định nghĩa Schema cho MongoDB
const ItemSchema = new mongoose.Schema({
    name: String,
    description: String
});

const Item = mongoose.model('Item', ItemSchema);

// Thiết lập Handlebars làm template engine
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
const ITEMS_PER_PAGE = 16;

app.get('/', async (req, res) => {
    const currentPage = parseInt(req.query.page) || 1;
    const skip = (currentPage - 1) * ITEMS_PER_PAGE;

    const items = await Item.find().skip(skip).limit(ITEMS_PER_PAGE).lean();
    const totalItems = await Item.countDocuments();
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    // Tính toán các trang cho thanh phân trang
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push({
            pageNumber: i,
            isCurrent: i === currentPage,
        });
    }

    res.render('home', {
        items,
        totalPages,
        pages,
        getCurrentPage: function () {
            return currentPage;
        },
    });
});


app.post('/addItem', async (req, res) => {
    const { namenew, descriptionnew } = req.body;
    const newItem = new Item({ name: namenew, description: descriptionnew });
    await newItem.save();
    res.redirect('/');
});

app.get('/deleteItem/:id', async (req, res) => {
    const id = req.params.id;
    const currentPage = req.query.page || 1;

    await Item.findByIdAndDelete(id);
    res.redirect(`/`);
});

app.get('/editItem/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const item = await Item.findById(id).lean();
        res.json({ success: true, item });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error fetching item.' });
    }
});

app.post('/editItem/:id', async (req, res) => {
    const id = req.params.id;
    const currentPage = req.query.page || 1;
    const { nameupd, descriptionupd } = req.body;
    await Item.findByIdAndUpdate(id, { name: nameupd, description: descriptionupd });
    res.redirect(`/?page=${currentPage}`);
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
