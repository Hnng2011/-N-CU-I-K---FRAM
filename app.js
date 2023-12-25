import express from 'express';
import mongoose from 'mongoose';
import { create } from 'express-handlebars';

const app = express();
const PORT = process.env.PORT || 3000;

// Kết nối đến MongoDB
mongoose.connect('mongodb://localhost:27017/', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Định nghĩa Schema cho MongoDB
const SpaceSchema = new mongoose.Schema({
    address: String,
    long: Number,
    lat: Number,
    type: String,
    format: String,
    ward: String,

});

const SurfacesSchema = new mongoose.Schema({
    format: String,
    width: Number,
    height: Number,
    imgUrl: String,
    space: { type: mongoose.Schema.Types.ObjectId, ref: 'Space' },
});

const ReportSchema = new mongoose.Schema({
    address: String,
    long: Number,
    lat: Number,
    email: String,
    phone: String,
    content: String,
    report_date: Date,
    state: Number,
    surface: { type: mongoose.Schema.Types.ObjectId, ref: 'Surface' },
});

const Space = mongoose.model('Space', SpaceSchema);
const Surfaces = mongoose.model('Surface', SurfacesSchema);
const Report = mongoose.model('Report', ReportSchema);


const hbs = create({
    helpers: {
        eq: function (a, b) {
            return a === b;
        }
    }
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', './views');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', async (req, res) => {
    const Spaces = await Space.find().lean();

    res.render('home', {
        Spaces
    });
});

app.get('/viewSpace/:id', async (req, res) => {
    const id = req.params.id;
    const surfaces = await Surfaces.find({ space: id }).lean();
    const address = await Space.findById(id).lean();

    res.render('detail', {
        surfaces,
        address
    });
});


app.post('/addSpace', async (req, res) => {
    const { long, lat, type, format, ward, address } = req.body;
    const newSpace = new Space({ long, lat, type, format, ward, address });
    await newSpace.save();
    res.redirect('/');
});

app.get('/addReport/:id', async (req, res) => {
    const id = req.params.id;
    const report = await Report.find({ surface: id }).lean();
    res.render('report', {
        id,
        report,
    });
});

app.post('/addReport/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { address, email, phone, content, report_date, surface, state, long, lat } = req.body;

        const newReport = new Report({
            address,
            email,
            phone,
            content,
            report_date,
            surface,
            state,
            long,
            lat,
        });

        await newReport.save();
        res.redirect(`/addReport/${id}`);
    } catch (error) {
        // Xử lý lỗi
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
